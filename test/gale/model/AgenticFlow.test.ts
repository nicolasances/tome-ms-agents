import { expect } from 'chai';
import { describe, it } from 'mocha';
import { AgenticFlow, AgentNode, GroupNode, BranchNode } from '../../../src/gale/model/AgenticFlow';

describe('AgenticFlow - Path ID Assignment', () => {

    describe('Test Case 1: Flow with a group of 3 agents', () => {
        it('should assign correct path IDs to a group with 3 agents', () => {
            // Create a group with 3 agents
            const group = new GroupNode({
                groupId: 'test-group-1',
                agents: [
                    new AgentNode({ taskId: 'agent-1' }),
                    new AgentNode({ taskId: 'agent-2' }),
                    new AgentNode({ taskId: 'agent-3' })
                ]
            });

            // Create the flow
            const flow = new AgenticFlow(group);

            // Assign path IDs starting with empty prefix (root level)
            group.assignPathIds('');

            // Verify the group path ID
            expect((group as any).pathIdentifier).to.equal('.g');

            // Verify each agent's path ID
            expect((group.agents![0] as any).pathIdentifier).to.equal('.g.a1');
            expect((group.agents![1] as any).pathIdentifier).to.equal('.g.a2');
            expect((group.agents![2] as any).pathIdentifier).to.equal('.g.a3');
        });
    });

    describe('Test Case 2: Flow with group followed by a branch with 2 branches', () => {
        it('should assign correct path IDs to group -> branch structure', () => {
            // Create the branch structure
            // Branch 1: single agent
            const branch1Agent = new AgentNode({ taskId: 'branch1-agent' });

            // Branch 2: group with 2 agents
            const branch2Group = new GroupNode({
                groupId: 'branch2-group',
                agents: [
                    new AgentNode({ taskId: 'branch2-agent-1' }),
                    new AgentNode({ taskId: 'branch2-agent-2' })
                ]
            });

            // Create the branch node
            const branchNode = new BranchNode({
                branches: [
                    { branchId: 'branch-1', branch: branch1Agent },
                    { branchId: 'branch-2', branch: branch2Group }
                ]
            });

            // Create the initial group
            const initialGroup = new GroupNode({
                groupId: 'initial-group',
                agents: [
                    new AgentNode({ taskId: 'agent-1' }),
                    new AgentNode({ taskId: 'agent-2' }),
                    new AgentNode({ taskId: 'agent-3' })
                ],
                next: branchNode
            });

            // Create the flow
            const flow = new AgenticFlow(initialGroup);

            // Assign path IDs
            initialGroup.assignPathIds('');

            // Verify initial group
            expect((initialGroup as any).pathIdentifier).to.equal('.g');
            expect((initialGroup.agents![0] as any).pathIdentifier).to.equal('.g.a1');
            expect((initialGroup.agents![1] as any).pathIdentifier).to.equal('.g.a2');
            expect((initialGroup.agents![2] as any).pathIdentifier).to.equal('.g.a3');

            // Verify branch node
            expect((branchNode as any).pathIdentifier).to.equal('.g.br');

            // Verify branch 1 (single agent)
            expect((branch1Agent as any).pathIdentifier).to.equal('.g.b1.a');

            // Verify branch 2 (group with 2 agents)
            expect((branch2Group as any).pathIdentifier).to.equal('.g.b2.g');
            expect((branch2Group.agents![0] as any).pathIdentifier).to.equal('.g.b2.g.a1');
            expect((branch2Group.agents![1] as any).pathIdentifier).to.equal('.g.b2.g.a2');
        });
    });

    describe('Test Case 3: Flow starting with agent, followed by branch with 2 branches', () => {
        it('should assign correct path IDs to agent -> branch structure', () => {
            // Create branch 1 agent
            const branch1Agent = new AgentNode({ taskId: 'branch1-agent' });

            // Create branch 2 agent
            const branch2Agent = new AgentNode({ taskId: 'branch2-agent' });

            // Create the branch node
            const branchNode = new BranchNode({
                branches: [
                    { branchId: 'branch-1', branch: branch1Agent },
                    { branchId: 'branch-2', branch: branch2Agent }
                ]
            });

            // Create the initial agent
            const initialAgent = new AgentNode({
                taskId: 'initial-agent',
                next: branchNode
            });

            // Create the flow
            const flow = new AgenticFlow(initialAgent);

            // Assign path IDs
            initialAgent.assignPathIds('');

            // Verify initial agent
            expect((initialAgent as any).pathIdentifier).to.equal('.a');

            // Note: AgentNode doesn't call next.assignPathIds in the current implementation
            // We need to manually trigger it for the branch
            branchNode.assignPathIds('.a');

            // Verify branch node
            expect((branchNode as any).pathIdentifier).to.equal('.a.br');

            // Verify branch 1 agent
            expect((branch1Agent as any).pathIdentifier).to.equal('.a.b1.a');

            // Verify branch 2 agent
            expect((branch2Agent as any).pathIdentifier).to.equal('.a.b2.a');
        });
    });

    describe('Test Case 4: Complex flow starting with a branch', () => {
        it('should assign correct path IDs to complex branching structure', () => {
            // Branch 1: Group of 2 agents -> Single agent
            const branch1Group = new GroupNode({
                groupId: 'branch1-group',
                agents: [
                    new AgentNode({ taskId: 'branch1-agent-1' }),
                    new AgentNode({ taskId: 'branch1-agent-2' })
                ]
            });

            const branch1NextAgent = new AgentNode({ taskId: 'branch1-next-agent' });
            branch1Group.next = branch1NextAgent;

            // Branch 2: More complex structure
            // Agent 1 in the group (will spin off another agent)
            const branch2Agent1 = new AgentNode({ taskId: 'branch2-agent-1' });
            const branch2Agent1SpinOff = new AgentNode({ taskId: 'branch2-agent-1-spinoff' });

            // Agent 2 in the group (will spin off a branch)
            const branch2Agent2 = new AgentNode({ taskId: 'branch2-agent-2' });

            // Create the nested branch for agent 2's spin-off
            const nestedBranch1Agent = new AgentNode({ taskId: 'nested-branch1-agent' });
            const nestedBranch2Agent = new AgentNode({ taskId: 'nested-branch2-agent' });
            const nestedBranch = new BranchNode({
                branches: [
                    { branchId: 'nested-branch-1', branch: nestedBranch1Agent },
                    { branchId: 'nested-branch-2', branch: nestedBranch2Agent }
                ]
            });

            const branch2Group = new GroupNode({
                groupId: 'branch2-group',
                agents: [
                    branch2Agent1,
                    branch2Agent2
                ]
            });

            // Create the main branch node
            const mainBranch = new BranchNode({
                branches: [
                    { branchId: 'branch-1', branch: branch1Group },
                    { branchId: 'branch-2', branch: branch2Group }
                ]
            });

            // Create the flow
            const flow = new AgenticFlow(mainBranch);

            // Assign path IDs
            mainBranch.assignPathIds('');

            // Verify main branch
            expect((mainBranch as any).pathIdentifier).to.equal('.br');

            // Verify Branch 1: Group -> Agent
            expect((branch1Group as any).pathIdentifier).to.equal('.b1.g');
            expect((branch1Group.agents![0] as any).pathIdentifier).to.equal('.b1.g.a1');
            expect((branch1Group.agents![1] as any).pathIdentifier).to.equal('.b1.g.a2');
            expect((branch1NextAgent as any).pathIdentifier).to.equal('.b1.g.a');

            // Verify Branch 2: Group with 2 agents
            expect((branch2Group as any).pathIdentifier).to.equal('.b2.g');
            expect((branch2Agent1 as any).pathIdentifier).to.equal('.b2.g.a1');
            expect((branch2Agent2 as any).pathIdentifier).to.equal('.b2.g.a2');

            // Verify spin-off agent from agent 1
            branch2Agent1SpinOff.assignPathIds('.b2.g.a1');
            expect((branch2Agent1SpinOff as any).pathIdentifier).to.equal('.b2.g.a1.a');

            // Verify nested branch from agent 2
            nestedBranch.assignPathIds('.b2.g.a2');
            expect((nestedBranch as any).pathIdentifier).to.equal('.b2.g.a2.br');
            expect((nestedBranch1Agent as any).pathIdentifier).to.equal('.b2.g.a2.b1.a');
            expect((nestedBranch2Agent as any).pathIdentifier).to.equal('.b2.g.a2.b2.a');
        });
    });

});
