import { TotoAPI, TotoAPIRequest } from "toto-api-controller";

export class TomeTopicsAPI extends TotoAPI {

    /**
     * Retrieves a topic by its id
     * @param topicId the id of the topic
     * @param cid cid
     * @returns the topic response
     */
    async getTopic(topicId: string, cid?: string): Promise<GetTopicResponse> {
        return this.get(new TotoAPIRequest(`/topics/${topicId}`, cid), GetTopicResponse);
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