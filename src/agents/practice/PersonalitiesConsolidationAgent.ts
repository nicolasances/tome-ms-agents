import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { GaleKit } from "../../gale/gentools/GaleKit";


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

        const ai = GaleKit.gale({ model: "amazon.nova-lite", host: { region: "eu-north-1" } });

        logger.compute(cid, `Consolidating genealogy for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const prompt = await this.prompt({
            peopleDescriptions: JSON.stringify(task.taskInputData!.peopleDescriptions, null, 2)
        });

        const response = await ai.generate({
            prompt: prompt,
            outputSchema: PersonalitiesConsolidationAgent.llmOutputSchema
        });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            personalities: response.output!
        });
    }
}