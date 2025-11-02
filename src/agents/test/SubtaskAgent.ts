import { Logger, TotoRuntimeError } from "toto-api-controller";
import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../gale/model/AgentTask";

/**
 * Test agent that only spawns subtasks. 
 */
export class SubtaskAgent implements GaleAgent {

    agentName = "SubtaskOrchestrator";
    taskId = "testspawning";

    async executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {

        // Check the step in the process
        if (task.command.command === "start") {

            const subtasks = [
                { taskId: "sayhello" },
                { taskId: "sayhello" },
                { taskId: "sayhello" },
            ]

            return new AgentTaskResponse("subtasks", task.correlationId!, null, subtasks, "sayhello-group-1")

        }
        else if (task.command.command === "resume") {

            if (task.command.completedSubtaskGroupId == "sayhello-group-1") {

                new Logger(this.agentName).compute(task.correlationId!, `All subtasks in group [${task.command.completedSubtaskGroupId}] completed. Proceeding to next step.`, "info");

                return new AgentTaskResponse("completed", task.correlationId!, {message: "All subtasks completed successfully."});

            }
        }

        throw new TotoRuntimeError(500, `Unsupported command [${JSON.stringify(task.command)}] for SubtaskOrchestrator agent.`);
    }
}
