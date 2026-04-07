import nodemailer from 'nodemailer';
import { logger } from './logger';

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

export interface MailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; attachments?: MailAttachment[] }) {
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

export interface ReminderEmailParams {
  to: string;
  customerName: string;
  categoryName: string;
  sessionDate: Date;
  startTime: Date;
  endTime: Date;
  quantity: number;
  location?: string | null;
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<void> {
  const { to, customerName, categoryName, sessionDate, startTime, endTime, quantity, location } = params;

  const dateLabel = sessionDate.toDateString();
  const startLabel = startTime.toUTCString().slice(17, 22); // "HH:MM"
  const endLabel = endTime.toUTCString().slice(17, 22);

  const subject = 'Reminder: Your workshop tomorrow';
  const html = `
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>This is a friendly reminder that your workshop is <strong>tomorrow</strong>.</p>
    <p><strong>Workshop:</strong> ${escapeHtml(categoryName)}</p>
    <p><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
    <p><strong>Time:</strong> ${escapeHtml(startLabel)} – ${escapeHtml(endLabel)}</p>
    ${location ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>` : ''}
    <p><strong>Participants:</strong> ${quantity}</p>
    <p>We look forward to seeing you!</p>
  `;

  await sendMail({ to, subject, html });
}
