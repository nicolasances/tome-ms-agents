import { Request } from "express";
import { APubSubImplementation, APubSubRequestValidator, TotoMessage } from "toto-api-controller";
import { APubSubRequestFilter } from "toto-api-controller/dist/evt/PubSubImplementation";

export class DevQImpl extends APubSubImplementation {

    getRequestValidator(): APubSubRequestValidator {
        return new DevQRequestValidator(this.config, this.logger);
    }
    convertMessage(req: Request): TotoMessage {
    
        const msg = req.body || {};

        return {
            timestamp: msg.timestamp, 
            cid: msg.cid,
            id: msg.id,
            type: msg.type,
            msg: msg.msg,
            data: msg.data
        }
    }

    filter(req: Request): APubSubRequestFilter | null {
        return null;
    }

}

export class DevQRequestValidator extends APubSubRequestValidator {

    isRequestAuthorized(req: Request): Promise<boolean> {
        return Promise.resolve(true);
    }
    isRequestRecognized(req: Request): boolean {
        return true;
    }
}