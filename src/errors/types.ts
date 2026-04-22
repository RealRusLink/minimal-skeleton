import {DatabaseError} from "pg";
import type {ContentfulStatusCode, StatusCode} from "hono/utils/http-status"

/**
 * Valid error categories used for classifying application failures and determining HTTP response codes.
 */
export type ErrorType = "BusinessError" | "InfrastructureError" | "DBError" | "Unknown"


/**
 * Base class for all application-specific exceptions.
 */
export  class AppError extends Error{
    type: ErrorType = "Unknown";
    constructor() {
        super();
    }
}


/**
 * Represents errors caused by invalid business logic or client-side input.
 */
export class BusinessError extends AppError{
    type: ErrorType = "BusinessError";
    constructor() {
        super();
        this.stack = "BusinessError " + this.stack
    }
}

/**
 * Represents general infrastructure-level failures (e.g., service unavailability).
 */
export class InfrastructureError extends AppError{
    type: ErrorType = "InfrastructureError"
    constructor() {
        super();
    }
}



/**
 * Specialized infrastructure error for PostgreSQL failures.
 * It maps raw PG error codes to human-readable messages and preserves database context like table names and details.
 */
export class DBError extends InfrastructureError{
    /**
     * Dictionary mapping PostgreSQL state codes to descriptive error messages.
     */
    static DBErrorCodeMap: Record<string, string> = {
        '08000': 'Connection exception',
        '08003': 'Connection does not exist',
        '08006': 'Connection failure',
        '08P01': 'Protocol violation',
        '23000': 'Integrity constraint violation',
        '23502': 'Not null violation',
        '23503': 'Foreign key violation',
        '23505': 'Unique violation (Duplicate key)',
        '23514': 'Check constraint violation',
        '28P01': 'Authentication failed',
        '42000': 'Syntax error or access rule violation',
        '42601': 'Syntax error',
        '42501': 'Insufficient privilege',
        '42703': 'Undefined column',
        '42P01': 'Undefined table',
        '0A000': 'Feature not supported',
        '53100': 'Disk full',
        '53200': 'Out of memory',
        '53300': 'Too many connections',
        '57014': 'Query canceled',
        '57P01': 'Admin shutdown',
        '57P03': 'Cannot connect now (Server is in recovery)',
        'XX000': 'Internal error',
        'Unknown error': 'Unknown error'
    }

    table: string | undefined;
    detail: string | undefined;
    hiddenStack: string;

    /**
     * Creates a DBError instance from a raw PostgreSQL DatabaseError, populating metadata and formatting the message.
     */
    constructor(Error: DatabaseError) {
        super();
        this.type = "DBError"
        this.hiddenStack = Error.stack || "";
        this.name = "DBError";
        this.message = Error.code + ": " + DBError.DBErrorCodeMap[Error.code || 'Unknown error'] || 'Unknown error';
        this.stack = this.message;
        this.table = Error.table;
        this.detail = Error.detail;
    }
}




/**
 * Map of ErrorType categories to their corresponding HTTP status codes for API responses.
 */
export const ErrorCodes: Record<ErrorType, ContentfulStatusCode> = {
    BusinessError: 418,
    InfrastructureError: 500,
    DBError: 503,
    Unknown: 500
}