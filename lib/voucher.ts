/**
 * Gift voucher code generator.
 *
 * Format: GIFT-XXXX-XXXX
 * Characters: uppercase alphanumeric, excluding visually ambiguous chars:
 *   0 (zero), O (capital o), 1 (one), I (capital i), L (capital l)
 */

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateVoucherCode(): string {
  const segment = (len: number): string => {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    return result;
  };

  return `GIFT-${segment(4)}-${segment(4)}`;
}
