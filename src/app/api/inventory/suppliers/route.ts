import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listSuppliers, createSupplier } from "@/server/inventory-service";
import { createSupplierSchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";
    const suppliers = await listSuppliers(includeInactive);
    return NextResponse.json({ suppliers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const supplier = await createSupplier(parsed.data);
    await logAudit({
      userId: session.userId,
      action: "CREATE_SUPPLIER",
      entityType: "Supplier",
      entityId: supplier.id,
      newValue: supplier,
    });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
