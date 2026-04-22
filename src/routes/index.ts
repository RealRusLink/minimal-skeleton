import {Hono} from "hono";
import type {Middleware} from "./middleware.js";

export type RoutersDeclaration<T extends Hono = Hono> =
    {router: T, path: string}[]

export type MiddlewareDeclaration<T extends Middleware = Middleware> =
    { middlewareClass: T, path: string }[]


export class Routes extends Hono{
    constructor(routersList: RoutersDeclaration, middlewareList: MiddlewareDeclaration) {
        super()
        for (let middle of middlewareList){
            this.use(middle.path,  middle.middlewareClass.handler)
        }
        for (let route of routersList){
            this.route(route.path, route.router)
        }
    }
}

export default {Routes}