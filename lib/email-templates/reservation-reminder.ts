import { Locale } from './locale';
import { escapeHtml, emailShell } from './helpers';
import { EmailTemplate } from './reservation-confirmation';

export interface ReservationReminderParams {
  customerName: string;
  categoryName: string;
  sessionDate: Date;
  startTime: Date;
  endTime: Date;
  quantity: number;
  location?: string | null;
  locale?: Locale;
}

type Strings = {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  workshop: string;
  date: string;
  time: string;
  location: string;
  participants: string;
  closing: string;
};

const strings: Record<Locale, Strings> = {
  nl: {
    subject: 'Herinnering: Uw workshop morgen',
    greeting: (name) => `Hallo ${name},`,
    intro: 'Dit is een vriendelijke herinnering dat uw workshop <strong>morgen</strong> plaatsvindt.',
    workshop: 'Workshop',
    date: 'Datum',
    time: 'Tijd',
    location: 'Locatie',
    participants: 'Deelnemers',
    closing: 'We kijken ernaar uit u te ontmoeten!',
  },
  en: {
    subject: 'Reminder: Your workshop tomorrow',
    greeting: (name) => `Hi ${name},`,
    intro: 'This is a friendly reminder that your workshop is <strong>tomorrow</strong>.',
    workshop: 'Workshop',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    participants: 'Participants',
    closing: 'We look forward to seeing you!',
  },
  tr: {
    subject: 'Hatırlatma: Yarınki atölyeniz',
    greeting: (name) => `Merhaba ${name},`,
    intro: 'Atölyenizin <strong>yarın</strong> gerçekleşeceğini hatırlatmak istedik.',
    workshop: 'Atölye',
    date: 'Tarih',
    time: 'Saat',
    location: 'Konum',
    participants: 'Katılımcılar',
    closing: 'Sizi görmek için sabırsızlanıyoruz!',
  },
};

export function buildReservationReminderEmail(
  params: ReservationReminderParams,
): EmailTemplate {
  const { customerName, categoryName, sessionDate, startTime, endTime, quantity, location, locale = 'nl' } = params;
  const t = strings[locale];

  const dateLabel = sessionDate.toDateString();
  const startLabel = startTime.toUTCString().slice(17, 22);
  const endLabel = endTime.toUTCString().slice(17, 22);

  const bodyHtml = `
    <p>${escapeHtml(t.greeting(customerName))}</p>
    <p>${t.intro}</p>
    <p><strong>${escapeHtml(t.workshop)}:</strong> ${escapeHtml(categoryName)}</p>
    <p><strong>${escapeHtml(t.date)}:</strong> ${escapeHtml(dateLabel)}</p>
    <p><strong>${escapeHtml(t.time)}:</strong> ${escapeHtml(startLabel)} – ${escapeHtml(endLabel)}</p>
    ${location ? `<p><strong>${escapeHtml(t.location)}:</strong> ${escapeHtml(location)}</p>` : ''}
    <p><strong>${escapeHtml(t.participants)}:</strong> ${quantity}</p>
    <p>${escapeHtml(t.closing)}</p>
  `;

  const text = [
    t.greeting(customerName),
    '',
    t.intro.replace(/<[^>]+>/g, ''),
    `${t.workshop}: ${categoryName}`,
    `${t.date}: ${dateLabel}`,
    `${t.time}: ${startLabel} – ${endLabel}`,
    location ? `${t.location}: ${location}` : '',
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
