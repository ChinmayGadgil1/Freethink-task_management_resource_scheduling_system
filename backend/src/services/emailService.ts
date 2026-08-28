import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a password reset email with the reset link
 */
export async function sendPasswordResetEmail(
    toEmail: string,
    userName: string,
    token: string,
): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/#/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Freethink Project" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Reset your Freethink password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: #8b6fd8; margin-bottom: 8px;">Reset your password</h2>
                <p style="color: #374151;">Hi <strong>${userName}</strong>,</p>
                <p style="color: #374151;">We received a request to reset the password for your Freethink account.</p>
                <p style="color: #374151;">Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}"
                       style="background-color: #8b6fd8; color: white; padding: 12px 28px; border-radius: 8px;
                              text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #6b7280; font-size: 13px;">
                    Or copy and paste this link into your browser:<br/>
                    <a href="${resetUrl}" style="color: #8b6fd8;">${resetUrl}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will not be changed.
                </p>
            </div>
        `,
    });
}
