import { z } from "genkit";
import { TomeTopicsAPI } from "../../../api/TomeTopicsAPI";
import { API_DEPENDENCIES } from "../../../Config";
import { GaleOrchestratorAgent, GaleOrchestratorAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskOrchestratorResponse, SubTaskInfo } from "../../../gale/model/AgentTask";
import { OnSectionsClassificationGroupDone } from "./steps/OnSectionsClassificationGroupDone";
import { SectionGenealogyAgent } from "../genealogy/SectionGenealogyAgent";
import { GenealogicTreeGeneration } from "./actions/GenealogicTreeGeneration";
import { PersonalitiesConsoliation } from "./actions/PersonalitiesConsoliation";

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
            const subtasks: SubTaskInfo[] = topic.sections.map((sectionCode, index) => {
                return {
                    taskId: "topic.section.classify",
                    subtasksGroupId: "sections-classification-group",
                    taskInputData: {
                        topicId: topic.id,
                        topicCode: topic.topicCode,
                        sectionCode: sectionCode,
                        sectionIndex: index
                    }
                }
            });

            return new AgentTaskOrchestratorResponse("subtasks", task.correlationId!, undefined, subtasks)
        }
        else if (task.command.command == 'resume') {

            const inputData = task.taskInputData as z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>;

            this.logger?.compute(cid, `Resuming practice building for topic [${inputData.originalInput.topicId} - ${inputData.originalInput.topicCode}]`, "info");

            if (task.command.completedSubtaskGroupId == "sections-classification-group") {
                return await new OnSectionsClassificationGroupDone(cid, logger).do(inputData);
            }
            else if (task.command.completedSubtaskGroupId == "sections-genealogy-group") {

                const sectionGenealogyOutput = inputData.childrenOutputs as z.infer<typeof SectionGenealogyAgent.outputSchema>[];

                // Cast input data
                const relationships = sectionGenealogyOutput.flatMap(childOutput => childOutput.info.genealogies);
                const personalities = sectionGenealogyOutput.flatMap(childOutput => childOutput.info.people);

                const subtaskGroupId = "genealogy-personalities-group";

                // 1. Trigger genealogic tree generation
                const subtasks1 = new GenealogicTreeGeneration().createSubtasks(subtaskGroupId, inputData.originalInput.topicId, inputData.originalInput.topicCode, relationships, personalities);

                // 2. Trigger personalities generation
                const subtasks2 = new PersonalitiesConsoliation().createSubtasks(subtaskGroupId, inputData.originalInput.topicId, inputData.originalInput.topicCode, personalities);

                // Merge subtasks
                const subtasks = [...subtasks1, ...subtasks2];

                return new AgentTaskOrchestratorResponse("subtasks", cid, undefined, subtasks);
            }
            else if (task.command.completedSubtaskGroupId == "topic-genealogy-prep") {
                // return await new OnGenealogyCleanupDone(cid, logger).do(inputData);
                return new AgentTaskOrchestratorResponse("completed", cid, { done: true });
            }

        }

        return new AgentTaskOrchestratorResponse("completed", cid, { done: true });

    }
}