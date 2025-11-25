import { z } from "genkit";
import { SubTaskInfo } from "../../gale/model/AgentTask";
import { LabelSchema } from "../../model/LabelSchema";
import { SectionGenealogyAgent } from "../../agents/practice/SectionGenealogyAgent";

export class SectionGenealogicRelationshipsExtraction {

    createSubtasks(subtasksGroupId: string, topicId: string, topicCode: string, sectionsClassifications: SectionClassification[]): SubTaskInfo[] {

        const subtasks: SubTaskInfo[] = sectionsClassifications
            .filter(sectionClassification => sectionClassification.labels.includes('genealogy'))
            .map(sectionClassification => ({
                taskId: SectionGenealogyAgent.taskId,
                subtasksGroupId: subtasksGroupId,
                taskInputData: {
                    topicId: topicId,
                    topicCode: topicCode,
                    sectionCode: sectionClassification.sectionCode,
                    sectionIndex: sectionClassification.sectionIndex
                }
            }));

        return subtasks;
    }
}

export interface SectionClassification {
    sectionCode: string;
    sectionIndex: number;
    labels: z.infer<typeof LabelSchema>[];
}