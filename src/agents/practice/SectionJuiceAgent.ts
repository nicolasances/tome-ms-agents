import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";
import { JuiceSchema } from "../../model/JuiceSchema";

export class SectionJuiceAgent extends GaleAgent<typeof SectionJuiceAgent.inputSchema, typeof SectionJuiceAgent.outputSchema> {

    static taskId: string = "topic.section.juice";

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
        juice: z.array(JuiceSchema).describe("Main events or aspects extracted from the section content."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Juice Extractor",
        taskId: SectionJuiceAgent.taskId,
        inputSchema: SectionJuiceAgent.inputSchema,
        outputSchema: SectionJuiceAgent.outputSchema,
        description: "Agent for extracting the most important information from sections of a Tome Topic. This agent analyzes the content of a section and summarizes the key events, facts, characters, and dates that are essential to remember.",
        model: "amazon.nova-pro",
    };

    async executeTask(task: AgentTaskRequest<typeof SectionJuiceAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionJuiceAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData! as z.infer<typeof SectionJuiceAgent.inputSchema>;

        logger.compute(cid, `Detecting timeline in section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);

        // 2. Prompt
        const prompt = await this.prompt({ sectionContent });

        const response = await this.ai().generate({ prompt: prompt, outputSchema: z.array(JuiceSchema).describe("Main events or aspects extracted from the section content.") });

        // 3. Create Juice Challenge for Tome


        // 4. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            juice: response?.output!
        });
    }
}