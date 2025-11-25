import { Logger } from "toto-api-controller";
import { AgentTaskOrchestratorResponse, SubTaskInfo } from "../../gale/model/AgentTask";
import { PracticeBuilderOrchestratorAgent } from "../PracticeBuilderOrchestratorAgent";


export class OnGenealogyCleanupDone {

    constructor(private cid: string, private logger: Logger) { }

    async do(inputData: { originalInput: any, childrenOutputs: any[] }): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderOrchestratorAgent.outputSchema>> {

        // Trigger the cleanup of the genealogy data for the topic
        const subtasks: SubTaskInfo[] = [{
            taskId: "topic.genealogy",
            subtasksGroupId: "topic-genealogy-group",
            taskInputData: {
                topicId: inputData.originalInput.topicId,
                topicCode: inputData.originalInput.topicCode,
                cleanedupInfo: inputData.childrenOutputs[0].cleanedupInfo
            }
        }]

        return new AgentTaskOrchestratorResponse("subtasks", this.cid, undefined, subtasks)
    }
}