import { z } from "genkit";

export const GeographicAreas = ["Europe", "North America", "South America", "Africa", "Middle East", "Russia", "Asia", "Oceania", "Polar"] as const;

export type GeoArea = typeof GeographicAreas[number];

export const TopicGeographicalLocation = z.object({
    zone: z.enum(GeographicAreas).describe("The geographical zone or location relevant to the Topic."),
})