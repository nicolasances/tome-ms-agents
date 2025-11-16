import { Request } from "express";
import { ExecutionContext, TotoDelegate, UserContext } from "toto-api-controller";
import { GaleAgent, GaleAgentManifest } from "./GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "./model/AgentTask";
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Delegate to handle task execution requests for a Gale Agent.
 */
export class GaleAgentTaskDelegate implements TotoDelegate {

    constructor(private agent: GaleAgent<any, any>) { }

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<AgentTaskResponse<any>> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        this.agent.logger = logger;
        this.agent.config = execContext.config;

        const agentTaskRequest = new AgentTaskRequest<any>({
            command: req.body.command,
            taskId: req.body.taskId,
            taskInstanceId: req.body.taskInstanceId,
            taskInputData: req.body.taskInputData,
            correlationId: req.body.correlationId,
            parentTask: req.body.parentTask
        });

        const response = await this.agent.run(agentTaskRequest);

        return response;
    }

}

/**
 * Delegate to provide agent information.
 * The information coincides with the agent manifest.
 */
export class GaleAgentInfoDelegate implements TotoDelegate {

    constructor(private agent: GaleAgent<any, any>) { }

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<AgentInfo> {
        return AgentInfo.fromAgentManifest(this.agent.manifest);
    }

}

export class AgentInfo {

    agentName: string = "";
    description: string = "";
    taskId: string = "";
    inputSchema: any;
    outputSchema: any;

    static fromAgentManifest(manifest: GaleAgentManifest): AgentInfo {

        const info = new AgentInfo();
        info.agentName = manifest.agentName;
        info.description = manifest.description;
        info.taskId = manifest.taskId;
        info.inputSchema = zodToJsonSchema(manifest.inputSchema);
        info.outputSchema = zodToJsonSchema(manifest.outputSchema);

        return info;
    }
}