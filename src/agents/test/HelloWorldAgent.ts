import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTriggerReponse } from "../../gale/model/AgentTriggerReponse";

export class HelloWorldAgent implements GaleAgent {

    agentName = "HelloWorld";
    taskId = "sayhello";

    async executeTask(taskInput: any): Promise<AgentTriggerReponse> {
        return {
            taskId: this.taskId,
            agentName: this.agentName,
            taskExecutionId: "exec-hello-1234"
        }
    }

}