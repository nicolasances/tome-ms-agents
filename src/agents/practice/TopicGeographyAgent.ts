import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { JuiceSchema } from "../../model/JuiceSchema";
import { GeographicAreas, TopicGeographicalLocation } from "../../model/TopicGeographicalLocationSchema";


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
    });

    manifest: GaleAgentManifest = {
        agentName: TopicGeographyAgent.agentName,
        taskId: TopicGeographyAgent.taskId,
        inputSchema: TopicGeographyAgent.inputSchema,
        outputSchema: TopicGeographyAgent.outputSchema,
        description: "Agent that determines which geographical locations are mostly covered by this Topic. Some Topics are specific to certain locations, while others are broader and refer to multiple locations.", 
        model: "amazon.nova-lite",
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

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            locations: response.output!
        });
    }
}