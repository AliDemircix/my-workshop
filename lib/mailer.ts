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

export interface WaitlistNotificationParams {
  to: string;
  customerName: string;
  categoryName: string;
  sessionDate: Date;
  startTime: Date;
  endTime: Date;
  bookingUrl: string;
}

export async function sendWaitlistNotificationEmail(params: WaitlistNotificationParams): Promise<void> {
  const { to, customerName, categoryName, sessionDate, startTime, endTime, bookingUrl } = params;

  const dateLabel = sessionDate.toDateString();
  const startLabel = startTime.toUTCString().slice(17, 22);
  const endLabel = endTime.toUTCString().slice(17, 22);

  const subject = 'A spot opened up for your workshop!';
  const html = `
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Great news! A spot has just opened up for a workshop you were waitlisted for.</p>
    <p><strong>Workshop:</strong> ${escapeHtml(categoryName)}</p>
    <p><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
    <p><strong>Time:</strong> ${escapeHtml(startLabel)} – ${escapeHtml(endLabel)}</p>
    <p>
      <a href="${escapeHtml(bookingUrl)}" style="display:inline-block;background:#c99706;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Book your spot now
      </a>
    </p>
    <p style="color:#888;font-size:0.85em;">This spot may not last long — book soon to secure your place!</p>
  `;

  await sendMail({ to, subject, html });
}

export interface ReviewRequestEmailParams {
  to: string;
  customerName: string;
  categoryName: string;
  sessionDate: Date;
  reviewToken: string;
}

export async function sendReviewRequestEmail(params: ReviewRequestEmailParams): Promise<void> {
  const { to, customerName, categoryName, sessionDate, reviewToken } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const reviewUrl = `${appUrl}/review?token=${encodeURIComponent(reviewToken)}`;
  const dateLabel = sessionDate.toDateString();

  const subject = `How was your ${escapeHtml(categoryName)} workshop?`;
  const html = `
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>We hope you enjoyed your <strong>${escapeHtml(categoryName)}</strong> workshop on ${escapeHtml(dateLabel)}!</p>
    <p>We would love to hear what you thought. It only takes a minute:</p>
    <p>
      <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#c99706;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Leave a review
      </a>
    </p>
    <p style="color:#888;font-size:0.85em;">This link is personal to you and expires in 30 days.</p>
  `;

  await sendMail({ to, subject, html });
}

export interface PrivateEventClosedEmailParams {
  to: string;
  customerName: string;
  categoryName?: string | null;
  message?: string | null;
}

export async function sendPrivateEventClosedEmail(params: PrivateEventClosedEmailParams): Promise<void> {
  const { to, customerName, categoryName, message } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const subject = 'Update on your private event inquiry';
  const html = `
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Thank you for your interest in booking a private event${categoryName ? ` for <strong>${escapeHtml(categoryName)}</strong>` : ''}.</p>
    <p>We wanted to let you know that your inquiry has been reviewed and is now closed.</p>
    ${message ? `<p><strong>Message from us:</strong> ${escapeHtml(message)}</p>` : ''}
    <p>If you have any questions or would like to discuss further, feel free to reach out or submit a new inquiry.</p>
    <p>
      <a href="${escapeHtml(appUrl)}/private-event" style="display:inline-block;background:#c99706;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Submit a new inquiry
      </a>
    </p>
    <p>Thank you for considering us!</p>
  `;

  await sendMail({ to, subject, html });
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
