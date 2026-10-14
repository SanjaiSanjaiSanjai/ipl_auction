import { NextFunction, Request, Response } from "express";
import { getOtpFromRedis } from "../utils/redis.common.ts";

export const otpVerficationController = async(req:Request,res: Response,next: NextFunction) => {
    try 
    {
        const {otp,email} = req.body;

        if(!otp || !email)
        {
            res.status(400).json({message: "OTP and email are required"});
            return;
        }

        const otpFromRedis = await getOtpFromRedis(email);

        if(!otpFromRedis){
            res.status(400).json({message: "OTP has expired or is invalid"});
            return;
        }

        console.log("redis otp type: ", typeof otpFromRedis);
        console.log("request otp type: ", typeof otp);
        
        if(otpFromRedis !== otp){
            res.status(400).json({message: "Invalid OTP"});
            return;
        }

        res.status(200).json({message: "OTP verified successfully"});
    }
    catch (err)
    {
        next(err);
    }
}