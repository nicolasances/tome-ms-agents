import { AgentTaskResponse } from "./model/AgentTask";

export interface GaleAgent {

    agentName: string;
    taskId: string;

    executeTask(taskInput: any): Promise<AgentTaskResponse>;

}