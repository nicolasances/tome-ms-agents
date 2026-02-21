import { Request } from "express";
import { TotoDelegate, UserContext, TotoMessageBus, TotoControllerConfig, TotoRequest, Logger } from "totoms";
import { Gale } from "./Gale";
import { GaleBrokerAPI } from "./integration/GaleBrokerAPI";
import { ControllerConfig } from "../Config";

/**
 * Request type for agent registration requests.
 */
export class AgentRegistrationDelegateRequest extends TotoRequest {}

/**
 * Delegate to force registration of all Gale Agents.
 * 
 * This provides an endpoint for re-registering all agents in Gale Broker.
 */
export class GaleAgentsRegistrationDelegate extends TotoDelegate<AgentRegistrationDelegateRequest, any> {

    constructor(private gale: Gale, messageBus: TotoMessageBus, config: TotoControllerConfig) {
        super(messageBus, config);
    }

    parseRequest(req: Request): AgentRegistrationDelegateRequest {
        return new AgentRegistrationDelegateRequest();
    }

    async do(req: AgentRegistrationDelegateRequest, userContext?: UserContext): Promise<any> {

        const config = this.config as ControllerConfig;

        // For each agent in Gale, register it again.
        const promises = this.gale.agentDefinitions.map(async agentDefinition => {

            Logger.getInstance().compute(this.cid || "no-cid", `Re-registering Agent [ ${agentDefinition.name} ] for task [ ${agentDefinition.taskId} ] with Gale Broker.`, "info");

            // Register the agent using Gale Broker API
            return new GaleBrokerAPI(config.galeBrokerURL).registerAgent({
                agentDefinition: agentDefinition
            });

        });

        await Promise.all(promises);

        Logger.getInstance().compute(this.cid || "no-cid", `Re-registered ${promises.length} agents with Gale Broker.`, "info");

        return {
            message: `Re-registered ${promises.length} agents with Gale Broker.`
        };
    }

}

