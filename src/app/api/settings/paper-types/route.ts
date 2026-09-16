import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listPaperTypes, createPaperType } from "@/server/paper-config-service";
import { createPaperTypeSchema } from "@/lib/validation/paper-config";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const paperTypes = await listPaperTypes(includeInactive);
    return NextResponse.json({ paperTypes });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createPaperTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const paperType = await createPaperType(parsed.data.name);
    await logAudit({
      userId: session.userId,
      action: "CREATE_PAPER_TYPE",
      entityType: "PaperType",
      entityId: paperType.id,
      newValue: paperType,
    });
    return NextResponse.json({ paperType }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
