import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { HelloWorldAgent } from "./agents/test/HelloWorldAgent";

const api = new TotoAPIController("tome-ms-agents", new ControllerConfig(), { basePath: '/tomeagents' });

api.path('POST', '/agents/helloworld/tasks', new HelloWorldAgent());

api.init().then(() => {
    api.listen()
});