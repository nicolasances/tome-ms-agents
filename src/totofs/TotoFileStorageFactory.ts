import { TotoControllerConfig, TotoRuntimeError } from "toto-api-controller";
import { GCSTotoFileStorage } from "./GCSTotoFileStorage";
import { S3TotoFileStorage } from "./S3TotoFileStorage";
import { TotoFileStorage } from "./TotoFileStorage";

/**
 * Factory class to create the appropriate TotoFileStorage implementation
 * based on the hyperscaler configuration.
 */
export class TotoFileStorageFactory {

    /**
     * Creates and returns the appropriate TotoFileStorage implementation
     * based on the hyperscaler defined in the TotoControllerConfig.
     * 
     * @param config the TotoControllerConfig instance
     * @returns a TotoFileStorage implementation (GCS or S3)
     * @throws Error if the hyperscaler is not supported
     */
    static create(config: TotoControllerConfig): TotoFileStorage {
        
        switch (config.hyperscaler) {
            case 'gcp':
                return new GCSTotoFileStorage(config);
            case 'aws':
                return new S3TotoFileStorage(config);
            case 'local':
                // For local development, default to GCS, unless specified otherwise in the config
                if (config.options?.defaultHyperscaler === 'aws') return new S3TotoFileStorage(config);
                return new GCSTotoFileStorage(config);
            default:
                throw new TotoRuntimeError(500, `Unsupported hyperscaler: ${config.hyperscaler}`);
        }
    }
}
