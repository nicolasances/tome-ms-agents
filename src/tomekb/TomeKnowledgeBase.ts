import { TotoControllerConfig, TotoRuntimeError } from "totoms";
import { ControllerConfig } from "../Config";
import { TotoFileStorage } from "../totofs/TotoFileStorage";
import { TotoFileStorageFactory } from "../totofs/TotoFileStorageFactory";

export class TomeKnowledgeBase {

    totoStorage: TotoFileStorage;
    bucketName: string;

    constructor(private config: TotoControllerConfig) {

        this.totoStorage = TotoFileStorageFactory.create(config);

        const controllerConfig = config as ControllerConfig;

        switch (controllerConfig.hyperscaler) {
            case 'gcp':
                this.bucketName = `${process.env['GCP_PID']}-tome-bucket`;
                break;

            case 'aws':
                this.bucketName = `toto-tome-bucket-${controllerConfig.env}`;
                break;

            default:
                this.bucketName = `${process.env['GCP_PID']}-tome-bucket`;
                break;
        }

    }

    async getSectionContent(topicCode: string, sectionCode: string, sectionIndex: number): Promise<string> {

        return this.totoStorage.getFileContent(this.bucketName, `kb/${topicCode}/${sectionIndex}-${sectionCode}.txt`);

    }

    /**
     * Finds and returns the content of the section at the given index for the specified topic.
     * 
     * This obviously assumes that sections are stored with the form `kb/${topicCode}/${sectionIndex}-${sectionCode}.txt`.
     * 
     * @param topicCode the code of the topic
     * @param sectionIndex the index of the section to retrieve
     */
    async getSectionAtIndex(topicCode: string, sectionIndex: number): Promise<string | null> {

        // 1. List files in the topic folder
        const files = await this.totoStorage.listFiles(this.bucketName, `kb/${topicCode}/`);

        // 2. Find the file that starts with the section index
        const sectionFile = files.find(f => {
            
            const fileName = f.split('/').pop() || '';

            return fileName.startsWith(`${sectionIndex}-`);
        });

        if (!sectionFile) return null;

        // 3. Retrieve and return the content of the section file
        return this.totoStorage.getFileContent(this.bucketName, sectionFile);

    }
}