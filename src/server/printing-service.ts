import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import { findMatchingPriceRule } from "@/server/pricing-service";
import { statusFromQuantity, computeStatus } from "@/server/lot-service";
import { calculatePrintingJob } from "@/lib/printing-calculation";
import { ApiError } from "@/lib/api-auth";
import type { z } from "zod";
import type {
  previewJobInputSchema,
  printingJobInputSchema,
  updatePrintingRecordSchema,
} from "@/lib/validation/printing";

/** Paper items available to the calculator, each with its current active
 * lot (if any) — this is what "Paper Size/GSM/Paper Type" dropdowns would
 * resolve to under the spec's literal design; here the operator picks the
 * item directly, which is unambiguous even if two items happen to share a
 * paper spec (see docs/spec.md). */
export async function listPaperItemsForCalculator() {
  const items = await prisma.inventoryItem.findMany({
    where: { status: "ACTIVE", deletedAt: null, category: { name: "Paper" } },
    include: {
      paperSize: true,
      gsm: true,
      paperType: true,
      lots: { where: { isActiveStock: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    barcode: item.barcode,
    paperSizeName: item.paperSize?.name ?? null,
    gsmValue: item.gsm?.value ?? null,
    paperTypeName: item.paperType?.name ?? null,
    activeLot: item.lots[0]
      ? {
          id: item.lots[0].id,
          lotCode: item.lots[0].lotCode,
          currentQuantity: item.lots[0].currentQuantity,
          costPerSheet: item.lots[0].costPerSheet.toString(),
        }
      : null,
  }));
}

/** Resolves a scanned/typed barcode to a paper item for the calculator.
 * Accepts either an item barcode or a lot barcode; a lot barcode that isn't
 * currently the active lot is flagged so the UI can offer to activate it. */
export async function resolveItemFromBarcode(barcode: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { barcode, deletedAt: null },
    include: { category: true },
  });
  if (item) {
    if (item.category.name.toLowerCase() !== "paper") {
      throw new ApiError(400, "That barcode belongs to a non-paper item.");
    }
    return { inventoryItemId: item.id, scannedLotId: null as string | null, scannedLotIsActive: true };
  }

  const lot = await prisma.inventoryLot.findFirst({
    where: { barcode, inventoryItem: { deletedAt: null } },
  });
  if (lot) {
    return {
      inventoryItemId: lot.inventoryItemId,
      scannedLotId: lot.id,
      scannedLotIsActive: lot.isActiveStock,
    };
  }

  throw new ApiError(404, `No item or stock lot matches barcode "${barcode}".`);
}

interface ResolvedJobInputs {
  item: NonNullable<Awaited<ReturnType<typeof getItemWithPaperIdentity>>>;
  activeLot: { id: string; currentQuantity: number; costPerSheet: string };
  priceRule: { id: string; chargePerSheet: string };
}

async function getItemWithPaperIdentity(inventoryItemId: string) {
  return prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, deletedAt: null },
    include: { paperSize: true, gsm: true, paperType: true },
  });
}

/** Resolves and validates everything a printing job needs: active lot,
 * matching price rule. Throws ApiError with a spec-worded message for each
 * of the three blocking cases (no active stock / insufficient stock is
 * checked by the caller since it also needs pages+copies / no price rule). */
async function resolveJobInputs(
  inventoryItemId: string,
  colourMode: "BW" | "COLOUR",
  sides: "SINGLE" | "DOUBLE"
): Promise<ResolvedJobInputs> {
  const item = await getItemWithPaperIdentity(inventoryItemId);
  if (!item) throw new ApiError(404, "Paper item not found.");
  if (!item.paperSizeId || !item.gsmId || !item.paperTypeId) {
    throw new ApiError(
      400,
      "This item is missing Paper Size/GSM/Paper Type — set them from Edit before printing with it."
    );
  }

  const activeLot = await prisma.inventoryLot.findFirst({
    where: { inventoryItemId, isActiveStock: true },
  });
  if (!activeLot) {
    throw new ApiError(
      409,
      `No active stock is available for ${item.name}. Please scan or add a new stock lot.`
    );
  }

  const priceRule = await findMatchingPriceRule({
    paperSizeId: item.paperSizeId,
    gsmId: item.gsmId,
    paperTypeId: item.paperTypeId,
    colourMode,
    sides,
  });
  if (!priceRule) {
    throw new ApiError(
      422,
      "No printing price has been configured for this combination. Please contact an administrator."
    );
  }

  return {
    item,
    activeLot: {
      id: activeLot.id,
      currentQuantity: activeLot.currentQuantity,
      costPerSheet: activeLot.costPerSheet.toString(),
    },
    priceRule: { id: priceRule.id, chargePerSheet: priceRule.chargePerSheet.toString() },
  };
}

export async function previewPrintingJob(data: z.infer<typeof previewJobInputSchema>) {
  const { item, activeLot, priceRule } = await resolveJobInputs(
    data.inventoryItemId,
    data.colourMode,
    data.sides
  );

  const calculation = calculatePrintingJob({
    sides: data.sides,
    pages: data.pages,
    copies: data.copies,
    paperCostPerSheet: Number(activeLot.costPerSheet),
    printingChargePerSheet: Number(priceRule.chargePerSheet),
    availableStock: activeLot.currentQuantity,
  });

  return {
    item: {
      id: item.id,
      name: item.name,
      itemCode: item.itemCode,
      paperSize: item.paperSize!.name,
      gsm: item.gsm!.value,
      paperType: item.paperType!.name,
    },
    activeLot,
    calculation,
  };
}

/** Submits a printing job atomically: validate → find active lot → check
 * stock → find price rule → calculate → save record (with snapshotted
 * prices) → deduct stock → log the stock transaction. All-or-nothing
 * (spec §27) — never deduct stock without a record, never save a record
 * without deducting stock. */
export async function submitPrintingJob(
  data: z.infer<typeof printingJobInputSchema>,
  operatorId: string
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findFirst({
      where: { id: data.inventoryItemId, deletedAt: null },
      include: { paperSize: true, gsm: true, paperType: true },
    });
    if (!item) throw new ApiError(404, "Paper item not found.");
    if (!item.paperSizeId || !item.gsmId || !item.paperTypeId) {
      throw new ApiError(400, "This item is missing Paper Size/GSM/Paper Type.");
    }

    const lecturer = await tx.lecturer.findUnique({ where: { id: data.lecturerId } });
    if (!lecturer) throw new ApiError(404, "Lecturer not found.");

    const activeLot = await tx.inventoryLot.findFirst({
      where: { inventoryItemId: data.inventoryItemId, isActiveStock: true },
    });
    if (!activeLot) {
      throw new ApiError(
        409,
        `No active stock is available for ${item.name}. Please scan or add a new stock lot.`
      );
    }

    const priceRule = await findMatchingPriceRule({
      paperSizeId: item.paperSizeId,
      gsmId: item.gsmId,
      paperTypeId: item.paperTypeId,
      colourMode: data.colourMode,
      sides: data.sides,
    });
    if (!priceRule) {
      throw new ApiError(
        422,
        "No printing price has been configured for this combination. Please contact an administrator."
      );
    }

    const calc = calculatePrintingJob({
      sides: data.sides,
      pages: data.pages,
      copies: data.copies,
      paperCostPerSheet: Number(activeLot.costPerSheet),
      printingChargePerSheet: Number(priceRule.chargePerSheet),
      availableStock: activeLot.currentQuantity,
    });

    if (!calc.sufficientStock) {
      throw new ApiError(
        409,
        `Insufficient stock. Required: ${calc.physicalSheets.toLocaleString()} sheets. ` +
          `Available: ${activeLot.currentQuantity.toLocaleString()} sheets. ` +
          `Shortage: ${(calc.physicalSheets - activeLot.currentQuantity).toLocaleString()} sheets.`
      );
    }

    const seq = await nextSequence("printing_record", tx);
    const printingCode = `PRT-${padSequence(seq)}`;

    const record = await tx.printingRecord.create({
      data: {
        printingCode,
        lecturerId: data.lecturerId,
        documentName: data.documentName,
        subject: data.subject || null,
        course: data.course || null,
        batchClass: data.batchClass || null,
        paperSizeId: item.paperSizeId,
        gsmId: item.gsmId,
        paperTypeId: item.paperTypeId,
        colourMode: data.colourMode,
        sides: data.sides,
        pages: data.pages,
        copies: data.copies,
        physicalSheets: calc.physicalSheets,
        lotId: activeLot.id,
        paperCostPerSheet: activeLot.costPerSheet,
        totalPaperCost: calc.totalPaperCost,
        priceRuleId: priceRule.id,
        printingChargePerSheet: priceRule.chargePerSheet,
        totalPrintingCharge: calc.totalPrintingCharge,
        totalCost: calc.totalCost,
        printingMachine: data.printingMachine || null,
        operatorId,
        notes: data.notes || null,
      },
    });

    const newQuantity = activeLot.currentQuantity - calc.physicalSheets;
    const nextStatus = statusFromQuantity(newQuantity, item.minStock);

    await tx.inventoryLot.update({
      where: { id: activeLot.id },
      data: {
        currentQuantity: newQuantity,
        status: nextStatus,
        isActiveStock: nextStatus === "OUT_OF_STOCK" ? false : true,
      },
    });

    await tx.stockTransaction.create({
      data: {
        type: "PRINTING_USAGE",
        inventoryItemId: item.id,
        lotId: activeLot.id,
        quantityChange: -calc.physicalSheets,
        previousQuantity: activeLot.currentQuantity,
        newQuantity,
        userId: operatorId,
        reason: `Printing job ${printingCode}: ${data.documentName}`,
        printingRecordId: record.id,
      },
    });

    return record;
  });
}

export interface PrintingRecordFilters {
  lecturerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listPrintingRecords(filters: PrintingRecordFilters = {}) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;

  const where = {
    ...(filters.lecturerId && { lecturerId: filters.lecturerId }),
    ...(filters.search && {
      OR: [
        { documentName: { contains: filters.search } },
        { printingCode: { contains: filters.search } },
      ],
    }),
  };

  const [records, total] = await Promise.all([
    prisma.printingRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        lecturer: { select: { name: true } },
        paperSize: true,
        gsm: true,
        paperType: true,
        operator: { select: { name: true } },
      },
    }),
    prisma.printingRecord.count({ where }),
  ]);

  return {
    records,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPrintingRecord(id: string) {
  return prisma.printingRecord.findUnique({
    where: { id },
    include: {
      lecturer: true,
      paperSize: true,
      gsm: true,
      paperType: true,
      lot: true,
      operator: { select: { name: true } },
    },
  });
}

/** Narrow, safe edits only — notes and wasted-sheet count. Everything else
 * on a printing record (lecturer, paper, pages, pricing) is locked in at
 * submission time; to fix one of those, delete the record and resubmit it
 * correctly. Changing wastedSheets deducts/restores the delta from the same
 * lot the job used and logs a StockTransaction, exactly like any other
 * audited stock change — but never touches totalCost, since waste from a
 * printing-time error is the shop's loss, not something to bill the
 * lecturer for. */
export async function updatePrintingRecord(
  id: string,
  data: z.infer<typeof updatePrintingRecordSchema>,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.printingRecord.findUnique({ where: { id } });
    if (!record) throw new ApiError(404, "Printing record not found.");

    if (data.wastedSheets !== undefined && data.wastedSheets !== record.wastedSheets) {
      const delta = data.wastedSheets - record.wastedSheets;
      const lot = await tx.inventoryLot.findUnique({
        where: { id: record.lotId },
        include: { inventoryItem: { select: { minStock: true } } },
      });
      if (!lot) throw new ApiError(404, "Stock lot not found.");
      if (delta > 0 && lot.currentQuantity < delta) {
        throw new ApiError(
          409,
          `Not enough stock to mark ${delta} more sheet(s) as wasted. Available: ${lot.currentQuantity.toLocaleString()} sheets.`
        );
      }

      const newQuantity = lot.currentQuantity - delta;
      const nextStatus = computeStatus(newQuantity, lot.inventoryItem.minStock, lot.status);

      await tx.inventoryLot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newQuantity,
          status: nextStatus,
          isActiveStock: nextStatus === "OUT_OF_STOCK" ? false : lot.isActiveStock,
        },
      });

      await tx.stockTransaction.create({
        data: {
          type: delta > 0 ? "DAMAGED" : "MANUAL_ADJUSTMENT",
          inventoryItemId: lot.inventoryItemId,
          lotId: lot.id,
          quantityChange: -delta,
          previousQuantity: lot.currentQuantity,
          newQuantity,
          userId,
          reason:
            delta > 0
              ? `${delta} sheet(s) marked wasted on printing record ${record.printingCode}`
              : `Wasted-sheet count corrected down by ${-delta} on printing record ${record.printingCode}`,
        },
      });
    }

    return tx.printingRecord.update({
      where: { id },
      data: {
        ...(data.wastedSheets !== undefined && { wastedSheets: data.wastedSheets }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });
  });
}

/** Fully undoes a printing job: restores the sheets it used (including any
 * wasted sheets) back to the lot it came from, removes the stock
 * transaction it created, and deletes the record. Blocked once a job has
 * been invoiced — at that point it's real billing history, not a mistake
 * to undo, and must be corrected some other way instead. */
export async function deletePrintingRecord(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.printingRecord.findUnique({
      where: { id },
      include: { invoiceItem: true },
    });
    if (!record) throw new ApiError(404, "Printing record not found.");
    if (record.invoiceItem) {
      throw new ApiError(409, "This job has already been invoiced and can't be deleted.");
    }

    const lot = await tx.inventoryLot.findUnique({
      where: { id: record.lotId },
      include: { inventoryItem: { select: { minStock: true } } },
    });
    if (lot) {
      const restored = record.physicalSheets + record.wastedSheets;
      const newQuantity = lot.currentQuantity + restored;
      const nextStatus = computeStatus(newQuantity, lot.inventoryItem.minStock, lot.status);

      await tx.inventoryLot.update({
        where: { id: lot.id },
        data: { currentQuantity: newQuantity, status: nextStatus },
      });

      await tx.stockTransaction.create({
        data: {
          type: "MANUAL_ADJUSTMENT",
          inventoryItemId: lot.inventoryItemId,
          lotId: lot.id,
          quantityChange: restored,
          previousQuantity: lot.currentQuantity,
          newQuantity,
          userId,
          reason: `Printing record ${record.printingCode} deleted — ${restored} sheet(s) restored`,
        },
      });
    }

    await tx.stockTransaction.deleteMany({ where: { printingRecordId: id } });
    await tx.printingRecord.delete({ where: { id } });

    return record;
  });
}
