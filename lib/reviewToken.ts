import { createHmac, timingSafeEqual } from 'crypto';

const REVIEW_TOKEN_SECRET = process.env.REVIEW_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'review-token-fallback-secret-change-me';
const REVIEW_TOKEN_TTL_DAYS = 30;

/**
 * Generate a signed review token for a given reservationId.
 * Format: <reservationId>.<expiryTimestamp>.<signature>
 */
export function generateReviewToken(reservationId: number): string {
  const expiresAt = Date.now() + REVIEW_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${reservationId}.${expiresAt}`;
  const sig = createHmac('sha256', REVIEW_TOKEN_SECRET).update(payload).digest('hex');
  // Base64url-encode the full token for safe URL inclusion
  const raw = `${payload}.${sig}`;
  return Buffer.from(raw).toString('base64url');
}

export interface ReviewTokenPayload {
  reservationId: number;
  expiresAt: number;
}

/**
 * Validate a review token.
 * Returns the decoded payload, or null if invalid/expired.
 */
export function validateReviewToken(token: string): ReviewTokenPayload | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split('.');
    if (parts.length !== 3) return null;

    const [idStr, expiryStr, sig] = parts;
    const payload = `${idStr}.${expiryStr}`;
    const expectedSig = createHmac('sha256', REVIEW_TOKEN_SECRET).update(payload).digest('hex');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const expiresAt = parseInt(expiryStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

    const reservationId = parseInt(idStr, 10);
    if (isNaN(reservationId)) return null;

    return { reservationId, expiresAt };
  } catch {
    return null;
  }
}
