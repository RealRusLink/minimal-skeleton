import {LoggerService, consoleConfig} from "logger/dist/index.js"
import {Config} from "./config.js";
import {DBConnector} from "./db/config.js";
import {DBAdapter} from "./db/adapter.js";
import {Api} from "./routes/api.js";
import {Web} from "./routes/web.js";
import {type MiddlewareDeclaration, type RoutersDeclaration, Routes} from "./routes/index.js";
import {Server} from "./server.js";
import {DBErrorTranslator} from "./errors/translators.js";
import {errorHandler, LoggerMiddleware} from "./routes/middleware.js";

/**
 * Higher-order utility that implements an interface via Proxy.
 * It decorates class instances with additional capabilities like error translation and automatic logging.
 */
const createBuilder = <T extends object>(instance: T, message: string): any => {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            /**
             * Wraps the instance with a specialized error translator.
             * Primarily used for database layers to convert raw driver exceptions into domain-specific errors.
             */
            if (prop === 'addTranslator') {
                return (translatorFn: (obj: T) => T) => {
                    Logger.important(`Initialised ${translatorFn.name} for ${target.constructor.name}`)
                    return createBuilder(translatorFn(target), message);
                };
            }

            /**
             * Enables method-level logging for the entire instance.
             * Uses LoggerService.setMultipleLoggers to wrap every class method with entry/exit logs, argument serialization, and execution timing.
             */
            if (prop === 'addLogger') {
                return () => {
                    const logged = Logger.setMultipleLoggers(target);
                    return createBuilder(logged, message);
                };
            }

            return Reflect.get(target, prop, receiver);
        }
    });
};

/**
 * Universal initialization factory that manages the lifecycle of application components.
 * It handles constructor wrapping for logging, instantiation, and returns a Proxy-builder for further decoration.
 *
 * **The initialization process follows this logic:**
 * - Constructor Wrapping: If IS_LOGGING_ENABLED is true, the class constructor is intercepted to log its call.
 * - Execution: A new instance is created with the provided arguments.
 * - Decoration: The instance is wrapped in a Proxy to support .addLogger() and .addTranslator() calls.
 * - Feedback: A custom completion message is logged at the IMPORTANT level.
 */
export const init = <T extends new (...args: any[]) => any>(
    BaseClass: T,
    message: string,
    ...args: ConstructorParameters<T>
): InstanceType<T> & {
    addTranslator: (fn: (obj: InstanceType<T>) => InstanceType<T>) => InstanceType<T> & any,
    addLogger: () => InstanceType<T> & any
} => {
    const WrappedClass = IS_LOGGING_ENABLED
        ? Logger.wrapConstructor(BaseClass, {
            customMessage: message,
            customMessageLevel: "IMPORTANT",
        })
        : BaseClass;

    return createBuilder(new WrappedClass(...args), message);
};

const IS_LOGGING_ENABLED = true;

/**
 * Global Logger initialization using pre-defined console configuration.
 * CAUTION: TRACE level may leak private data.
 */
const Logger = new LoggerService(consoleConfig)
Logger.logLevel = "TRACE"


/**
 * SERVER BOOTSTRAP LIFECYCLE
 * * Configuration Loading:
 * Loads environment variables and validates that all required fields are present in the Config object.
 */
const GlobalConfig = init(Config, "Global configuration loaded");

/**
 * Database Connectivity:
 * Initializes the DBConnector with pool settings. It adds a DBErrorTranslator to handle pg-driver errors
 * and enables method logging for the connection manager.
 */
const DBConnection = init(DBConnector, "DB pool connected", GlobalConfig)
    .addTranslator(DBErrorTranslator)
    .addLogger();

/**
 * Connection Verification:
 * Asynchronously checks database availability before proceeding to route initialization.
 */
await DBConnection.verifyConnection();

/**
 * Data Access Layer:
 * Creates the DBAdapter which contains business-related queries. It is also decorated with
 * error translation and logging capabilities.
 */
const DBApi = init(DBAdapter, "DB adapter initialised", DBConnection, GlobalConfig)
    .addTranslator(DBErrorTranslator)
    .addLogger();

/**
 * Sub-Routers Declaration:
 * Initializes API and Web routers, applying logging to each, and maps them to their respective URL paths.
 */
const routersDeclaration: RoutersDeclaration = [
    {
        router: init(Api, "Api routes initialised", DBApi, GlobalConfig).addLogger(),
        path: "/api"
    },
    {
        router: init(Web, "Web routes initialised", GlobalConfig).addLogger(),
        path: "/"
    }
];

/**
 * Middleware Registration:
 * Sets up global middlewares, such as LoggerMiddleware, which will run for all incoming requests.
 */
const middlewareDeclaration: MiddlewareDeclaration = [
    {
        middlewareClass: init(LoggerMiddleware, "Logging middleware initialised", Logger),
        path: "*",
    },
]

/**
 * Main Application Assembly:
 * Uses the Routes class to combine all routers and middlewares into a single Hono application instance.
 */
const AppRoutes = init(Routes, "All routes and middleware registered", routersDeclaration, middlewareDeclaration).addLogger();

/**
 * Error Handling:
 * Attaches the global errorHandler to the Hono instance to manage AppErrors and unknown exceptions.
 */
AppRoutes.onError(errorHandler)
Logger.important("Registered global error handling")

/**
 * Server Start:
 * Binds the assembled application to the network port and starts listening for HTTP requests.
 */
const AppServer = init(Server, `Server started on port ${GlobalConfig.listenPort}`, AppRoutes, GlobalConfig).addLogger();


/**
 * Server shutdown handler
 */
const shutdown = async () => {
    Logger.important("Received shutdown signal. Starting graceful shutdown...");
    AppServer.stop();
    Logger.important("HTTP server stopped accepting new connections.");

    try {
        await DBConnection.pool.end();
        Logger.important("Database pool successfully closed.");
        process.exit(0);
    } catch (err) {
        Logger.error(`Error during graceful shutdown: ${err}`);
        process.exit(1);
    }
};

/**
 * Shutdown listener
 */
process.on('SIGINT', shutdown);
process.on("exit", () => Logger.important("Server closed."))