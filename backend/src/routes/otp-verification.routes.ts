import { Router } from "express";
import { otpVerficationController } from "../controller/otp-verification.controller.ts";
const otpVerificationRouter = Router();

otpVerificationRouter.post("/otp/verify",otpVerficationController);

export default otpVerificationRouter;