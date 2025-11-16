import { ValidationError } from "toto-api-controller";
import { TaskEndpoint } from "./TaskEndpoint";
import { TaskId } from "./TaskId";
import { GaleAgentManifest } from "../GaleAgent";
import zodToJsonSchema from "zod-to-json-schema";

export class AgentDefinition {

    name: string = ""; // The name of the Agent.
    description: string = ""; // The description of the Agent.
    taskId: TaskId = ""; // The unique identifier of the type of task this Agent can execute.
    inputSchema: any = {}; 
    outputSchema: any = {}; 
    endpoint: TaskEndpoint = new TaskEndpoint(""); // The endpoint (URL) where the Agent can be reached.

    constructor(manifest: GaleAgentManifest, endpoint: TaskEndpoint) {
        this.name = manifest.agentName;
        this.description = manifest.description;
        this.taskId = manifest.taskId;
        this.inputSchema = zodToJsonSchema(manifest.inputSchema);
        this.outputSchema = zodToJsonSchema(manifest.outputSchema);
        this.endpoint = endpoint;
    }

}