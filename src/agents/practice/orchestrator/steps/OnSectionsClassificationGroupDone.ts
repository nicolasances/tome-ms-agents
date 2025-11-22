import { Logger } from "toto-api-controller";
import { AgentTaskOrchestratorResponse, SubTaskInfo } from "../../../../gale/model/AgentTask";
import { PracticeBuilderOrchestratorAgent } from "../PracticeBuilderOrchestratorAgent";


export class OnSectionsClassificationGroupDone {

    constructor(private cid: string, private logger: Logger) { }

    async do(inputData: { originalInput: any, childrenOutputs: any[] }): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderOrchestratorAgent.outputSchema>> {

        const subtasks: SubTaskInfo[] = [];

        for (const childOutput of inputData.childrenOutputs) {

            const sectionOutput = childOutput as { topicCode: string, sectionCode: string, sectionIndex: number, labels: string[] };

            // Only trigger genealogy detection for sections labelled with 'genealogy'
            if (sectionOutput.labels.includes('genealogy')) {
                
                subtasks.push({
                    taskId: "topic.section.genealogy",
                    subtasksGroupId: "sections-genealogy-group",
                    taskInputData: {
                        topicId: inputData.originalInput.topicId,
                        topicCode: sectionOutput.topicCode,
                        sectionCode: sectionOutput.sectionCode,
                        sectionIndex: sectionOutput.sectionIndex
                    }
                })
            }

            if (sectionOutput.labels.includes('timeline')) {

                subtasks.push({
                    taskId: "topic.section.timeline",
                    subtasksGroupId: "sections-timeline-group",
                    taskInputData: {
                        topicId: inputData.originalInput.topicId,
                        topicCode: sectionOutput.topicCode,
                        sectionCode: sectionOutput.sectionCode,
                        sectionIndex: sectionOutput.sectionIndex
                    }
                })
            }
        }


        if (subtasks.length === 0) {
            this.logger.compute(this.cid, `No sections labelled with 'genealogy' for topic [${inputData.originalInput.topicId}]`, "info");

            // TODO: Proceed with next steps of practice building...
            return new AgentTaskOrchestratorResponse("completed", this.cid, { done: true });
        }

        return new AgentTaskOrchestratorResponse("subtasks", this.cid, undefined, subtasks)
    }
}