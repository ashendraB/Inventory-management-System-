import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listSubjects, createSubject } from "@/server/paper-config-service";
import { createSubjectSchema } from "@/lib/validation/paper-config";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]);
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const subjects = await listSubjects(includeInactive);
    return NextResponse.json({ subjects });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const subject = await createSubject(parsed.data.name);
    await logAudit({
      userId: session.userId,
      action: "CREATE_SUBJECT",
      entityType: "Subject",
      entityId: subject.id,
      newValue: subject,
    });
    return NextResponse.json({ subject }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
