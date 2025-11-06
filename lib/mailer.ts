import nodemailer from 'nodemailer';
import { logger } from './logger';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
const tlsServername = process.env.SMTP_TLS_SERVERNAME; // e.g., provider host when cert CN doesn't match SMTP_HOST
const tlsRejectUnauthorizedEnv = process.env.SMTP_TLS_REJECT_UNAUTHORIZED; // 'false' to bypass (not recommended)
const tlsRejectUnauthorized =
  typeof tlsRejectUnauthorizedEnv === 'string'
    ? tlsRejectUnauthorizedEnv.toLowerCase() !== 'false'
    : undefined;

export function hasSmtpConfig() {
  return !!(host && user && pass);
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!hasSmtpConfig()) {
    logger.smtpWarning('SMTP not configured; skipping email send');
    return;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for 587/25
      auth: { user, pass },
      tls: {
        ...(tlsServername ? { servername: tlsServername } : {}),
        ...(typeof tlsRejectUnauthorized === 'boolean' ? { rejectUnauthorized: tlsRejectUnauthorized } : {}),
      },
    });
    
    await transporter.sendMail({ from, ...opts });
    logger.info('Email sent successfully', { to: opts.to, subject: opts.subject });
  } catch (error) {
    logger.emailError('sendMail', error as Error, { to: opts.to, subject: opts.subject });
    throw error; // Re-throw for upstream handling
  }
}
