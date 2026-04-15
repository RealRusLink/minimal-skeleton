import dotenv from "dotenv"

dotenv.config();

export const GLOBAL_CONFIG = {
    webPath: process.env.WEB_PATH,
    listenPort: parseInt(process.env.LISTEN_PORT || "80"),
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    }
}

export default GLOBAL_CONFIG