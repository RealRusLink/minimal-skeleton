import {Pool} from "pg"
import {type Config} from "../config.js";


export class DBConnector {
    pool: Pool;
    constructor(GLOBAL_CONFIG: Config) {
        this.pool = new Pool({
            host: GLOBAL_CONFIG.db.host,
            port: GLOBAL_CONFIG.db.port,
            user: GLOBAL_CONFIG.db.user,
            database: GLOBAL_CONFIG.db.name,
            password: GLOBAL_CONFIG.db.password,
            max: 10,
            connectionTimeoutMillis: 3000,
            idleTimeoutMillis: 30000
        })
    }

    async verifyConnection(errorHandler: Function = (err: Error) => {
        throw err
    }): Promise<void> {
        try {
            const client = await this.pool.connect();
            client.release();
        } catch (err) {
            errorHandler(err);
        }
    }
}


export default { dbConnection: DBConnector }
