import { TomeTest } from "./tests/TomeTest";
import { TomeChallenge } from "./TomeChallenge";

export class JuiceChallenge extends TomeChallenge {

    public type: string = "juice";
    public context: string;
    public topicId: string;
    public topicCode: string;
    public sectionIndex: number;
    public sectionCode: string; 

    public toRemember: ToRemember[];
    public tests: TomeTest[];

    constructor({ topicId, topicCode, sectionIndex, sectionCode, context, toRemember, tests }: { topicId: string, topicCode: string, sectionIndex: number, sectionCode: string, context: string, toRemember: ToRemember[], tests: TomeTest[] }) {
        super();
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.sectionIndex = sectionIndex;
        this.sectionCode = sectionCode;
        this.context = context;
        this.toRemember = toRemember;
        this.tests = tests;
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