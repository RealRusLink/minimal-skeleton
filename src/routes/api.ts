import {type Context, Hono} from "hono";
import type {DBAdapter} from "../db/adapter.js";
import type {Config} from "../config.js";

export class Api extends Hono{
    DBApi: DBAdapter;
    GlobalConfig: Config;
    constructor(DBApi: DBAdapter, GlobalConfig: Config) {
        super();
        this.DBApi = DBApi;
        this.GlobalConfig = GlobalConfig;
        this.setupRoutes();
    }

    setupRoutes(){
        this.get("/", (c) => this.#sendHello(c))
    }

    async #sendHello(c: Context){
        return c.json({message: "hello"})
    }


}

export default {Api}