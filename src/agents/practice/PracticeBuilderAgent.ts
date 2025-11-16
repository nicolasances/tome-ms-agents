import { z } from "genkit";
import { TomeTopicsAPI } from "../../api/TomeTopicsAPI";
import { API_DEPENDENCIES } from "../../Config";
import { GaleAgentManifest, GaleOrchestratorAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskOrchestratorResponse, SubTaskInfo } from "../../gale/model/AgentTask";

/**
 * This agent is the ORCHESTRATOR for building practices for a give Tome Topic.
 */
export class PracticeBuilderAgent extends GaleOrchestratorAgent<typeof PracticeBuilderAgent.inputSchema, typeof PracticeBuilderAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        originalInput: z.any().optional().describe("Original input data passed when starting the practice building process."),
        childrenOutputs: z.array(z.any()).optional().describe("Outputs from child tasks, when this agent is resumed.")
    });

    static outputSchema = z.object({
        done: z.boolean().describe("Whether the practice building process is complete."),
        error: z.string().optional().describe("Error message if the process failed.")
    });

    manifest: GaleAgentManifest = {
        agentName: "TomePracticeBuilder",
        taskId: "topic.practice.build",
        inputSchema: PracticeBuilderAgent.inputSchema,
        outputSchema: PracticeBuilderAgent.outputSchema,
        description: "Orchestrator agent for building practices for a given Tome Topic."
    };

    async executeTask(task: AgentTaskRequest<typeof PracticeBuilderAgent.inputSchema>): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;

        if (!task.taskInputData) {
            throw new Error("Task input data is required");
        }

        // Step 1: Get a classification Agent to classify the topic type
        if (task.command.command === "start") {

            this.logger?.compute(cid, `Starting practice building for topic [${task.taskInputData.topicId} - ${task.taskInputData.topicCode}]`, "info");

            // 1.1. Get the list of sections for the topic 
            const topic = await new TomeTopicsAPI(API_DEPENDENCIES.tomeTopics, this.config!).getTopic(task.taskInputData.topicId, cid);

            if (!topic || !topic.sections || topic.sections.length === 0) {

                logger.compute(cid, `No sections found for topic [${task.taskInputData.topicId}]`, "error");

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

            this.logger?.compute(cid, `Resuming practice building for topic [${task.taskInputData.originalInput.topicId} - ${task.taskInputData.originalInput.topicCode}]`, "info");

            // Step 2: Generate overall classification & trigger next step
            if (task.command.completedSubtaskGroupId == "sections-classification-group") {

                console.log(task.taskInputData);


            }

        }

        return new AgentTaskOrchestratorResponse("completed", task.correlationId!, { done: true });

    }
}