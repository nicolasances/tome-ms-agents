import { ValidationError } from "toto-api-controller";
import { AgentTaskOrchestratorResponse, BranchInfo, SubTaskInfo } from "../model/AgentTask";
import { DeterministicFlow as DeterministicFlow, FlowNode } from "../model/DeterministicFlow";


export class GaleOrchestrator {

    constructor(private correlationId: string, private flow: DeterministicFlow) { }

    async start(input: any): Promise<AgentTaskOrchestratorResponse<any>> {

        // Start processing the flow
        if (this.flow.start.branch && this.flow.start.branch.length > 1) return this.processBranch(this.flow.start.branch, input);
        else if (this.flow.start.parallelize) { }
        else if (this.flow.start.agent) { }

        throw new Error("Not implemented yet");

    }

    async resume(correlationId: string) {

    }

    private processBranch(branch: FlowNode[], input: any): AgentTaskOrchestratorResponse<any> {

        const branches: BranchInfo[] = [];

        for (const node of branch) {

            if (node.parallelize) {

                const subtasks: SubTaskInfo[] = node.parallelize.map((agentNode) => {
                    return {
                        taskId: agentNode.taskId,
                        subtasksGroupId: node.name,
                        taskInputData: agentNode.mapInput(input)
                    }
                })

                branches.push({ branchName: node.name, subtasks: subtasks });

            }
            else if (node.agent) {

                const subtask: SubTaskInfo = {
                    taskId: node.agent.taskId,
                    subtasksGroupId: node.name,
                    taskInputData: node.agent.mapInput(input)
                }

                branches.push({ branchName: node.name, subtasks: [subtask] });
            }
            else if (node.branch) throw new ValidationError(400, 'Branches directly under a branch are not supported yet. A branch must contain either parallelize or agent nodes. Otherwise, please flatten the structure (move the branch one level up).');
        }

        return new AgentTaskOrchestratorResponse("branch", this.correlationId, undefined, undefined, branches);

    }

}

/**
 * This interface defines the persistent storage methods required for Gale Orchestrator to save and retrieve its workflow state.
 */
export interface GaleOrchestratorPersistentStorage {
    saveFlowState(flowId: string, state: DeterministicFlow): Promise<void>;
}