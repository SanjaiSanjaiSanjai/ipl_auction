import { NextFunction, Request, Response } from "express";
import { Unauthorize } from "../errors/unauthorize.error.ts";

export const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin") {
    return next(new Unauthorize("Admin access is required", [
      {
        field: "role",
        issue: "FORBIDDEN",
        message: "Only admin users can manage auction teams and players.",
      },
    ]));
  }
  next();
};
