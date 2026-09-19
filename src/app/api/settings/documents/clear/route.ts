import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { clearDocumentsOlderThan } from "@/server/printing-service";
import { clearDocumentsSchema } from "@/lib/validation/printing";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = clearDocumentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const before = new Date(parsed.data.before);
    const cleared = await clearDocumentsOlderThan(before);
    await logAudit({
      userId: session.userId,
      action: "CLEAR_PRINTING_DOCUMENTS",
      entityType: "PrintingRecord",
      newValue: { before: parsed.data.before, cleared },
    });
    return NextResponse.json({ cleared });
  } catch (err) {
    return handleApiError(err);
  }
}
