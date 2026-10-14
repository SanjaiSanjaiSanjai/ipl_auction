import { redisClient } from "../config/redis.ts";


export const setOtpInRedis = async (key: string, value: string) => {
    try {
        const expiryTime = 60;
        const otpKey = `iplauction:auth:otp:${key}`;
        await redisClient.set(otpKey, value, { EX: expiryTime });
        console.log("OTP is successfully set into redis...");
    } catch (error) {
        console.log("OTP is not set into redis....", error);
        throw new Error("Unable to save OTP for verification", { cause: error });
    }
}

export const getOtpFromRedis = async (key: string): Promise<string | null> => {
    try {
        const otpKey = `iplauction:auth:otp:${key}`;
        const otp = await redisClient.get(otpKey);
        return otp;
    } catch (error) {
        console.log("Error retrieving OTP from Redis:", error);
        throw new Error("Error retrieving OTP from Redis");
    }
}