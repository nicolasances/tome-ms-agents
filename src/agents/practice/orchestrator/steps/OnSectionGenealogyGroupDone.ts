import { Logger } from "toto-api-controller";
import { AgentTaskOrchestratorResponse, SubTaskInfo } from "../../../../gale/model/AgentTask";
import { PracticeBuilderOrchestratorAgent } from "../PracticeBuilderOrchestratorAgent";
import { z } from "genkit";
import { SectionGenealogyAgent } from "../../genealogy/SectionGenealogyAgent";


export class OnSectionGenealogyGroupDone {

    constructor(private cid: string, private logger: Logger) { }

    async do(inputData: { originalInput: any, childrenOutputs: any[] }): Promise<AgentTaskOrchestratorResponse<typeof PracticeBuilderOrchestratorAgent.outputSchema>> {

        const subtasksGroupId = "topic-genealogy-prep";

        // Trigger the cleanup of the genealogy data for the topic
        const subtasks: SubTaskInfo[] = [
            {
                taskId: "topic.genealogy.cleanup",
                subtasksGroupId: subtasksGroupId,
                taskInputData: {
                    topicId: inputData.originalInput.topicId,
                    topicCode: inputData.originalInput.topicCode,
                    sectionsData: inputData.childrenOutputs.map(child => child.info)
                }
            }, 
            {
                taskId: "topic.personalities.generate", 
                subtasksGroupId: subtasksGroupId,
                taskInputData: {
                    topicId: inputData.originalInput.topicId,
                    topicCode: inputData.originalInput.topicCode,
                    people: inputData.childrenOutputs.flatMap(child => (child.info as z.infer<typeof SectionGenealogyAgent.responseSchema>).people)
                }
                
            }
        ]

        return new AgentTaskOrchestratorResponse("subtasks", this.cid, undefined, subtasks)
    }
}