import dotenv from "dotenv"


interface ConfigIF{
    webPath: string;
    listenPort: number;
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        tables: {
            users: string;
        }
    };
}

const ConfigBase = class {} as new () => ConfigIF

/**
 * Loads environment variables into a structured configuration object and validates presence of all values.
 */
export class Config extends ConfigBase{


    /**
     * Initializes configuration by parsing .env and mapping environment variables to class properties.
     */
    constructor() {
        dotenv.config({quiet: true})
        super()
        this.webPath = process.env.WEB_PATH || "";
        this.listenPort = Number(process.env.LISTEN_PORT || 80);

        this.db = {
            host: process.env.DB_HOST || "",
            port: Number(process.env.DB_PORT || 0),
            name: process.env.DB_NAME || "",
            user: process.env.DB_USER || "",
            password: process.env.DB_PASSWORD || "",
            tables: {
                users: process.env.USERS_TABLE || ""
            }
        };

        this.checkConfig(this, "GLOBAL_CONFIG");

    }


    /**
     * Recursively traverses the configuration object to ensure no values are empty, null, or undefined.
     */
    checkConfig
    (obj:
     Record<string, any>,
     objName:
     string,
     handler:
     Function =
     (obj: Record<string, any>, objName: string, key: keyof typeof obj): void => {
         throw new Error(`${objName}.${key} is ${obj[key]}. Config failed to load.`)
     }
    ): void {
        let key: string;
        for (key in obj) {
            if (obj[key] === undefined || obj[key] === null || Number.isNaN(obj[key]) || obj[key] === "") {
                handler(obj, objName, key);
            }
            if (typeof obj[key] === "object"){
                this.checkConfig(obj[key], key);
            }
        }
    }

}


export default {Config}