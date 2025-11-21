import { z } from "genkit";
import { TomeTopicsAPI } from "../../api/TomeTopicsAPI";
import { API_DEPENDENCIES } from "../../Config";
import { GaleOrchestratorAgent, GaleOrchestratorAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskOrchestratorResponse, SubTaskInfo } from "../../gale/model/AgentTask";

/**
 * This agent is the ORCHESTRATOR for building practices for a give Tome Topic.
 */
export class PracticeBuilderOrchestratorAgent extends GaleOrchestratorAgent<typeof PracticeBuilderOrchestratorAgent.inputSchema, typeof PracticeBuilderOrchestratorAgent.resumeInputSchema, typeof PracticeBuilderOrchestratorAgent.outputSchema> {

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
        taskId: "topic.practice.build",
        inputSchema: PracticeBuilderOrchestratorAgent.inputSchema,
        outputSchema: PracticeBuilderOrchestratorAgent.outputSchema,
        resumeInputSchema: PracticeBuilderOrchestratorAgent.resumeInputSchema,
        description: "Orchestrator agent for building practices for a given Tome Topic."
    };

    async executeTask(task: AgentTaskRequest<typeof PracticeBuilderOrchestratorAgent.inputSchema | typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderOrchestratorAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;

        // Step 1: Get a classification Agent to classify the topic type
        if (task.command.command === "start") {

            const inputData = task.taskInputData as z.infer<typeof PracticeBuilderOrchestratorAgent.inputSchema>;

            this.logger?.compute(cid, `Starting practice building for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

            // 1.1. Get the list of sections for the topic 
            const topic = await new TomeTopicsAPI(API_DEPENDENCIES.tomeTopics, this.config!).getTopic(inputData.topicId, cid);

            if (!topic || !topic.sections || topic.sections.length === 0) {

                logger.compute(cid, `No sections found for topic [${inputData.topicId}]`, "error");

                return new AgentTaskOrchestratorResponse("failed", cid, { done: false, error: "No sections found for topic" });
            }

            // 1.2. For each section, create a subtask to classify the section
            const subtasks: SubTaskInfo[] = topic.sections.map((section, index) => {
                return {
                    taskId: "topic.section.classify",
                    taskInputData: {
                        topicId: topic.id,
                        topicCode: topic.topicCode,
                        sectionCode: section,
                        sectionIndex: index
                    }
                }
            });

            return new AgentTaskOrchestratorResponse("subtasks", task.correlationId!, undefined, subtasks, "sections-classification-group")
        }
        else if (task.command.command == 'resume') {

            const inputData = task.taskInputData as z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>;

            this.logger?.compute(cid, `Resuming practice building for topic [${inputData.originalInput.topicId} - ${inputData.originalInput.topicCode}]`, "info");

            // Step 2: Trigger Genealogy detection for sections
            if (task.command.completedSubtaskGroupId == "sections-classification-group") {

                const subtasks: SubTaskInfo[] = inputData.childrenOutputs.map((childOutput, index) => {

                    const sectionOutput = childOutput as { topicCode: string, sectionCode: string, sectionIndex: number, labels: string[] };

                    // Only trigger genealogy detection for sections labelled with 'genealogy'
                    if (sectionOutput.labels.includes('genealogy')) {
                        return {
                            taskId: "topic.section.genealogy",
                            taskInputData: {
                                topicId: inputData.originalInput.topicId,
                                topicCode: sectionOutput.topicCode,
                                sectionCode: sectionOutput.sectionCode,
                                sectionIndex: sectionOutput.sectionIndex
                            }
                        }
                    }
                }).filter(st => st !== undefined) as SubTaskInfo[];

                if (subtasks.length === 0) {
                    logger.compute(cid, `No sections labelled with 'genealogy' for topic [${inputData.originalInput.topicId}]`, "info");

                    // TODO: Proceed with next steps of practice building...
                    return new AgentTaskOrchestratorResponse("completed", cid, { done: true });
                }
                
                return new AgentTaskOrchestratorResponse("subtasks", cid, undefined, subtasks, "sections-genealogy-group")

            }
            else if (task.command.completedSubtaskGroupId == "sections-genealogy-group") {

                logger.compute(cid, `Consolidating genealogy information for topic [${inputData.originalInput.topicId}]`, "info");

                const subtasks: SubTaskInfo[] = [{
                    taskId: "topic.genealogy",
                    taskInputData: {
                        topicId: inputData.originalInput.topicId,
                        topicCode: inputData.originalInput.topicCode,
                        sectionsData: inputData.childrenOutputs.map(child => child.info)
                    }
                }]

                return new AgentTaskOrchestratorResponse("subtasks", cid, undefined, subtasks, "topic-genealogy-group")
            }

        }

        return new AgentTaskOrchestratorResponse("completed", cid, { done: true });

    }
}