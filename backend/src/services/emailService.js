/**
 * emailService.js
 * Sends transactional emails via Gmail SMTP using Nodemailer.
 * All credentials are read exclusively from environment variables.
 */

import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Validate required SMTP configuration at module load time
// ---------------------------------------------------------------------------
const REQUIRED_SMTP_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

function validateSmtpConfig() {
  const missing = REQUIRED_SMTP_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[EmailService] Missing required SMTP environment variables: ${missing.join(', ')}. ` +
        'Configure them in backend/.env and restart the server.'
    );
  }
}

// ---------------------------------------------------------------------------
// Build a reusable transporter (created once per module import)
// ---------------------------------------------------------------------------
function buildTransporter() {
  validateSmtpConfig();

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Helps Gmail SMTP connections be more reliable
    pool: false,
    tls: {
      // Do not fail on invalid certificates in dev; remove in strict prod
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

// Lazily initialise so the server still starts if .env is incomplete —
// the error surfaces only when someone actually tries to send an email.
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = buildTransporter();
  }
  return _transporter;
}

// ---------------------------------------------------------------------------
// Derive the "from" address
// Gmail SMTP requires the envelope sender to match the authenticated account.
// ---------------------------------------------------------------------------
function getFromAddress() {
  // SMTP_FROM="HerGuardian AI <sengar.bhoomi22@gmail.com>" (preferred)
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;

  const name = process.env.FROM_NAME || 'HerGuardian AI';
  const email = process.env.SMTP_USER; // must match the Gmail account
  return `"${name}" <${email}>`;
}

// ---------------------------------------------------------------------------
// HTML + plain-text password-reset email
// ---------------------------------------------------------------------------
function buildPasswordResetEmail({ name, resetUrl }) {
  const displayName = name && name !== 'undefined' ? name : 'there';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password — HerGuardian AI</title>
</head>
<body style="margin:0;padding:0;background:#FBF9F7;font-family:Arial,Helvetica,sans-serif;color:#1E1B18;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border:1px solid #EDE6E2;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#8C3737;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                🛡️ HerGuardian AI
              </h1>
              <p style="margin:6px 0 0;font-size:13px;color:#f0c8c8;">
                Your personal wellbeing companion
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1E1B18;">
                Password Reset Request
              </h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4F4A45;">
                Hello <strong>${displayName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4F4A45;">
                We received a request to reset the password for your HerGuardian AI account.
                Click the button below to choose a new password. This link is valid for
                <strong>15 minutes</strong>.
              </p>

              <!-- CTA button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#8C3737;color:#ffffff;text-decoration:none;
                              font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;
                              letter-spacing:0.3px;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#78726B;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#8C3737;">
                ${resetUrl}
              </p>

              <!-- Security notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:#FBF9F7;border:1px solid #EDE6E2;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#4F4A45;">
                      ⏱️ Link expires in 15 minutes
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#78726B;">
                      If you did not request a password reset, please ignore this email — your
                      account remains secure and no changes have been made.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #EDE6E2;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#78726B;">
                © 2026 HerGuardian AI · Empowering women through AI-driven guidance
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#A89E99;">
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `HerGuardian AI — Password Reset

Hello ${displayName},

We received a request to reset the password for your HerGuardian AI account.

Reset your password here (link valid for 15 minutes):
${resetUrl}

If you did not request this, please ignore this email. Your account is secure.

— HerGuardian AI Team`;

  return { html, text };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a password-reset email to the specified address.
 *
 * @param {object} opts
 * @param {string} opts.to        - Recipient email address
 * @param {string} opts.name      - Recipient display name
 * @param {string} opts.resetUrl  - Full password-reset URL (constructed server-side)
 * @returns {Promise<object>}     - Nodemailer send info
 * @throws {Error}                - If SMTP configuration is missing or delivery fails
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = getTransporter();
  const from = getFromAddress();
  const { html, text } = buildPasswordResetEmail({ name, resetUrl });

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Reset your HerGuardian AI password',
    html,
    text,
  });

  console.log(
    `[EmailService] Password-reset email delivered to ${to} — Message-ID: ${info.messageId}`
  );

  return info;
};
