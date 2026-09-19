import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listGrades, createGrade } from "@/server/paper-config-service";
import { createGradeSchema } from "@/lib/validation/paper-config";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const grades = await listGrades(includeInactive);
    return NextResponse.json({ grades });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createGradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const grade = await createGrade(parsed.data.name);
    await logAudit({
      userId: session.userId,
      action: "CREATE_GRADE",
      entityType: "Grade",
      entityId: grade.id,
      newValue: grade,
    });
    return NextResponse.json({ grade }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
