import { Genkit, genkit, z } from "genkit";
import { amazonNovaProV1, anthropicClaude37SonnetV1, awsBedrock } from "../../genkit/index";

export class GaleKit {

    constructor(private llm: Genkit) { }

    /**
     * Static method to initialize GaleKit functionalities.
     */
    static gale(config: GaleKitConfig) {

        const llm = genkit({
            plugins: [
                awsBedrock({ region: config.host.region }),
            ],
            model: getModel(config.model, "eu"),
        });

        return new GaleKit(llm);
    }

    /**
     * Generates output based on the provided prompt, calling the underlying LLM service.
     * 
     * @param prompt 
     */
    async generate(prompt: Prompt) {

        return this.llm.generate({ prompt: prompt.prompt, output: { schema: prompt.outputSchema } });
    }

}

export interface Prompt {
    prompt: string;
    outputSchema?: z.ZodTypeAny;
}

export interface GaleKitConfig {
    host: GaleHost;                 // Defines where Gale is running
    model: ModelId;
}

export interface GaleHost {
    region: string;
}

export type ModelId = "anthropic.claude-3.7-sonnet" | "amazon.nova-pro" ;

function getModel(modeId: ModelId, region: string) {

    switch (modeId) {
        case "anthropic.claude-3.7-sonnet":
            return anthropicClaude37SonnetV1(region);
        case "amazon.nova-pro":
            return amazonNovaProV1(region);
        default:
            throw new Error(`Unsupported model id: ${modeId}`);
    }
}