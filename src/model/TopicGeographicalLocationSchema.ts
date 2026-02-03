import { z } from "genkit";

export const TopicGeographicalLocation = z.object({
    zone: z.enum(["Europe", "North America", "South America", "Africa", "Middle East", "Russia", "Asia", "Oceania", "Polar"]).describe("The geographical zone or location relevant to the Topic."),
})