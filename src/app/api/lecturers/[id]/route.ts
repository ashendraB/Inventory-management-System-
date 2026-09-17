import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getLecturer, updateLecturer } from "@/server/lecturer-service";
import { updateLecturerSchema } from "@/lib/validation/lecturer";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getLecturer(id);
    if (!existing) throw new ApiError(404, "Lecturer not found.");

    const body = await request.json().catch(() => null);
    const parsed = updateLecturerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const lecturer = await updateLecturer(id, parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_LECTURER",
      entityType: "Lecturer",
      entityId: lecturer.id,
      oldValue: existing,
      newValue: lecturer,
    });
    return NextResponse.json({ lecturer });
  } catch (err) {
    return handleApiError(err);
  }
}
