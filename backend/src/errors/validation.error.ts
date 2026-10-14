import { AppError } from './custom.error.ts';
import type { ErrorDetails } from '../interfaces/common.interface.ts';

export class ValidationError extends AppError{
    constructor(message:string,details: ErrorDetails[]){
        super({
            code: "VALIDATION_FAILED",
            message,
            statusCode:400,
            details
        });
    }
}