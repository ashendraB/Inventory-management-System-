import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import {
  listInventoryItems,
  createGenericInventoryItem,
  createPaperInventoryItem,
  getCategory,
  type InventoryItemFilters,
} from "@/server/inventory-service";
import { createInventoryItemSchema } from "@/lib/validation/inventory";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const sp = request.nextUrl.searchParams;
    const filters: InventoryItemFilters = {
      search: sp.get("search") ?? undefined,
      categoryId: sp.get("categoryId") ?? undefined,
      status: (sp.get("status") as "ACTIVE" | "INACTIVE") ?? undefined,
      supplierId: sp.get("supplierId") ?? undefined,
      sort: (sp.get("sort") as InventoryItemFilters["sort"]) ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    };
    const result = await listInventoryItems(filters);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Both Administrator and Inventory Operator may add items (spec §4);
    // only Administrator may later edit/deactivate them.
    const session = await requireRole(["ADMINISTRATOR", "INVENTORY_OPERATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createInventoryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const category = await getCategory(parsed.data.categoryId);
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 400 });
    }
    const isPaperCategory = category.name.toLowerCase() === "paper";
    if (parsed.data.kind === "paper" && !isPaperCategory) {
      return NextResponse.json(
        { error: `"${category.name}" is not the Paper category.` },
        { status: 400 }
      );
    }
    if (parsed.data.kind === "generic" && isPaperCategory) {
      return NextResponse.json(
        { error: "Paper items must be entered using packs, not a plain count." },
        { status: 400 }
      );
    }

    const item =
      parsed.data.kind === "paper"
        ? await createPaperInventoryItem(parsed.data, session.userId)
        : await createGenericInventoryItem(parsed.data, session.userId);

    await logAudit({
      userId: session.userId,
      action: "CREATE_INVENTORY_ITEM",
      entityType: "InventoryItem",
      entityId: item.id,
      newValue: item,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
