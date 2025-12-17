import { TomeTest } from "./TomeTest";

export class FreeTextTest extends TomeTest {

    type: string = "freeText";
    testId: string;
    question: string; 
    correctAnswer: string;

    constructor({ testId, question, correctAnswer }: { testId: string; question: string; correctAnswer: string; }) {
        super();
        this.testId = testId;
        this.question = question;
        this.correctAnswer = correctAnswer;
    }
}