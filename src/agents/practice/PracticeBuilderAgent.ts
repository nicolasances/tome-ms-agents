import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";

/**
 * This agent is the orchestrator for building practices for a give Tome Topic.
 */
export class PracticeBuilderAgent implements GaleAgent {
    
    agentName: string = "PracticeBuilder"
    taskId: string = "topic.practice.build"
    
    executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {

        console.log("Practice Builder... done!");

        const response = new AgentTaskResponse("completed", task.correlationId!, {done: true});

        return Promise.resolve(response);
        
    }
}