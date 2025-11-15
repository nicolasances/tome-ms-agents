import { Request } from "express";
import { ExecutionContext, TotoDelegate, UserContext } from "toto-api-controller";
import { GaleAgent } from "./GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "./model/AgentTask";

export class GaleAgentTaskDelegate implements TotoDelegate {

    constructor(private agent: GaleAgent) { }

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<AgentTaskResponse> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        this.agent.logger = logger;
        this.agent.config = execContext.config;

        const agentTaskRequest = AgentTaskRequest.fromHTTPRequest(req);

        logger.compute(cid, `Received request to execute task with correlation Id ${agentTaskRequest.correlationId}`, "info");

        const response = await this.agent.executeTask(agentTaskRequest);

        return response;
    }

}