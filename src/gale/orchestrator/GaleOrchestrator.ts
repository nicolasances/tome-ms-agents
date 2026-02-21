import { Logger, TotoControllerConfig, TotoRuntimeError, ValidationError } from "totoms";
import { DeterministicFlow as DeterministicFlow, FlowNode } from "../model/DeterministicFlow";
import { AgenticFlow, AgentNode, BranchNode, GroupNode } from "../model/AgenticFlow";
import { AgentTaskOrchestratorResponse, Command, ResumeCommand, TaskGroup } from "../model/AgentTask";

export class GaleOrchestrator {

    logger: Logger;

    constructor(private flow: AgenticFlow, private correlationId: string, private config: TotoControllerConfig) {
        this.logger = Logger.getInstance();
    }

    /**
     * Starts the orchestrator flow.
     * @param input 
     * @returns 
     */
    async start(input: any): Promise<AgentTaskOrchestratorResponse<any>> {

        try {

            // Start processing the flow
            const root = this.flow.root;

            if (root.getType() == "group") return this.processGroup(root as GroupNode, input);
            else if (root.getType() == 'branch') return this.processBranch(root as BranchNode, input);
            else if (root.getType() == 'agent') return this.processAgent(root as AgentNode<any>, input);

            throw new TotoRuntimeError(500, `Root node type [${root.getType()}] not supported in Gale Orchestrator.`);

        } catch (error) {

            return new AgentTaskOrchestratorResponse("failed", this.correlationId, { error: error });

        }
    }

    /**
     * Resumes the orchestrator flow. 
     * 
     * This method searches for the next node to process based on the received input and executes that node. 
     * @param input 
     */
    async resume(input: any, command: ResumeCommand): Promise<AgentTaskOrchestratorResponse<any>> {

        try {

            this.logger.compute(this.correlationId, `Resuming Gale Orchestrator for correlationId [${this.correlationId}] after completion of group [${command.completedTaskGroupId}]`, "info");

            // Find what to process next. The resume command contains the group Id that was completed => process the "next" of that group.
            const completedNode = this.flow.findNode(command.completedTaskGroupId);

            this.logger.compute(this.correlationId, `Found completed node of type [${completedNode?.getType()}] for groupId [${command.completedTaskGroupId}]`, "info");

            const nextNode = completedNode?.getNext();

            this.logger.compute(this.correlationId, `Next node to process is of type [${nextNode?.getType()}]`, "info");

            if (nextNode) {
                if (nextNode.getType() == "group") return this.processGroup(nextNode as GroupNode, input);
                else if (nextNode.getType() == 'branch') return this.processBranch(nextNode as BranchNode, input);
                else if (nextNode.getType() == 'agent') return this.processAgent(nextNode as AgentNode<any>, input);
                else throw new TotoRuntimeError(500, `Next node type [${nextNode.getType()}] not supported in Gale Orchestrator.`);
            }

            return new AgentTaskOrchestratorResponse("completed", this.correlationId, { done: true, msg: `Nothing to do after group ${command.completedTaskGroupId}` });

        } catch (error) {

            return new AgentTaskOrchestratorResponse("failed", this.correlationId, { error: error });

        }

    }

    /**
     * Processes an Agent node. 
     * 
     * @param agent the agent to be processed
     * @param input the input that the orchestrator received
     */
    private async processAgent(agent: AgentNode<any>, input: any): Promise<AgentTaskOrchestratorResponse<any>> {

        // Apply input mapper if provided, otherwise use the agent's taskInputData
        const taskInputData = agent.taskInputMapper ? agent.taskInputMapper(input) : agent.taskInputData;

        return new AgentTaskOrchestratorResponse("subtasks", this.correlationId, {}, [{
            groupId: agent.getPathId()!,    // Using something that can be reconstructed later as a group id, so that when this agent completes, I can resume from the next node
            tasks: [{
                taskId: agent.taskId,
                taskInputData: taskInputData
            }]
        }]);
    }

    /**
     * Processes a group node in the flow.
     * - Each agent in the group will be converted into a subtask.
     * - This is generating a single TaskGroup containing all the agents as tasks. (Generation of multiple TaskGroups is supported as branches) 
     * 
     * @param group the group to process
     * @param input the input data arrived to the orchestrator
     * @returns 
     */
    private async processGroup(group: GroupNode, input: any): Promise<AgentTaskOrchestratorResponse<any>> {

        // Get the agents for the group
        let agents = group.agents;
        if (!agents && group.agentsProvider) agents = await group.agentsProvider(input, this.config);
        if (!agents || agents.length === 0) throw new ValidationError(400, `No agents provided for group [${group.groupId}].`);

        const taskGroups = [
            {
                groupId: group.groupId,
                tasks: agents.map(agent => ({
                    taskId: agent.taskId,
                    taskInputData: agent.taskInputData
                }))
            }
        ]

        return new AgentTaskOrchestratorResponse("subtasks", this.correlationId, {}, taskGroups);
    }

    /**
     * Processes a branch. 
     * - For each branch node, generates a TaskGroup, each containing the subtasks for that branch.
     * 
     * @param branch the branch to process
     * @param input the input received by the orchestrator
     * @returns the response
     */
    private async processBranch(branch: BranchNode, input: any): Promise<AgentTaskOrchestratorResponse<any>> {

        const taskGroups = await Promise.all(branch.branches.map(async (branch) => {

            const branchType = branch.branch.getType();

            let response: AgentTaskOrchestratorResponse<any>;

            if (branchType == 'group') response = await this.processGroup(branch.branch as GroupNode, input);
            else if (branchType == 'agent') response = await this.processAgent(branch.branch as AgentNode<any>, input);
            else throw new ValidationError(500, `Branch node type [${branchType}] not supported as one of the branches of a Branch Node.`);

            if (!response || !response.subtasks || response.subtasks.length === 0) throw new ValidationError(500, `No subtasks generated for branch [${branch.branchId}].`);

            return response.subtasks[0];    // Groups and agents always only return a single TaskGroup. Branch in a branch is not supported.

        }));

        return new AgentTaskOrchestratorResponse("subtasks", this.correlationId, {}, taskGroups);

    }

}

/**
 * This interface defines the persistent storage methods required for Gale Orchestrator to save and retrieve its workflow state.
 */
export interface GaleOrchestratorPersistentStorage {
    saveFlowState(flowId: string, state: DeterministicFlow): Promise<void>;
}