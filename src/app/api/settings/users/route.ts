import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listUsers, createUser } from "@/server/user-service";
import { createUserSchema } from "@/lib/validation/user";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const user = await createUser(parsed.data);
    await logAudit({
      userId: session.userId,
      action: "CREATE_USER",
      entityType: "User",
      entityId: user.id,
      newValue: user,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
