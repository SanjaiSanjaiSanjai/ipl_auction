import { SignupUserDetails } from "../interfaces/common.interface.ts";
import { ValidationError } from "../errors/validation.error.ts";
import { User } from "../models/user.models.ts";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { generateOtp } from "../utils/room-id.ts";
import { setOtpInRedis } from "../utils/redis.common.ts";
import { otpEmailTemplate } from "../templates/otp.templates.ts";
import { sendEmail } from "./mail.service.ts";


export const getTokenExpiry = (): {
  accessToken: SignOptions["expiresIn"];
  refreshToken: SignOptions["expiresIn"];
} => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    accessToken: isProduction ? "15m" : "5m",
    refreshToken: isProduction ? "7d" : "1h",
  };
};

export const signupService = async (userdetails: SignupUserDetails) => {
  const existingUser = await User.findOne({
    $or: [
      { username: userdetails.username },
      { email: userdetails.email },
    ],
  });

  if (existingUser) {
    throw new ValidationError("User already exists", [
      {
        field: "username/email",
        issue: "USER_EXISTING",
        message: "This username or email is already associated with an account.",
      },
    ]);
  }

  const hashedPassword = await bcrypt.hash(userdetails.password, 10);

  const newUser = await User.create({
    username: userdetails.username,
    email: userdetails.email,
    password: hashedPassword,

  });

  const user = {
    id: newUser._id.toString(),
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  };

  const accessTokenSecret =
    process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
  const refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured");
  }

  const tokenExpiry = getTokenExpiry();

  const accessToken = jwt.sign(user, accessTokenSecret, {
    expiresIn: tokenExpiry.accessToken,
  });
  const refreshToken = jwt.sign(user, refreshTokenSecret, {
    expiresIn: tokenExpiry.refreshToken,
  });

  if (process.env.NODE_ENV === "production") {
    const otp: string = generateOtp();
    await setOtpInRedis(user.email, otp);
    const html_template = otpEmailTemplate(user.username, otp);
    await sendEmail({
      to: user.email,
      subject: "Email verification",
      text: `Your verification OTP is ${otp}. It expires in 1 minute.`,
      html: html_template,
    });
  }
  return {
    user,
    accessToken,
    refreshToken,

  };
};
