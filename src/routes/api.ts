import {type Context, Hono} from "hono";
import type {DBAdapter} from "../db/adapter.js";
import type {Config} from "../config.js";
import {BusinessError} from "../errors/types.js";

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
        this.get("/", (c) => this.sendHello(c))
        this.get("/secret", (c) => this.getSecret(c))
    }

    async sendHello(c: Context){
        return c.json({message: "hello"})
    }

    async getSecret(c: Context){
        const password = c.req.query("password");
        const username = c.req.query("username");
        if (password === undefined || username === undefined) throw new BusinessError()
        const queryResult = await this.DBApi.getUserSecret(username, password)
        if (queryResult.success){
            return c.json({secret: queryResult.secret})
        } else {
            return c.text(queryResult.reason)
        }
    }


}

export default {Api}