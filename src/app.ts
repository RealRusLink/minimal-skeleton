import {LoggerService, consoleConfig} from "logger/dist/index.js"
import {Config} from "./config.js";
import {DBConnector} from "./db/config.js";
import {DBAdapter} from "./db/adapter.js";
import {type MiddlewareDeclaration, type RoutersDeclaration, Routes} from "./routes/index.js";
import {Api} from "./routes/api.js";
import {Web} from "./routes/web.js";
import {Server} from "./server.js";
import {DBErrorTranslator} from "./errors/translators.js";
import {errorHandler, LoggerMiddleware} from "./routes/middleware.js";


const createBuilder = <T extends object>(instance: T, message: string): any => {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            if (prop === 'addTranslator') {
                return (translatorFn: (obj: T) => T) => {
                    Logger.important(`Initialised ${translatorFn.name} for ${target.constructor.name}`)
                    return createBuilder(translatorFn(target), message);
                };
            }

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

const Logger = new LoggerService(consoleConfig)
Logger.logLevel = "TRACE"



const GlobalConfig = init(Config, "Global configuration loaded");

const DBConnection = init(DBConnector, "DB pool connected", GlobalConfig)
    .addTranslator(DBErrorTranslator)
    .addLogger();

await DBConnection.verifyConnection();

const DBApi = init(DBAdapter, "DB adapter initialised", DBConnection, GlobalConfig)
    .addTranslator(DBErrorTranslator)
    .addLogger();

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

const middlewareDeclaration: MiddlewareDeclaration = [
    {
        middlewareClass: init(LoggerMiddleware, "Logging middleware initialised", Logger),
        path: "*",
    },
]

const AppRoutes = init(Routes, "All routes and middleware registered", routersDeclaration, middlewareDeclaration).addLogger();

AppRoutes.onError(errorHandler)
Logger.important("Registered global error handling")

const AppServer = init(Server, `Server started on port ${GlobalConfig.listenPort}`, AppRoutes, GlobalConfig).addLogger();