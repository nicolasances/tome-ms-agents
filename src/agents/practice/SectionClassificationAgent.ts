import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";

export class SectionClassificationAgent extends GaleAgent {
    
    agentName: string = "TomeSectionClassifier";
    taskId: string = "topic.section.classify";
    
    async executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;

        logger.compute(cid, `Classifying section [${task.taskInputData?.sectionCode}] for topic [${task.taskInputData?.topicId} - ${task.taskInputData?.topicCode}]`, "info");

        return new AgentTaskResponse("completed", cid, { done: true });
    }

    
}