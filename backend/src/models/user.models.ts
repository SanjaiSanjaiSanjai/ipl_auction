import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/common.interface.ts";



const userSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			minlength: 3,
			maxlength: 50,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
			select: false,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		isActive: {
			type: Boolean,
			default: true,
		},

	},
	{ timestamps: true },
);

export const User = model<IUser>("User", userSchema);
