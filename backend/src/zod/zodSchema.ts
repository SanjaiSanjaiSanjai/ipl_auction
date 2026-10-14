import { z } from "zod";
import { getAllowedEmailDomains } from "../utils/helper.ts";


// Zod schema for signup validation
export const createSignupSchema = () => {
    const allowedDomains = getAllowedEmailDomains();
    const isProduction = process.env.NODE_ENV === "production";

    return z.object({
        username: z.string()
            .min(1, "Username is required.")
            .min(3, "Username must be at least 3 characters long.")
            .max(30, "Username must not exceed 30 characters.")
            .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens."),
        email: z.string()
            .min(1, "Email is required.")
            .email("Invalid email format.")
            .refine(
                (email) => {
                    const domain = email.split("@")[1];
                    return allowedDomains.includes(domain);
                },
                {
                    message: isProduction
                        ? "Only gmail.com email addresses are allowed."
                        : `Only ${allowedDomains.join(", ")} email addresses are allowed in development.`,
                }
            ),
        password: z.string()
            .min(1, "Password is required.")
            .min(8, "Password must be at least 8 characters long.")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number."
            ),
    });
};


// Zod schema for login validation
export const createLoginSchema = () => {
    const allowedDomains = getAllowedEmailDomains();
    const isProduction = process.env.NODE_ENV === "production";

    return z.object({
        email: z.string()
            .min(1, "Email is required.")
            .email("Invalid email format.")
            .refine(
                (email) => {
                    const domain = email.split("@")[1];
                    return allowedDomains.includes(domain);
                },
                {
                    message: isProduction
                        ? "Only gmail.com email addresses are allowed."
                        : `Only ${allowedDomains.join(", ")} email addresses are allowed in development.`,
                }
            ),
        password: z.string()
            .min(1, "Password is required.")
            .min(8, "Password must be at least 8 characters long.")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number."
            ),
    });
};
