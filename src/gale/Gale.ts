import { Logger, TotoAPIController } from "toto-api-controller";
import { agentNameToPath } from "./util/NamingUtils";
import { GaleAgent } from "./GaleAgent";
import { GaleAgentInfoDelegate, GaleAgentTaskDelegate } from "./GaleAgentDelegate";
import { GaleBrokerAPI } from "./integration/GaleBrokerAPI";
import { TaskEndpoint } from "./model/TaskEndpoint";
import { AgentDefinition } from "./model/AgentDefinition";

export class Gale {

    logger: Logger;

    constructor(private config: GaleConfig, private options?: GaleOptions) {
        this.logger = new Logger("Gale");
    }

    async registerAgent(agent: GaleAgent<any, any>): Promise<void> {

        // Validations 
        if (!this.config.baseURL) throw new Error("Gale configuration error: baseURL is not defined.");

        // Determine the name for the agent to use in the path
        const agentPath = agentNameToPath(agent.manifest.agentName);
        const agentTaskExecutionPath = `/agents/${agentPath}/tasks`;
        const agentInfoPath = `/agents/${agentPath}/info`;

        let agentEndpoint = `${this.config.baseURL}/agents/${agentPath}`;
        if (this.options?.totoApiController?.options?.basePath) agentEndpoint = `${this.config.baseURL}${this.options.totoApiController.options.basePath}/agents/${agentPath}`;

        // If TotoAPIController is provided, register the Agent endpoint(s).
        if (this.options?.totoApiController) {

            const apiController = this.options.totoApiController;

            // Register the /tasks and /info endpoints for the Agent.
            apiController.path('POST', agentTaskExecutionPath, new GaleAgentTaskDelegate(agent));
            apiController.path('GET', agentInfoPath, new GaleAgentInfoDelegate(agent));
        }

        // Register the agent in Gale's internal registry (API call).
        this.logger.compute("", `Registering Agent [ ${agent.manifest.agentName} ] for task [ ${agent.manifest.taskId} ] with Gale Broker at [ ${this.config.galeBrokerURL} ].`, "info");
        this.logger.compute("", `Agent [ ${agent.manifest.agentName} ] endpoint set to [ ${agentEndpoint} ].`, "info");

        // Create the Agent Definition and register it
        const agentDefinition = new AgentDefinition(agent.manifest, new TaskEndpoint(agentEndpoint));

        const registrationResult = await new GaleBrokerAPI(this.config.galeBrokerURL).registerAgent({
            agentDefinition: agentDefinition
        });

        this.logger.compute("", `Agent [ ${agent.manifest.agentName} ] successfully registered with Gale Broker.`, "info");

    }
}

export interface GaleConfig {
    galeBrokerURL: string;
    baseURL: string; // The public endpoint where the service hosting the agent is reachable. 
}

export interface GaleOptions {
    totoApiController?: TotoAPIController;
}