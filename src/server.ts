import Fastify from "fastify";
import registerApi from "./routes/api.js";
import registerWeb from "./routes/web.js";
import GLOBAL_CONFIG from "./config.js";
const server = Fastify();


await registerWeb(server);
await registerApi(server);

server.listen({port: GLOBAL_CONFIG.listenPort},
    (error, address) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Server running on ", address)
        }

    });
