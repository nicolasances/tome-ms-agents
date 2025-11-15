import { GetTopicResponse } from "@google-cloud/pubsub";
import { TomeTopicsAPI } from "../../api/TomeTopicsAPI";
import { API_DEPENDENCIES } from "../../Config";
import { GaleAgent } from "../../gale/GaleAgent";
import { AgentTaskRequest, AgentTaskResponse, SubTaskInfo } from "../../gale/model/AgentTask";

/**
 * This agent is the ORCHESTRATOR for building practices for a give Tome Topic.
 */
export class PracticeBuilderAgent extends GaleAgent {
    
    agentName: string = "TomePracticeBuilder"
    taskId: string = "topic.practice.build"
    
    async executeTask(task: AgentTaskRequest): Promise<AgentTaskResponse> {

        const cid = task.correlationId || "no-cid";
        const logger = this.logger!;

        // Step 1: Get a classification Agent to classify the topic type
        if (task.command.command === "start") {

            this.logger?.compute(cid, `Starting practice building for topic [${task.taskInputData?.topicId} - ${task.taskInputData?.topicCode}]`, "info");

            // 1.1. Get the list of sections for the topic 
            const topic = await new TomeTopicsAPI(API_DEPENDENCIES.tomeTopics, this.config!).getTopic(task.taskInputData!.topicId, cid);

            if (!topic || !topic.sections || topic.sections.length === 0) {

                logger.compute(cid, `No sections found for topic [${task.taskInputData?.topicId}]`, "error");

                return new AgentTaskResponse("failed", cid, {error: "No sections found for topic"});
            }

            // 1.2. For each section, create a subtask to classify the section
            const subtasks: SubTaskInfo[] = topic.sections.map((section, index) => {
                return {
                    taskId: "topic.section.classify", 
                    taskInputData: {
                        topicId: topic.id, 
                        topicCode: topic.topicCode,
                        sectionCode: section, 
                        sectionIndex: index
                    }
                }
            });

            return new AgentTaskResponse("subtasks", task.correlationId!, null, subtasks, "sections-classification-group")
        }
        else if (task.command.command == 'resume') {
            
            this.logger?.compute(cid, `Resuming practice building for topic [${task.taskInputData?.topicId} - ${task.taskInputData?.topicCode}]`, "info");
            
            // Step 2: Generate overall classification & trigger next step
            if (task.command.completedSubtaskGroupId == "sections-classification-group") {

                this.logger?.compute(cid, `All sections classified for topic [${task.taskInputData?.topicId} - ${task.taskInputData?.topicCode}]`, "info");

            }

        }

        const response = new AgentTaskResponse("completed", task.correlationId!, {done: true});

        return response;
        
    }
}