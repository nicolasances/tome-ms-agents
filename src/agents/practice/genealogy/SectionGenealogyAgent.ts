import { genkit, z } from "genkit";
import { anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";
import { GaleAgent, GaleAgentManifest } from "../../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse } from "../../../gale/model/AgentTask";
import { TomeKnowledgeBase } from "../../../tomekb/TomeKnowledgeBase";
import { RelationshipSchema } from "../../model/GenealogicTreeSchema";
import { PersonalitySchema } from "../../model/PersonalitiesSchema";


export class SectionGenealogyAgent extends GaleAgent<typeof SectionGenealogyAgent.inputSchema, typeof SectionGenealogyAgent.outputSchema> {

    static inputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic to build practice for."),
        topicCode: z.string().describe("Unique code of the Tome Topic to build practice for. E.g. the-merovingians"),
        sectionCode: z.string().describe("Code of the section to classify. E.g. 'boniface-viii'"),
        sectionIndex: z.number().describe("Index of the section within the topic."),
    });

    static responseSchema = z.object({
        genealogies: z.array(RelationshipSchema).describe("List of genealogical information detected in the section content. "),
        people: z.array(PersonalitySchema).describe("List of people mentioned in the section content with a description of who they are. The array contains arrays of 2 strings, where the first string is the name of the person and the second string is an description of the person that can be used to univoquely identify it in history. E.g. ['Pippin', 'Pippin the Short, King of the Franks from 751 to 768']"),
    });

    static outputSchema = z.object({
        topicId: z.string().describe("Unique identifier (database ID) of the Tome Topic."),
        topicCode: z.string().describe("Unique code of the Tome Topic."),
        sectionCode: z.string().describe("Code of the section that was classified."),
        sectionIndex: z.number().describe("Index of the section within the topic."),
        info: SectionGenealogyAgent.responseSchema.describe("Genealogical information extracted from the section content."),
    });

    manifest: GaleAgentManifest = {
        agentName: "Tome Section Genealogy Detector",
        taskId: "topic.section.genealogy",
        inputSchema: SectionGenealogyAgent.inputSchema,
        outputSchema: SectionGenealogyAgent.outputSchema,
        description: "Agent for detecting genealogical information in sections of a Tome Topic. This agent analyzes the content of a section and determines if it contains genealogical details such as family relationships, lineages, or ancestry information."
    };

    async executeTask(task: AgentTaskRequest<typeof SectionGenealogyAgent.inputSchema>): Promise<AgentTaskResponse<typeof SectionGenealogyAgent.outputSchema>> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;
        const inputData = task.taskInputData!;

        const ai = genkit({
            plugins: [
                awsBedrock({ region: "eu-north-1" }),
            ],
            model: anthropicClaude37SonnetV1("eu"),
        });

        logger.compute(cid, `Detecting genealogy in section [${inputData.sectionCode}] for topic [${inputData.topicId} - ${inputData.topicCode}]`, "info");

        // 1. Retrieve section content
        const sectionContent = await new TomeKnowledgeBase(this.config!).getSectionContent(inputData.topicCode, inputData.sectionCode, inputData.sectionIndex);

        const prompt = `
            You are an Agent specialized in extracting genealogical information from historical texts.

            Given the following content, identify and extract the following: 
             - genealogical relationships in the form of triples: (subject, relationship, object). The subject and object are names of individuals, and the relationship describes their familial connection (e.g., parent, child, sibling, spouse).
             - list of people mentioned in the content along with a brief description of who they are to help identify them in history univoquely.

            Rules: 
            - Relationships MUST BE EXPLICITLY stated in the content. DO NOT infer relationships that are not clearly mentioned.
            - ALLOWED family connections are ONLY: **child, parent, sibling, spouse**.
            - DISCARD any information that does not fit into these relationships. DO NOT add relationship types that are not in the allowed list.
            - DISCARD any relationship where either the subject or the object is not a person's name. Subjects and objects MUST be a person's name (first name, last name, or full name).
            - DISCARD any person in the list of people that is does not have an explicit name (first name, last name, or full name).
            - Make sure to avoid duplicates and symmetric entries (e.g., if you have (Alice, parent, Bob), do not include (Bob, child, Alice)).

            Content:
            ${sectionContent}
        `

        const response = await ai.generate({ prompt: prompt, output: { schema: SectionGenealogyAgent.responseSchema } });

        // 3. Return classification result
        return new AgentTaskResponse("completed", cid, {
            topicId: inputData.topicId,
            topicCode: inputData.topicCode,
            sectionCode: inputData.sectionCode,
            sectionIndex: inputData.sectionIndex,
            info: response.output!
        });
    }
}