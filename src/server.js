import Fastify from "fastify";
import { registerApi } from "./routes/api.ts";
const server = Fastify();
registerApi(server);
server.listen({ port: 443 }, (error, address) => {
    console.log(error);
});
