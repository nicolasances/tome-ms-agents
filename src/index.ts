import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { HelloWorldAgent } from "./agents/test/HelloWorldAgent";
import { Gale } from "./gale/Gale";
import { SubtaskAgent } from "./agents/test/SubtaskAgent";

const api = new TotoAPIController("tome-ms-agents", new ControllerConfig(), { basePath: '/tomeagents' });

const gale = new Gale(
    {
        baseURL: process.env.SERVICE_BASE_URL!,
        galeBrokerURL: `${String(process.env.GALE_BROKER_URL)}/galebroker`
        // baseURL: "http://localhost:8080",
        // galeBrokerURL: "http://localhost:8081/galebroker"
    },
    { totoApiController: api }
);

gale.registerAgent(new HelloWorldAgent());
gale.registerAgent(new SubtaskAgent());

api.init().then(() => {
    api.listen()
});