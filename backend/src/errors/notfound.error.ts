import { AppError } from "./custom.error.ts";
import type { ErrorDetails } from "../interfaces/common.interface.ts";

export class NotFound extends AppError {
    constructor(message:string,details:ErrorDetails[] = []){
        super({
            code: 'NOT FOUND',
            message,
            statusCode: 404,
            details
        })
    }
}