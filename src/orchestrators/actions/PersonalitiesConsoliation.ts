import { z } from "genkit";
import { SubTaskInfo } from "../../gale/model/AgentTask";
import { PersonalitiesConsolidationAgent } from "../../agents/practice/PersonalitiesConsolidationAgent";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";

export class PersonalitiesConsoliation {

    createSubtasks(subtasksGroupId: string, topicId: string, topicCode: string, personalities: z.infer<typeof PersonalitySchema>[]): SubTaskInfo[] {

        const subtasks: SubTaskInfo[] = [];
        
        const taskInputData: z.infer<typeof PersonalitiesConsolidationAgent.inputSchema> = {
            topicId: topicId,
            topicCode: topicCode,
            peopleDescriptions: personalities
        };

        subtasks.push({
            taskId: PersonalitiesConsolidationAgent.taskId,
            subtasksGroupId: subtasksGroupId,
            taskInputData: taskInputData
        })

        return subtasks;

    }
}