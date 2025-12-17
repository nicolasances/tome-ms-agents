import { TomeTest } from "./TomeTest";

export class OpenQuestionTest extends TomeTest {

    type: string = "open";
    testId: string;
    question: string; 
    correctAnswer?: string;

    constructor({ testId, question }: { testId: string; question: string; }) {
        super();
        this.testId = testId;
        this.question = question;
    }
}