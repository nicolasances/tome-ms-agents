import { Logger, TotoAPIController } from "toto-api-controller";
import { agentNameToPath } from "./util/NamingUtils";
import { GaleAgent } from "./GaleAgent";
import { GaleAgentTaskDelegate } from "./GaleAgentDelegate";
import { GakeBrokerAPI } from "./integration/GakeBrokerAPI";
import { TaskEndpoint } from "./model/TaskEndpoint";
import { AgentDefinition } from "./model/AgentDefinition";

export class Gale {

    logger: Logger;

    constructor(private config: GaleConfig, private options?: GaleOptions) {
        this.logger = new Logger("Gale");
    }

    async registerAgent(agent: GaleAgent): Promise<void> {

        // Validations 
        if (!this.config.baseURL) throw new Error("Gale configuration error: baseURL is not defined.");

        // Determine the name for the agent to use in the path
        const agentPath = agentNameToPath(agent.agentName);
        const agentTaskExecutionPath = `/agents/${agentPath}/tasks`;
        const agentInfoPath = `/agents/${agentPath}/info`;

        let agentEndpoint = `${this.config.baseURL}/agents/${agentPath}`;
        if (this.options?.totoApiController?.options?.basePath) agentEndpoint = `${this.config.baseURL}${this.options.totoApiController.options.basePath}/agents/${agentPath}`;

        // If TotoAPIController is provided, register the Agent endpoint(s).
        if (this.options?.totoApiController) {

            const apiController = this.options.totoApiController;

            // Register the /tasks and /info endpoints for the Agent.
            apiController.path('POST', agentTaskExecutionPath, new GaleAgentTaskDelegate(agent), { contentType: 'application/json', noAuth: true, ignoreBasePath: false });
            // TODO /info endpoint

        }

        // Register the agent in Gale's internal registry (API call).
        this.logger.compute("", `Registering Agent [ ${agent.agentName} ] for task [ ${agent.taskId} ] with Gale Broker at [ ${this.config.galeBrokerURL} ].`, "info");
        this.logger.compute("", `Agent [ ${agent.agentName} ] endpoint set to [ ${agentEndpoint} ].`, "info");

        const registrationResult = await new GakeBrokerAPI(this.config.galeBrokerURL).registerAgent({
            agentDefinition: new AgentDefinition(agent.agentName, agent.taskId, new TaskEndpoint(agentEndpoint))
        });

        this.logger.compute("", `Agent [ ${agent.agentName} ] successfully registered with Gale Broker.`, "info");

    }
}

export interface GaleConfig {
    galeBrokerURL: string;
    baseURL: string; // The public endpoint where the service hosting the agent is reachable. 
}

export interface GaleOptions {
    totoApiController?: TotoAPIController;
}