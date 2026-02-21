import { Request } from "express";
import { TotoDelegate, UserContext, TotoMessageBus, TotoControllerConfig, Logger, TotoRequest } from "totoms";
import { AgentRunOptions, GaleAgent, GaleAgentManifest } from "./GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "./model/AgentTask";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Prompt } from "./util/Prompt";
import { GaleKit, ModelId } from "./gentools/GaleKit";

/**
 * Request type for agent task execution.
 */
export class AgentTaskDelegateRequest extends TotoRequest {
    command: any;
    taskId: string = "";
    taskInstanceId?: string;
    taskInputData?: any;
    correlationId?: string;
    parentTask?: any;
    playground?: any;
}

/**
 * Delegate to handle task execution requests for a Gale Agent.
 */
export class GaleAgentTaskDelegate extends TotoDelegate<AgentTaskDelegateRequest, AgentTaskResponse<any>> {

    constructor(private agent: GaleAgent<any, any>, messageBus: TotoMessageBus, config: TotoControllerConfig) {
        super(messageBus, config);
    }

    parseRequest(req: Request): AgentTaskDelegateRequest {
        const r = new AgentTaskDelegateRequest();
        r.command = req.body.command;
        r.taskId = req.body.taskId;
        r.taskInstanceId = req.body.taskInstanceId;
        r.taskInputData = req.body.taskInputData;
        r.correlationId = req.body.correlationId;
        r.parentTask = req.body.parentTask;
        r.playground = req.body.playground;
        return r;
    }

    async do(req: AgentTaskDelegateRequest, userContext?: UserContext): Promise<AgentTaskResponse<any>> {

        this.agent.config = this.config;

        const agentTaskRequest = new AgentTaskRequest<any>({
            command: req.command,
            taskId: req.taskId,
            taskInstanceId: req.taskInstanceId,
            taskInputData: req.taskInputData,
            correlationId: req.correlationId,
            parentTask: req.parentTask
        });

        // Prepare the options for running the agent, if any
        const runOptions: AgentRunOptions = {};
        
        if (req.playground) runOptions.playground = req.playground;

        const response = await this.agent.run(agentTaskRequest, runOptions);

        return response;
    }

}

/**
 * Request type for agent info requests.
 */
export class AgentInfoDelegateRequest extends TotoRequest {}

/**
 * Delegate to provide agent information.
 * The information coincides with the agent manifest.
 */
export class GaleAgentInfoDelegate extends TotoDelegate<AgentInfoDelegateRequest, AgentInfo> {

    constructor(private agent: GaleAgent<any, any>, messageBus: TotoMessageBus, config: TotoControllerConfig) {
        super(messageBus, config);
    }

    parseRequest(req: Request): AgentInfoDelegateRequest {
        return new AgentInfoDelegateRequest();
    }

    async do(req: AgentInfoDelegateRequest, userContext?: UserContext): Promise<AgentInfo> {

        // Get the agent info from the manifest
        const agentInfo = AgentInfo.fromAgentManifest(this.agent.manifest);

        // Find the prompt of the agent, if any
        agentInfo.promptTemplate = await Prompt.getPromptTemplate(this.agent.manifest) || undefined;

        return agentInfo;
    }

}

export class AgentInfo {

    agentName: string = "";
    description: string = "";
    taskId: string = "";
    inputSchema: any;
    outputSchema: any;
    promptTemplate?: string;
    allowedModels: ModelId[] = GaleKit.getSupportedModels();
    model: ModelId = "anthropic.claude-3.7-sonnet";

    static fromAgentManifest(manifest: GaleAgentManifest): AgentInfo {

        const info = new AgentInfo();
        info.agentName = manifest.agentName;
        info.description = manifest.description;
        info.taskId = manifest.taskId;
        info.inputSchema = zodToJsonSchema(manifest.inputSchema);
        info.outputSchema = zodToJsonSchema(manifest.outputSchema);
        info.allowedModels = GaleKit.getSupportedModels();
        info.model = manifest.model;

        return info;
    }
}
