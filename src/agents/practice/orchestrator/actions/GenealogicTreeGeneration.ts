import { z } from "genkit";
import { SubTaskInfo } from "../../../../gale/model/AgentTask";
import { GenealogicTreeAgent } from "../../genealogy/GenealogicTreeAgent";
import { RelationshipSchema } from "../../../model/GenealogicTreeSchema";
import { PersonalitySchema } from "../../../model/PersonalitiesSchema";

export class GenealogicTreeGeneration {

    createSubtasks(subtasksGroupId: string, topicId: string, topicCode: string, relationships: z.infer<typeof RelationshipSchema>[], personalities: z.infer<typeof PersonalitySchema>[]): SubTaskInfo[] {

        const subtasks: SubTaskInfo[] = [];
        
        const taskInputData: z.infer<typeof GenealogicTreeAgent.inputSchema> = {
            topicId: topicId,
            topicCode: topicCode,
            relationships: relationships,
            peopleDescriptions: personalities
        };

        subtasks.push({
            taskId: GenealogicTreeAgent.taskId,
            subtasksGroupId: subtasksGroupId,
            taskInputData: taskInputData
        })

        return subtasks;

    }
}