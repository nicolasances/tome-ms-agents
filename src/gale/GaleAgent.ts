import { Logger, TotoControllerConfig } from "toto-api-controller";
import { AgentTaskRequest, AgentTaskResponse, AgentTaskOrchestratorResponse } from "./model/AgentTask";
import { z } from "genkit";
import { ValidationError } from "toto-api-controller";

export abstract class GaleAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {

    logger: Logger | undefined;
    config: TotoControllerConfig | undefined;

    abstract manifest: GaleAgentManifest;

    /**
     * Main method to run the agent's task. 
     * 
     * This method wraps executeTask to provide common functionality: 
     * - logging
     * - validation of input and output against schemas
     * - error handling
     * 
     * @param task the task to execute
     */
    async run(task: AgentTaskRequest<I>): Promise<AgentTaskResponse<O>> {

        const cid = task.correlationId || "no-cid";

        this.logger?.compute(cid, `Running agent [${this.manifest.agentName} - ${this.manifest.taskId}] for task [${task.taskId}]`, "info");

        // 1. Validate input
        try {
            // For orchestrator agents, validate against the appropriate schema based on command
            if (this instanceof GaleOrchestratorAgent) {

                const orchestratorAgent = this as any;

                if (task.command.command === "start" && orchestratorAgent.constructor.startInputSchema) {

                    (this.manifest as GaleOrchestratorAgentManifest).inputSchema.parse(task.taskInputData);

                } else if (task.command.command === "resume" && orchestratorAgent.constructor.resumeInputSchema) {

                    (this.manifest as GaleOrchestratorAgentManifest).resumeInputSchema.parse(task.taskInputData);

                } else throw new ValidationError(400, `Invalid command [${task.command.command}] for orchestrator agent [${this.manifest.agentName}]`);

            } else this.manifest.inputSchema.parse(task.taskInputData);

        } catch (error) {

            if (error instanceof z.ZodError) {
                this.logger?.compute(cid, `Input validation error for input ${JSON.stringify(task.taskInputData)}: ${error.message}`, "error");
                return new AgentTaskResponse("failed", cid, null as any);
            }
        }

        // 2. Execute the task
        try {

            const response = await this.executeTask(task);

            // 3. Return output
            return response;

        } catch (error) {

            this.logger?.compute(cid, `Task execution error: ${(error as Error).message}`, "error");
            return new AgentTaskResponse("failed", cid, null as any);
        }
    }

    abstract executeTask(task: AgentTaskRequest<I>): Promise<AgentTaskResponse<O>>;

}

export abstract class GaleOrchestratorAgent<SI extends z.ZodTypeAny, RI extends z.ZodTypeAny, O extends z.ZodTypeAny> extends GaleAgent<SI | RI, O> {

    abstract manifest: GaleOrchestratorAgentManifest;

    abstract executeTask(task: AgentTaskRequest<SI | RI>): Promise<AgentTaskOrchestratorResponse<O>>;

}

export interface GaleAgentManifest {

    agentName: string;
    description: string;
    taskId: string;
    inputSchema: z.ZodTypeAny;
    outputSchema: z.ZodTypeAny;

}

export interface GaleOrchestratorAgentManifest extends GaleAgentManifest {

    resumeInputSchema: z.ZodTypeAny;

}