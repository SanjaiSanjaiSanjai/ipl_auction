import { AppError } from "./custom.error.ts";
import type { ErrorDetails } from "../interfaces/common.interface.ts";

export class Unauthorize extends AppError {
    constructor(message:string,details:ErrorDetails[]){
        super({
            code: 'UNAUTHORIZED',
            message,
            statusCode: 401,
            details
        })
    }
}