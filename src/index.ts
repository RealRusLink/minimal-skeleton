import Fastify from "fastify";

export function sayHello(name: string): void {
    console.log(`Hello, ${name}`);
    return;
} 

export default { sayHello };
