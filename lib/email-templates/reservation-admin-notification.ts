import { escapeHtml, emailShell, ctaButton } from './helpers';
import { EmailTemplate } from './reservation-confirmation';

export interface ReservationAdminNotificationParams {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  categoryName: string;
  sessionDate: Date | null;
  quantity: number;
  adminUrl: string;
}

export function buildReservationAdminNotificationEmail(
  params: ReservationAdminNotificationParams,
): EmailTemplate {
  const { customerName, customerEmail, customerPhone, categoryName, sessionDate, quantity, adminUrl } = params;

  const dateLabel = sessionDate ? sessionDate.toDateString() : null;

  const bodyHtml = `
    <h2>New paid reservation</h2>
    <p><strong>Name:</strong> ${escapeHtml(customerName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(customerPhone ?? '—')}</p>
    ${categoryName ? `<p><strong>Workshop:</strong> ${escapeHtml(categoryName)}</p>` : ''}
    ${dateLabel ? `<p><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>` : ''}
    <p><strong>Participants:</strong> ${quantity}</p>
    ${ctaButton(adminUrl, 'View in admin panel')}
  `;

  const text = [
    'New paid reservation',
    '',
    `Name: ${customerName}`,
    `Email: ${customerEmail}`,
    `Phone: ${customerPhone ?? '—'}`,
    categoryName ? `Workshop: ${categoryName}` : '',
    dateLabel ? `Date: ${dateLabel}` : '',
    `Participants: ${quantity}`,
    '',
    adminUrl,
  ]
    .filter((line) => line !== null)
    .join('\n');

  return {
    subject: `New reservation from ${customerName}`,
    html: emailShell(bodyHtml),
    text,
  };
}
