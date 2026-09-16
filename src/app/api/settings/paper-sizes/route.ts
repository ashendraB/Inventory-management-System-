import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listPaperSizes, createPaperSize } from "@/server/paper-config-service";
import { createPaperSizeSchema } from "@/lib/validation/paper-config";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const paperSizes = await listPaperSizes(includeInactive);
    return NextResponse.json({ paperSizes });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createPaperSizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const paperSize = await createPaperSize(parsed.data.name);
    await logAudit({
      userId: session.userId,
      action: "CREATE_PAPER_SIZE",
      entityType: "PaperSize",
      entityId: paperSize.id,
      newValue: paperSize,
    });
    return NextResponse.json({ paperSize }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
