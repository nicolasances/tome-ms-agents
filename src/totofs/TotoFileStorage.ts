import { TotoControllerConfig } from "toto-api-controller";


export abstract class TotoFileStorage {

    constructor(protected config: TotoControllerConfig) { }

    /**
     * Retrieves the content of a file from storage.
     * 
     * @param bucketName the name of the bucket
     * @param filePath the filepath
     * @returns 
     */
    abstract getFileContent(bucketName: string, filePath: string): Promise<string>;

}