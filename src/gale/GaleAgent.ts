import { Logger, TotoControllerConfig } from "toto-api-controller";
import { AgentTaskRequest, AgentTaskResponse } from "./model/AgentTask";

export abstract class GaleAgent {

    logger: Logger | undefined; 
    config: TotoControllerConfig | undefined;

    abstract agentName: string;
    abstract taskId: string;

    abstract executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse>;

}