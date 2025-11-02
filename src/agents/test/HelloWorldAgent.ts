import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { genkit, z } from 'genkit';
import { awsBedrock, anthropicClaude37SonnetV1 } from "genkitx-aws-bedrock";

export class HelloWorldAgent implements GaleAgent {

    agentName = "HelloWorld";
    taskId = "sayhello";

    async executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {

        // const ai = genkit({
        //     plugins: [
        //         awsBedrock({ region: "eu-north-1" }),
        //     ],
        //     model: anthropicClaude37SonnetV1("eu"),
        // });

        // const response = await ai.generate("Explain the theory of relativity in simple terms.");

        return new AgentTaskResponse("completed", task.correlationId!, { done: true });
    }

}