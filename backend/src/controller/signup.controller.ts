import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "../errors/validation.error.ts";
import { signupService } from "../service/signup.service.ts";
import { SignupUserDetails } from "../interfaces/common.interface.ts";
import { NotFound } from "../errors/notfound.error.ts";
import { createSignupSchema } from "../zod/zodSchema.ts";
import { zodErrorToValidationDetails } from "../zod/zodError.ts";




export const signupController = async (
  req: Request<{}, {}, SignupUserDetails>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body using Zod
    const signupSchema = createSignupSchema();
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      const details = zodErrorToValidationDetails(validationResult.error);
      return next(
        new ValidationError("One or more fields failed validation.", details)
      );
    }

    const { username, email, password } = validationResult.data;

    const { user, accessToken, refreshToken } = await signupService({
      username,
      email,
      password,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieKey = process.env.REFRESHTOKEN_COOKIE_KEY;

    if (!cookieKey) {
      throw new NotFound(
        "REFRESHTOKEN_COOKIE_KEY is not defined in environment variables.",
        [
          {
            field: "cookieKey",
            issue: "NOT_FOUND",
            message:
              "REFRESHTOKEN_COOKIE_KEY is not defined in environment variables.",
          },
        ]
      );
    }

    return res
      .cookie(cookieKey, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge:
          process.env.NODE_ENV === "production"
            ? 7 * 24 * 60 * 60 * 1000
            : 10 * 60 * 1000,
        path: "/",
      })
      .status(201)
      .json({
        message: "User created successfully",
        user,
        accessToken,
      });
  } catch (error) {
    next(error);
  }
};
