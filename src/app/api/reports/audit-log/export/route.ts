import { NextRequest } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listAuditLogs } from "@/server/audit-service";
import { csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const { logs } = await listAuditLogs({
      entityType: sp.get("entityType") ?? undefined,
      action: sp.get("action") ?? undefined,
      search: sp.get("search") ?? undefined,
      page: 1,
      pageSize: 10000,
    });
    return csvResponse(
      "audit-log.csv",
      ["Date", "User", "Action", "Entity Type", "Entity ID"],
      logs.map((l) => [
        formatDate(l.createdAt),
        l.user?.name ?? "system",
        l.action,
        l.entityType ?? "",
        l.entityId ?? "",
      ])
    );
  } catch (err) {
    return handleApiError(err);
  }
}
