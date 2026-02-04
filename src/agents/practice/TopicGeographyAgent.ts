import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { GeographicAreas, TopicGeographicalLocation } from "../../model/TopicGeographicalLocationSchema";
import { TomeTopicsAPI } from "../../api/TomeTopicsAPI";
import { TotoRuntimeError } from "toto-api-controller";
import { API_DEPENDENCIES } from "../../Config";


export class TopicGeographyAgent extends GaleAgent<typeof TopicGeographyAgent.inputSchema, typeof TopicGeographyAgent.outputSchema> {

    static taskId: string = "topic.locations.build";
    static agentName: string = "Tome Topic Locations Agent";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        juice: z.array(z.string()).describe("All the important aspects of the Topic."),
    })

    static topicLocations = z.array(
        TopicGeographicalLocation
    ).describe("List of geographical locations that this Topic is mostly concerned with")

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        locations: TopicGeographyAgent.topicLocations,
        numUpdatedTopics: z.number().describe("Number of topics updated with geographical location information.")
    });

    manifest: GaleAgentManifest = {
        agentName: TopicGeographyAgent.agentName,
        taskId: TopicGeographyAgent.taskId,
        inputSchema: TopicGeographyAgent.inputSchema,
        outputSchema: TopicGeographyAgent.outputSchema,
        description: "Agent that determines which geographical locations are mostly covered by this Topic. Some Topics are specific to certain locations, while others are broader and refer to multiple locations.",
        model: "amazon.nova-pro",
    };

    async executeTask(task: AgentTaskRequest<typeof TopicGeographyAgent.inputSchema>): Promise<AgentTaskResponse<typeof TopicGeographyAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = this.ai();

        logger.compute(cid, `Determining geography information for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const prompt = await this.prompt({
            geographicAreas: JSON.stringify(GeographicAreas),
            topicJuice: JSON.stringify(inputData.juice, null, 2)
        });

        const response = await ai.generate({ prompt: prompt, outputSchema: TopicGeographyAgent.topicLocations });

        const locations = response.output as z.infer<typeof TopicGeographyAgent.topicLocations>;

        try {
            // 2. Call the Tome API to update the topic metadta
            const result = await new TomeTopicsAPI(API_DEPENDENCIES.tomeTopics, this.config!).updateTopicMetadata(inputData.topicId, {
                geoArea: locations && locations.length > 0 ? {
                    mainArea: locations[0].zone,
                    allAreas: locations.map(loc => loc.zone)
                } : undefined
            }, cid);

            logger.compute(cid, `Result of topic [${inputData.topicId}] metadata update. Modified topics: ${JSON.stringify(result)}`, "info");

            // 3. Return classification result
            return new AgentTaskResponse("completed", cid, {
                topicId: inputData.topicId,
                topicCode: inputData.topicCode,
                locations: response.output!,
                numUpdatedTopics: result.modifiedTopics
            });

        } catch (error) {
            logger.compute(cid, `Failed to update topic [${inputData.topicId}] metadata with geography information: ${error}`, "error");
            throw new TotoRuntimeError(500, `Failed to update topic [${inputData.topicId}] metadata with geography information: ${error}`);
        }
    }
}