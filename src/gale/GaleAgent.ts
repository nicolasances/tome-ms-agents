import { ExecutionContext, Logger, TotoControllerConfig } from "toto-api-controller";
import { AgentTaskRequest, AgentTaskResponse, AgentTaskOrchestratorResponse } from "./model/AgentTask";
import { z } from "genkit";
import { ValidationError } from "toto-api-controller";
import { Prompt } from "./util/Prompt";
import { GaleKit, LLMError, ModelId } from "./gentools/GaleKit";

export abstract class GaleAgent<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {

    logger: Logger | undefined;
    config: TotoControllerConfig | undefined;
    execContext: ExecutionContext | undefined;

    protected options?: AgentRunOptions;

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
    async run(task: AgentTaskRequest<I>, options?: AgentRunOptions): Promise<AgentTaskResponse<O>> {

        const cid = task.correlationId || "no-cid";
        this.options = options;

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

            if (error instanceof LLMError && error.code === "llmOutputTypError") {
                this.logger?.compute(cid, `LLM output type error: ${(error as Error).message}`, "error");

                return new AgentTaskResponse("failed", cid, error as LLMError);
            }

            this.logger?.compute(cid, `Task execution error: ${(error as Error).message}`, "error");
            return new AgentTaskResponse("failed", cid, null as any);
        }
    }

    /**
     * Retrieves the prompt for the agent, filled with the provided input.
     * 
     * This method handles automatically any override of the prompt template coming from, for example, the playground.
     * 
     * @param input the input parameters to fill the prompt template. Input should be an object with key-value pairs matching the template parameters. (e.g. if the template contains {{parameterName}}, the input should contain { parameterName: "value" } )
     */
    async prompt(input: any): Promise<string> {

        return Prompt.namedPrompt(this.manifest.taskId, input, { promptTemplateOverride: this.options?.playground?.promptOverride });

    }

    /**
     * Returns an instance of GaleKit configured with the specified model.
     * This method also applies any model override specified in the agent's run options (e.g., from the playground).
     * 
     * @param model the model Id to use
     * 
     * @returns 
     */
    protected ai(): GaleKit {

        if (this.options?.playground?.modelOverride) this.logger?.compute(this.execContext?.cid || "no-cid", `Overriding model to [${this.options.playground.modelOverride}] as per playground settings`, "info");

        return GaleKit.gale({ model: this.options?.playground?.modelOverride || this.manifest.model, host: { region: "eu-north-1" } });
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
    model: ModelId;

}

export interface GaleOrchestratorAgentManifest extends GaleAgentManifest {

    resumeInputSchema: z.ZodTypeAny;

}

export interface AgentRunOptions {

    playground?: Playground;

}

export interface Playground {
    /**
     * Provides the possibility to override the prompt of the agent. 
     * Parameters in the prompt (dynamic injection of content) should still be provided using the handlebars syntax (e.g., {{parameterName}}).
     */
    promptOverride?: string;
    modelOverride?: ModelId;
}