import {LoggerService, consoleConfig} from "../../logger/dist/index.js"
import {Config} from "./config.js";
import {DBConnector} from "./db/config.js";
import {DBAdapter} from "./db/adapter.js";

const Logger = new LoggerService(consoleConfig)


const LoggedConfig = Logger.wrapConstructor(Config, {customMessage: "Global configuration loaded", customMessageLevel: "IMPORTANT"})
const LoggedDBConnector = Logger.wrapConstructor(DBConnector, {customMessage: "DB pool connected", customMessageLevel: "IMPORTANT"})
const LoggedDBAdapter = Logger.wrapConstructor(DBAdapter, {customMessage: "DB adapter initialised", customMessageLevel: "IMPORTANT"})


const GlobalConfig = Logger.setMultipleLoggers(new LoggedConfig())
const DBConnection = Logger.setMultipleLoggers(new LoggedDBConnector(GlobalConfig))
await DBConnection.verifyConnection()
const DBApi = new LoggedDBAdapter(DBConnection, GlobalConfig)








