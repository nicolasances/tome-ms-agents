import { Request } from "express";
import { ExecutionContext, TotoDelegate, UserContext } from "toto-api-controller";
import { Gale } from "./Gale";
import { GaleBrokerAPI } from "./integration/GaleBrokerAPI";
import { ControllerConfig } from "../Config";

/**
 * Delegate to force registration of all Gale Agents.
 * 
 * This provides an endpoint for re-registering all agents in Gale Broker.
 */
export class GaleAgentsRegistrationDelegate implements TotoDelegate {

    constructor(private gale: Gale) { }

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const config = execContext.config as ControllerConfig;

        // For each agent in Gale, register it again.
        const promises = this.gale.agentDefinitions.map(async agentDefinition => {

            execContext.logger.compute(execContext.cid, `Re-registering Agent [ ${agentDefinition.name} ] for task [ ${agentDefinition.taskId} ] with Gale Broker.`, "info");

            // Register the agent using Gale Broker API
            return new GaleBrokerAPI(config.galeBrokerURL).registerAgent({
                agentDefinition: agentDefinition
            });

        });

        await Promise.all(promises);

        execContext.logger.compute(execContext.cid, `Re-registered ${promises.length} agents with Gale Broker.`, "info");

        return {
            message: `Re-registered ${promises.length} agents with Gale Broker.`
        };
    }

}

