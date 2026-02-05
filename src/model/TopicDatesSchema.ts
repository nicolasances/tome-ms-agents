import { z } from "genkit";

export const TopicDatesSchema = z.object({
    startYear: z.number().nullable().describe("The starting year of the topic's relevance or occurrence, if applicable."),
    endYear: z.number().nullable().describe("The ending year of the topic's relevance or occurrence, if applicable."),
})