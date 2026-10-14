import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

if (!REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}

export const redisClient = createClient(
    {
        url: REDIS_URL,
    }
);

redisClient.on("connect", () => { console.log("Redis connecting...") });
redisClient.on("ready", () => { console.log(" Redis connected...") });
redisClient.on("error", (error) => { console.log(" Redis error : ", error) });
redisClient.on("reconnecting", () => { console.log("Redis reconnecting...") });

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
        } catch (error) {
            console.log("Redis is not connected", error);
            process.exit(1);
        }
    }
}