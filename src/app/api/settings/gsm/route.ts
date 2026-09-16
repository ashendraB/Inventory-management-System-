import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listGsmTypes, createGsmType } from "@/server/paper-config-service";
import { createGsmTypeSchema } from "@/lib/validation/paper-config";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const gsmTypes = await listGsmTypes(includeInactive);
    return NextResponse.json({ gsmTypes });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createGsmTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const gsmType = await createGsmType(parsed.data.value);
    await logAudit({
      userId: session.userId,
      action: "CREATE_GSM",
      entityType: "GsmType",
      entityId: gsmType.id,
      newValue: gsmType,
    });
    return NextResponse.json({ gsmType }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
