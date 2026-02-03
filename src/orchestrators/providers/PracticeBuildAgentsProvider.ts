import { z } from "genkit";
import { PracticeBuilderOrchestratorAgent } from "../PracticeBuilderOrchestrator";
import { AgentNode } from "../../gale/model/AgenticFlow";
import { TomeTopicsAPI } from "../../api/TomeTopicsAPI";
import { API_DEPENDENCIES, ControllerConfig } from "../../Config";
import { ExecutionContext, TotoRuntimeError } from "toto-api-controller";
import { SectionClassificationAgent } from "../../agents/practice/SectionClassificationAgent";
import { SectionGenealogyAgent } from "../../agents/practice/SectionGenealogyAgent";
import { SectionTimelineAgent } from "../../agents/practice/SectionTimelineAgent";
import { SectionJuiceAgent } from "../../agents/practice/SectionJuiceAgent";
import { SectionContextAgent } from "../../agents/practice/SectionContextAgent";
import { JuiceChallengeAgent } from "../../agents/practice/challenges/JuiceChallenceAgent";

/**
 * Provides agents for the classification group in the practice build orchestrator.
 */
export async function classificationAgents(input: z.infer<typeof PracticeBuilderOrchestratorAgent.inputSchema>, execContext: ExecutionContext): Promise<AgentNode<typeof SectionClassificationAgent.inputSchema>[]> {

    const config = execContext.config as ControllerConfig;
    const cid = execContext.cid;

    let sectionCodes = input.sections;

    if (!sectionCodes || sectionCodes.length === 0) {
        // Fetch the topic to get its sections
        const topic = await new TomeTopicsAPI(API_DEPENDENCIES.tomeTopics, config).getTopic(input.topicId, cid);

        if (!topic || !topic.sections || topic.sections.length === 0) throw new TotoRuntimeError(500, `Topic [${input.topicId}] has no sections defined.`);

        sectionCodes = topic.sections;
    }

    return sectionCodes.map((section, index) =>
        new AgentNode<typeof SectionClassificationAgent.inputSchema>({
            taskId: SectionClassificationAgent.taskId,
            taskInputData: {
                sectionCode: section,
                sectionIndex: index,
                topicId: input.topicId,
                topicCode: input.topicCode
            } as z.infer<typeof SectionClassificationAgent.inputSchema>,
        })
    );

}

/**
 * Provides agents for the genealogy group in the practice build orchestrator.
 * Generates one agent per section.
 * 
 * ONLY considers sections that were labelled with the "genealogy" label.
 * 
 * @param input expects inputs to be a LIST of SectionClassificationAgent.outputSchema
 * @param execContext 
 */
export async function sectionGenealogyAgents(input: z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>, execContext: ExecutionContext): Promise<AgentNode<typeof SectionGenealogyAgent.inputSchema>[]> {

    const inputData = input.childrenOutputs as z.infer<typeof SectionClassificationAgent.outputSchema>[];

    // 1. Filter sections labelled with "genealogy"
    const genealogySections = inputData.filter(sectionOutput =>
        sectionOutput.labels.some(label => label === "genealogy")
    );

    // 2. Generate one GenealogicTreeAgent per genealogy section
    return genealogySections.map(section =>
        new AgentNode<typeof SectionGenealogyAgent.inputSchema>({
            taskId: SectionGenealogyAgent.taskId,
            taskInputData: {
                topicId: section.topicId,
                topicCode: section.topicCode,
                sectionCode: section.sectionCode,
                sectionIndex: section.sectionIndex,
            } as z.infer<typeof SectionGenealogyAgent.inputSchema>,
        })
    );

}

/**
 * Generates the agents responsible for extracting timeline information from sections.
 * 
 * ONLY considers sections that were labelled with the "timeline" label.
 */
export async function sectionTimelineAgents(input: z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentNode<typeof SectionTimelineAgent.inputSchema>[]> {

    const inputData = input.childrenOutputs as z.infer<typeof SectionClassificationAgent.outputSchema>[];

    // 1. Filter sections labelled with "timeline"
    const timelineSections = inputData.filter(sectionOutput =>
        sectionOutput.labels.some(label => label === "timeline")
    );

    // 2. Generate one GenealogicTreeAgent per genealogy section
    return timelineSections.map(section =>
        new AgentNode<typeof SectionTimelineAgent.inputSchema>({
            taskId: SectionTimelineAgent.taskId,
            taskInputData: {
                topicId: section.topicId,
                topicCode: section.topicCode,
                sectionCode: section.sectionCode,
                sectionIndex: section.sectionIndex,
            } as z.infer<typeof SectionTimelineAgent.inputSchema>,
        })
    );

}

/**
 * Generates the agents responsible for extracting juice information from sections.
 * Generates one agent per section.
 */
export async function sectionJuiceAgents(input: z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentNode<typeof SectionJuiceAgent.inputSchema>[]> {

    const inputData = input.childrenOutputs as z.infer<typeof SectionClassificationAgent.outputSchema>[];

    return inputData.map(section =>
        new AgentNode<typeof SectionJuiceAgent.inputSchema>({
            taskId: SectionJuiceAgent.taskId,
            taskInputData: {
                topicId: section.topicId,
                topicCode: section.topicCode,
                sectionCode: section.sectionCode,
                sectionIndex: section.sectionIndex,
            } as z.infer<typeof SectionJuiceAgent.inputSchema>,
        })
    );

}

/**
 * Generates the agents responsible for extracting context information from sections.
 * Generates one agent per section.
 */
export async function sectionContextAgents(input: z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentNode<typeof SectionContextAgent.inputSchema>[]> {

    const inputData = input.childrenOutputs as z.infer<typeof SectionJuiceAgent.outputSchema>[];

    const agents = []

    const sections = inputData.sort((s1, s2) => s1.sectionIndex - s2.sectionIndex);

    for (let i = 0; i < sections.length; i++) {

        const section = sections[i];
        const previousSection = i > 0 ? sections[i - 1] : null;

        agents.push(
            new AgentNode<typeof SectionContextAgent.inputSchema>({
                taskId: SectionContextAgent.taskId,
                taskInputData: {
                    topicId: section.topicId,
                    topicCode: section.topicCode,
                    sectionCode: section.sectionCode,
                    sectionIndex: section.sectionIndex,
                    previousSectionJuice: previousSection?.juice || null,
                    juice: section.juice,
                } as z.infer<typeof SectionContextAgent.inputSchema>,
            })
        )

    }

    return agents;
}


/**
 * Generates the agents responsible for extracting context information from sections.
 * Generates one agent per section.
 */
export async function juiceChallengeAgents(input: z.infer<typeof PracticeBuilderOrchestratorAgent.resumeInputSchema>): Promise<AgentNode<typeof JuiceChallengeAgent.inputSchema>[]> {

    const inputData = input.childrenOutputs as z.infer<typeof SectionContextAgent.outputSchema>[];

    return inputData.map(section =>
        new AgentNode<typeof JuiceChallengeAgent.inputSchema>({
            taskId: JuiceChallengeAgent.taskId,
            taskInputData: {
                topicId: section.topicId,
                topicCode: section.topicCode,
                sectionCode: section.sectionCode,
                sectionIndex: section.sectionIndex,
                context: section.context,
                juice: section.juice,
            } as z.infer<typeof JuiceChallengeAgent.inputSchema>,
        })
    );
}
