import { Storage } from "@google-cloud/storage";
import { TotoControllerConfig, TotoRuntimeError } from "toto-api-controller";
import { TotoFileStorage } from "./TotoFileStorage";

/**
 * Google Cloud Storage implementation of TotoFileStorage
 */
export class GCSTotoFileStorage extends TotoFileStorage {

    private storage: Storage;

    constructor(config: TotoControllerConfig) {
        super(config);
        this.storage = new Storage();
    }

    /**
     * Retrieves the content of a file from GCS.
     * 
     * @param bucketName the name of the bucket
     * @param filePath the filepath
     * @returns the file content as a string
     */
    async getFileContent(bucketName: string, filePath: string): Promise<string> {
        
        try {
            const bucket = this.storage.bucket(bucketName);
            const file = bucket.file(filePath);
            
            const [contents] = await file.download();
            
            return contents.toString('utf-8');
            
        } catch (error) {
            throw new TotoRuntimeError(500, `Failed to retrieve file from GCS bucket ${bucketName} at path ${filePath}: ${error}`);
        }
    }
}
