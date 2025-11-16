import http from "request";
import { AgentDefinition } from "../model/AgentDefinition";
import { AgentTaskRequest } from "../model/AgentTask";
import { ExecutionContext } from "toto-api-controller";
import { v4 as uuidv4 } from "uuid";

export class GaleBrokerAPI {

    constructor(private galeBrokerURL: string, private execContext?: ExecutionContext) {}

    /**
     * Executes the agent with the given input.
     * @param agentInput any input data to provide to the agent. This is agent-specific.
     * @returns a promise that resolves to the agent trigger response.
     */
    async registerAgent(request: RegisterAgentRequest): Promise<RegisterAgentResponse> {

        return new Promise<RegisterAgentResponse>((success, failure) => {

            http({
                uri: `${this.galeBrokerURL}/catalog/agents`,
                method: 'PUT',
                headers: {
                    'x-correlation-id': 'Gale-registerAgent',
                    // 'Authorization': `Bearer ${this.bearerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                    return;
                }

                // Parse the output
                try {
                    const agentResponse = RegisterAgentResponse.fromHTTPResponse(body);
                    success(agentResponse);
                }
                catch (error) {
                    console.log(body);
                    failure(error);
                }


            })
        })

    }

    /**
     * Posts a task to an agent for execution using Gale Broker API.
     * 
     * @param task the task
     * 
     * @returns 
     */
    async postTask(task: AgentTaskRequest<any>, token: string): Promise<any> {

        return new Promise<any>((success, failure) => {

            http({
                uri: `${this.galeBrokerURL}/tasks`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.execContext?.cid || uuidv4(),
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                    return;
                }

                success(body);
            })
        })
    }
}


export interface RegisterAgentRequest {
    agentDefinition: AgentDefinition;
}
export class RegisterAgentResponse {

    constructor(private modifiedCount: number) {}

    static fromHTTPResponse(responseBody: any): RegisterAgentResponse {
        return new RegisterAgentResponse(
            JSON.parse(responseBody).modifiedCount
        );
    }

}