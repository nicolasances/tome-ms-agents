import { z } from "genkit";

export const DateTestSchema = z.object({
    question: z.string().describe("The question asking for a specific date."),
    correctDate: z.object({
        day: z.number().nullable().describe("The correct day of the date, or null if not specified."),
        month: z.number().nullable().describe("The correct month of the date, or null if not specified."),
        year: z.number().nullable().describe("The correct year of the date, or null if not specified."),
    }).describe("The correct date split into day, month, and year, where available."),
});

export const FreeTextTestSchema = z.object({
    question: z.string().describe("The question asking for a free text answer."),
});
