import { Request } from "express";
import { ExecutionContext, TotoDelegate, UserContext } from "toto-api-controller";
import { GaleAgent } from "./GaleAgent";

export class GaleAgentTaskDelegate implements TotoDelegate {

    constructor(private agent: GaleAgent) {}

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const taskInput = req.body;

        return this.agent.executeTask(taskInput);

    }

}