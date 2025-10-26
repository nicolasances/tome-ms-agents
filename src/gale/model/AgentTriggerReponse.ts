import { TotoRuntimeError, ValidationError } from "toto-api-controller";
import { TaskId } from "./TaskId";

/**
 * This class represents the response returned when an Agent is successfully triggered to execute a task.
 * 
 * WHAT IT IS NOT
 * - It is NOT the response from the Agent after executing the task. It is just an acknowledgment that the Agent has been triggered.
 */
export class AgentTriggerReponse {

    taskId: TaskId; // The ID of the task that was triggered.
    agentName: string; // The name of the Agent that was triggered.
    taskExecutionId: string; // The unique identifier for this task execution.

    constructor(taskId: TaskId, agentName: string, taskExecutionId: string) {
        this.taskId = taskId;
        this.agentName = agentName;
        this.taskExecutionId = taskExecutionId;
    }
}