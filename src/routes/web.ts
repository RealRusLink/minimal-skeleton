import {type Context, Hono} from "hono";
import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {serveStatic} from "@hono/node-server/serve-static";
import type {Config} from "../config.js";

export class Web extends Hono {

    constructor(GlobalConfig: Config) {
        super();

        const absolutePath = resolve(GlobalConfig.webPath);

        if (!existsSync(absolutePath)) {
            throw new Error(`webPath ${GlobalConfig.webPath} doesn't exist`);
        }
        this.use("/*", serveStatic({ root: GlobalConfig.webPath }));
    }
}

export default {Web}