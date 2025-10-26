import { AgentTriggerReponse } from "./model/AgentTriggerReponse";

export interface GaleAgent {

    agentName: string;
    taskId: string;

    executeTask(taskInput: any): Promise<AgentTriggerReponse>;

}