import { RegistryCache, TotoAPI, TotoAPIRequest } from "toto-api-controller";
import { TomeChallenge } from "./model/TomeChallenge";

export class TomeChallengesAPI extends TotoAPI {

    async saveChallenge(challenge: TomeChallenge, cid: string): Promise<SaveChallengeResponse> {
        return this.post(new TotoAPIRequest('/challenges', challenge, cid), SaveChallengeResponse)
    }

}

class SaveChallengeResponse {
    static fromParsedHTTPResponseBody(body: any): SaveChallengeResponse {
        return new SaveChallengeResponse();
    }
}