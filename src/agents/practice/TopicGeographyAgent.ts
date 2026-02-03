import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { GenealogicTreeSchema, RelationshipSchema } from "../../model/GenealogicTreeSchema";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";
import { JuiceSchema } from "../../model/JuiceSchema";
import { TopicGeographicalLocation } from "../../model/TopicGeographicalLocationSchema";


export class TopicGeographyAgent extends GaleAgent<typeof TopicGeographyAgent.inputSchema, typeof TopicGeographyAgent.outputSchema> {

    static taskId: string = "topic.locations.build";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        juice: z.array(JuiceSchema).describe("All the important aspects of the Topic."),
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
        agentName: "Tome Topic Locations Agent",
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

        logger.compute(cid, `Consolidating genealogy for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const prompt = await this.prompt({ 
            relationships: JSON.stringify(task.taskInputData!.relationships, null, 2),
            peopleDescriptions: JSON.stringify(task.taskInputData!.peopleDescriptions, null, 2)
        });

        const response = await ai.generate({ prompt: prompt, outputSchema: TopicGeographyAgent.genealogicTrees });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            genealogicTrees: response.output!
        });
    }
}