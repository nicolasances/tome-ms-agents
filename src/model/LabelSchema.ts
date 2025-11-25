import { z } from "genkit";

export const LabelSchema = z.string().describe("A label assigned to a section, representing its content or purpose within the topic.");