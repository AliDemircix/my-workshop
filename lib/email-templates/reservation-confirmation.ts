import { Locale } from './locale';
import { escapeHtml, emailShell } from './helpers';

export interface ReservationConfirmationParams {
  customerName: string;
  categoryName: string;
  sessionDate: Date | null;
  quantity: number;
  locale?: Locale;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

type Strings = {
  subject: string;
  greeting: (name: string) => string;
  thanks: string;
  workshop: string;
  date: string;
  participants: string;
  closing: string;
};

const strings: Record<Locale, Strings> = {
  nl: {
    subject: 'Uw reservering is bevestigd',
    greeting: (name) => `Hallo ${name},`,
    thanks: 'Bedankt voor uw betaling. Uw reservering is bevestigd.',
    workshop: 'Workshop',
    date: 'Datum',
    participants: 'Deelnemers',
    closing: 'We kijken ernaar uit u te ontmoeten!',
  },
  en: {
    subject: 'Your reservation is confirmed',
    greeting: (name) => `Hi ${name},`,
    thanks: 'Thanks for your payment. Your reservation is confirmed.',
    workshop: 'Workshop',
    date: 'Date',
    participants: 'Participants',
    closing: 'We look forward to seeing you!',
  },
  tr: {
    subject: 'Rezervasyonunuz onaylandı',
    greeting: (name) => `Merhaba ${name},`,
    thanks: 'Ödemeniz için teşekkürler. Rezervasyonunuz onaylandı.',
    workshop: 'Atölye',
    date: 'Tarih',
    participants: 'Katılımcılar',
    closing: 'Sizi görmek için sabırsızlanıyoruz!',
  },
};

export function buildReservationConfirmationEmail(
  params: ReservationConfirmationParams,
): EmailTemplate {
  const { customerName, categoryName, sessionDate, quantity, locale = 'nl' } = params;
  const t = strings[locale];

  const dateLabel = sessionDate ? sessionDate.toDateString() : null;

  const bodyHtml = `
    <p>${escapeHtml(t.greeting(customerName))}</p>
    <p>${escapeHtml(t.thanks)}</p>
    ${
      categoryName
        ? `<p><strong>${escapeHtml(t.workshop)}:</strong> ${escapeHtml(categoryName)}</p>`
        : ''
    }
    ${dateLabel ? `<p><strong>${escapeHtml(t.date)}:</strong> ${escapeHtml(dateLabel)}</p>` : ''}
    <p><strong>${escapeHtml(t.participants)}:</strong> ${quantity}</p>
    <p>${escapeHtml(t.closing)}</p>
  `;

  const text = [
    t.greeting(customerName),
    '',
    t.thanks,
    categoryName ? `${t.workshop}: ${categoryName}` : '',
    dateLabel ? `${t.date}: ${dateLabel}` : '',
    `${t.participants}: ${quantity}`,
    '',
    t.closing,
  ]
    .filter((line) => line !== null)
    .join('\n');

  return {
    subject: t.subject,
    html: emailShell(bodyHtml),
    text,
  };
}
