import { z } from "genkit";
import { JuiceChallenge } from "./model/JuiceChallenge";
import { JuiceChallengeAgent } from "../../agents/practice/challenges/JuiceChallenceAgent";
import { DateTest } from "./model/tests/DateTest";
import { v4 as uuidv4 } from "uuid";
import { OpenQuestionTest } from "./model/tests/OpenQuestionTest";
import { TomeTest } from "./model/tests/TomeTest";

export class ChallengeFactory {

    static juiceChallenge(data: z.infer<typeof JuiceChallengeAgent.outputSchema>): JuiceChallenge {

        // Create the tests: 
        const tests: TomeTest[] = data.dateTests.map(item => new DateTest({
            testId: uuidv4(),
            question: item.question,
            correctAnswer: item.correctDate,
        }));

        tests.push(new OpenQuestionTest({
            testId: uuidv4(),
            question: data.juiceQuestion.question
        }));

        console.log(tests);
        

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
            tests: tests,
        });
    }
}