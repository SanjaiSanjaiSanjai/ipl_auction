import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IRoom, IRoomPlayer, ISoldLot } from "../interfaces/common.interface.ts";

export type GameType = "cricket";
export type RoomStatus = "waiting" | "team_selection" | "playing" | "finished";

export const roomPlayerSchema = new Schema<IRoomPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    teamCode: {
      type: String,
      default: null,
    },
    connected: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

export const soldLotSchema = new Schema<ISoldLot>(
  {
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    role: { type: String, required: true },
    nationality: { type: String, required: true },
    teamCode: { type: String, required: true },
    soldPrice: { type: Number, required: true },
    buyerUserId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

export const roomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    gameType: {
      type: String,
      enum: ["cricket"],
      default: "cricket",
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 20,
    },
    status: {
      type: String,
      enum: ["waiting", "team_selection", "playing", "finished"],
      default: "waiting",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    players: {
      type: [roomPlayerSchema],
      default: [],
    },
    soldLots: {
      type: [soldLotSchema],
      default: [],
    },
    auctionState: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.index({
  status: 1,
  gameType: 1,
  isPrivate: 1,
});

roomSchema.index({
  createdBy: 1,
  createdAt: -1,
});

export const Room: Model<IRoom> = mongoose.model<IRoom>("Room", roomSchema);
