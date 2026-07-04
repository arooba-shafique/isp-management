import nodemailer from "nodemailer";
import { logger } from "./logger";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@ispsystem.com";

function createTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const transport = createTransport();
  if (!transport) {
    logger.warn("SMTP not configured — password reset email not sent");
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to,
      subject: "Password Reset - NetLink ISP",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Use the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
          <p style="margin-top: 24px;">Or copy this token: <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${resetToken}</code></p>
          <p style="color: #64748b; font-size: 12px;">This link expires in 1 hour.</p>
        </div>
      `,
    });
    logger.info({ to }, "Password reset email sent");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    return false;
  }
}
