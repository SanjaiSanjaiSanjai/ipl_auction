import mongoose from "mongoose";

export const connectDB = async () => 
    {
    const MONGO_URI = process.env.MONGODB_URI as string;
    try
    {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");
    }
    catch (error)
    {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}