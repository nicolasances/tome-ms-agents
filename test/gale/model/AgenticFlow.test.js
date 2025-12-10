"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const AgenticFlow_1 = require("../../../src/gale/model/AgenticFlow");
(0, mocha_1.describe)('AgenticFlow - Path ID Assignment', () => {
    (0, mocha_1.it)('Flow with a group of 3 agents', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.GroupNode({
            groupId: 'test-group-1',
            agents: [
                new AgenticFlow_1.AgentNode({ taskId: 'agent-1' }),
                new AgenticFlow_1.AgentNode({ taskId: 'agent-2' }),
                new AgenticFlow_1.AgentNode({ taskId: 'agent-3' })
            ]
        }));
        const group = flow.root;
        // Verify the group path ID
        (0, chai_1.expect)(group.pathIdentifier).to.equal('.g');
        // Verify each agent's path ID
        (0, chai_1.expect)(group.agents[0].pathIdentifier).to.equal('.g.a1.a');
        (0, chai_1.expect)(group.agents[1].pathIdentifier).to.equal('.g.a2.a');
        (0, chai_1.expect)(group.agents[2].pathIdentifier).to.equal('.g.a3.a');
    });
    (0, mocha_1.it)('Flow with group of 3 agents followed by a branch (branch 1: single agent, branch 2: group of 2 agents)', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.GroupNode({
            groupId: 'initial-group',
            agents: [
                new AgenticFlow_1.AgentNode({ taskId: 'agent-1' }),
                new AgenticFlow_1.AgentNode({ taskId: 'agent-2' }),
                new AgenticFlow_1.AgentNode({ taskId: 'agent-3' })
            ],
            next: new AgenticFlow_1.BranchNode({
                branches: [
                    {
                        branchId: 'branch-1',
                        branch: new AgenticFlow_1.AgentNode({ taskId: 'branch1-agent' })
                    },
                    {
                        branchId: 'branch-2',
                        branch: new AgenticFlow_1.GroupNode({
                            groupId: 'branch2-group',
                            agents: [
                                new AgenticFlow_1.AgentNode({ taskId: 'branch2-agent-1' }),
                                new AgenticFlow_1.AgentNode({ taskId: 'branch2-agent-2' })
                            ]
                        })
                    }
                ]
            })
        }));
        const branchNode = flow.root.getNext();
        const initialGroup = flow.root;
        const branch1Agent = branchNode.branches[0].branch;
        const branch2Group = flow.root.getNext().branches[1].branch;
        // Verify initial group
        (0, chai_1.expect)(initialGroup.pathIdentifier).to.equal('.g');
        (0, chai_1.expect)(initialGroup.agents[0].pathIdentifier).to.equal('.g.a1.a');
        (0, chai_1.expect)(initialGroup.agents[1].pathIdentifier).to.equal('.g.a2.a');
        (0, chai_1.expect)(initialGroup.agents[2].pathIdentifier).to.equal('.g.a3.a');
        // Verify branch node
        (0, chai_1.expect)(branchNode.pathIdentifier).to.equal('.g.br');
        // Verify branch 1 (single agent)
        (0, chai_1.expect)(branch1Agent.pathIdentifier).to.equal('.g.br.b1.a');
        // Verify branch 2 (group with 2 agents)
        (0, chai_1.expect)(branch2Group.pathIdentifier).to.equal('.g.br.b2.g');
        (0, chai_1.expect)(branch2Group.agents[0].pathIdentifier).to.equal('.g.br.b2.g.a1.a');
        (0, chai_1.expect)(branch2Group.agents[1].pathIdentifier).to.equal('.g.br.b2.g.a2.a');
    });
    (0, mocha_1.it)('Flow starting with agent, followed by branch with 2 single-agent branches', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.AgentNode({
            taskId: 'initial-agent',
            next: new AgenticFlow_1.BranchNode({
                branches: [
                    { branchId: 'branch-1', branch: new AgenticFlow_1.AgentNode({ taskId: 'branch1-agent' }) },
                    { branchId: 'branch-2', branch: new AgenticFlow_1.AgentNode({ taskId: 'branch2-agent' }) }
                ]
            })
        }));
        const branchNode = flow.root.getNext();
        const initialAgent = flow.root;
        const branch1Agent = branchNode.branches[0].branch;
        const branch2Agent = branchNode.branches[1].branch;
        // Verify initial agent
        (0, chai_1.expect)(initialAgent.pathIdentifier).to.equal('.a');
        // Verify branch node
        (0, chai_1.expect)(branchNode.pathIdentifier).to.equal('.a.br');
        // Verify branch 1 agent
        (0, chai_1.expect)(branch1Agent.pathIdentifier).to.equal('.a.br.b1.a');
        // Verify branch 2 agent
        (0, chai_1.expect)(branch2Agent.pathIdentifier).to.equal('.a.br.b2.a');
    });
    (0, mocha_1.it)('Complex flow starting with a branch (branch 1: group->agent, branch 2: group with spin-offs)', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.BranchNode({
            branches: [
                {
                    branchId: 'branch-1',
                    branch: new AgenticFlow_1.GroupNode({
                        groupId: 'branch1-group',
                        agents: [
                            new AgenticFlow_1.AgentNode({ taskId: 'branch1-agent-1' }),
                            new AgenticFlow_1.AgentNode({ taskId: 'branch1-agent-2' })
                        ],
                        next: new AgenticFlow_1.AgentNode({ taskId: 'branch1-next-agent' })
                    })
                },
                {
                    branchId: 'branch-2', branch: new AgenticFlow_1.GroupNode({
                        groupId: 'branch2-group',
                        agents: [
                            new AgenticFlow_1.AgentNode({
                                taskId: 'branch2-agent-1',
                                next: new AgenticFlow_1.AgentNode({ taskId: 'branch2-agent-1-spinoff' })
                            }),
                            new AgenticFlow_1.AgentNode({
                                taskId: 'branch2-agent-2',
                                next: new AgenticFlow_1.BranchNode({
                                    branches: [
                                        { branchId: 'nested-branch-1', branch: new AgenticFlow_1.AgentNode({ taskId: 'nested-branch1-agent' }) },
                                        { branchId: 'nested-branch-2', branch: new AgenticFlow_1.AgentNode({ taskId: 'nested-branch2-agent' }) }
                                    ]
                                })
                            })
                        ]
                    })
                }
            ]
        }));
        const branch1Group = flow.root.branches[0].branch;
        const branch2Group = flow.root.branches[1].branch;
        const branch1NextAgent = branch1Group.getNext();
        const branch2Agent1SpinOff = branch2Group.agents[0].getNext();
        const nestedBranch = branch2Group.agents[1].getNext();
        const mainBranch = flow.root;
        const branch2Agent1 = branch2Group.agents[0];
        const branch2Agent2 = branch2Group.agents[1];
        // Verify main branch
        (0, chai_1.expect)(mainBranch.pathIdentifier).to.equal('.br');
        // Verify Branch 1: Group -> Agent
        (0, chai_1.expect)(branch1Group.pathIdentifier).to.equal('.br.b1.g');
        (0, chai_1.expect)(branch1Group.agents[0].pathIdentifier).to.equal('.br.b1.g.a1.a');
        (0, chai_1.expect)(branch1Group.agents[1].pathIdentifier).to.equal('.br.b1.g.a2.a');
        (0, chai_1.expect)(branch1NextAgent.pathIdentifier).to.equal('.br.b1.g.a');
        // Verify Branch 2: Group with 2 agents
        (0, chai_1.expect)(branch2Group.pathIdentifier).to.equal('.br.b2.g');
        (0, chai_1.expect)(branch2Agent1.pathIdentifier).to.equal('.br.b2.g.a1.a');
        (0, chai_1.expect)(branch2Agent2.pathIdentifier).to.equal('.br.b2.g.a2.a');
        (0, chai_1.expect)(branch2Agent1SpinOff.pathIdentifier).to.equal('.br.b2.g.a1.a.a');
        const nestedBranch1Agent = nestedBranch.branches[0].branch;
        const nestedBranch2Agent = nestedBranch.branches[1].branch;
        (0, chai_1.expect)(nestedBranch.pathIdentifier).to.equal('.br.b2.g.a2.a.br');
        (0, chai_1.expect)(nestedBranch1Agent.pathIdentifier).to.equal('.br.b2.g.a2.a.br.b1.a');
        (0, chai_1.expect)(nestedBranch2Agent.pathIdentifier).to.equal('.br.b2.g.a2.a.br.b2.a');
    });
    (0, mocha_1.it)('Group chain', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.AgentNode({
            taskId: 'agent-1',
            next: new AgenticFlow_1.AgentNode({
                taskId: 'agent-2',
                next: new AgenticFlow_1.AgentNode({
                    taskId: 'agent-3'
                })
            })
        }));
        const agent1 = flow.root;
        const agent2 = agent1.getNext();
        const agent3 = agent2.getNext();
        (0, chai_1.expect)(agent1.getPathId()).to.equal('.a');
        (0, chai_1.expect)(agent2.getPathId()).to.equal('.a.a');
        (0, chai_1.expect)(agent3.getPathId()).to.equal('.a.a.a');
    });
    (0, mocha_1.it)('Agent chain', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.GroupNode({
            groupId: 'group-1',
            agents: [
                new AgenticFlow_1.AgentNode({ taskId: 'agent-1' }),
                new AgenticFlow_1.AgentNode({ taskId: 'agent-2' }),
            ],
            next: new AgenticFlow_1.GroupNode({
                groupId: 'group-2',
                agents: [
                    new AgenticFlow_1.AgentNode({ taskId: 'agent-3' }),
                    new AgenticFlow_1.AgentNode({ taskId: 'agent-4' }),
                ],
                next: new AgenticFlow_1.GroupNode({
                    groupId: 'group-3',
                    agents: [
                        new AgenticFlow_1.AgentNode({ taskId: 'agent-5' })
                    ]
                })
            })
        }));
        const group1 = flow.root;
        const g1a1 = group1.agents[0];
        const g1a2 = group1.agents[1];
        const group2 = group1.getNext();
        const g2a1 = group2.agents[0];
        const g2a2 = group2.agents[1];
        const group3 = group2.getNext();
        const g3a1 = group3.agents[0];
        (0, chai_1.expect)(group1.getPathId()).to.equal('.g');
        (0, chai_1.expect)(g1a1.getPathId()).to.equal('.g.a1.a');
        (0, chai_1.expect)(g1a2.getPathId()).to.equal('.g.a2.a');
        (0, chai_1.expect)(group2.getPathId()).to.equal('.g.g');
        (0, chai_1.expect)(g2a1.getPathId()).to.equal('.g.g.a1.a');
        (0, chai_1.expect)(g2a2.getPathId()).to.equal('.g.g.a2.a');
        (0, chai_1.expect)(group3.getPathId()).to.equal('.g.g.g');
        (0, chai_1.expect)(g3a1.getPathId()).to.equal('.g.g.g.a1.a');
    });
    (0, mocha_1.it)('Branch chain', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.BranchNode({
            branches: [
                { branchId: 'branch-1', branch: new AgenticFlow_1.AgentNode({ taskId: 'agent-1' }) },
                { branchId: 'branch-2', branch: new AgenticFlow_1.AgentNode({ taskId: 'agent-2' }) }
            ],
            next: new AgenticFlow_1.BranchNode({
                branches: [
                    { branchId: 'branch-1', branch: new AgenticFlow_1.AgentNode({ taskId: 'agent-3' }) },
                    { branchId: 'branch-2', branch: new AgenticFlow_1.AgentNode({ taskId: 'agent-4' }) }
                ],
                next: new AgenticFlow_1.BranchNode({
                    branches: [
                        { branchId: 'branch-1', branch: new AgenticFlow_1.AgentNode({ taskId: 'agent-5' }) }
                    ]
                })
            })
        }));
        const branch1 = flow.root;
        const b1a1 = branch1.branches[0].branch;
        const b1a2 = branch1.branches[1].branch;
        const branch2 = branch1.getNext();
        const b2a1 = branch2.branches[0].branch;
        const b2a2 = branch2.branches[1].branch;
        const branch3 = branch2.getNext();
        const b3a1 = branch3.branches[0].branch;
        (0, chai_1.expect)(branch1.getPathId()).to.equal('.br');
        (0, chai_1.expect)(b1a1.getPathId()).to.equal('.br.b1.a');
        (0, chai_1.expect)(b1a2.getPathId()).to.equal('.br.b2.a');
        (0, chai_1.expect)(branch2.getPathId()).to.equal('.br.br');
        (0, chai_1.expect)(b2a1.getPathId()).to.equal('.br.br.b1.a');
        (0, chai_1.expect)(b2a2.getPathId()).to.equal('.br.br.b2.a');
        (0, chai_1.expect)(branch3.getPathId()).to.equal('.br.br.br');
        (0, chai_1.expect)(b3a1.getPathId()).to.equal('.br.br.br.b1.a');
    });
    (0, mocha_1.it)('Nested group referenced by group id rather than path id', () => {
        // Create the flow
        const flow = new AgenticFlow_1.AgenticFlow(new AgenticFlow_1.GroupNode({
            groupId: "sections-classification-group",
            next: new AgenticFlow_1.BranchNode({
                branches: [
                    {
                        branchId: "sections-genealogy-branch",
                        branch: new AgenticFlow_1.GroupNode({
                            groupId: "sections-genealogy-group",
                            next: new AgenticFlow_1.BranchNode({
                                branches: [
                                    {
                                        branchId: "genealogy-personalities-branch",
                                        branch: new AgenticFlow_1.AgentNode({
                                            taskId: "PersonalitiesConsolidationAgent.taskId",
                                        })
                                    },
                                    {
                                        branchId: "genealogy-tree-branch",
                                        branch: new AgenticFlow_1.AgentNode({
                                            taskId: "GenealogicTreeAgent.taskId",
                                        })
                                    }
                                ]
                            })
                        })
                    },
                    {
                        branchId: "sections-timeline-branch",
                        branch: new AgenticFlow_1.GroupNode({
                            groupId: "sections-timeline-group",
                        })
                    }
                ]
            })
        }));
        // sections-genealogy-group is completed => find it by group id
        const genealogyGroupNode = flow.findNode("sections-genealogy-group");
        (0, chai_1.expect)(genealogyGroupNode).to.not.be.null;
        (0, chai_1.expect)(genealogyGroupNode).to.be.instanceOf(AgenticFlow_1.GroupNode);
        (0, chai_1.expect)(genealogyGroupNode.groupId).to.equal("sections-genealogy-group");
    });
});
