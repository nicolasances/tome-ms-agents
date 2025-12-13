import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";
import { TimelineSchema } from "../../model/TimelineSchema";
import { GaleKit } from "../../gale/gentools/GaleKit";


export class SectionTimelineAgent extends GaleAgent<typeof SectionTimelineAgent.inputSchema, typeof SectionTimelineAgent.outputSchema> {

    static taskId: string = "topic.section.timeline";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionCode: z.string().describe("Code of the section to classify. E.g. 'boniface-viii'"),
        sectionIndex: z.number().describe("Index of the section within the topic."),
    });

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        timeline: TimelineSchema.describe("Timeline events extracted from the section content."),
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

        const ai = GaleKit.gale({ model: "amazon.nova-lite", host: { region: "eu-north-1" } });

        logger.compute(cid, `Detecting timeline in section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);

        const prompt = await this.prompt({ sectionContent: sectionContent });
        
        const response = await ai.generate({ prompt: prompt, outputSchema: TimelineSchema });

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