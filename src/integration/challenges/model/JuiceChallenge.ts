import { ValidationError } from "toto-api-controller";
import { TomeChallenge } from "./TomeChallenge";

export class JuiceChallenge extends TomeChallenge {

    public type: string = "juice";
    public context: string;
    public topicId: string;
    public topicCode: string;

    public toRemember: ToRemember[];

    constructor({ topicId, topicCode, context, toRemember }: { topicId: string, topicCode: string, context: string, toRemember: ToRemember[] }) {
        super();
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.context = context;
        this.toRemember = toRemember;
    }

}

interface ToRemember {
    toRemember: string;
    date?: SplitDate | null;
}

interface SplitDate {
    day: number | null;
    month: number | null;
    year: number | null;
}