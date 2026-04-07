export { resolveLocale, localeFromAcceptLanguage, DEFAULT_LOCALE } from './locale';
export type { Locale } from './locale';

export { buildReservationConfirmationEmail } from './reservation-confirmation';
export type { ReservationConfirmationParams } from './reservation-confirmation';
export type { EmailTemplate } from './reservation-confirmation';

export { buildReservationReminderEmail } from './reservation-reminder';
export type { ReservationReminderParams } from './reservation-reminder';

export {
  buildGiftVoucherPurchaserEmail,
  buildGiftVoucherRecipientEmail,
  buildRefundNotificationEmail,
} from './gift-voucher';
export type {
  GiftVoucherPurchaserParams,
  GiftVoucherRecipientParams,
  RefundNotificationParams,
} from './gift-voucher';
