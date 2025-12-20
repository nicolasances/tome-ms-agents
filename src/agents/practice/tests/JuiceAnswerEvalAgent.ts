import { z } from "genkit";
import { GaleAgent, GaleAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../../gale/model/AgentTask";
import { JuiceSchema } from "../../../model/JuiceSchema";


export class JuiceAnswerEvalAgent extends GaleAgent<typeof JuiceAnswerEvalAgent.inputSchema, typeof JuiceAnswerEvalAgent.outputSchema> {

    static taskId: string = "juice.answer.eval";

    static inputSchema = z.object({
        userAnswer: z.string().describe("The user's answer to an open question on the topic."),
        juice: z.array(JuiceSchema).describe("The main events or aspects that should be reflected in the user's answer to the question."),
    })

    static outputSchema = z.object({
        numAspectsFound: z.number().describe("Number of main aspects or events from the 'juice' list that were reflected at an acceptable level in the user's answer."),
        juiceIndexesFound: z.array(z.number()).describe("Indexes of the main aspects or events from the 'juice' list that were reflected at an acceptable level in the user's answer. Remember that indexes are zero-based."),
        explanation: z.string().describe("A brief explanation of which aspects were found in the user's answer and which were missing."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Juice Answer Evaluator",
        taskId: JuiceAnswerEvalAgent.taskId,
        inputSchema: JuiceAnswerEvalAgent.inputSchema,
        outputSchema: JuiceAnswerEvalAgent.outputSchema,
        description: "Agent for evaluating the user's answer to an open question on a Tome Topic based on the main events or aspects extracted from the section content.",
        model: "anthropic.claude-3.7-sonnet",
    };

    async executeTask(task: AgentTaskRequest<typeof JuiceAnswerEvalAgent.inputSchema>): Promise<AgentTaskResponse<typeof JuiceAnswerEvalAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = this.ai();

        logger.compute(cid, `Evaluating user Answer`, "info");

        const prompt = await this.prompt({
            importantElements: inputData.juice.map((je: z.infer<typeof JuiceSchema>, index: number) => `Aspect ${index + 1}: ${je.toRemember}`).join("\n"),
            userAnswer: inputData.userAnswer
        });

        const response = await ai.generate({ prompt: prompt, outputSchema: JuiceAnswerEvalAgent.outputSchema });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, response?.output!);
    }
}