import { TotoControllerConfig } from "toto-api-controller";
import { TotoFileStorage } from "../totofs/TotoFileStorage";
import { TotoFileStorageFactory } from "../totofs/TotoFileStorageFactory";

export class TomeKnowledgeBase {

    totoStorage: TotoFileStorage;
    bucketName: string;

    constructor(private config: TotoControllerConfig) {

        this.totoStorage = TotoFileStorageFactory.create(config);

        switch (config.hyperscaler) {
            case 'gcp':
                this.bucketName = `${process.env['GCP_PID']}-tome-bucket`;
                break;

            case 'aws':
                this.bucketName = `toto-tome-bucket-${config.env}`;
                break;

            default:
                this.bucketName = config.options?.defaultHyperscaler === 'aws' ? `toto-tome-bucket-${config.env}` : `${process.env['GCP_PID']}-tome-bucket`;
                break;
        }

    }

    async getSectionContent(topicCode: string, sectionCode: string, sectionIndex: number): Promise<string> {

        return this.totoStorage.getFileContent(this.bucketName, `kb/${topicCode}/${sectionIndex}-${sectionCode}.txt`);

    }
}