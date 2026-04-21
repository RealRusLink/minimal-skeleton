import {LoggerService, consoleConfig} from "../../logger/dist/index.js"
import {Config} from "./config.js";
import {DBConnector} from "./db/config.js";
import {DBAdapter} from "./db/adapter.js";
import {type RoutersDeclaration, Routes} from "./routes/index.js";
import {Api} from "./routes/api.js";
import {Web} from "./routes/web.js";
import {Server} from "./server.js";




const init = <T extends new (...args: any[]) => any>(
    BaseClass: T,
    message: string,
    ...args: ConstructorParameters<T>
): InstanceType<T> => {
    if (!IS_LOGGING_ENABLED) return new BaseClass(...args);

    const WrappedClass = Logger.wrapConstructor(BaseClass, {
        customMessage: message,
        customMessageLevel: "IMPORTANT"
    });

    return Logger.setMultipleLoggers(new WrappedClass(...args));
};

const IS_LOGGING_ENABLED = true;

const Logger = new LoggerService(consoleConfig)
Logger.logLevel = "INFO"

const GlobalConfig = init(Config, "Global configuration loaded");

const DBConnection = init(DBConnector, "DB pool connected", GlobalConfig);
await DBConnection.verifyConnection();

const DBApi = init(DBAdapter, "DB adapter initialised", DBConnection, GlobalConfig);

const routersDeclaration: RoutersDeclaration = [
    { router: init(Api, "Api routes initialised", DBApi, GlobalConfig), path: "/api" },
    { router: init(Web, "Web routes initialised", GlobalConfig), path: "/" }
];

const AppRoutes = init(Routes, "All routes registered", routersDeclaration);

const AppServer = init(Server, `Server is listening on ${GlobalConfig.listenPort}`, AppRoutes, GlobalConfig)