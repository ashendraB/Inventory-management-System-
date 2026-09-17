import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import { ApiError } from "@/lib/api-auth";
import type { z } from "zod";
import type { LotStatus } from "@prisma/client";
import type {
  addStockLotSchema,
  adjustLotQuantitySchema,
  updateLotSchema,
} from "@/lib/validation/lots";

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

export function statusFromQuantity(currentQuantity: number, minStock: number): LotStatus {
  if (currentQuantity <= 0) return "OUT_OF_STOCK";
  if (currentQuantity <= minStock) return "LOW_STOCK";
  return "ACTIVE";
}

/** A lot's status reacts to its quantity, but never overrides a manual
 * FINISHED/INACTIVE state — those only change via explicit operator action. */
export function computeStatus(
  currentQuantity: number,
  minStock: number,
  currentStatus: LotStatus
): LotStatus {
  if (currentStatus === "FINISHED" || currentStatus === "INACTIVE") return currentStatus;
  return statusFromQuantity(currentQuantity, minStock);
}

export interface LotFilters {
  itemId?: string;
  status?: LotStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listLots(filters: LotFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;

  const where = {
    inventoryItem: { deletedAt: null },
    ...(filters.itemId && { inventoryItemId: filters.itemId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { lotCode: { contains: filters.search } },
        { barcode: { contains: filters.search } },
        { inventoryItem: { name: { contains: filters.search } } },
      ],
    }),
  };

  const [lots, total] = await Promise.all([
    prisma.inventoryLot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { inventoryItem: { select: { id: true, name: true, itemCode: true, minStock: true } } },
    }),
    prisma.inventoryLot.count({ where }),
  ]);

  return {
    lots,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLot(id: string) {
  return prisma.inventoryLot.findUnique({
    where: { id },
    include: {
      inventoryItem: true,
      supplier: true,
      stockTransactions: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });
}

export async function findByBarcode(barcode: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { barcode, deletedAt: null },
    include: { category: true, lots: { orderBy: { createdAt: "desc" } } },
  });
  if (item) return { type: "item" as const, item };

  const lot = await prisma.inventoryLot.findFirst({
    where: { barcode, inventoryItem: { deletedAt: null } },
    include: { inventoryItem: true },
  });
  if (lot) return { type: "lot" as const, lot };

  return null;
}

/** Adds a new stock lot to an existing Paper item — the "scan LOT-002 when
 * LOT-001 runs out" workflow. Mirrors createPaperInventoryItem's math but
 * for items that already exist. */
export async function addStockLot(
  itemId: string,
  data: z.infer<typeof addStockLotSchema>,
  userId: string
) {
  const totalSheets = data.packs * data.sheetsPerPack;
  const costPerSheet = (data.packPrice / data.sheetsPerPack).toFixed(4);

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({ where: { id: itemId, deletedAt: null } });
    if (!item) throw new ApiError(404, "Inventory item not found.");

    const itemCode = item.itemCode;
    const lotSeq = await nextSequence(`lot:${itemId}`, tx);
    const lotCode = `${itemCode}-LOT-${padSequence(lotSeq, 3)}`;

    if (data.setActive) {
      await tx.inventoryLot.updateMany({
        where: { inventoryItemId: itemId, isActiveStock: true },
        data: { isActiveStock: false },
      });
    }

    const lot = await tx.inventoryLot.create({
      data: {
        lotCode,
        barcode: lotCode,
        inventoryItemId: itemId,
        quantityPurchased: totalSheets,
        currentQuantity: totalSheets,
        costPerSheet,
        supplierId: cleanOptional(data.supplierId),
        location: cleanOptional(data.location) ?? item.location,
        status: "ACTIVE",
        isActiveStock: data.setActive,
        notes:
          cleanOptional(data.notes) ??
          `${data.packs} pack(s) × ${data.sheetsPerPack} sheets @ Rs. ${data.packPrice}/pack`,
      },
    });

    await tx.stockTransaction.create({
      data: {
        type: "PURCHASE",
        inventoryItemId: itemId,
        lotId: lot.id,
        quantityChange: totalSheets,
        previousQuantity: 0,
        newQuantity: totalSheets,
        userId,
        reason: "New stock lot added",
      },
    });

    return lot;
  });
}

/** Sets a lot as the active stock for its item, deactivating any other
 * active lot on that item. Exhausted/finished lots can't be reactivated. */
export async function setActiveLot(lotId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const lot = await tx.inventoryLot.findUnique({ where: { id: lotId } });
    if (!lot) throw new ApiError(404, "Stock lot not found.");
    if (lot.status === "FINISHED" || lot.status === "OUT_OF_STOCK") {
      throw new ApiError(
        409,
        `This lot is ${lot.status.replaceAll("_", " ").toLowerCase()} and can't be set active.`
      );
    }

    await tx.inventoryLot.updateMany({
      where: { inventoryItemId: lot.inventoryItemId, isActiveStock: true },
      data: { isActiveStock: false },
    });

    const updated = await tx.inventoryLot.update({
      where: { id: lotId },
      data: { isActiveStock: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "SET_ACTIVE_LOT",
        entityType: "InventoryLot",
        entityId: lotId,
        newValue: JSON.stringify({ lotCode: lot.lotCode }),
      },
    });

    return updated;
  });
}

/** Corrects a lot's details after a data-entry mistake — cost, supplier,
 * location, notes. Never touches quantity; that only ever changes through
 * addStockLot/adjustLotQuantity so every unit change stays audited. */
export async function updateLot(
  lotId: string,
  data: z.infer<typeof updateLotSchema>,
  userId: string
) {
  const existing = await prisma.inventoryLot.findUnique({ where: { id: lotId } });
  if (!existing) throw new ApiError(404, "Stock lot not found.");

  const updated = await prisma.inventoryLot.update({
    where: { id: lotId },
    data: {
      ...(data.costPerSheet !== undefined && { costPerSheet: data.costPerSheet.toFixed(4) }),
      ...(data.supplierId !== undefined && { supplierId: cleanOptional(data.supplierId) }),
      ...(data.location !== undefined && { location: cleanOptional(data.location) }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "UPDATE_LOT",
      entityType: "InventoryLot",
      entityId: lotId,
      oldValue: JSON.stringify({
        costPerSheet: existing.costPerSheet.toString(),
        supplierId: existing.supplierId,
        location: existing.location,
        notes: existing.notes,
      }),
      newValue: JSON.stringify({
        costPerSheet: updated.costPerSheet.toString(),
        supplierId: updated.supplierId,
        location: updated.location,
        notes: updated.notes,
      }),
    },
  });

  return updated;
}

/** Undoes an accidental "Mark Finished" — status goes back to whatever its
 * quantity implies. The lot stays inactive until someone explicitly sets it
 * active again, so reopening never silently swaps which lot the printing
 * calculator is using. */
export async function reopenLot(lotId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const lot = await tx.inventoryLot.findUnique({
      where: { id: lotId },
      include: { inventoryItem: { select: { minStock: true } } },
    });
    if (!lot) throw new ApiError(404, "Stock lot not found.");
    if (lot.status !== "FINISHED") {
      throw new ApiError(409, "Only a finished lot can be reopened.");
    }

    const updated = await tx.inventoryLot.update({
      where: { id: lotId },
      data: { status: statusFromQuantity(lot.currentQuantity, lot.inventoryItem.minStock) },
    });

    await tx.stockTransaction.create({
      data: {
        type: "MANUAL_ADJUSTMENT",
        inventoryItemId: lot.inventoryItemId,
        lotId: lot.id,
        quantityChange: 0,
        previousQuantity: lot.currentQuantity,
        newQuantity: lot.currentQuantity,
        userId,
        reason: "Lot reopened (was mistakenly marked finished)",
      },
    });

    return updated;
  });
}

export async function markLotFinished(lotId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const lot = await tx.inventoryLot.findUnique({ where: { id: lotId } });
    if (!lot) throw new ApiError(404, "Stock lot not found.");

    const updated = await tx.inventoryLot.update({
      where: { id: lotId },
      data: { status: "FINISHED", isActiveStock: false },
    });

    await tx.stockTransaction.create({
      data: {
        type: "STOCK_FINISHED",
        inventoryItemId: lot.inventoryItemId,
        lotId: lot.id,
        quantityChange: 0,
        previousQuantity: lot.currentQuantity,
        newQuantity: lot.currentQuantity,
        userId,
        reason: "Manually marked finished",
      },
    });

    return updated;
  });
}

/** Manual stock adjustment (damage, return, transfer, correction). Always
 * logs a StockTransaction and recomputes the lot's status from the new
 * quantity — never a silent quantity change (spec §17). */
export async function adjustLotQuantity(
  lotId: string,
  data: z.infer<typeof adjustLotQuantitySchema>,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const lot = await tx.inventoryLot.findUnique({
      where: { id: lotId },
      include: { inventoryItem: { select: { minStock: true } } },
    });
    if (!lot) throw new ApiError(404, "Stock lot not found.");

    const newQuantity = lot.currentQuantity + data.delta;
    if (newQuantity < 0) {
      throw new ApiError(
        400,
        `Adjustment would bring stock below zero (current: ${lot.currentQuantity}, change: ${data.delta}).`
      );
    }

    const nextStatus = computeStatus(newQuantity, lot.inventoryItem.minStock, lot.status);

    const updated = await tx.inventoryLot.update({
      where: { id: lotId },
      data: {
        currentQuantity: newQuantity,
        status: nextStatus,
        isActiveStock: nextStatus === "OUT_OF_STOCK" ? false : lot.isActiveStock,
      },
    });

    await tx.stockTransaction.create({
      data: {
        type: data.type,
        inventoryItemId: lot.inventoryItemId,
        lotId: lot.id,
        quantityChange: data.delta,
        previousQuantity: lot.currentQuantity,
        newQuantity,
        userId,
        reason: data.reason,
      },
    });

    return updated;
  });
}
