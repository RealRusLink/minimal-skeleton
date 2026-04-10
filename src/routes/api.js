export async function registerApi(server) {
    server.get("/hello", (request, reply) => {
        reply.send("Ok");
    });
}
export default { registerApi };
