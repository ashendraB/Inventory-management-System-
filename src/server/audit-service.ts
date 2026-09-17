import "server-only";
import { prisma } from "@/lib/prisma";

export interface AuditLogFilters {
  entityType?: string;
  action?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 50;

  const where = {
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.action && { action: filters.action }),
    ...(filters.search && {
      OR: [
        { action: { contains: filters.search } },
        { entityId: { contains: filters.search } },
      ],
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAuditActions() {
  const rows = await prisma.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });
  return rows.map((r) => r.action);
}

export async function listAuditEntityTypes() {
  const rows = await prisma.auditLog.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    where: { entityType: { not: null } },
    orderBy: { entityType: "asc" },
  });
  return rows.map((r) => r.entityType!).filter(Boolean);
}
