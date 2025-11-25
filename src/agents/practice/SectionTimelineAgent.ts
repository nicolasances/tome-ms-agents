import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";


export class SectionTimelineAgent extends GaleAgent<typeof SectionTimelineAgent.inputSchema, typeof SectionTimelineAgent.outputSchema> {

    static taskId: string = "topic.section.timeline";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionCode: z.string().describe("Code of the section to classify. E.g. 'boniface-viii'"),
        sectionIndex: z.number().describe("Index of the section within the topic."),
    });

    static timelineElementSchema = z.object({
        year: z.number().optional().describe("Year of the timeline event as an integer."),
        month: z.number().optional().describe("Month of the timeline event as an integer (1-12)."),
        day: z.number().optional().describe("Day of the month of the timeline event as an integer (1-31)."),
        description: z.string().describe("Description of the timeline event."),
    });

    static timelineSchema = z.array(SectionTimelineAgent.timelineElementSchema).describe("List of timeline events in chronological order extracted from the section content.");

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        timeline: SectionTimelineAgent.timelineSchema.describe("Timeline events extracted from the section content."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Timeline Extractor",
        taskId: SectionTimelineAgent.taskId,
        inputSchema: SectionTimelineAgent.inputSchema,
        outputSchema: SectionTimelineAgent.outputSchema,
        description: "Agent for extracting timeline information in sections of a Tome Topic. This agent analyzes the content of a section and determines if it contains timeline details such as dates and descriptions of events."
    };

    async executeTask(task: AgentTaskRequest<typeof SectionTimelineAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionTimelineAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Detecting genealogy in section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);

        const prompt = `
            You are an Agent specialized in understanding historical text and sorting events in chronological order. 

            You are provided the content of a section from a historical topic. 
            
            Your task: 
            Read through the content and identify all events that can be placed in chronological order, either based on explicit dates mentioned or inferred from the context.

            Rules TO FOLLOW: 
            - Not all events need to have dates. 
            - DO NOT INVENT DATES. ONLY EXTRACT DATES THAT ARE PRESENT IN THE TEXT.
            - If a date is partially specified (e.g., only year or year and month), extract only the available components.
            - Ensure the description provides context about the event associated with the date.

            Content:
            ${sectionContent}
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: SectionTimelineAgent.timelineSchema } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            timeline: response.output!
        });
    }
}