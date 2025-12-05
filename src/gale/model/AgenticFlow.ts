import { ExecutionContext, TotoRuntimeError } from "toto-api-controller";

export class AgenticFlow {

    // Root node of the flow
    root: AbstractNode;

    constructor(root: AbstractNode) {
        this.root = root;

        this.assignPathIds();
    }

    /**
     * This method is going through the flow and is assigning path IDs to all Group Nodes and Agent Nodes.
     * 
     * Why? 
     * - Group Nodes need a unique path ID to identify the group of tasks they represent, so that when a resume command happens, the orchestrator knows which group to resume from. 
     * - Single Agent Nodes similarly need to be associated with a path ID, as Gale treats them as a group of 1 agent.
     * This avoids to have the coder that creates the flow to have to assign unique path IDs manually, which is error-prone.
     * 
     * How? 
     * - Each group is basically assigned an id that is constructed as a concatenation of the nodes it goes through. 
     *  e.g. b1.g.b1.a (branch 1 -> group -> branch 1 -> agent)
     */
    private assignPathIds() {
        this.root.assignPathIds('');
    }

    public findNode(pathId: string): AbstractNode | null {
        return this.root.findNode(pathId);
    }

}

/**
 * There are three types of nodes: 
 * - Agent Node: represents a single agent 
 * - Group Node: represents a group of agents to be executed in parallel. The flow is interrupted until all agents in the group have completed.
 * - Branch Node: represents a set of parallel paths in the flow. All branches are executed in parallel, and the flow continues until all branches have completed.
 */
export abstract class AbstractNode {
    protected type: "agent" | "group" | "branch" = "agent";
    protected name: string | null = null;
    protected next: AbstractNode | null = null;
    protected prev: AbstractNode | null = null;
    protected pathIdentifier: string | null = null;

    getType(): "agent" | "group" | "branch" {
        return this.type;
    }

    getNext(): AbstractNode | null {
        return this.next;
    }

    getPathId(): string | null {
        return this.pathIdentifier;
    }

    abstract assignPathIds(prefix: string): void;

    public findNode(pathId: string): AbstractNode | null {

        if (this.pathIdentifier === pathId) return this;

        // Search in next
        if (this.next) {
            const foundInNext = this.next.findNode(pathId);
            if (foundInNext) return foundInNext;
        }
        return null;
    }

}

export class AgentNode extends AbstractNode {

    taskId: string;
    taskInputData?: any;
    taskInputMapper?: (input: any) => any;

    constructor({ taskId, taskInputData, taskInputMapper, name, next }: { taskId: string, taskInputData?: any, taskInputMapper?: (input: any) => any, name?: string, next?: AbstractNode }) {
        super();

        this.taskId = taskId;
        this.taskInputData = taskInputData;
        this.taskInputMapper = taskInputMapper;
        this.type = "agent";
        if (name) this.name = name;
        if (next) this.next = next;
    }

    assignPathIds(prefix: string): void {
        this.pathIdentifier = prefix + ".a";
        if (this.next) this.next.assignPathIds(this.pathIdentifier);
    }

}

export class GroupNode extends AbstractNode {
    agents?: AgentNode[];
    agentsProvider?: (input: any, execContext: ExecutionContext) => Promise<AgentNode[]>; // Function to provide agents dynamically
    groupId: string;

    constructor({ agents, agentsProvider, groupId, name, next }: { agents?: AgentNode[], agentsProvider?: (input: any, execContext: ExecutionContext) => Promise<AgentNode[]>, groupId: string, name?: string, next?: AbstractNode }) {
        super();

        this.type = "group";
        this.agents = agents;
        this.agentsProvider = agentsProvider;
        this.groupId = groupId;
        if (name) this.name = name;
        if (next) this.next = next;
    }

    assignPathIds(prefix: string): void {

        this.pathIdentifier = prefix + ".g";

        // Assign to next.
        if (this.next) this.next.assignPathIds(this.pathIdentifier);

        if (this.agents) {
            for (let i = 0; i < this.agents.length; i++) {
                const agent = this.agents[i];
                const agentPrefix = `${this.pathIdentifier}.a${i + 1}`;
                agent.assignPathIds(agentPrefix);
            }
        }
    }


}

export class BranchNode extends AbstractNode {
    branches: {
        branchId: string,
        branch: AbstractNode
    }[];

    constructor({ branches, name, next }: { branches: { branchId: string, branch: AbstractNode }[], name?: string, next?: AbstractNode }) {
        super();

        this.type = "branch";
        this.branches = branches;
        if (name) this.name = name;
        if (next) this.next = next;
    }

    assignPathIds(prefix: string): void {

        this.pathIdentifier = prefix + ".br";

        // Assign group IDs to each branch. E.g. b1, b2, etc.
        for (let i = 0; i < this.branches.length; i++) {
            const branch = this.branches[i];
            const branchPrefix = `${this.pathIdentifier}.b${i + 1}`;
            branch.branch.assignPathIds(branchPrefix);
        }
        if (this.next) this.next.assignPathIds(this.pathIdentifier);
    }
}
