import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { verifyToken } from "../utils/jwt.ts";
import { NotFound } from "../errors/notfound.error.ts";
import jwt from "jsonwebtoken";
import { Unauthorize } from "../errors/unauthorize.error.ts";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Unauthorize("Unauthorized: Invalid token format", [
        {
          field: "Authorization",
          message: "Invalid token format",
          issue: "Token is missing or does not start with Bearer",
        },
      ]);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new Unauthorize("Unauthorized: No token provided", [
        {
          field: "Authorization",
          message: "No token provided",
          issue: "Token is missing",
        },
      ]);
    }

    const payload = verifyToken(token);

    if (!Types.ObjectId.isValid(payload.id)) {
      throw new Unauthorize("Unauthorized: Invalid user ID", [
        {
          field: "Authorization",
          message: "Invalid user ID",
          issue: "User ID is not valid",
        },
      ]);
    }

    req.user = payload as {
      id: Types.ObjectId;
      username: string;
      email: string;
      role: string;
    };
    next();
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : undefined;

    if (
      err instanceof jwt.TokenExpiredError ||
      errorName === "TokenExpiredError"
    ) {
      return next(new Unauthorize("Unauthorized: Token has expired", [
        {
          field: "Authorization",
          message: "Your session has expired. Please log in again.",
          issue: "Token expired",
        },
      ]));
    }

    if (
      err instanceof jwt.JsonWebTokenError ||
      errorName === "JsonWebTokenError" ||
      errorName === "NotBeforeError" ||
      errorName === "SyntaxError"
    ) {
      return next(new Unauthorize("Unauthorized: Invalid token", [
        {
          field: "Authorization",
          message: "The provided token is invalid.",
          issue: "Token verification failed",
        },
      ]));
    }

    return next(err);
  }
};
