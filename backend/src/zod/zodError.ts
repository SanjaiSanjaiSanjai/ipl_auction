import { ZodError } from "zod";

// Convert Zod errors to ValidationError format
export const zodErrorToValidationDetails = (zodError: ZodError) => {
    return zodError.issues.map((error) => ({
        field: error.path[0] as string,
        issue: error.code.toUpperCase(),
        message: error.message,
    }));
};