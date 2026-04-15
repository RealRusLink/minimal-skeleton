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
 objName:
 string,
 handler:
 Function =
 (obj: Record<string, any>, objName: string, key: keyof typeof obj): void => {
     throw new Error(`${objName}.${key} is ${obj[key]}`)
 }
): void {
    let key: keyof typeof obj;
    for (key in obj) {
        if (obj[key] === undefined || obj[key] === null || Number.isNaN(obj[key]) || obj[key] === "") {
            handler(obj, objName, key);
        }
        if (typeof obj[key] === "object"){
            console.log(`Checking ${objName}.${key}..`)
            checkConfig(obj[key], key);
        }
        console.log(`${objName}.${key} is checked`)
    }
}

checkConfig(GLOBAL_CONFIG, 'GLOBAL_CONFIG');

export default GLOBAL_CONFIG