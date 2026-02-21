import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { TotoControllerConfig, TotoRuntimeError } from "totoms";
import { TotoFileStorage } from "./TotoFileStorage";

/**
 * AWS S3 implementation of TotoFileStorage
 */
export class S3TotoFileStorage extends TotoFileStorage {

    private s3Client: S3Client;

    constructor(config: TotoControllerConfig) {
        super(config);
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'eu-west-1'
        });
    }

    /**
     * Retrieves the content of a file from S3.
     * 
     * @param bucketName the name of the bucket
     * @param filePath the filepath
     * @returns the file content as a string
     */
    async getFileContent(bucketName: string, filePath: string): Promise<string> {
        
        try {
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: filePath
            });

            const response = await this.s3Client.send(command);
            
            if (!response.Body) {
                throw new TotoRuntimeError(500, 'Empty response body from S3');
            }

            const bodyContents = await response.Body.transformToString('utf-8');
            
            return bodyContents;
        } catch (error) {
            throw new TotoRuntimeError(500, `Failed to retrieve file from S3 bucket ${bucketName} at path ${filePath}: ${error}`);
        }
    }

        /**
     * Retrieves a list of files from a specified folder in storage.
     * 
     * @param bucketName the name of the bucket
     * @param folderPath the path of the folder from which to list files
     * 
     * @returns a list of file paths
     */
    async listFiles(bucketName: string, folderPath: string): Promise<string[]> {

        try {
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: folderPath
            });

            const response = await this.s3Client.send(command);
            
            if (!response.Contents) {
                return [];
            }

            return response.Contents.filter(item => item.Key !== undefined).map(item => item.Key!);

        } catch (error) {
            throw new TotoRuntimeError(500, `Failed to list files from S3 bucket ${bucketName} with prefix ${folderPath}: ${error}`);
        }
    }
}
