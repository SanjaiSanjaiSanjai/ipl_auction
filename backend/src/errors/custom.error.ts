import { AppErrorOption, ErrorDetails } from "../interfaces/common.interface.ts";


export class AppError extends Error{
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: ErrorDetails[];
  public readonly timestamp: string;

  constructor({code, message, statusCode, details = []}: AppErrorOption) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}
