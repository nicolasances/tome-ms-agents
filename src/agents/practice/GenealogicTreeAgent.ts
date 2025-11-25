import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { GenealogicTreeSchema, RelationshipSchema } from "../../model/GenealogicTreeSchema";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";


export class GenealogicTreeAgent extends GaleAgent<typeof GenealogicTreeAgent.inputSchema, typeof GenealogicTreeAgent.outputSchema> {

    static taskId: string = "topic.genealogic.tree.build";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        relationships: z.array(RelationshipSchema).describe("List of genealogical relationships extracted from the blog."),
        peopleDescriptions: z.array(PersonalitySchema).describe("List of people mentioned in the blog with a description of who they are."),
    })

    static genealogicTrees = z.array(
        GenealogicTreeSchema
    ).describe("List of genealogical trees representing the consolidated genealogical information for the topic.");

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        genealogicTrees: GenealogicTreeAgent.genealogicTrees.describe("Consolidated genealogical trees for the topic."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Genealogic Tree Builder",
        taskId: GenealogicTreeAgent.taskId,
        inputSchema: GenealogicTreeAgent.inputSchema,
        outputSchema: GenealogicTreeAgent.outputSchema,
        description: "Agent for consolidating genealogical information of a Tome Topic. This agent consolidates genealogical data from multiple sections into a comprehensive overview and a set of complete genealogical trees."
    };

    async executeTask(task: AgentTaskRequest<typeof GenealogicTreeAgent.inputSchema>): Promise<AgentTaskResponse<typeof GenealogicTreeAgent.outputSchema>> {

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

        const prompt = `
            You are an Agent specialized in the understanding of historical information and in the construction of genealogical trees.
            You have historical knowledge that you can use to better understand relationships between historical figures.

            In the following content, you will find: 
            1. A list of genealogical relationships extracted from a historical blog, represented as triples (subject, relationship, object). E.g. (Jack, child, John) or (Helen spouse Jack).
            2. A list of people mentioned in the sections with a description of who they are.

            Your task is to consolidate this information into one or more comprehensive genealogical trees.

            ----
            List of genealogical relationships:
            ${JSON.stringify(task.taskInputData!.relationships, null, 2)}

            ----
            List of people descriptions:
            ${JSON.stringify(task.taskInputData!.peopleDescriptions, null, 2)}

            ----
            Generate the genealogical trees:
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: GenealogicTreeAgent.genealogicTrees } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            genealogicTrees: response.output!
        });
    }
}