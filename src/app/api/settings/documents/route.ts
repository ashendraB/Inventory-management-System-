import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { getStoredDocumentsStats, listStoredDocuments } from "@/server/printing-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const sp = request.nextUrl.searchParams;
    const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
    const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;
    const [stats, documents] = await Promise.all([
      getStoredDocumentsStats(),
      listStoredDocuments({ from, to }),
    ]);
    return NextResponse.json({ stats, documents });
  } catch (err) {
    return handleApiError(err);
  }
}
