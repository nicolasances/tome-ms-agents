import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { Gale } from "./gale/Gale";
import { OnTopicEventHandler } from "./evt/OnTopicEvent";
import { DevQImpl } from "./DevQImpl";
import { SectionClassificationAgent } from "./agents/practice/SectionClassificationAgent";
import { SectionTimelineAgent } from "./agents/practice/SectionTimelineAgent";
import { PracticeBuilderOrchestratorAgent } from "./orchestrators/PracticeBuilderOrchestrator";
import { SectionJuiceAgent } from "./agents/practice/SectionJuiceAgent";
import { SectionContextAgent } from "./agents/practice/SectionContextAgent";
import { JuiceChallengeAgent } from "./agents/practice/challenges/JuiceChallenceAgent";
import { JuiceAnswerEvalAgent } from "./agents/practice/tests/JuiceAnswerEvalAgent";
import { TopicGeographyAgent } from "./agents/practice/TopicGeographyAgent";

const galeBrokerURL = `${String(process.env.GALE_BROKER_URL)}`;

const config = new ControllerConfig({ apiName: "tome-ms-agents" }, galeBrokerURL, { defaultHyperscaler: "aws", defaultSecretsManagerLocation: "aws" });

const api = new TotoAPIController(config, { basePath: '/tomeagents' });
api.registerPubSubImplementation(new DevQImpl(config, config.logger!));

const gale = new Gale(
    {
        baseURL: process.env.SERVICE_BASE_URL!,
        galeBrokerURL: galeBrokerURL
    },
    { totoApiController: api }
);

gale.registerAgent(new PracticeBuilderOrchestratorAgent());
gale.registerAgent(new SectionClassificationAgent());
gale.registerAgent(new SectionTimelineAgent());
gale.registerAgent(new SectionJuiceAgent());
gale.registerAgent(new SectionContextAgent());
gale.registerAgent(new JuiceChallengeAgent());
gale.registerAgent(new JuiceAnswerEvalAgent());
gale.registerAgent(new TopicGeographyAgent());

api.registerPubSubEventHandler('topic', new OnTopicEventHandler())

api.init().then(() => {
    api.listen()
});