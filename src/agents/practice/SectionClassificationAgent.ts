import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { z } from 'genkit';
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";
import { LabelSchema } from "../../model/LabelSchema";
import { GaleKit } from "../../gale/gentools/GaleKit";

export class SectionClassificationAgent extends GaleAgent<typeof SectionClassificationAgent.inputSchema, typeof SectionClassificationAgent.outputSchema> {

    static taskId: string = "topic.section.classify";

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
        labels: z.array(LabelSchema).describe("List of labels assigned to the section content."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Classifier",
        taskId: SectionClassificationAgent.taskId,
        inputSchema: SectionClassificationAgent.inputSchema,
        outputSchema: SectionClassificationAgent.outputSchema,
        description: "Agent for labelling sections of a Tome Topic. This agent analyzes the content of a section and assigns one or more predefined labels based on the content's characteristics."
    };

    async executeTask(task: AgentTaskRequest<typeof SectionClassificationAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionClassificationAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = GaleKit.gale({ model: "amazon.nova-lite", host: { region: "eu-north-1" } });

        logger.compute(cid, `Classifying section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);

        // 2. Use an LLM to classify the section content
        const classificationPrompt = await this.prompt({ sectionContent });

        const ClassificationSchema = z.object({
            labels: z.array(z.string()).describe("List of labels that apply to the content from the predefined set"),
        })

        const response = await ai.generate({ prompt: classificationPrompt, outputSchema: ClassificationSchema });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            labels: response.output?.labels || []
        });
    }


}

class Label {
    code: string;
    description: string;

    constructor(code: string, description: string) {
        this.code = code;
        this.description = description;
    }
}