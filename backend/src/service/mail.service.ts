import { mailTransporter } from "../config/mail.config.ts";

interface SendEmailOption {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailOption) => {
    const info = await mailTransporter.sendMail(
        {
            from: process.env.MAIL_USER,
            to,
            subject,
            text,
            html
        }
    )
    console.log("Mail is send to user");
    return info;
}