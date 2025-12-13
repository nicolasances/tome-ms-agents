import { Genkit, genkit, z } from "genkit";
import { amazonNovaLiteV1, amazonNovaProV1, anthropicClaude37SonnetV1, awsBedrock } from "genkitx-aws-bedrock";

const SUPPORTED_MODELS = ["anthropic.claude-3.7-sonnet", "amazon.nova-pro", "amazon.nova-lite"] as const;

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

        try {
            const r = await this.llm.generate({ prompt: prompt.prompt, output: { schema: prompt.outputSchema } });
            return r;
            
        } catch (error) {
            
            // If the errror is an "Schema validation failed" error, we rethrow it as is for the caller to handle it
            if ((error as Error).message.includes("Schema validation failed")) {
                throw new LLMError("llmOutputTypError", (error as Error).message);
            }

            throw error;
        }
    }

    static getSupportedModels(): ModelId[] {
        return [...SUPPORTED_MODELS];
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

export type ModelId = typeof SUPPORTED_MODELS[number];

function getModel(modeId: ModelId, region: string) {

    switch (modeId) {
        case "anthropic.claude-3.7-sonnet":
            return anthropicClaude37SonnetV1(region);
        case "amazon.nova-pro":
            return amazonNovaProV1(region);
        case "amazon.nova-lite":
            return amazonNovaLiteV1;
        default:
            throw new Error(`Unsupported model id: ${modeId}`);
    }
}

export class LLMError extends Error {

    code: LLMErrorCode;

    constructor(code: LLMErrorCode, message: string) {
        super(message);

        this.code = code;
        this.name = "LLMError";

    }

}

export type LLMErrorCode = "llmOutputTypError";