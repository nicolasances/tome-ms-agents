import { TotoMessageHandler, ProcessingResponse, newTotoServiceToken, TotoMessage, TotoControllerConfig, TotoMessageBus, Logger } from "totoms";
import { GaleBrokerAPI } from "../gale/integration/GaleBrokerAPI";
import { ControllerConfig } from "../Config";
import { AgentTaskRequest } from "../gale/model/AgentTask";
import { PracticeBuilderOrchestratorAgent } from "../orchestrators/PracticeBuilderOrchestrator";

/**
 * Event handler for 'topicScraped' events.
 */
export class OnTopicEventHandler extends TotoMessageHandler {

    protected handledMessageType: string = TOPIC_EVENTS.topicScraped;

    constructor(config: TotoControllerConfig, messageBus: TotoMessageBus) {
        super(config, messageBus);
    }

    async onMessage(msg: TotoMessage): Promise<ProcessingResponse> {

        const cid = msg.cid || "no-cid";

        // Get a JWT Token
        const token = newTotoServiceToken(this.config);

        // Create the task
        const task: AgentTaskRequest<any> = {
            taskId: PracticeBuilderOrchestratorAgent.taskId,
            command: { command: 'start' },
            taskInputData: {
                topicId: msg.data.topicId,
                topicCode: msg.data.topicCode,
                sections: msg.data.sections
            }
        }

        // Trigger a Practice Builder Agent task
        const result = await new GaleBrokerAPI((this.config as ControllerConfig).galeBrokerURL, cid).postTask(task, token);

        Logger.getInstance().compute(cid, `Triggered task ${task.taskId} on topic [${msg.data.topicCode}]. Task Output: [${JSON.stringify(result)}].`, "info");

        return { status: "processed", responsePayload: result }

    }

}

const TOPIC_EVENTS = {

    // Event triggered when a topic's blog post has been scraped
    topicScraped: 'topicScraped'
}