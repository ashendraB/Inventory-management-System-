import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getUser, updateUser } from "@/server/user-service";
import { updateUserSchema } from "@/lib/validation/user";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getUser(id);
    if (!existing) throw new ApiError(404, "User not found.");

    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    // Deactivating your own account would lock you out immediately with no
    // other admin able to fix it from this session.
    if (parsed.data.isActive === false && id === session.userId) {
      throw new ApiError(400, "You can't deactivate your own account.");
    }

    const user = await updateUser(id, parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_USER",
      entityType: "User",
      entityId: id,
      oldValue: existing,
      newValue: user,
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
