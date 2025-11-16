import { Logger, TotoControllerConfig } from "toto-api-controller";
import { AgentTaskRequest, AgentTaskResponse, AgentTaskOrchestratorResponse } from "./model/AgentTask";
import { z } from "genkit";

export abstract class GaleAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {

    logger: Logger | undefined; 
    config: TotoControllerConfig | undefined;

    abstract manifest: GaleAgentManifest;

    abstract executeTask(task: AgentTaskRequest<I>): Promise<AgentTaskResponse<O>>;

}

export abstract class GaleOrchestratorAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny> extends GaleAgent<I, O> {

    abstract executeTask(task: AgentTaskRequest<I>): Promise<AgentTaskOrchestratorResponse<O>>;

}

export interface GaleAgentManifest {

    agentName: string; 
    description: string; 
    taskId: string;
    inputSchema: z.ZodTypeAny;
    outputSchema: z.ZodTypeAny;

}