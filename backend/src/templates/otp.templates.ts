export const otpEmailTemplate = (username: string, otp: string): string => {
  return `
  <!DOCTYPE html>
    <html>

      <head>
        <meta charset="UTF-8" />

        <title>Email Verification</title>
      </head>

      <body>

        <h2>Hello ${username},</h2>

        <p>
          Your verification OTP is:
        </p>

        <h1>
          ${otp}
        </h1>

        <p>
          This OTP will expire in 1 minutes.
        </p>

        <p>
          If you did not request this OTP,
          please ignore this email.
        </p>

      </body>

    </html>
  `
}