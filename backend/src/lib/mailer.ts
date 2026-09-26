import nodemailer from 'nodemailer';
import { env } from '../config/env';

type Transporter = ReturnType<typeof nodemailer.createTransport>;
let transporter: Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
        text,
      });
      return;
    } catch (err) {
      console.error('[Mailer Error] Failed to send email via SMTP:', err);
    }
  }

  // Development fallback: Log email content to console
  console.log('--- [DEV EMAIL DISPATCHED] ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text || html}`);
  console.log('------------------------------');
}
