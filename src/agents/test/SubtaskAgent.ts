import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskResponse } from "../../gale/model/AgentTask";
import { genkit, z } from 'genkit';
import { awsBedrock, anthropicClaude37SonnetV1 } from "genkitx-aws-bedrock";

/**
 * Test agent that only spawns subtasks. 
 */
export class SubtaskAgent implements GaleAgent {

    agentName = "SubtaskOrchestrator";
    taskId = "testspawning";

    async executeTask(taskInput: any): Promise<AgentTaskResponse> {

        return {
            stopReason: "subtasks", 
            taskOutput: {},
            subtasks: [
                {taskId: "sayhello"}, 
                {taskId: "sayhello"}, 
                {taskId: "sayhello"}, 
            ]
        }
    }

}