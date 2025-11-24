import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../../gale/model/AgentTask";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";


export class PersonalitiesAgent extends GaleAgent<typeof PersonalitiesAgent.inputSchema, typeof PersonalitiesAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        people: z.array(PersonalitySchema).describe("List of people mentioned in the topic (blog) with a description of who they are."),
    });

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        personalities: z.array(PersonalitySchema).describe("Cleaned-up list of personalities mentioned in the topic, with duplicates removed."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Personalities Generator",
        taskId: "topic.personalities.generate",
        inputSchema: PersonalitiesAgent.inputSchema,
        outputSchema: PersonalitiesAgent.outputSchema,
        description: "Agent for generating a cleaned-up list of historical personalities mentioned in a Tome Topic. This agent processes a list of people with descriptions and removes duplicates to create a concise list of unique personalities."
    };

    async executeTask(task: AgentTaskRequest<typeof PersonalitiesAgent.inputSchema>): Promise<AgentTaskResponse<typeof PersonalitiesAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Creating the list of personalities for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const data = task.taskInputData!.people;

        const prompt = `
            You are an Agent specialized in identifying understanding historical content and context and working with historical personalities. 

            In the following content, you will find a list of people mentioned in various sections of a historical topic, each with a description of who they are.
            This list contains redundant information (same person mentioned multiple times with slightly different descriptions, or names written differently).

            Your task is to clean up this list by identifying and removing duplicates, ensuring that each personality is represented only once.
            - Two entries refer to the same personality if their names are identical or very similar (e.g., "Pippin" and "Pippin the Short") and their descriptions indicate they are the same historical figure.
            - When duplicates are found, retain the most complete and informative description and retain the most historically accurate name.
            - The output should be a cleaned-up list of personalities, each represented by a name and a description.

            Content (list of people)
            ${JSON.stringify(data, null, 2)}
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: z.array(PersonalitySchema).describe("Cleaned-up list of personalities mentioned in the topic, with duplicates removed.") } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            personalities: response.output!
        });
    }
}