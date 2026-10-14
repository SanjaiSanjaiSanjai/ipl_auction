import { LoginUserdetailsType  } from "../interfaces/common.interface.ts";
import { ValidationError } from "../errors/validation.error.ts";
import { User } from "../models/user.models.ts";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getTokenExpiry } from "./signup.service.ts";
import { generateOtp } from "../utils/room-id.ts";
import { setOtpInRedis } from "../utils/redis.common.ts";
import { otpEmailTemplate } from "../templates/otp.templates.ts";
import { sendEmail } from "./mail.service.ts";



export const loginService = async(userdetails:LoginUserdetailsType) => {
    const ifUserExsisting = await User.findOne({email:userdetails.email}).select('+password');
    if (!ifUserExsisting){
        throw new ValidationError('user is not available',[{field:'ifUserExsisting',issue:'NOT_FOUND',message:'user is not available'}])
    }
    const compare_password = await bcrypt.compare(userdetails.password,ifUserExsisting.password);
    if(!compare_password){
        throw new ValidationError('password is incorrect',[{field:'compare_password',issue:'INCORRECT',message:'password is incorrect'}])
    }
    const user = {
        id: ifUserExsisting._id,
        username: ifUserExsisting.username,
        email: ifUserExsisting.email,
        role: ifUserExsisting.role
    }
    const accessToken_secretKey = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
const refreshToken_secretKey = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
    if(!accessToken_secretKey || !refreshToken_secretKey){
        throw new ValidationError('access token or refresh token must configred',[{field:'accessToken_secretKey or refreshToken_secretKey',issue:'UNDEFINED',message:'access token or refresh token must configred'}])
    }
    const token_expiry = getTokenExpiry();
    const access_token = jwt.sign(user,accessToken_secretKey,{expiresIn:token_expiry.accessToken});
    const refresh_token = jwt.sign(user,refreshToken_secretKey,{expiresIn:token_expiry.refreshToken});
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

    return {user,access_token,refresh_token};
}