import { Request } from "express";
import { ExecutionContext, TotoDelegate, UserContext } from "toto-api-controller";

export class HelloWorldAgent implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        return { message: "Hello World!" }

    }

}