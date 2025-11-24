import { z } from "genkit";

export const PersonalitySchema = z.object({
    name: z.string().describe("Name of the personality. It can be any of its first name, last name, full name, title, nickname, etc. E.g. 'Pippin', 'Pippin the Short', 'King Pippin of the Franks'. It will ALWAYS have to be a name of a person."),
    description: z.string().describe("A brief description of who the personality is. This description should help to univoquely identify the personality in history. E.g. 'Pippin the Short, King of the Franks from 751 to 768'"),
});