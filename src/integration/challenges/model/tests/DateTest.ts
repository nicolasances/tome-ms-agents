import { TomeTest } from "./TomeTest";

export class DateTest extends TomeTest {

    type: string = "date";
    testId: string;
    question: string; 
    correctAnswer: {
        day?: number | null;
        month?: number | null;
        year?: number | null;
    }

    constructor({ testId, question, correctAnswer }: { testId: string; question: string; correctAnswer: { day?: number | null; month?: number | null; year?: number | null; } }) {
        super();
        this.testId = testId;
        this.question = question;
        this.correctAnswer = correctAnswer;
    }

}