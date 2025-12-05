import { expect } from 'chai';
import { describe, it } from 'mocha';
import { AgenticFlow, AgentNode, GroupNode, BranchNode } from '../../../src/gale/model/AgenticFlow';

describe('AgenticFlow - Path ID Assignment', () => {

    it('Flow with a group of 3 agents', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new GroupNode({
                groupId: 'test-group-1',
                agents: [
                    new AgentNode({ taskId: 'agent-1' }),
                    new AgentNode({ taskId: 'agent-2' }),
                    new AgentNode({ taskId: 'agent-3' })
                ]
            })
        );

        const group = flow.root as GroupNode;

        // Verify the group path ID
        expect((group as any).pathIdentifier).to.equal('.g');

        // Verify each agent's path ID
        expect((group.agents![0] as any).pathIdentifier).to.equal('.g.a1.a');
        expect((group.agents![1] as any).pathIdentifier).to.equal('.g.a2.a');
        expect((group.agents![2] as any).pathIdentifier).to.equal('.g.a3.a');
    });

    it('Flow with group of 3 agents followed by a branch (branch 1: single agent, branch 2: group of 2 agents)', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new GroupNode({
                groupId: 'initial-group',
                agents: [
                    new AgentNode({ taskId: 'agent-1' }),
                    new AgentNode({ taskId: 'agent-2' }),
                    new AgentNode({ taskId: 'agent-3' })
                ],
                next: new BranchNode({
                    branches: [
                        {
                            branchId: 'branch-1',
                            branch: new AgentNode({ taskId: 'branch1-agent' })
                        },
                        {
                            branchId: 'branch-2',
                            branch: new GroupNode({
                                groupId: 'branch2-group',
                                agents: [
                                    new AgentNode({ taskId: 'branch2-agent-1' }),
                                    new AgentNode({ taskId: 'branch2-agent-2' })
                                ]
                            })
                        }
                    ]
                })
            })
        );

        const branchNode = (flow.root.getNext() as BranchNode);

        const initialGroup = flow.root as GroupNode;
        const branch1Agent = branchNode.branches[0].branch as AgentNode;
        const branch2Group = (flow.root.getNext() as BranchNode).branches[1].branch as GroupNode;

        // Verify initial group
        expect((initialGroup as any).pathIdentifier).to.equal('.g');
        expect((initialGroup.agents![0] as any).pathIdentifier).to.equal('.g.a1.a');
        expect((initialGroup.agents![1] as any).pathIdentifier).to.equal('.g.a2.a');
        expect((initialGroup.agents![2] as any).pathIdentifier).to.equal('.g.a3.a');

        // Verify branch node
        expect((branchNode as any).pathIdentifier).to.equal('.g.br');

        // Verify branch 1 (single agent)
        expect((branch1Agent as any).pathIdentifier).to.equal('.g.br.b1.a');

        // Verify branch 2 (group with 2 agents)
        expect((branch2Group as any).pathIdentifier).to.equal('.g.br.b2.g');
        expect((branch2Group.agents![0] as any).pathIdentifier).to.equal('.g.br.b2.g.a1.a');
        expect((branch2Group.agents![1] as any).pathIdentifier).to.equal('.g.br.b2.g.a2.a');
    });

    it('Flow starting with agent, followed by branch with 2 single-agent branches', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new AgentNode({
                taskId: 'initial-agent',
                next: new BranchNode({
                    branches: [
                        { branchId: 'branch-1', branch: new AgentNode({ taskId: 'branch1-agent' }) },
                        { branchId: 'branch-2', branch: new AgentNode({ taskId: 'branch2-agent' }) }
                    ]
                })
            })
        );

        const branchNode = (flow.root.getNext() as BranchNode);

        const initialAgent = flow.root as AgentNode;
        const branch1Agent = branchNode.branches[0].branch as AgentNode;
        const branch2Agent = branchNode.branches[1].branch as AgentNode;

        // Verify initial agent
        expect((initialAgent as any).pathIdentifier).to.equal('.a');

        // Verify branch node
        expect((branchNode as any).pathIdentifier).to.equal('.a.br');

        // Verify branch 1 agent
        expect((branch1Agent as any).pathIdentifier).to.equal('.a.br.b1.a');

        // Verify branch 2 agent
        expect((branch2Agent as any).pathIdentifier).to.equal('.a.br.b2.a');
    });

    it('Complex flow starting with a branch (branch 1: group->agent, branch 2: group with spin-offs)', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new BranchNode({
                branches: [
                    {
                        branchId: 'branch-1',
                        branch: new GroupNode({
                            groupId: 'branch1-group',
                            agents: [
                                new AgentNode({ taskId: 'branch1-agent-1' }),
                                new AgentNode({ taskId: 'branch1-agent-2' })
                            ],
                            next: new AgentNode({ taskId: 'branch1-next-agent' })
                        })
                    },
                    {
                        branchId: 'branch-2', branch:
                            new GroupNode({
                                groupId: 'branch2-group',
                                agents: [
                                    new AgentNode({
                                        taskId: 'branch2-agent-1',
                                        next: new AgentNode({ taskId: 'branch2-agent-1-spinoff' })
                                    }),
                                    new AgentNode({
                                        taskId: 'branch2-agent-2',
                                        next: new BranchNode({
                                            branches: [
                                                { branchId: 'nested-branch-1', branch: new AgentNode({ taskId: 'nested-branch1-agent' }) },
                                                { branchId: 'nested-branch-2', branch: new AgentNode({ taskId: 'nested-branch2-agent' }) }
                                            ]
                                        })
                                    })
                                ]
                            })
                    }
                ]
            })
        );

        const branch1Group = (flow.root as BranchNode).branches[0].branch as GroupNode;
        const branch2Group = (flow.root as BranchNode).branches[1].branch as GroupNode;
        const branch1NextAgent = branch1Group.getNext() as AgentNode;
        const branch2Agent1SpinOff = branch2Group.agents![0].getNext() as AgentNode;
        const nestedBranch = branch2Group.agents![1].getNext() as BranchNode;

        const mainBranch = flow.root as BranchNode;
        const branch2Agent1 = branch2Group.agents![0];
        const branch2Agent2 = branch2Group.agents![1];

        // Verify main branch
        expect((mainBranch as any).pathIdentifier).to.equal('.br');

        // Verify Branch 1: Group -> Agent
        expect((branch1Group as any).pathIdentifier).to.equal('.br.b1.g');
        expect((branch1Group.agents![0] as any).pathIdentifier).to.equal('.br.b1.g.a1.a');
        expect((branch1Group.agents![1] as any).pathIdentifier).to.equal('.br.b1.g.a2.a');
        expect((branch1NextAgent as any).pathIdentifier).to.equal('.br.b1.g.a');

        // Verify Branch 2: Group with 2 agents
        expect((branch2Group as any).pathIdentifier).to.equal('.br.b2.g');
        expect((branch2Agent1 as any).pathIdentifier).to.equal('.br.b2.g.a1.a');
        expect((branch2Agent2 as any).pathIdentifier).to.equal('.br.b2.g.a2.a');

        expect((branch2Agent1SpinOff as any).pathIdentifier).to.equal('.br.b2.g.a1.a.a');

        const nestedBranch1Agent = nestedBranch.branches[0].branch as AgentNode;
        const nestedBranch2Agent = nestedBranch.branches[1].branch as AgentNode;

        expect((nestedBranch as any).pathIdentifier).to.equal('.br.b2.g.a2.a.br');
        expect((nestedBranch1Agent as any).pathIdentifier).to.equal('.br.b2.g.a2.a.br.b1.a');
        expect((nestedBranch2Agent as any).pathIdentifier).to.equal('.br.b2.g.a2.a.br.b2.a');
    });

    it('Group chain', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new AgentNode({
                taskId: 'agent-1',
                next: new AgentNode({
                    taskId: 'agent-2',
                    next: new AgentNode({
                        taskId: 'agent-3'
                    })
                })
            })
        );

        const agent1 = flow.root as AgentNode;
        const agent2 = agent1.getNext() as AgentNode;
        const agent3 = agent2.getNext() as AgentNode;

        expect(agent1.getPathId()).to.equal('.a');
        expect(agent2.getPathId()).to.equal('.a.a');
        expect(agent3.getPathId()).to.equal('.a.a.a');
    });

    it('Agent chain', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new GroupNode({
                groupId: 'group-1',
                agents: [
                    new AgentNode({ taskId: 'agent-1' }),
                    new AgentNode({ taskId: 'agent-2' }),
                ],
                next: new GroupNode({
                    groupId: 'group-2',
                    agents: [
                        new AgentNode({ taskId: 'agent-3' }),
                        new AgentNode({ taskId: 'agent-4' }),
                    ],
                    next: new GroupNode({
                        groupId: 'group-3',
                        agents: [
                            new AgentNode({ taskId: 'agent-5' })
                        ]
                    })
                })
            })
        );

        const group1 = flow.root as GroupNode;
        const g1a1 = group1.agents![0];
        const g1a2 = group1.agents![1];
        const group2 = group1.getNext() as GroupNode;
        const g2a1 = group2.agents![0];
        const g2a2 = group2.agents![1];
        const group3 = group2.getNext() as GroupNode;
        const g3a1 = group3.agents![0];


        expect(group1.getPathId()).to.equal('.g');
        expect(g1a1.getPathId()).to.equal('.g.a1.a');
        expect(g1a2.getPathId()).to.equal('.g.a2.a');
        expect(group2.getPathId()).to.equal('.g.g');
        expect(g2a1.getPathId()).to.equal('.g.g.a1.a');
        expect(g2a2.getPathId()).to.equal('.g.g.a2.a');
        expect(group3.getPathId()).to.equal('.g.g.g');
        expect(g3a1.getPathId()).to.equal('.g.g.g.a1.a');
    });

    it('Branch chain', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new BranchNode({
                branches: [
                    { branchId: 'branch-1', branch: new AgentNode({ taskId: 'agent-1' }) },
                    { branchId: 'branch-2', branch: new AgentNode({ taskId: 'agent-2' }) }
                ],
                next: new BranchNode({
                    branches: [
                        { branchId: 'branch-1', branch: new AgentNode({ taskId: 'agent-3' }) },
                        { branchId: 'branch-2', branch: new AgentNode({ taskId: 'agent-4' }) }
                    ],
                    next: new BranchNode({
                        branches: [
                            { branchId: 'branch-1', branch: new AgentNode({ taskId: 'agent-5' }) }
                        ]
                    })
                })
            })
        );

        const branch1 = flow.root as BranchNode;
        const b1a1 = branch1.branches[0].branch as AgentNode;
        const b1a2 = branch1.branches[1].branch as AgentNode;
        const branch2 = branch1.getNext() as BranchNode;
        const b2a1 = branch2.branches[0].branch as AgentNode;
        const b2a2 = branch2.branches[1].branch as AgentNode;
        const branch3 = branch2.getNext() as BranchNode;
        const b3a1 = branch3.branches[0].branch as AgentNode;

        expect(branch1.getPathId()).to.equal('.br');
        expect(b1a1.getPathId()).to.equal('.br.b1.a');
        expect(b1a2.getPathId()).to.equal('.br.b2.a');
        expect(branch2.getPathId()).to.equal('.br.br');
        expect(b2a1.getPathId()).to.equal('.br.br.b1.a');
        expect(b2a2.getPathId()).to.equal('.br.br.b2.a');
        expect(branch3.getPathId()).to.equal('.br.br.br');
        expect(b3a1.getPathId()).to.equal('.br.br.br.b1.a');
    });

    it('Nested group referenced by group id rather than path id', () => {
        // Create the flow
        const flow = new AgenticFlow(
            new GroupNode({
                groupId: "sections-classification-group",
                next: new BranchNode({
                    branches: [
                        {
                            branchId: "sections-genealogy-branch",
                            branch: new GroupNode({
                                groupId: "sections-genealogy-group",
                                next: new BranchNode({
                                    branches: [
                                        {
                                            branchId: "genealogy-personalities-branch",
                                            branch: new AgentNode({
                                                taskId: "PersonalitiesConsolidationAgent.taskId",
                                            })
                                        },
                                        {
                                            branchId: "genealogy-tree-branch",
                                            branch: new AgentNode({
                                                taskId: "GenealogicTreeAgent.taskId",
                                            })
                                        }
                                    ]
                                })
                            })
                        },
                        {
                            branchId: "sections-timeline-branch",
                            branch: new GroupNode({
                                groupId: "sections-timeline-group",
                            })
                        }
                    ]
                })
            })
        )

        // sections-genealogy-group is completed => find it by group id
        const genealogyGroupNode = flow.findNode("sections-genealogy-group");
        
        expect(genealogyGroupNode).to.not.be.null;
        expect(genealogyGroupNode).to.be.instanceOf(GroupNode);
        expect((genealogyGroupNode as GroupNode).groupId).to.equal("sections-genealogy-group");
    });
});
