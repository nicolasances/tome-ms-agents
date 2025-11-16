import { ExecutionContext, ITotoPubSubEventHandler, newTotoServiceToken, TotoMessage } from "toto-api-controller";
import { GaleBrokerAPI } from "../gale/integration/GaleBrokerAPI";
import { ControllerConfig } from "../Config";
import { AgentTaskRequest } from "../gale/model/AgentTask";

/**
 * Event handler for 'topic' events.
 */
export class OnTopicEventHandler implements ITotoPubSubEventHandler {

    async onEvent(msg: TotoMessage, execContext: ExecutionContext): Promise<any> {

        if (msg.type === TOPIC_EVENTS.topicScraped) {

            // Get a JWT Token
            const token = newTotoServiceToken(execContext.config);

            // Create the task
            const task: AgentTaskRequest<any> = {
                taskId: "topic.practice.build",
                command: { command: 'start' }, 
                taskInputData: {
                    topicCode: msg.data.topicCode
                }
            }

            // Trigger a Practice Builder Agent task
            await new GaleBrokerAPI((execContext.config as ControllerConfig).galeBrokerURL, execContext).postTask(task, token);
        }

        return { consumed: false }

    }

}

const TOPIC_EVENTS = {

    // Event triggered when a topic's blog post has been scraped
    topicScraped: 'topicScraped'
}