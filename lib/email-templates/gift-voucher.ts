import { Locale } from './locale';
import { escapeHtml, emailShell } from './helpers';
import { EmailTemplate } from './reservation-confirmation';

// ─── Purchaser confirmation ──────────────────────────────────────────────────

export interface GiftVoucherPurchaserParams {
  purchaserName: string;
  voucherCode: string;
  amountLabel: string;
  expiryLabel: string;
  locale?: Locale;
}

type PurchaserStrings = {
  subject: string;
  greeting: (name: string) => string;
  thanks: string;
  code: string;
  value: string;
  validUntil: string;
  usage: string;
  closing: string;
};

const purchaserStrings: Record<Locale, PurchaserStrings> = {
  nl: {
    subject: 'Uw cadeaubon is klaar!',
    greeting: (name) => `Hallo ${name},`,
    thanks: 'Bedankt voor het kopen van een cadeaubon. Dit zijn de details:',
    code: 'Boncode',
    value: 'Waarde',
    validUntil: 'Geldig tot',
    usage: 'Deze bon kan worden gebruikt bij het afrekenen van een workshop.',
    closing: 'Geniet ervan!',
  },
  en: {
    subject: 'Your gift voucher is ready!',
    greeting: (name) => `Hi ${name},`,
    thanks: 'Thank you for purchasing a gift voucher. Here are the details:',
    code: 'Voucher Code',
    value: 'Value',
    validUntil: 'Valid Until',
    usage: 'This voucher can be applied at checkout when booking a workshop.',
    closing: 'Enjoy!',
  },
  tr: {
    subject: 'Hediye çekiniz hazır!',
    greeting: (name) => `Merhaba ${name},`,
    thanks: 'Hediye çeki satın aldığınız için teşekkürler. İşte detaylar:',
    code: 'Çek Kodu',
    value: 'Değer',
    validUntil: 'Geçerlilik Tarihi',
    usage: 'Bu çeki bir atölye rezervasyonunda ödeme sırasında kullanabilirsiniz.',
    closing: 'İyi eğlenceler!',
  },
};

export function buildGiftVoucherPurchaserEmail(
  params: GiftVoucherPurchaserParams,
): EmailTemplate {
  const { purchaserName, voucherCode, amountLabel, expiryLabel, locale = 'nl' } = params;
  const t = purchaserStrings[locale];

  const bodyHtml = `
    <p>${escapeHtml(t.greeting(purchaserName))}</p>
    <p>${escapeHtml(t.thanks)}</p>
    <p><strong>${escapeHtml(t.code)}:</strong> <span style="font-size:1.2em;letter-spacing:0.1em;">${escapeHtml(voucherCode)}</span></p>
    <p><strong>${escapeHtml(t.value)}:</strong> ${escapeHtml(amountLabel)}</p>
    <p><strong>${escapeHtml(t.validUntil)}:</strong> ${escapeHtml(expiryLabel)}</p>
    <p>${escapeHtml(t.usage)}</p>
    <p>${escapeHtml(t.closing)}</p>
  `;

  const text = [
    t.greeting(purchaserName),
    '',
    t.thanks,
    `${t.code}: ${voucherCode}`,
    `${t.value}: ${amountLabel}`,
    `${t.validUntil}: ${expiryLabel}`,
    '',
    t.usage,
    t.closing,
  ].join('\n');

  return {
    subject: t.subject,
    html: emailShell(bodyHtml),
    text,
  };
}

// ─── Recipient gift email ────────────────────────────────────────────────────

export interface GiftVoucherRecipientParams {
  senderName: string;
  voucherCode: string;
  amountLabel: string;
  expiryLabel: string;
  locale?: Locale;
}

type RecipientStrings = {
  subject: string;
  greeting: string;
  intro: (senderName: string) => string;
  code: string;
  value: string;
  validUntil: string;
  usage: string;
  closing: string;
};

const recipientStrings: Record<Locale, RecipientStrings> = {
  nl: {
    subject: 'U heeft een cadeaubon ontvangen!',
    greeting: 'Hallo,',
    intro: (senderName) => `${senderName} heeft u een cadeaubon gestuurd voor een workshop!`,
    code: 'Boncode',
    value: 'Waarde',
    validUntil: 'Geldig tot',
    usage: 'Gebruik deze code bij het afrekenen van uw workshop.',
    closing: 'Geniet ervan!',
  },
  en: {
    subject: "You've received a gift voucher!",
    greeting: 'Hi there,',
    intro: (senderName) => `${senderName} has sent you a gift voucher for a workshop!`,
    code: 'Voucher Code',
    value: 'Value',
    validUntil: 'Valid Until',
    usage: 'Use this code at checkout when booking your workshop.',
    closing: 'Enjoy!',
  },
  tr: {
    subject: 'Bir hediye çeki aldınız!',
    greeting: 'Merhaba,',
    intro: (senderName) => `${senderName} size bir atölye için hediye çeki gönderdi!`,
    code: 'Çek Kodu',
    value: 'Değer',
    validUntil: 'Geçerlilik Tarihi',
    usage: 'Bu kodu atölye rezervasyonunuzu yaparken kullanın.',
    closing: 'İyi eğlenceler!',
  },
};

export function buildGiftVoucherRecipientEmail(
  params: GiftVoucherRecipientParams,
): EmailTemplate {
  const { senderName, voucherCode, amountLabel, expiryLabel, locale = 'nl' } = params;
  const t = recipientStrings[locale];

  const bodyHtml = `
    <p>${escapeHtml(t.greeting)}</p>
    <p>${escapeHtml(t.intro(senderName))}</p>
    <p><strong>${escapeHtml(t.code)}:</strong> <span style="font-size:1.2em;letter-spacing:0.1em;">${escapeHtml(voucherCode)}</span></p>
    <p><strong>${escapeHtml(t.value)}:</strong> ${escapeHtml(amountLabel)}</p>
    <p><strong>${escapeHtml(t.validUntil)}:</strong> ${escapeHtml(expiryLabel)}</p>
    <p>${escapeHtml(t.usage)}</p>
    <p>${escapeHtml(t.closing)}</p>
  `;

  const text = [
    t.greeting,
    '',
    t.intro(senderName),
    `${t.code}: ${voucherCode}`,
    `${t.value}: ${amountLabel}`,
    `${t.validUntil}: ${expiryLabel}`,
    '',
    t.usage,
    t.closing,
  ].join('\n');

  return {
    subject: t.subject,
    html: emailShell(bodyHtml),
    text,
  };
}

// ─── Refund notification ─────────────────────────────────────────────────────

export interface RefundNotificationParams {
  customerName: string;
  quantity: number;
  locale?: Locale;
}

type RefundStrings = {
  subject: string;
  greeting: (name: string) => string;
  body: string;
  participants: string;
};

const refundStrings: Record<Locale, RefundStrings> = {
  nl: {
    subject: 'Uw terugbetaling is voltooid',
    greeting: (name) => `Hallo ${name},`,
    body: 'Uw terugbetaling is verwerkt. Het kan een paar dagen duren voordat het op uw afschrift verschijnt.',
    participants: 'Deelnemers',
  },
  en: {
    subject: 'Your refund has been completed',
    greeting: (name) => `Hi ${name},`,
    body: 'Your refund has been completed. It may take a few days for it to appear on your statement.',
    participants: 'Participants',
  },
  tr: {
    subject: 'İadeniz tamamlandı',
    greeting: (name) => `Merhaba ${name},`,
    body: 'İadeniz tamamlandı. Hesap ekstrenizde görünmesi birkaç gün sürebilir.',
    participants: 'Katılımcılar',
  },
};

export function buildRefundNotificationEmail(
  params: RefundNotificationParams,
): EmailTemplate {
  const { customerName, quantity, locale = 'nl' } = params;
  const t = refundStrings[locale];

  const bodyHtml = `
    <p>${escapeHtml(t.greeting(customerName))}</p>
    <p>${escapeHtml(t.body)}</p>
    <p><strong>${escapeHtml(t.participants)}:</strong> ${quantity}</p>
  `;

  const text = [t.greeting(customerName), '', t.body, `${t.participants}: ${quantity}`].join('\n');

  return {
    subject: t.subject,
    html: emailShell(bodyHtml),
    text,
  };
}
