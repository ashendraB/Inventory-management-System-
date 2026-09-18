import { NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listCategories } from "@/server/inventory-service";

// Categories are a fixed set (Paper, Office Supplies, Tec Item, Others) —
// seeded once, not user-creatable. This route is read-only.
export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const categories = await listCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}
