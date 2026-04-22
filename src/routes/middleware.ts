import {type Context, type MiddlewareHandler, type Next} from "hono";
import {type LoggerService} from "../../../logger/dist/index.js"


export abstract class Middleware{

    public readonly handler: MiddlewareHandler = (c, next) => this.execute(c, next);

    protected abstract execute: (c: Context, next: Next) => Promise<Response | void>

}



export class LoggerMiddleware extends Middleware{
    logger: LoggerService;
    constructor(Logger: LoggerService) {
        super();
        this.logger = Logger;
    }

    protected execute = async (c: Context, next: () => Promise<void>) => {
        this.logger.info(`Entered endpoint ${c.req.method} ${c.req.path}`);
        const time = performance.now();
        await next();
        this.logger.info(`Endpoint ${c.req.method} ${c.req.path} finished in ${performance.now() - time} ms`)
    }


}