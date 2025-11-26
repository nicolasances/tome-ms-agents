

export interface DeterministicFlow {
    start: FlowNode; 
}

export interface FlowNode {
    name: string; 
    agent?: AgentNode;
    branch?: FlowNode[];
    parallelize?: AgentNode[];
    next: FlowNode | null;
    state?: string; 
}

export class AgentNode {
    taskId: string;
    mapInput: (input: any) => any; 

    constructor(taskId: string, mapInput: (input: any) => any) {
        this.taskId = taskId;
        this.mapInput = mapInput;
    }
}
