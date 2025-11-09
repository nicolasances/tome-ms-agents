import { MongoClient } from 'mongodb';
import { TotoControllerConfig, ValidatorProps, Logger, SecretsManager, ConfigurationData } from "toto-api-controller";

const dbName = 'mydb';
const collections = {
    coll1: 'coll1',
};

export class ControllerConfig extends TotoControllerConfig {

    logger: Logger | undefined;

    mongoUser: string | undefined;
    mongoPwd: string | undefined;
    galeBrokerURL: string;

    constructor(configuration: ConfigurationData, galeBrokerUrl?: string) {
        super(configuration);
        
        this.galeBrokerURL = galeBrokerUrl || String(process.env.GALE_BROKER_URL);
    }

    async load(): Promise<any> {

        const promises = [];

        promises.push(super.load());

        // Other possible secrets to load:
        // mongo-host
        // mongo-user
        // mongo-pswd
        
        await Promise.all(promises);

    }

    getProps(): ValidatorProps {

        return {
        }
    }

    async getMongoClient() {

        const mongoUrl = `mongodb://${this.mongoUser}:${this.mongoPwd}@${this.mongoHost}:27017`

        return await new MongoClient(mongoUrl).connect();
    }
    
    getDBName() { return dbName }
    getCollections() { return collections }

}
