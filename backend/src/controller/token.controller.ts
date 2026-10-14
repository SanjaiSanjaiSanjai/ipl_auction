import { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { NotFound } from "../errors/notfound.error.ts";
import { Unauthorize } from "../errors/unauthorize.error.ts";
import { getTokenExpiry } from "../service/signup.service.ts";

const COOKIE_KEY = process.env.REFRESHTOKEN_COOKIE_KEY;
const REFRESHTOKEN_SECRET_KEY = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
const ACCESS_TOKEN_SECRET_KEY = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;

export const tokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!COOKIE_KEY || !REFRESHTOKEN_SECRET_KEY || !ACCESS_TOKEN_SECRET_KEY) {
      throw new NotFound("ENV is undefined in environment variables.", [
        {
          field: "COOKIE_KEY || REFRESHTOKEN_SECRET_KEY || JWT_ACCESS_SECRET",
          issue: "NOT_FOUND",
          message: "ENV is undefined in environment variables.",
        },
      ]);
    }
    console.log("Every env variable is here....");
    const refresh_token = req.cookies[COOKIE_KEY];
    if (!refresh_token) {
      throw new Unauthorize("Unauthorized: Refresh token is missing from cookies", [
        {
          field: "refresh_token",
          issue: "NOT_FOUND",
          message: "refresh_token is missing from cookies",
        },
      ]);
    }

    const tokenExpiry = getTokenExpiry();

    try {
      const decoded = jwt.verify(refresh_token, REFRESHTOKEN_SECRET_KEY) as JwtPayload;
      const userPayload = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };

      const access_token = jwt.sign(userPayload, ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: tokenExpiry.accessToken,
      });

      return res.status(200).json({
        success: true,
        access_token,
        accessToken: access_token,
      });
    } catch (tokenErr) {
      return next(
        new Unauthorize("Unauthorized: Refresh token has expired or is invalid.", [
          {
            field: "refresh_token",
            issue: "INVALID_OR_EXPIRED_TOKEN",
            message: "Session expired. Please log in again.",
          },
        ])
      );
    }
  } catch (error) {
    return next(error);
  }
};