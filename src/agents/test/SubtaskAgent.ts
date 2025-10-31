import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";
import { genkit, z } from 'genkit';
import { awsBedrock, anthropicClaude37SonnetV1 } from "genkitx-aws-bedrock";

/**
 * Test agent that only spawns subtasks. 
 */
export class SubtaskAgent implements GaleAgent {

    agentName = "SubtaskOrchestrator";
    taskId = "testspawning";

    async executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {
        
        const subtasks = [
            { taskId: "sayhello" },
            { taskId: "sayhello" },
            { taskId: "sayhello" },
        ]

        return new AgentTaskResponse("subtasks", task.correlationId!, null, subtasks)
    }

}