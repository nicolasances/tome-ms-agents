import { TotoAPI, TotoAPIRequest } from "toto-api-controller";
import { GeoArea } from "../model/TopicGeographicalLocationSchema";

export class TomeTopicsAPI extends TotoAPI {

    /**
     * Retrieves a topic by its id
     * @param topicId the id of the topic
     * @param cid cid
     * @returns the topic response
     */
    async getTopic(topicId: string, cid?: string): Promise<GetTopicResponse> {
        return this.get(new TotoAPIRequest(`/topics/${topicId}`, null, cid), GetTopicResponse);
    }

    /**
     * Updates the topic metadata
     * @param topicId 
     * @param metadata 
     * @param cid 
     * @returns 
     */
    async updateTopicMetadata(topicId: string, metadata: TopicMetadata, cid?: string): Promise<UpdateTopicMetadataResponse> {
        return this.put(new TotoAPIRequest(`/topics/${topicId}`, metadata, cid), UpdateTopicMetadataResponse);
    }

}

class GetTopicResponse {

    id: string = "";
    name: string = "";
    topicCode: string = ""; 
    sections: string[] = [];

    static fromParsedHTTPResponseBody(body: any): GetTopicResponse {
        const response = new GetTopicResponse();
        response.id = body.id;
        response.name = body.name;
        response.topicCode = body.topicCode;
        response.sections = body.sections;
        return response;
    }
}

class UpdateTopicMetadataResponse {

    modifiedTopics: number;

    constructor(modifiedTopics: number) {
        this.modifiedTopics = modifiedTopics;
    }
    
    static fromParsedHTTPResponseBody(body: any): UpdateTopicMetadataResponse {

        return new UpdateTopicMetadataResponse(body.result);
    }
}

export interface TopicMetadata {
    geoArea?: {
        mainArea: GeoArea;
        allAreas: GeoArea[];
    },
    timePeriod?: TimePeriodMetadata;
}
export interface TimePeriodMetadata {
    startYear: number;
    endYear: number;
}