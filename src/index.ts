import { TotoAPIController, TotoMessageBus, SecretsManager, TotoEnvironment, Logger, getHyperscalerConfiguration } from "totoms";
import { ControllerConfig } from "./Config";
import { Gale } from "./gale/Gale";
import { OnTopicEventHandler } from "./evt/OnTopicEvent";
import { SectionClassificationAgent } from "./agents/practice/SectionClassificationAgent";
import { SectionTimelineAgent } from "./agents/practice/SectionTimelineAgent";
import { PracticeBuilderOrchestratorAgent } from "./orchestrators/PracticeBuilderOrchestrator";
import { SectionJuiceAgent } from "./agents/practice/SectionJuiceAgent";
import { SectionContextAgent } from "./agents/practice/SectionContextAgent";
import { JuiceChallengeAgent } from "./agents/practice/challenges/JuiceChallenceAgent";
import { JuiceAnswerEvalAgent } from "./agents/practice/tests/JuiceAnswerEvalAgent";
import { TopicGeographyAgent } from "./agents/practice/TopicGeographyAgent";

const galeBrokerURL = `${String(process.env.GALE_BROKER_URL)}`;

const environment: TotoEnvironment = {
    hyperscaler: (process.env.HYPERSCALER as any) || "aws",
    hyperscalerConfiguration: getHyperscalerConfiguration()
};

Logger.init("tome-ms-agents");

const secretsManager = new SecretsManager(environment);
const config = new ControllerConfig(secretsManager, environment, galeBrokerURL);

config.load().then(async () => {

    const api = new TotoAPIController(
        { apiName: "tome-ms-agents", environment: environment, config: config },
        { basePath: '/tomeagents' }
    );

    const messageBus = new TotoMessageBus({
        controller: api,
        customConfig: config,
        environment: environment,
        topics: []
    });

    messageBus.registerMessageHandler(new OnTopicEventHandler(config, messageBus));

    const gale = new Gale(
        {
            baseURL: process.env.SERVICE_BASE_URL!,
            galeBrokerURL: galeBrokerURL
        },
        { totoApiController: api, messageBus: messageBus, controllerConfig: config }
    );

    await gale.registerAgent(new PracticeBuilderOrchestratorAgent());
    await gale.registerAgent(new SectionClassificationAgent());
    await gale.registerAgent(new SectionTimelineAgent());
    await gale.registerAgent(new SectionJuiceAgent());
    await gale.registerAgent(new SectionContextAgent());
    await gale.registerAgent(new JuiceChallengeAgent());
    await gale.registerAgent(new JuiceAnswerEvalAgent());
    await gale.registerAgent(new TopicGeographyAgent());

    await api.init();
    api.listen();
});