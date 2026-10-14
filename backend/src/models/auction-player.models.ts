import mongoose, { Model, Schema } from "mongoose";
import { IAuctionPlayer } from "../interfaces/common.interface.ts";

const auctionPlayerSchema = new Schema<IAuctionPlayer>(
  {
    playerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ["batter", "bowler", "allrounder", "wicketkeeper"],
      required: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const AuctionPlayer: Model<IAuctionPlayer> =
  mongoose.model<IAuctionPlayer>("AuctionPlayer", auctionPlayerSchema);
