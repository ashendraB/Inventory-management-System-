import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listCategories, createCategory } from "@/server/inventory-service";
import { createCategorySchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const categories = await listCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const category = await createCategory(parsed.data);
    await logAudit({
      userId: session.userId,
      action: "CREATE_CATEGORY",
      entityType: "InventoryCategory",
      entityId: category.id,
      newValue: category,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
