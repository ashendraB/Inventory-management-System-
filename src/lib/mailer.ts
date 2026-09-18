import "server-only";
import nodemailer from "nodemailer";
import { ApiError } from "@/lib/api-auth";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new ApiError(
      503,
      "Email isn't configured yet. Ask an administrator to set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env."
    );
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMail(options: { to: string; subject: string; html: string }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await transporter.sendMail({ from, to: options.to, subject: options.subject, html: options.html });
  } catch {
    throw new ApiError(502, "Could not send the email. Check the SMTP settings and try again.");
  }
}
