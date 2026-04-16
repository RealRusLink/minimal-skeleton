import {pool} from "./dbConfig.js"
import GLOBAL_CONFIG from "../config.js";


export async function doesUserExist(username: string): Promise<boolean> {
    const queryResult = await pool.query(`SELECT username
                                  FROM ${GLOBAL_CONFIG.db.usersTable}
                                  WHERE username = $1`, [username])
    return queryResult.rows.length !== 0;
}


type getUserIdFeedback = { success: true, id: string } | { success: false, reason: "User doesn't exist" }

export async function getUserId(username: string): Promise<getUserIdFeedback> {
    const queryResult = await pool.query(`SELECT id
                                          FROM ${GLOBAL_CONFIG.db.usersTable}
                                          WHERE username = $1`, [username])
    return queryResult.rows.length === 0 ?
        {success: false, reason: "User doesn't exist"} :
        {success: true,
        id: queryResult.rows[0].id
        }
}


type createUserFeedback = { success: true, id: string } | {
    success: false,
    reason: "User already exists" | "Empty password"
}

export async function createUser(username: string, password: string): Promise<createUserFeedback> {
    if (password.length === 0) return {success: false, reason: "Empty password"};
    const queryResult = await pool.query(`INSERT INTO ${GLOBAL_CONFIG.db.usersTable} (id, username, password)
                      VALUES (DEFAULT, $1, $2) 
                      ON CONFLICT (username) DO NOTHING    
                      RETURNING id`, [username, password]);

    if (queryResult.rows.length === 0) return {success: false, reason: "User already exists"};
    return {
        success: true,
        id: queryResult.rows[0].id
    }

}


async function verifyUserPassword(username: string, password: string): Promise<boolean> {
    const queryResult  = (await pool.query(`SELECT NULL
                                                    FROM ${GLOBAL_CONFIG.db.usersTable}
                                                    WHERE username = $1 AND password = $2`, [username, password]))
    return queryResult.rows.length !== 0;
}


type getUserSecretFeedback = { success: true, secret: string } | {
    success: false,
    reason: "User doesn't exist" | "Wrong password"
}

async function getUserSecret(username: string, password: string): Promise<getUserSecretFeedback> {
    const queryResult = await pool.query(`SELECT secret, (password = $2) AS "passwordMatch"
                                              FROM ${GLOBAL_CONFIG.db.usersTable}
                                              WHERE username = $1`, [username, password])
    if (queryResult.rows.length === 0) return {success: false, reason: "User doesn't exist"}
    if (!queryResult.rows[0].passwordMatch) return {success: false, reason: "Wrong password"}
    return {success: true, secret: queryResult.rows[0].secret}
}

type writeUserSecretFeedback = { success: true } | { success: false, reason: "User doesn't exist" | "Wrong password" }

async function writeUserSecret(username: string, password: string, secret: string): Promise<writeUserSecretFeedback> {
    const queryResult = await pool.query(`UPDATE ${GLOBAL_CONFIG.db.usersTable}
                          SET secret = CASE 
                              WHEN password = $3 THEN $1
                              ELSE secret
                          END
                          WHERE username = $2
                          RETURNING username, (password = $3) AS "passwordMatch"`, [secret, username, password]);
    if (queryResult.rows.length === 0) return {success: false, reason: "User doesn't exist"};
    if (!queryResult.rows[0].passwordMatch) return {success: false, reason: "Wrong password"};
    return {success: true};
}

const dbAdapter =  {doesUserExist, getUserId, createUser, getUserSecret, writeUserSecret}

export default dbAdapter

