import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { Gale } from "./gale/Gale";
import { OnTopicEventHandler } from "./evt/OnTopicEvent";
import { DevQImpl } from "./DevQImpl";
import { PracticeBuilderAgent } from "./agents/practice/PracticeBuilderAgent";
import { SectionClassificationAgent } from "./agents/practice/SectionClassificationAgent";

const galeBrokerURL = `${String(process.env.GALE_BROKER_URL)}`;
// const galeBrokerURL = "http://localhost:8081/galebroker";
// const galeBrokerURL = "https://api.dev.toto.nimoto.eu/galebroker";

const config = new ControllerConfig({ apiName: "tome-ms-agents" }, galeBrokerURL, {defaultHyperscaler: "aws", defaultSecretsManagerLocation: "aws"});

const api = new TotoAPIController(config, { basePath: '/tomeagents' });
api.registerPubSubImplementation(new DevQImpl(config, config.logger!));

const gale = new Gale(
    {
        baseURL: process.env.SERVICE_BASE_URL!,
        // baseURL: "http://localhost:8080",
        galeBrokerURL: galeBrokerURL
    },
    { totoApiController: api }
);

gale.registerAgent(new PracticeBuilderAgent());
gale.registerAgent(new SectionClassificationAgent());

api.registerPubSubEventHandler('topic', new OnTopicEventHandler())

api.init().then(() => {
    api.listen()
});