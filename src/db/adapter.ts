import {type DBConnector} from "./config.js";
import {type Config} from "../config.js";

export type getUserIdFeedback =
    | { success: true, id: string }
    | { success: false, reason: "User doesn't exist" };

export type createUserFeedback =
    | { success: true, id: string }
    | { success: false, reason: "User already exists" | "Empty password" };

export type getUserSecretFeedback =
    | { success: true, secret: string }
    | { success: false, reason: "User doesn't exist" | "Wrong password" };

export type writeUserSecretFeedback =
    | { success: true }
    | { success: false, reason: "User doesn't exist" | "Wrong password" };


export class DBAdapter {
    connection: DBConnector;
    config: Config;

    constructor(DBConnection: DBConnector, GlobalConfig: Config) {
        this.connection = DBConnection;
        this.config = GlobalConfig
    }



    async doesUserExist(username: string): Promise<boolean> {
        const queryResult = await this.connection.pool.query(
            `SELECT username FROM ${this.config.db.tables.users} WHERE username = $1`,
            [username]
        );
        return queryResult.rows.length !== 0;
    }

    async getUserId(username: string): Promise<getUserIdFeedback> {
        const queryResult = await this.connection.pool.query(
            `SELECT id FROM ${this.config.db.tables.users} WHERE username = $1`,
            [username]
        );

        if (queryResult.rows.length === 0) {
            return { success: false, reason: "User doesn't exist" };
        }

        return {
            success: true,
            id: queryResult.rows[0].id
        };
    }

    async createUser(username: string, password: string): Promise<createUserFeedback> {
        if (password.length === 0) {
            return { success: false, reason: "Empty password" };
        }

        const queryResult = await this.connection.pool.query(
            `INSERT INTO ${this.config.db.tables.users} (id, username, password)
             VALUES (DEFAULT, $1, $2) 
             ON CONFLICT (username) DO NOTHING    
             RETURNING id`,
            [username, password]
        );

        if (queryResult.rows.length === 0) {
            return { success: false, reason: "User already exists" };
        }

        return {
            success: true,
            id: queryResult.rows[0].id
        };
    }

    async verifyUserPassword(username: string, password: string): Promise<boolean> {
        const queryResult = await this.connection.pool.query(
            `SELECT NULL FROM ${this.config.db.tables.users} 
             WHERE username = $1 AND password = $2`,
            [username, password]
        );
        return queryResult.rows.length !== 0;
    }

    async getUserSecret(username: string, password: string): Promise<getUserSecretFeedback> {
        const queryResult = await this.connection.pool.query(
            `SELECT secret, (password = $2) AS "passwordMatch"
             FROM ${this.config.db.tables.users}
             WHERE username = $1`,
            [username, password]
        );

        if (queryResult.rows.length === 0) {
            return { success: false, reason: "User doesn't exist" };
        }
        if (!queryResult.rows[0].passwordMatch) {
            return { success: false, reason: "Wrong password" };
        }

        return { success: true, secret: queryResult.rows[0].secret };
    }

    async writeUserSecret(username: string, password: string, secret: string): Promise<writeUserSecretFeedback> {
        const queryResult = await this.connection.pool.query(
            `UPDATE ${this.config.db.tables.users}
             SET secret = CASE 
                 WHEN password = $3 THEN $1
                 ELSE secret
             END
             WHERE username = $2
             RETURNING username, (password = $3) AS "passwordMatch"`,
            [secret, username, password]
        );

        if (queryResult.rows.length === 0) {
            return { success: false, reason: "User doesn't exist" };
        }
        if (!queryResult.rows[0].passwordMatch) {
            return { success: false, reason: "Wrong password" };
        }

        return { success: true };
    }
}

export default {DBAdapter}

