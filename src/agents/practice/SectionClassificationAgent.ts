import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { genkit, z } from 'genkit';
import { awsBedrock, anthropicClaude37SonnetV1 } from "genkitx-aws-bedrock";
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";

export class SectionClassificationAgent extends GaleAgent {

    agentName: string = "TomeSectionClassifier";
    taskId: string = "topic.section.classify";

    async executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Classifying section [${task.taskInputData?.sectionCode}] for topic [${task.taskInputData?.topicId} - ${task.taskInputData?.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(task.taskInputData.topicCode, task.taskInputData!.sectionCode, task.taskInputData!.sectionIndex);

        // 2. Use an LLM to classify the section content
        const labels: Label[] = [
            new Label("history", "This label can be only used for text that describes historical events, figures, or periods. Use this label when the content focuses mainly on a historical subject, event or era. "),
            new Label("timeline", "This label is appropriate for text that contain events that have a chronological ordering. Use this label when the content contains sequences of events where chronological order can be determined."),
            new Label("genealogy", "This label should be used for text that describes some level of family histories, lineages, or ancestral connections. Use this label when the content focuses on tracing relationships between individuals or families across generations."),
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
            topicCode: task.taskInputData?.topicCode,
            sectionCode: task.taskInputData?.sectionCode,
            sectionIndex: task.taskInputData?.sectionIndex,
            labels: response.output?.labels
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