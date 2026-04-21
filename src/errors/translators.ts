import {DatabaseError} from "pg";
import {BusinessError, DBError, InfrastructureError} from "./types.js";

export function DBErrorTranslator<T extends object>(instance: T): T {
    return new Proxy(instance, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value === 'function') {
                return async (...args: any[]) => {
                    const className = target.constructor.name;
                    const methodName = String(prop);
                    try {
                        const result = await value.apply(receiver, args);
                        return result;
                    } catch (error) {
                        if (error instanceof DatabaseError) {
                            const translatedError = new DBError(error);
                            throw translatedError;
                        } else throw error;
                    }
                };
            }
            return value;
        }
    });
}