import Fastify, {type FastifyInstance, type FastifyReply, type FastifyRequest} from "fastify";
import {fastifyStatic} from "@fastify/static";
import * as path from "node:path";
import GLOBAL_CONFIG from "../config.js";
/**
 * Registers src/public as public
 */
export async function registerWeb(server: FastifyInstance): Promise<void> {

    await server.register(fastifyStatic, {
        root: path.join(process.cwd(), GLOBAL_CONFIG.webPath),
        prefix: "/"
    })

}
export default registerWeb