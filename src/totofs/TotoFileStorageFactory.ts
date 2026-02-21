import { TotoControllerConfig, TotoRuntimeError } from "totoms";
import { ControllerConfig } from "../Config";
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
        
        const controllerConfig = config as ControllerConfig;

        switch (controllerConfig.hyperscaler) {
            case 'gcp':
                return new GCSTotoFileStorage(config);
            case 'aws':
                return new S3TotoFileStorage(config);
            default:
                throw new TotoRuntimeError(500, `Unsupported hyperscaler: ${controllerConfig.hyperscaler}`);
        }
    }
}
