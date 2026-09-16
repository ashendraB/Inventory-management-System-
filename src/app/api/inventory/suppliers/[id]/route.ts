import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError, ApiError } from "@/lib/api-auth";
import { getSupplier, updateSupplier } from "@/server/inventory-service";
import { updateSupplierSchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const { id } = await ctx.params;
    const existing = await getSupplier(id);
    if (!existing) throw new ApiError(404, "Supplier not found.");

    const body = await request.json().catch(() => null);
    const parsed = updateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const supplier = await updateSupplier(id, parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_SUPPLIER",
      entityType: "Supplier",
      entityId: supplier.id,
      oldValue: existing,
      newValue: supplier,
    });
    return NextResponse.json({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}
