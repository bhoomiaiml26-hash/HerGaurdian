import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

try {
  await t.verify();
  console.log('[SMTP TEST] Connection verified — Gmail SMTP is ready.');
} catch (err) {
  console.error('[SMTP TEST] Connection failed:', err.message);
  process.exit(1);
}
