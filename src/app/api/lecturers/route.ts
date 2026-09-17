import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listLecturers, createLecturer } from "@/server/lecturer-service";
import { createLecturerSchema } from "@/lib/validation/lecturer";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";
    const lecturers = await listLecturers(includeInactive);
    return NextResponse.json({ lecturers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createLecturerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const lecturer = await createLecturer(parsed.data);
    await logAudit({
      userId: session.userId,
      action: "CREATE_LECTURER",
      entityType: "Lecturer",
      entityId: lecturer.id,
      newValue: lecturer,
    });
    return NextResponse.json({ lecturer }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
