import {Hono} from "hono";

export type RoutersDeclaration<T extends Hono = Hono> =
    {router: T, path: string}[]


export class Routes extends Hono{
    constructor(routersList: RoutersDeclaration) {
        super()
        for (let route of routersList){
            this.route(route.path, route.router)
        }
    }
}

export default {Routes}