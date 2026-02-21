import { TotoControllerConfig, SecretsManager, APIOptions, TotoEnvironment, AWSConfiguration } from "totoms";

const dbName = 'mydb';
const collections = {
    coll1: 'coll1',
};

export const API_DEPENDENCIES = {
    tomeTopics: "tome-ms-topics",
    tomeChallenges: "tome-ms-challenges", 
}

export class ControllerConfig extends TotoControllerConfig {

    galeBrokerURL: string;
    environment: TotoEnvironment;

    constructor(secretsManager: SecretsManager, environment: TotoEnvironment, galeBrokerUrl?: string) {
        super(secretsManager);

        this.environment = environment;
        this.galeBrokerURL = galeBrokerUrl || String(process.env.GALE_BROKER_URL);
    }

    async load(): Promise<any> {
        await super.load();
    }

    getMongoSecretNames(): { userSecretName: string; pwdSecretName: string } | null {
        return null;
    }

    getProps(): APIOptions {
        return {};
    }

    get hyperscaler(): TotoEnvironment['hyperscaler'] {
        return this.environment.hyperscaler;
    }

    get env(): string {
        if (this.environment.hyperscaler === 'aws') {
            return (this.environment.hyperscalerConfiguration as AWSConfiguration).environment;
        }
        return 'dev';
    }
    
    getDBName() { return dbName }
    getCollections() { return collections }

}
