import Fastify, {type FastifyInstance, type FastifyReply, type FastifyRequest} from "fastify";

/**
 * Registers API paths
 */
export async function registerApi(server: FastifyInstance): Promise<void> {

    server.get("/hello", (request: FastifyRequest, reply: FastifyReply) => {
        reply.send("Ok")
    })

}

export default registerApi