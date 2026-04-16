import {Pool} from "pg"
import GLOBAL_CONFIG from "../config.js";

export const pool = new Pool({
    host: GLOBAL_CONFIG.db.host,
    port: GLOBAL_CONFIG.db.port,
    user: GLOBAL_CONFIG.db.user,
    database: GLOBAL_CONFIG.db.name,
    password: GLOBAL_CONFIG.db.password,
    max: 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000
})

async function verifyConnection(errorHandler: Function = (err: Error) => {
    throw err
}): Promise<void> {
    try {
        const client = await pool.connect();
        console.log("Connected to db");
        client.release();
    } catch (err) {
        errorHandler(err);
    }



}


await verifyConnection()

export default { pool }
