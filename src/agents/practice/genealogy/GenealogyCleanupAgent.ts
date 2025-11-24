import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../../gale/model/AgentTask";
import { SectionGenealogyAgent } from "./SectionGenealogyAgent";


export class GenealogyCleanupAgent extends GaleAgent<typeof GenealogyCleanupAgent.inputSchema, typeof GenealogyCleanupAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionsData: z.array(SectionGenealogyAgent.responseSchema).describe("List of section genealogy information detected in the topic."),
    });

    static cleanedUpGenealogies = z.array(z.array(z.string())).describe("List of genealogical information detected in the section content. Each genealogy is represented as an array of 3 strings, where the first string is the subject, the second string the relationship and the third string the object. E.g. ['Jack, 'son', 'John']");

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        cleanedupInfo: GenealogyCleanupAgent.cleanedUpGenealogies
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Topic Genealogy Cleanup",
        taskId: "topic.genealogy.cleanup",
        inputSchema: GenealogyCleanupAgent.inputSchema,
        outputSchema: GenealogyCleanupAgent.outputSchema,
        description: "Agent part of consolidating genealogical information of a Tome Topic. This agent cleans up duplicated genealogical data from multiple sections."
    };

    async executeTask(task: AgentTaskRequest<typeof GenealogyCleanupAgent.inputSchema>): Promise<AgentTaskResponse<typeof GenealogyCleanupAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Cleaning up genealogy information for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const data = task.taskInputData!.sectionsData;

        // Flatten the list of genealogies from all sections
        const flattenedGenealogies = data.flatMap(section => section.genealogies);
        const flattenedPeople = data.flatMap(section => section.people);

        const prompt = `
            You are an Agent specialized in identifying redundant information and cleaning it up.

            In the following content, you will find: 
            1. A list of genealogical relationships extracted from various sections of a historical topic, represented as triples (subject, relationship, object). E.g. (Jack, child, John) or (Helen spouse Jack).
            2. A list of people with a description of who they are.

            Your taks is to REMOVE ALL DUPLICATED INFORMATION from the genealogies: From the list of genealogies, remove all duplicate entries (e.g., if (Alice, parent, Bob) appears multiple times, keep only one instance).

            List of People:
            ${JSON.stringify(flattenedPeople, null, 2)}

            List of Genealogies:
            ${JSON.stringify(flattenedGenealogies, null, 2)}

            Return the cleanup list of genealogies.
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: GenealogyCleanupAgent.cleanedUpGenealogies } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            cleanedupInfo: response.output!
        });
    }
}