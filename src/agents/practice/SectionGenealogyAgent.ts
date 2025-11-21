import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { TomeKnowledgeBase } from "../../tomekb/TomeKnowledgeBase";


export class SectionGenealogyAgent extends GaleAgent<typeof SectionGenealogyAgent.inputSchema, typeof SectionGenealogyAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionCode: z.string().describe("Code of the section to classify. E.g. 'boniface-viii'"),
        sectionIndex: z.number().describe("Index of the section within the topic."),
    });

    static generalogiesSchema = z.array(z.array(z.string())).describe("List of genealogical information detected in the section content. Each genealogy is represented as an array of 3 strings, where the first string is the subject, the second string the relationship and the third string the object. E.g. ['Jack, 'son', 'John']");

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        genealogies: SectionGenealogyAgent.generalogiesSchema
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Genealogy Detector",
        taskId: "topic.section.genealogy",
        inputSchema: SectionGenealogyAgent.inputSchema,
        outputSchema: SectionGenealogyAgent.outputSchema,
        description: "Agent for detecting genealogical information in sections of a Tome Topic. This agent analyzes the content of a section and determines if it contains genealogical details such as family relationships, lineages, or ancestry information."
    };

    async executeTask(task: AgentTaskRequest<typeof SectionGenealogyAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionGenealogyAgent.outputSchema>> {

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
            You are an Agent specialized in extracting genealogical information from historical texts.
            Given the following content, identify and extract genealogical relationships in the form of triples: (subject, relationship, object).
            The subject and object are names of individuals, and the relationship describes their familial connection (e.g., parent, child, sibling, spouse).

            ALLOWED family connections are ONLY: child, parent, sibling, spouse, grandparent, grandchild.
            DISCARD any information that does not fit into these relationships. DO NOT add relationship types that are not in the allowed list.

            Make sure to avoid duplicates and symmetric entries (e.g., if you have (Alice, parent, Bob), do not include (Bob, child, Alice)).

            Content:
            ${sectionContent}
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: SectionGenealogyAgent.generalogiesSchema } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            genealogies: response.output || []
        });
    }
}