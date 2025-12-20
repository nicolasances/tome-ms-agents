import { z } from "genkit";

export const JuiceSchema = z.object({
    toRemember: z.string().describe("An important aspect, fact, event to remember."),
    date: z.object({
        year: z.number().nullable().describe("Year of the timeline event as an integer."),
        month: z.number().nullable().describe("Month of the timeline event as an integer (1-12)."),
        day: z.number().nullable().describe("Day of the month of the timeline event as an integer (1-31)."),
    }).optional().nullable().describe("Date associated with the event, aspect or fact to remember, if any date is available for this event in the text."),
})