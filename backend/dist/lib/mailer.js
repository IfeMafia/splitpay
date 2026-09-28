"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
let transporter = null;
if (env_1.env.SMTP_HOST && env_1.env.SMTP_USER && env_1.env.SMTP_PASS) {
    transporter = nodemailer_1.default.createTransport({
        host: env_1.env.SMTP_HOST,
        port: env_1.env.SMTP_PORT ?? 587,
        secure: env_1.env.SMTP_PORT === 465,
        auth: {
            user: env_1.env.SMTP_USER,
            pass: env_1.env.SMTP_PASS,
        },
    });
}
async function sendEmail({ to, subject, html, text, }) {
    if (transporter) {
        try {
            await transporter.sendMail({
                from: env_1.env.SMTP_FROM,
                to,
                subject,
                html,
                text,
            });
            return;
        }
        catch (err) {
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
//# sourceMappingURL=mailer.js.map