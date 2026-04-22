import {type DBConnector} from "./config.js";
import {type Config} from "../config.js";

/**
 * Feedback types representing structured response objects returned by database operations to indicate success or specific error reasons.
 */
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

/**
 * Data access layer that provides methods for user management and secret handling.
 * Requires an instance of DBConnector (holding the connection pool) and a Config object for table mapping.
 */
export class DBAdapter {
    connection: DBConnector;
    config: Config;

    /**
     * Initializes the adapter with a database connection pool and global configuration.
     */
    constructor(DBConnection: DBConnector, GlobalConfig: Config) {
        this.connection = DBConnection;
        this.config = GlobalConfig
    }



    /**
     * Checks if a specific username already exists in the database.
     */
    async doesUserExist(username: string): Promise<boolean> {
        const queryResult = await this.connection.pool.query(
            `SELECT username FROM ${this.config.db.tables.users} WHERE username = $1`,
            [username]
        );
        return queryResult.rows.length !== 0;
    }

    /**
     * Retrieves the unique identifier for a given username.
     */
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

    /**
     * Attempts to register a new user; fails if the password is empty or the username is taken.
     */
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

    /**
     * Validates user credentials by matching the username and password in the database.
     */
    async verifyUserPassword(username: string, password: string): Promise<boolean> {
        const queryResult = await this.connection.pool.query(
            `SELECT NULL FROM ${this.config.db.tables.users}
             WHERE username = $1 AND password = $2`,
            [username, password]
        );
        return queryResult.rows.length !== 0;
    }

    /**
     * Fetches the protected secret string for a user after verifying their credentials.
     */
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

    /**
     * Updates the secret string for a user, provided the credentials are valid.
     */
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