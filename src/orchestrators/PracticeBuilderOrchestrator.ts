import { z } from "genkit";
import { GaleOrchestratorAgent, GaleOrchestratorAgentManifest } from "../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskOrchestratorResponse, ResumeTaskInputData, StartTaskInputData } from "../gale/model/AgentTask";
import { GaleOrchestrator } from "../gale/orchestrator/GaleOrchestrator";
import { AgenticFlow, AgentNode, BranchNode, GroupNode } from "../gale/model/AgenticFlow";
import { GenealogicTreeAgent } from "../agents/practice/GenealogicTreeAgent";
import { PersonalitiesConsolidationAgent } from "../agents/practice/PersonalitiesConsolidationAgent";
import { classificationAgents, sectionGenealogyAgents, sectionTimelineAgents } from "./providers/PracticeBuildAgentsProvider";
import { SectionGenealogyAgent } from "../agents/practice/SectionGenealogyAgent";

/**
 * This agent is the ORCHESTRATOR for building practices for a give Tome Topic.
 * 
 * This is the NEW orchestrator built with the new Gale standard for workflows.
 */
export class PracticeBuilderOrchestratorAgent extends GaleOrchestratorAgent<typeof PracticeBuilderOrchestratorAgent.inputSchema, typeof PracticeBuilderOrchestratorAgent.resumeInputSchema, typeof PracticeBuilderOrchestratorAgent.outputSchema> {

    static taskId = "tome.practice.build";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
    });

    static resumeInputSchema = z.object({
        originalInput: z.object({
            topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
            topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        }).describe("Original input data passed when starting the practice building process."),
        childrenOutputs: z.array(z.any()).describe("Outputs from child tasks.")
    });

    static outputSchema = z.object({
        done: z.boolean().describe("Whether the practice building process is complete."),
        error: z.string().optional().describe("Error message if the process failed.")
    });

    manifest: GaleOrchestratorAgentManifest = {
        agentName: "Tome Practice Builder",
        taskId: PracticeBuilderOrchestratorAgent.taskId,
        inputSchema: PracticeBuilderOrchestratorAgent.inputSchema,
        outputSchema: PracticeBuilderOrchestratorAgent.outputSchema,
        resumeInputSchema: PracticeBuilderOrchestratorAgent.resumeInputSchema,
        description: "Orchestrator Agent that builds a complete Tome Practice for a given Topic by coordinating multiple sub-agents."
    };

    private flow = new AgenticFlow(
        new GroupNode({
            groupId: "sections-classification-group",
            agentsProvider: classificationAgents,
            next: new BranchNode({
                branches: [
                    {
                        branchId: "sections-genealogy-branch",
                        branch: new GroupNode({
                            groupId: "sections-genealogy-group",
                            agentsProvider: sectionGenealogyAgents,
                            next: new BranchNode({
                                branches: [
                                    {
                                        branchId: "genealogy-personalities-branch",
                                        branch: new AgentNode<typeof PersonalitiesConsolidationAgent.inputSchema>({
                                            taskId: PersonalitiesConsolidationAgent.taskId,
                                            taskInputMapper: (input: ResumeTaskInputData) => ({topicId: input.originalInput.topicId, topicCode: input.originalInput.topicCode, peopleDescriptions: (input.childrenOutputs as z.infer<typeof SectionGenealogyAgent.outputSchema>[]).flatMap(co => co.info.people)})
                                        })
                                    },
                                    {
                                        branchId: "genealogy-tree-branch",
                                        branch: new AgentNode<typeof GenealogicTreeAgent.inputSchema>({
                                            taskId: GenealogicTreeAgent.taskId,
                                            taskInputMapper: (input: ResumeTaskInputData) => ({topicId: input.originalInput.topicId, topicCode: input.originalInput.topicCode, relationships: (input.childrenOutputs as z.infer<typeof SectionGenealogyAgent.outputSchema>[]).flatMap(co => co.info.genealogies), peopleDescriptions: (input.childrenOutputs as z.infer<typeof SectionGenealogyAgent.outputSchema>[]).flatMap(co => co.info.people)})
                                        })
                                    }
                                ]
                            })
                        })
                    },
                    {
                        branchId: "sections-timeline-branch",
                        branch: new GroupNode({
                            groupId: "sections-timeline-group",
                            agentsProvider: sectionTimelineAgents, 
                        })
                    }
                ]
            })
        })
    )

    async executeTask(task: AgentTaskRequest<typeof PracticeBuilderOrchestratorAgent.inputSchema | typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderOrchestratorAgent.outputSchema>> {

        const cid = task.correlationId;
        
        
        const flow = new GaleOrchestrator(this.flow, cid!, this.execContext!);
        
        if (task.command.command === "start") {
            return await flow.start(task.taskInputData);
        }
        else if (task.command.command == 'resume') {
            return await flow.resume(task.taskInputData, task.command);
        }

        return new AgentTaskOrchestratorResponse("completed", cid!, { done: true });

    }
}