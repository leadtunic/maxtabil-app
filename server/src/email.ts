import nodemailer from "nodemailer";
import { env } from "./env.js";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const isEmailConfigured = () =>
  Boolean(env.smtpHost && env.smtpPort && env.smtpFrom);

const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const secure = env.smtpPort === 465;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure,
    auth: env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
  });
};

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, text, html }: EmailPayload) => {
  if (!transporter) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html,
  });
};

export const assertEmailConfigured = () => {
  if (!isEmailConfigured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
};
