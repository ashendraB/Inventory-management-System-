import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { setPaperTypeActive } from "@/server/paper-config-service";
import { setActiveSchema } from "@/lib/validation/paper-config";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = setActiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    const paperType = await setPaperTypeActive(id, parsed.data.isActive);
    return NextResponse.json({ paperType });
  } catch (err) {
    return handleApiError(err);
  }
}
