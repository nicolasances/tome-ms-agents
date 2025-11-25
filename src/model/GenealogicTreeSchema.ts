import { z } from "genkit";

export const RelationshipSchema = z.object({
    subject: z.string().describe("The subject of the relationship. E.g. the name of a person."),
    relationship: z.string().describe("The type of relationship between the subject and the object. This CAN ONLY be one of the following: 'child', 'spouse'."),
    object: z.string().describe("The object of the relationship. E.g. the name of another person."),
})

export const GenealogicTreeSchema = z.object({
    treeName: z.string().describe("Name of the genealogical tree (e.g. the family name or a prominent figure in the tree)."),
    root: z.lazy(() => GenealogicTreeNodeSchema),
}).describe("Schema representing a genealogical tree.");

export const GenealogicTreeNodeSchema: z.ZodType<{
    subject: string;
    spouses?: any[];
    children?: any[];
}> = z.lazy(() => z.object({
    subject: z.string().describe("The subject represented by this node of the genealogical tree. This should be the name of a person (first name, or last name, or full name, eventually including titles)."),
    spouses: z.array(GenealogicTreeNodeSchema).optional().describe("List of names of spouses of the subject. This should be the name of a person (first name, or last name, or full name, eventually including titles). E.g. ['Helen', 'Henry II', 'Queen Margaret']"),
    children: z.array(GenealogicTreeNodeSchema).optional().describe("List of names of children of the subject. This should be the name of a person (first name, or last name, or full name, eventually including titles). E.g. ['Alice', 'Prince Henry III', 'Mathilda']"),
}).describe("A node in the genealogical tree representing a subject and their relationships."));