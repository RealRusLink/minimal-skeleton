import {type Context, Hono} from "hono";
import type {DBAdapter} from "../db/adapter.js";
import type {Config} from "../config.js";
import {BusinessError} from "../errors/types.js";

/**
 * API router class that extends Hono to provide specialized endpoints for user secrets.
 * It integrates a DBAdapter instance for data persistence and a Config object for environment settings.
 * * To add a new route:
 * 1. Define a new async method to handle the request.
 * 2. Register the method in the setupRoutes() function using Hono routing methods.
 */
export class Api extends Hono{
    DBApi: DBAdapter;
    GlobalConfig: Config;

    /**
     * Initializes the API with required database and configuration dependencies, then sets up internal routing.
     */
    constructor(DBApi: DBAdapter, GlobalConfig: Config) {
        super();
        this.DBApi = DBApi;
        this.GlobalConfig = GlobalConfig;
        this.setupRoutes();
    }

    /**
     * Registers specific HTTP methods and paths to their corresponding internal handler functions.
     */
    setupRoutes(){
        this.get("/", (c) => this.sendHello(c))
        this.get("/secret", (c) => this.getSecret(c))
    }

    /**
     * Returns a simple JSON greeting message.
     */
    async sendHello(c: Context){
        return c.json({message: "hello"})
    }

    /**
     * Handles requests for a user's secret by validating credentials via the database adapter.
     */
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