import dotenv from "dotenv"

dotenv.config();

export const GLOBAL_CONFIG = {
    webPath: process.env.WEB_PATH || "",
    listenPort: parseInt(process.env.LISTEN_PORT || "80"),
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || ""),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    }
}

function checkConfig
(obj:
 Record<string, any>,
 handler:
 Function =
 (obj: Record<string, any>, key: keyof typeof obj): void => {
     throw new Error(`${key} is ${obj[key]}`)
 }
): void {
    let key: keyof typeof obj;
    for (key in obj) {
        if (obj[key] === undefined || obj[key] === null || Number.isNaN(obj[key]) || obj[key] === "") {
            handler(obj, key);
        }
        if (typeof obj[key] === "object"){
            checkConfig(obj[key]);
        }
        console.log(`${key} is checked`)
    }
}

checkConfig(GLOBAL_CONFIG);

export default GLOBAL_CONFIG