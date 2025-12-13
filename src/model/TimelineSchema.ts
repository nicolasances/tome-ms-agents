import { z } from "genkit";

export const TimelineElementSchema = z.object({
    year: z.number().optional().describe("Year of the timeline event as an integer."),
    month: z.number().optional().describe("Month of the timeline event as an integer (1-12)."),
    day: z.number().optional().describe("Day of the month of the timeline event as an integer (1-31)."),
    description: z.string().describe("Description of the timeline event."),
});

export const TimelineSchema = z.array(TimelineElementSchema).describe("List of timeline events in chronological order extracted from the section content.");
