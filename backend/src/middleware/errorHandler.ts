import type{ Request, Response, NextFunction } from "express";
import { AppError } from "../errors/custom.error.ts";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  // Our known application error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
        {
            success: false,
            error: {
                code: err.code,
                message: err.message,
                status: err.statusCode,
                timestamp: err.timestamp,
                path: req.originalUrl,
                details: err.details
            }
        }
    )
  }

  // Unknown/unexpected error
  console.error(err);

  return res.status(500).json({
    success: false,

    error: {
      code: "INTERNAL_SERVER_ERROR",

      message: "Something went wrong.",

      status: 500,

      timestamp: new Date().toISOString(),

      path: req.originalUrl,

      details: [],
    },
  });
}