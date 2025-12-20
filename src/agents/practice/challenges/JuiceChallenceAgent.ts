import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../../gale/model/AgentTask";
import { JuiceSchema } from "../../../model/JuiceSchema";
import { SectionContextAgent } from "../SectionContextAgent";
import { DateTestSchema, OpenQuestionTestSchema } from "../../../model/TomeTestsSchema";
import { ChallengeFactory } from "../../../integration/challenges/ChallengeFactory";
import { TomeChallengesAPI } from "../../../integration/challenges/TomeChallengesAPI";
import { API_DEPENDENCIES } from "../../../Config";

/**
 * This Agents is responsible for:
 *  
 * 1. Creating all the tests for the Juice Challenge
 *  * Concretely this means creating date tests: one date test per event/aspect with a date in the "to remember" list
 * 2. Using the Tome Challenges API to save the Juice Challenge 
 */
export class JuiceChallengeAgent extends GaleAgent<typeof JuiceChallengeAgent.inputSchema, typeof JuiceChallengeAgent.outputSchema> {

    static taskId: string = "juice.challenge.creation";

    static inputSchema = SectionContextAgent.outputSchema;

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        juice: z.array(JuiceSchema).describe("Main events or aspects extracted from the section content."),
        context: z.string().describe("Contextual information on the section."),
        dateTests: z.array(DateTestSchema).describe("List of date tests for the Juice Challenge."),
        juiceQuestion: OpenQuestionTestSchema.describe("Question asking for the user to recollect the main aspects or events of this section.")
    });

    llmOutputSchema = z.object({
        questions: z.array(DateTestSchema).describe("List of date questions for the provided key facts and events."),
        juiceQuestion: OpenQuestionTestSchema.describe("Question asking for the user to recollect the main aspects or events of this section.")
    })

    manifest: GaleAgentManifest = {
        agentName: "Tome Juice Challenge Creator",
        taskId: JuiceChallengeAgent.taskId,
        inputSchema: JuiceChallengeAgent.inputSchema,
        outputSchema: JuiceChallengeAgent.outputSchema,
        description: "Agent responsible for creating Tests for Juice Challenges based on the key facts and events extracted from Tome sections.", 
        model: "anthropic.claude-3.7-sonnet",
    };

    async executeTask(task: AgentTaskRequest<typeof JuiceChallengeAgent.inputSchema>): Promise<AgentTaskResponse<typeof JuiceChallengeAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData! as z.infer<typeof JuiceChallengeAgent.inputSchema>;

        logger.compute(cid, `Generating Juice Challenge questions for section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 2. Prompt
        const prompt = await this.prompt({ keyFactsAndEvents: JSON.stringify(inputData.juice, null, 2) });

        const response = await this.ai().generate({ prompt: prompt, outputSchema: this.llmOutputSchema });

        const output = {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            context: inputData.context,
            juice: inputData.juice,
            dateTests: response?.output!.questions,
            juiceQuestion: response?.output!.juiceQuestion,
        }

        // 3. Save the Juice Challenge for Tome
        logger.compute(cid, `Created date tests for section [${inputData.sectionCode}]. Saving Juice Challenge through Tome Challenges API`, "info");

        const challenge = ChallengeFactory.juiceChallenge(output);

        try {
            const response = await new TomeChallengesAPI(API_DEPENDENCIES.tomeChallenges, this.config!).saveChallenge(challenge, cid) as any;

            if (response && response.body && response.body.code && response.body.code != 200) {
                return new AgentTaskResponse("failed", task.correlationId!, response);
            }
            
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