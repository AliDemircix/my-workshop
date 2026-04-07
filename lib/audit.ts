import { prisma } from '@/lib/prisma';

export async function logAction(
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await (prisma as any).auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    // Audit failures must never crash the main operation
    console.error('[audit] Failed to write audit log:', err);
  }
}
