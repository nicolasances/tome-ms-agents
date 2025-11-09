import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { HelloWorldAgent } from "./agents/test/HelloWorldAgent";
import { Gale } from "./gale/Gale";
import { SubtaskAgent } from "./agents/test/SubtaskAgent";
import { OnTopicEventHandler } from "./evt/OnTopicEvent";
import { DevQImpl } from "./DevQImpl";
import { PracticeBuilderAgent } from "./agents/practice/PracticeBuilderAgent";

const galeBrokerURL = `${String(process.env.GALE_BROKER_URL)}`;
// const galeBrokerURL = "http://localhost:8081/galebroker";

const config = new ControllerConfig({ apiName: "tome-ms-agents" }, galeBrokerURL);

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

gale.registerAgent(new HelloWorldAgent());
gale.registerAgent(new SubtaskAgent());
gale.registerAgent(new PracticeBuilderAgent());

api.registerPubSubEventHandler('topic', new OnTopicEventHandler())

api.init().then(() => {
    api.listen()
});