import { TotoControllerConfig } from "totoms";


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

    /**
     * Retrieves a list of files from a specified folder in storage.
     * 
     * @param bucketName the name of the bucket
     * @param folderPath the path of the folder from which to list files
     * 
     * @returns a list of file paths
     */
    abstract listFiles(bucketName: string, folderPath: string): Promise<string[]>;

}