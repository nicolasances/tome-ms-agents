import { AgentTaskRequest, AgentTaskResponse } from "./model/AgentTask";

export interface GaleAgent {

    agentName: string;
    taskId: string;

    executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse>;

}