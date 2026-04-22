import {type Context, type MiddlewareHandler, type Next} from "hono";
import {type LoggerService} from "logger/dist/index.js"
import {AppError, ErrorCodes} from "../errors/types.js";

/**
 * Base abstract class for creating Hono middleware.
 * Exposes a standardized handler that bridges Hono's middleware interface with the internal execute logic.
 * * To implement custom middleware:
 * 1. Extend this class.
 * 2. Implement the protected `execute` method with your logic.
 * 3. Call `await next()` within `execute` to continue the request lifecycle.
 */
export abstract class Middleware{

    /**
     * The middleware handler function to be registered in Hono.
     */
    public readonly handler: MiddlewareHandler = (c, next) => this.execute(c, next);

    /**
     * Internal logic of the middleware to be implemented by subclasses.
     */
    protected abstract execute: (c: Context, next: Next) => Promise<Response | void>

}



/**
 * Middleware implementation that logs the lifecycle of an HTTP request, including method, path, and execution duration.
 * Requires a LoggerService instance for output.
 */
export class LoggerMiddleware extends Middleware{
    logger: LoggerService;
    constructor(Logger: LoggerService) {
        super();
        this.logger = Logger;
    }

    /**
     * Records the start of the request, awaits execution, and logs the total processing time.
     */
    protected execute = async (c: Context, next: () => Promise<void>) => {
        this.logger.info(`Entered endpoint ${c.req.method} ${c.req.path}`);
        const time = performance.now();
        await next();
        this.logger.info(`Endpoint ${c.req.method} ${c.req.path} finished in ${performance.now() - time} ms`)
    }


}

/**
 * Global error handling function that catches exceptions, distinguishing between known AppErrors and unexpected internal errors.
 */
export function errorHandler (err: Error, c: Context){
    if (err instanceof AppError) return c.text(err.message, ErrorCodes[err.type])
    return c.text("Unknown error", 500)
}