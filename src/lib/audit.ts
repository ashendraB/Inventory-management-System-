import "server-only";
import { prisma } from "@/lib/prisma";

interface AuditParams {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Fire-and-forget audit trail entry. Never throws into the caller's flow. */
export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue:
          params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null,
        newValue:
          params.newValue !== undefined ? JSON.stringify(params.newValue) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
