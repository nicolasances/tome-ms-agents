import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { Gale } from "./gale/Gale";
import { OnTopicEventHandler } from "./evt/OnTopicEvent";
import { DevQImpl } from "./DevQImpl";
import { PracticeBuilderOrchestratorAgent } from "./agents/practice/PracticeBuilderOrchestratorAgent";
import { SectionClassificationAgent } from "./agents/practice/SectionClassificationAgent";
import { SectionGenealogyAgent } from "./agents/practice/SectionGenealogyAgent";

const galeBrokerURL = `${String(process.env.GALE_BROKER_URL)}`;

const config = new ControllerConfig({ apiName: "tome-ms-agents" }, galeBrokerURL, {defaultHyperscaler: "aws", defaultSecretsManagerLocation: "aws"});

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
gale.registerAgent(new SectionGenealogyAgent());

api.registerPubSubEventHandler('topic', new OnTopicEventHandler())

api.init().then(() => {
    api.listen()
});