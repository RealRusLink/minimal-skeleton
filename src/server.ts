import {serve} from "@hono/node-server";
import type {Routes} from "./routes/index.js";
import type {Config} from "./config.js";

export class Server {
    constructor(AppRoutes: Routes, GlobalConfig: Config) {
        serve({
            fetch: AppRoutes.fetch,
            port: GlobalConfig.listenPort
        })
    }
}