import mongoose, { Model, Schema } from "mongoose";
import { ITeam } from "../interfaces/common.interface.ts";

const teamSchema = new Schema<ITeam>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    color: {
      type: String,
      default: "#3b82f6",
      trim: true,
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

export const Team: Model<ITeam> = mongoose.model<ITeam>("Team", teamSchema);
