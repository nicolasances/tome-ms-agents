import { z } from "genkit";
import { JuiceChallenge } from "./model/JuiceChallenge";
import { JuiceChallengeAgent } from "../../agents/practice/challenges/JuiceChallenceAgent";
import { DateTest } from "./model/tests/DateTest";
import {v4 as uuidv4} from "uuid";

export class ChallengeFactory {

    static juiceChallenge(data: z.infer<typeof JuiceChallengeAgent.outputSchema>): JuiceChallenge {

        return new JuiceChallenge({
            topicId: data.topicId,
            topicCode: data.topicCode,
            sectionCode: data.sectionCode,
            context: data.context,
            toRemember: data.juice.map(item => ({
                toRemember: item.toRemember,
                date: item.date ? {
                    day: item.date.day,
                    month: item.date.month,
                    year: item.date.year
                } : null
            })), 
            tests: data.dateTests.map(item => new DateTest({
                testId: uuidv4(),
                question: item.question,
                correctAnswer: item.correctDate,
            })),
        });
    }
}