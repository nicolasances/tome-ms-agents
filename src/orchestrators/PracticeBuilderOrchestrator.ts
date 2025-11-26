import { z } from "genkit";
import { TomeTopicsAPI } from "../api/TomeTopicsAPI";
import { API_DEPENDENCIES } from "../Config";
import { GaleOrchestratorAgent, GaleOrchestratorAgentManifest } from "../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskOrchestratorResponse, SubTaskInfo } from "../gale/model/AgentTask";
import { SectionGenealogyAgent } from "../agents/practice/SectionGenealogyAgent";
import { GenealogicTreeGeneration } from "./actions/GenealogicTreeGeneration";
import { PersonalitiesConsoliation } from "./actions/PersonalitiesConsoliation";
import { SectionClassificationAgent } from "../agents/practice/SectionClassificationAgent";
import { SectionClassification, SectionGenealogicRelationshipsExtraction } from "./actions/SectionGenealogicRelationshipsExtraction";
import { SectionTimelineRelationshipsExtraction } from "./actions/SectionTimelineRelationshipsExtraction";
import { AgentNode, DeterministicFlow } from "../gale/model/DeterministicFlow";
import { GaleOrchestrator } from "../gale/orchestrator/GaleOrchestrator";
import { SectionTimelineAgent } from "../agents/practice/SectionTimelineAgent";

/**
 * This agent is the ORCHESTRATOR for building practices for a give Tome Topic.
 * 
 * This is the NEW orchestrator built with the new Gale standard for workflows.
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
        description: "Orchestrator Agent that builds a complete Tome Practice for a given Topic by coordinating multiple sub-agents."
    };

    async executeTask(task: AgentTaskRequest<typeof PracticeBuilderOrchestratorAgent.inputSchema | typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderOrchestratorAgent.outputSchema>> {

        const cid = task.correlationId;
        const logger = this.logger!;

        if (task.command.command === "start") {

            const inputData = task.taskInputData as z.infer<typeof PracticeBuilderOrchestratorAgent.inputSchema>;

            this.logger?.compute(cid, `Starting practice building for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

            // 1.1. Get the list of sections for the topic 
            const topic = await new TomeTopicsAPI(API_DEPENDENCIES.tomeTopics, this.config!).getTopic(inputData.topicId, cid);

            if (!topic || !topic.sections || topic.sections.length === 0) {

                logger.compute(cid, `No sections found for topic [${inputData.topicId}]`, "error");

                return new AgentTaskOrchestratorResponse("failed", cid, { done: false, error: "No sections found for topic" });
            }

            // 1. Create the flow and start it
            const flow: DeterministicFlow = {
                start: {
                    name: "branch-01",
                    branch: [
                        {
                            name: "group-section-classification",
                            parallelize: topic.sections.map((section, index) => new AgentNode(
                                "topic.section.classify",
                                (input: z.infer<typeof PracticeBuilderOrchestratorAgent.inputSchema>) => ({ sectionCode: section, sectionIndex: index, topicId: input.topicId, topicCode: input.topicCode } as z.infer<typeof SectionClassificationAgent.inputSchema>)
                            )),
                            next: null
                            // next: {
                            //     name: "branch-01.1",
                            //     branch: [
                            //         {
                            //             name: "group-section-genealogy",
                            //             parallelize: [{ agent: {}, next: null }, { agent: {}, next: null }, { agent: {}, next: null }],
                            //             next: null
                            //         },
                            //         {
                            //             name: "group-section-personalities",
                            //             parallelize: [{ agent: {}, next: null }, { agent: {}, next: null }, { agent: {}, next: null }],
                            //             next: {
                            //                 name: "personalities-consolidation",
                            //                 agent: {},
                            //                 next: null
                            //             }
                            //         }
                            //     ],
                            //     next: null
                            // }
                        },
                        {
                            name: "group-section-timeline",
                            parallelize: topic.sections.map((section, index) => new AgentNode(
                                "topic.section.timeline",
                                (input: z.infer<typeof PracticeBuilderOrchestratorAgent.inputSchema>) => ({ sectionCode: section, sectionIndex: index, topicId: input.topicId, topicCode: input.topicCode } as z.infer<typeof SectionTimelineAgent.inputSchema>)
                            )),
                            next: null
                        }
                    ],
                    next: null
                }
            }

            return await new GaleOrchestrator(cid, flow).start(cid);

            // return new AgentTaskOrchestratorResponse("subtasks", task.correlationId!, undefined, subtasks)
        }
        else if (task.command.command == 'resume') {

            const inputData = task.taskInputData as z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>;

            this.logger?.compute(cid, `Resuming practice building for topic [${inputData.originalInput.topicId} - ${inputData.originalInput.topicCode}]`, "info");

            if (task.command.completedSubtaskGroupId == "sections-classification-group") {

                const sectionClassificationOutput = inputData.childrenOutputs as z.infer<typeof SectionClassificationAgent.outputSchema>[];

                const sectionsClassifications: SectionClassification[] = sectionClassificationOutput.map(sc => ({ labels: sc.labels, sectionIndex: sc.sectionIndex, sectionCode: sc.sectionCode }))

                // 1. Trigger Section Genealogic relationships extraction
                const genSubtasks = new SectionGenealogicRelationshipsExtraction().createSubtasks("sections-genealogy-group", inputData.originalInput.topicId, inputData.originalInput.topicCode, sectionsClassifications);

                // 2. Trigger Section Timeline extraction
                const timelineSubtasks = new SectionTimelineRelationshipsExtraction().createSubtasks("sections-timeline-group", inputData.originalInput.topicId, inputData.originalInput.topicCode, sectionsClassifications);

                const subtasks = [...genSubtasks, ...timelineSubtasks];

                return new AgentTaskOrchestratorResponse("subtasks", cid, undefined, subtasks);
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

        }

        return new AgentTaskOrchestratorResponse("completed", cid, { done: true });

    }
}