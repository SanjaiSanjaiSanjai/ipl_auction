import type { NextFunction, Request, Response } from "express";
import { loginService } from "../service/login.service.ts";
import { LoginUserdetailsType } from "../interfaces/common.interface.ts";
import { NotFound } from "../errors/notfound.error.ts";
import { ValidationError } from "../errors/validation.error.ts";
import { createLoginSchema } from "../zod/zodSchema.ts";
import { zodErrorToValidationDetails } from "../zod/zodError.ts";

export const loginController = async (
  req: Request<{}, {}, LoginUserdetailsType>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body using Zod
    const loginSchema = createLoginSchema();
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      const details = zodErrorToValidationDetails(validationResult.error);
      return next(
        new ValidationError("One or more fields failed validation.", details)
      );
    }

    const { email, password } = validationResult.data;

    const { user, access_token, refresh_token } = await loginService({
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
      .cookie(cookieKey, refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge:
          process.env.NODE_ENV === "production"
            ? 7 * 24 * 60 * 60 * 1000
            : 10 * 60 * 1000,
        path: "/",
      })
      .status(200)
      .json({
        message: "Login successful",
        user,
        access_token,
        accessToken: access_token,
      });
  } catch (error) {
    next(error);
  }
};

