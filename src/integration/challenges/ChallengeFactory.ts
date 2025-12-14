import { z } from "genkit";
import { SectionContextAgent } from "../../agents/practice/SectionContextAgent";
import { JuiceChallenge } from "./model/JuiceChallenge";

export class ChallengeFactory {

    static juiceChallenge(data: z.infer<typeof SectionContextAgent.outputSchema>): JuiceChallenge {

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
            }))
        });
    }
}