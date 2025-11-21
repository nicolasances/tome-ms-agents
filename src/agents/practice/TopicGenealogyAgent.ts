import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { SectionGenealogyAgent } from "./SectionGenealogyAgent";


export class TopicGenealogyAgent extends GaleAgent<typeof TopicGenealogyAgent.inputSchema, typeof TopicGenealogyAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionsData: z.array(SectionGenealogyAgent.responseSchema).describe("List of section genealogy information detected in the topic."),
    });

    static responseSchema = z.array(z.array(z.string())).describe("List of genealogical information detected in the section content. Each genealogy is represented as an array of 3 strings, where the first string is the subject, the second string the relationship and the third string the object. E.g. ['Jack, 'son', 'John']");

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        genealogicTrees: TopicGenealogyAgent.responseSchema.describe("List of genealogical trees representing the consolidated genealogical information for the topic."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Topic Genealogy Builder",
        taskId: "topic.genealogy",
        inputSchema: TopicGenealogyAgent.inputSchema,
        outputSchema: TopicGenealogyAgent.outputSchema,
        description: "Agent for consolidating genealogical information of a Tome Topic. This agent consolidates genealogical data from multiple sections into a comprehensive overview and a set of complete genealogical trees."
    };

    async executeTask(task: AgentTaskRequest<typeof TopicGenealogyAgent.inputSchema>): Promise<AgentTaskResponse<typeof TopicGenealogyAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Consolidating genealogy for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const data = task.taskInputData!.sectionsData;

        const prompt = `
            You are an Agent specialized in consolidating genealogical information from historical texts.

            In the following content, you will find: 
            1. A list of genealogical relationships extracted from various sections of a historical topic, represented as triples (subject, relationship, object). E.g. (Jack, child, John) or (Helen spouse Jack).
            2. A list of people mentioned in the sections with a description of who they are.

            Your task is to consolidate this information into one or more comprehensive genealogical trees.
            The output will be a list of genealogic trees, where each tree is represented as a list of triples (subject, relationship, object). 
            Two different trees should not share the same person, otherwise the trees should be merged into one.

            ALLOWED family connections are ONLY: child, parent, sibling, spouse, grandparent, grandchild.
            DISCARD any information that does not fit into these relationships. DO NOT add relationship types that are not in the allowed list.

            Make sure to avoid duplicates and symmetric entries (e.g., if you have (Alice, parent, Bob), do not include (Bob, child, Alice)).

            Content:
            ${JSON.stringify(data, null, 2)}
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: TopicGenealogyAgent.responseSchema } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            genealogicTrees: response.output!
        });
    }
}