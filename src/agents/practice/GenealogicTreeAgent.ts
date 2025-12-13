import { z } from "genkit";
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
        description: "Agent for consolidating genealogical information of a Tome Topic. This agent consolidates genealogical data from multiple sections into a comprehensive overview and a set of complete genealogical trees.", 
        model: "anthropic.claude-3.7-sonnet",
    };

    async executeTask(task: AgentTaskRequest<typeof GenealogicTreeAgent.inputSchema>): Promise<AgentTaskResponse<typeof GenealogicTreeAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = this.ai();

        logger.compute(cid, `Consolidating genealogy for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        const prompt = await this.prompt({ 
            relationships: JSON.stringify(task.taskInputData!.relationships, null, 2),
            peopleDescriptions: JSON.stringify(task.taskInputData!.peopleDescriptions, null, 2)
        });

        const response = await ai.generate({ prompt: prompt, outputSchema: GenealogicTreeAgent.genealogicTrees });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            genealogicTrees: response.output!
        });
    }
}