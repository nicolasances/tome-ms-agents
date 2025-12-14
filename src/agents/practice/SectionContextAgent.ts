import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { JuiceSchema } from "../../model/JuiceSchema";
import { TomeChallengesAPI } from "../../integration/challenges/TomeChallengesAPI";
import { ChallengeFactory } from "../../integration/challenges/ChallengeFactory";

export class SectionContextAgent extends GaleAgent<typeof SectionContextAgent.inputSchema, typeof SectionContextAgent.outputSchema> {

    static taskId: string = "topic.section.context";

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionCode: z.string().describe("Code of the section to classify. E.g. 'boniface-viii'"),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        previousSectionJuice: z.array(JuiceSchema).nullable().describe("Main events or aspects extracted from the previous section content."),
        juice: z.array(JuiceSchema).describe("Main events or aspects extracted from the section content."),
    });

    static contextSchema = z.object({
        context: z.string().describe("Contextual information on the section.")
    })

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        juice: z.array(JuiceSchema).describe("Main events or aspects extracted from the section content."),
        context: z.string().describe("Contextual information on the section."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Context Extractor",
        taskId: SectionContextAgent.taskId,
        inputSchema: SectionContextAgent.inputSchema,
        outputSchema: SectionContextAgent.outputSchema,
        description: "Agent that creates a concise contextual summary that helps place the section within the broader context, to introduce it without giving details.", 
        model: "anthropic.claude-3.7-sonnet",
    };

    async executeTask(task: AgentTaskRequest<typeof SectionContextAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionContextAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData! as z.infer<typeof SectionContextAgent.inputSchema>;

        logger.compute(cid, `Creating the context in section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content and the previous section content, so that context can be built
        let previousSectionContent: string = "Not available";
        if (inputData.previousSectionJuice) previousSectionContent = inputData.previousSectionJuice.map(j => j.toRemember).join("\n");

        // const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);
        const sectionContent = inputData.juice.map(j => j.toRemember).join("\n");

        // 2. Prompt
        const prompt = await this.prompt({ sectionContent, previousSectionContent });

        const response = await this.ai().generate({ prompt: prompt, outputSchema: SectionContextAgent.contextSchema });

        const output = {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            context: response?.output!.context,
            juice: inputData.juice,
        }

        // 3. Save the Juice Challenge for Tome
        logger.compute(cid, `Created context for section [${inputData.sectionCode}]. Saving Juice Challenge through Tome Challenges API`, "info");

        const challenge = ChallengeFactory.juiceChallenge(output);

        try {
            await new TomeChallengesAPI("tome-ms-challenges", this.config!).saveChallenge(challenge, cid);
        } 
        catch (error) {
            logger.compute(cid, `Error saving Juice Challenge for section [${inputData.sectionCode}]: ${error}`, "error");

            return new AgentTaskResponse("failed", cid, {
                message: "Error saving Juice Challenge: " + (error as Error).message, 
            } as any);
        }

        // 4. Return classification result
        return new AgentTaskResponse("completed", cid, output);
    }
}