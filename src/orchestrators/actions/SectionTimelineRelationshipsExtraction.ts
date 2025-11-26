import { z } from "genkit";
import { SubTaskInfo } from "../../gale/model/AgentTask";
import { LabelSchema } from "../../model/LabelSchema";
import { SectionTimelineAgent } from "../../agents/practice/SectionTimelineAgent";

export class SectionTimelineRelationshipsExtraction {

    createSubtasks(subtasksGroupId: string, topicId: string, topicCode: string, sectionsClassifications: SectionClassification[]): SubTaskInfo[] {

        const subtasks: SubTaskInfo[] = sectionsClassifications
            .filter(sectionClassification => sectionClassification.labels.includes('timeline'))
            .map(sectionClassification => ({
                taskId: SectionTimelineAgent.taskId,
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

interface SectionClassification {
    sectionCode: string;
    sectionIndex: number;
    labels: z.infer<typeof LabelSchema>[];
}