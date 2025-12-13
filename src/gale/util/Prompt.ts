import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars, { template } from 'handlebars';
import { GaleAgentManifest } from '../GaleAgent';

/**
 * This class wraps a prompt template for agents. 
 * 
 * It supports 
 * - defining prompt files in the root/prompts folder and loading them 
 * - rendering templates using Handlebars syntax ({{paramName}})
 */
export class Prompt {

    /**
     * Loads the named prompt template from the prompts folder and fills it with the provided input.
     * 
     * @param promptName name of the prompt. The file is expected to be located at root/prompts/{promptName}.prompt
     * @param input object containing the parameters to inject into the template
     * @returns the rendered prompt with all parameters replaced
     */
    static async namedPrompt(promptName: string, input: any, options?: Options): Promise<string> {

        // 1. Load the prompt template 
        let templateContent = "";

        if (options?.promptTemplateOverride) templateContent = options.promptTemplateOverride;
        else {
            const promptPath = path.join(process.cwd(), 'prompts', `${promptName}.prompt`);
            templateContent = await fs.readFile(promptPath, 'utf-8');
        }

        // 2. Fill the template using Handlebars
        const compiled = Handlebars.compile(templateContent);
        const rendered = compiled(input);

        // 3. Returns the filled prompt
        return rendered;
    }

    /**
     * Renders a prompt template string with the provided parameters using Handlebars.
     * 
     * @param template the prompt template string with Handlebars syntax ({{paramName}})
     * @param input object containing the parameters to inject into the template
     * @returns the rendered prompt with all parameters replaced
     */
    static render(template: string, input: any): string {
        const compiled = Handlebars.compile(template);
        return compiled(input);
    }

    /**
     * Retrieves the prompt template associated with the given agent manifest.
     * 
     * @param manifest the agent manifest containing the taskId
     * @returns the prompt template string
     */
    static async getPromptTemplate(manifest: GaleAgentManifest): Promise<string | null> {

        const promptPath = path.join(process.cwd(), 'prompts', `${manifest.taskId}.prompt`);
        
        try {

            const templateContent = await fs.readFile(promptPath, 'utf-8');

            return templateContent;

        } catch (error) {
            return null;
        }
    }

}

export interface Options {
    promptTemplateOverride?: string;
}