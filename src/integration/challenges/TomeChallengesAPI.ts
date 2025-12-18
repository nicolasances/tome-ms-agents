import { TotoAPI, TotoAPIRequest } from "toto-api-controller";
import { TomeChallenge } from "./model/TomeChallenge";

export class TomeChallengesAPI extends TotoAPI {

    async saveChallenge(challenge: TomeChallenge, cid: string): Promise<SaveChallengeResponse> {
        return this.post(new TotoAPIRequest('/challenges', challenge, cid), SaveChallengeResponse)
    }

}

class SaveChallengeResponse {

    constructor(public body: any) {}

    static fromParsedHTTPResponseBody(body: any): SaveChallengeResponse {
        return new SaveChallengeResponse(body);
    }
}