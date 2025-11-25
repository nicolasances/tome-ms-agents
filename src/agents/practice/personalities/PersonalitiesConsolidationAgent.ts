import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../../gale/model/AgentTask";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";


export class PersonalitiesConsolidationAgent extends GaleAgent<typeof PersonalitiesConsolidationAgent.inputSchema, typeof PersonalitiesConsolidationAgent.outputSchema> {

    static taskId: string = "topic.personalities.consolidate";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        peopleDescriptions: z.array(PersonalitySchema).describe("List of people mentioned in the blog with a description of who they are."),
    })

    static llmOutputSchema = z.array(PersonalitySchema).describe("Consolidated list of personalities for the topic.");

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        personalities: PersonalitiesConsolidationAgent.llmOutputSchema
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Personalities Consolidation Agent",
        taskId: PersonalitiesConsolidationAgent.taskId,
        inputSchema: PersonalitiesConsolidationAgent.inputSchema,
        outputSchema: PersonalitiesConsolidationAgent.outputSchema,
        description: "Agent for consolidating personalities information of a Tome Topic. This agent consolidates personalities data from multiple sections into a comprehensive overview and a set of complete genealogical trees."
    };

    async executeTask(task: AgentTaskRequest<typeof PersonalitiesConsolidationAgent.inputSchema>): Promise<AgentTaskResponse<typeof PersonalitiesConsolidationAgent.outputSchema>> {

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
            You are an Agent specialized in the understanding of historical information and specifically historical personalities.
            You have historical knowledge that you can use to better understand historical figures.

            In the following content, you will find a list of people mentioned in the different sections of a blog post with a description of who they are. The data has a high chance of containing duplicates or overlapping information.

            Your task is to consolidate this information by removing duplicates and merging overlapping descriptions. 
            Make sure that each personality in the consolidated list is unique and contains the most comprehensive description possible.

            ----
            List of people descriptions:
            ${JSON.stringify(task.taskInputData!.peopleDescriptions, null, 2)}

            ----
            Generate the consolidated list of personalities:
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: PersonalitiesConsolidationAgent.llmOutputSchema } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            personalities: response.output!
        });
    }
}