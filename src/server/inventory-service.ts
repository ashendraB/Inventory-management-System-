import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import { ApiError } from "@/lib/api-auth";
import type { z } from "zod";
import type { Prisma } from "@prisma/client";
import type {
  createGenericItemSchema,
  createPaperItemSchema,
  updateInventoryItemSchema,
  adjustItemQuantitySchema,
  createSupplierSchema,
  updateSupplierSchema,
  createCategorySchema,
} from "@/lib/validation/inventory";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories() {
  return prisma.inventoryCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getCategory(id: string) {
  return prisma.inventoryCategory.findUnique({ where: { id } });
}

export async function createCategory(
  data: z.infer<typeof createCategorySchema>
) {
  return prisma.inventoryCategory.create({ data: { name: data.name } });
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function listSuppliers(includeInactive = false) {
  return prisma.supplier.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({ where: { id } });
}

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

export async function createSupplier(
  data: z.infer<typeof createSupplierSchema>
) {
  return prisma.supplier.create({
    data: {
      name: data.name,
      contactPerson: cleanOptional(data.contactPerson),
      phone: cleanOptional(data.phone),
      email: cleanOptional(data.email),
      address: cleanOptional(data.address),
      notes: cleanOptional(data.notes),
    },
  });
}

export async function updateSupplier(
  id: string,
  data: z.infer<typeof updateSupplierSchema>
) {
  return prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.contactPerson !== undefined && {
        contactPerson: cleanOptional(data.contactPerson),
      }),
      ...(data.phone !== undefined && { phone: cleanOptional(data.phone) }),
      ...(data.email !== undefined && { email: cleanOptional(data.email) }),
      ...(data.address !== undefined && {
        address: cleanOptional(data.address),
      }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

// ---------------------------------------------------------------------------
// Inventory items
// ---------------------------------------------------------------------------

export interface InventoryItemFilters {
  search?: string;
  categoryId?: string;
  status?: "ACTIVE" | "INACTIVE";
  supplierId?: string;
  sort?: "name" | "quantity" | "price" | "date";
  page?: number;
  pageSize?: number;
}

export async function listInventoryItems(filters: InventoryItemFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;

  const where = {
    deletedAt: null,
    ...(filters.status && { status: filters.status }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.supplierId && { supplierId: filters.supplierId }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search } },
        { itemCode: { contains: filters.search } },
        { barcode: { contains: filters.search } },
      ],
    }),
  };

  const orderBy =
    filters.sort === "price"
      ? { defaultPrice: "desc" as const }
      : filters.sort === "date"
        ? { createdAt: "desc" as const }
        : { name: "asc" as const };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        supplier: true,
        lots: { select: { currentQuantity: true, status: true } },
      },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      totalStock: totalStockOf(item),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Lot quantities are the source of truth once an item has lots (always true
 * for paper); otherwise fall back to the item's own simple count. Finished
 * and inactive lots are excluded — their stock is retired, not available,
 * even though we keep their currentQuantity around as a historical record. */
export function totalStockOf(item: {
  currentQuantity: number;
  lots: { currentQuantity: number; status: string }[];
}) {
  return item.lots.length > 0
    ? item.lots
        .filter((l) => l.status !== "FINISHED" && l.status !== "INACTIVE")
        .reduce((sum, l) => sum + l.currentQuantity, 0)
    : item.currentQuantity;
}

export async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      supplier: true,
      paperSize: true,
      gsm: true,
      paperType: true,
      lots: { orderBy: { createdAt: "desc" } },
    },
  });
}

async function generateItemCode(tx: Prisma.TransactionClient) {
  const seq = await nextSequence("inventory_item", tx);
  return `INV-${padSequence(seq)}`;
}

export async function createGenericInventoryItem(
  data: z.infer<typeof createGenericItemSchema>,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const itemCode = await generateItemCode(tx);
    const item = await tx.inventoryItem.create({
      data: {
        itemCode,
        barcode: itemCode, // Code128-compatible; scanning it looks up this same record.
        name: data.name,
        categoryId: data.categoryId,
        description: cleanOptional(data.description),
        brand: cleanOptional(data.brand),
        unit: "Unit",
        minStock: data.minStock ?? 0,
        defaultPrice: data.defaultPrice ?? 0,
        currentQuantity: data.currentQuantity ?? 0,
        supplierId: cleanOptional(data.supplierId),
        location: cleanOptional(data.location),
        notes: cleanOptional(data.notes),
      },
    });

    if (data.currentQuantity > 0) {
      await tx.stockTransaction.create({
        data: {
          type: "PURCHASE",
          inventoryItemId: item.id,
          quantityChange: data.currentQuantity,
          previousQuantity: 0,
          newQuantity: data.currentQuantity,
          userId,
          reason: "Initial stock on item creation",
        },
      });
    }

    return item;
  });
}

/** Paper items are entered as packs and immediately get one stock lot —
 * paper's per-sheet cost must always come from a real lot (see docs/spec.md,
 * "Historical price protection"), never a plain item-level price field. */
export async function createPaperInventoryItem(
  data: z.infer<typeof createPaperItemSchema>,
  userId: string
) {
  const totalSheets = data.packs * data.sheetsPerPack;
  const costPerSheet = (data.packPrice / data.sheetsPerPack).toFixed(4);

  return prisma.$transaction(async (tx) => {
    const itemCode = await generateItemCode(tx);
    const item = await tx.inventoryItem.create({
      data: {
        itemCode,
        barcode: itemCode,
        name: data.name,
        categoryId: data.categoryId,
        description: cleanOptional(data.description),
        unit: "Sheet",
        defaultPrice: costPerSheet,
        currentQuantity: 0, // stock lives on the lot, not this field
        supplierId: cleanOptional(data.supplierId),
        location: cleanOptional(data.location),
        notes: cleanOptional(data.notes),
        paperSizeId: data.paperSizeId,
        gsmId: data.gsmId,
        paperTypeId: data.paperTypeId,
      },
    });

    const lotSeq = await nextSequence(`lot:${item.id}`, tx);
    const lotCode = `${itemCode}-LOT-${padSequence(lotSeq, 3)}`;

    const lot = await tx.inventoryLot.create({
      data: {
        lotCode,
        barcode: lotCode,
        inventoryItemId: item.id,
        quantityPurchased: totalSheets,
        currentQuantity: totalSheets,
        costPerSheet,
        supplierId: cleanOptional(data.supplierId),
        location: cleanOptional(data.location),
        status: "ACTIVE",
        isActiveStock: true,
        notes: `${data.packs} pack(s) × ${data.sheetsPerPack} sheets @ Rs. ${data.packPrice}/pack`,
      },
    });

    await tx.stockTransaction.create({
      data: {
        type: "PURCHASE",
        inventoryItemId: item.id,
        lotId: lot.id,
        quantityChange: totalSheets,
        previousQuantity: 0,
        newQuantity: totalSheets,
        userId,
        reason: "Initial stock on item creation",
      },
    });

    return item;
  });
}

export async function updateInventoryItem(
  id: string,
  data: z.infer<typeof updateInventoryItemSchema>
) {
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.description !== undefined && {
        description: cleanOptional(data.description),
      }),
      ...(data.brand !== undefined && { brand: cleanOptional(data.brand) }),
      ...(data.minStock !== undefined && { minStock: data.minStock }),
      ...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
      ...(data.currentQuantity !== undefined && {
        currentQuantity: data.currentQuantity,
      }),
      ...(data.supplierId !== undefined && {
        supplierId: cleanOptional(data.supplierId),
      }),
      ...(data.location !== undefined && { location: cleanOptional(data.location) }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
      ...(data.paperSizeId !== undefined && { paperSizeId: cleanOptional(data.paperSizeId) }),
      ...(data.gsmId !== undefined && { gsmId: cleanOptional(data.gsmId) }),
      ...(data.paperTypeId !== undefined && { paperTypeId: cleanOptional(data.paperTypeId) }),
    },
  });
}

/** Audited stock quantity change for a non-paper item (plain on-hand count,
 * no lots) — "used 1", "stock is finished" (delta down to 0), a correction,
 * etc. Mirrors adjustLotQuantity in lot-service.ts: never silently mutate
 * currentQuantity, always log a StockTransaction (spec §17). */
export async function adjustItemQuantity(
  id: string,
  data: z.infer<typeof adjustItemQuantitySchema>,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new ApiError(404, "Inventory item not found.");

    const newQuantity = item.currentQuantity + data.delta;
    if (newQuantity < 0) {
      throw new ApiError(
        400,
        `Adjustment would bring stock below zero (current: ${item.currentQuantity.toLocaleString()}, change: ${data.delta}).`
      );
    }

    const updated = await tx.inventoryItem.update({
      where: { id },
      data: { currentQuantity: newQuantity },
    });

    await tx.stockTransaction.create({
      data: {
        type: data.type,
        inventoryItemId: id,
        quantityChange: data.delta,
        previousQuantity: item.currentQuantity,
        newQuantity,
        userId,
        reason: data.reason,
      },
    });

    return updated;
  });
}

export async function setInventoryItemStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE"
) {
  return prisma.inventoryItem.update({ where: { id }, data: { status } });
}

/** Soft-deletes the item: sets deletedAt, nothing else. Every read that
 * powers an active list or picker (items list, item detail, Stock Lots,
 * Active Paper Stock, the printing calculator's paper picker, barcode
 * lookup) filters deletedAt: null, so the item and its lots simply stop
 * appearing everywhere — but the underlying rows are untouched, so nothing
 * about existing printing records or invoices ever changes. This is why a
 * delete here never needs to be blocked: there's nothing to lose. */
export async function deleteInventoryItem(id: string) {
  return prisma.inventoryItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
