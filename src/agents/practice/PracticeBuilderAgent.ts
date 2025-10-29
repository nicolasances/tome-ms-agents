import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskResponse } from "../../gale/model/AgentTask";

/**
 * This agent is the orchestrator for building practices for a give Tome Topic.
 */
export class PracticeBuilderAgent implements GaleAgent {
    
    agentName: string = "PracticeBuilder"
    taskId: string = "topic.practice.build"
    
    executeTask(taskInput: any): Promise<AgentTaskResponse> {
        throw new Error("Method not implemented.");
    }
}