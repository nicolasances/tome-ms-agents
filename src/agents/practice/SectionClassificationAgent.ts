import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { genkit, z } from 'genkit';
import { awsBedrock, anthropicClaude37SonnetV1 } from "genkitx-aws-bedrock";
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";

export class SectionClassificationAgent extends GaleAgent<typeof SectionClassificationAgent.inputSchema, typeof SectionClassificationAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionCode: z.string().describe("Code of the section to classify. E.g. 'boniface-viii'"),
        sectionIndex: z.number().describe("Index of the section within the topic."),
    });

    static outputSchema = z.object({
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        labels: z.array(z.string()).describe("List of labels assigned to the section content."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Classifier",
        taskId: "topic.section.classify",
        inputSchema: SectionClassificationAgent.inputSchema,
        outputSchema: SectionClassificationAgent.outputSchema,
        description: "Agent for labelling sections of a Tome Topic. This agent analyzes the content of a section and assigns one or more predefined labels based on the content's characteristics."
    };

    async executeTask(task: AgentTaskRequest<typeof SectionClassificationAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionClassificationAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Classifying section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);

        // 2. Use an LLM to classify the section content
        const labels: Label[] = [
            new Label("history", "This label can be only used for text that describes historical events, figures, or periods. Use this label when the content focuses mainly on a historical subject, event or era. "),
            new Label("timeline", "This label is appropriate for text that contain events that have a chronological ordering. Use this label when the content contains sequences of events where chronological order can be determined."),
            new Label("genealogy", "This label should be used for text that contain genealogical information. For example text that contains family relationships, lineages, or ancestry details should be classified with this label."),
        ]

        const classificationPrompt = `
            You are a classification engine for educational content. 
            Given the following content, label it using one or more of these labels: ${labels.map(l => `\n- ${l.code}: ${l.description}`).join('')}

            Content: 
            ${sectionContent}

            Do not add explanations, just return the list of labels that apply.
        `

        const ClassificationSchema = z.object({
            labels: z.array(z.string()).describe("List of labels that apply to the content from the predefined set"),
        })

        const response = await ai.generate({ prompt: classificationPrompt, output: { schema: ClassificationSchema } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
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