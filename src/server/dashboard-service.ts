import "server-only";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboardSummary() {
  const [
    totalInventoryItems,
    activeLotsAgg,
    lowStockLots,
    outOfStockLots,
    activePaperLots,
    todaysPrintingJobs,
    monthCostAgg,
    lecturerCount,
    pendingInvoices,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.inventoryLot.aggregate({
      where: { status: { in: ["ACTIVE", "LOW_STOCK"] }, inventoryItem: { deletedAt: null } },
      _sum: { currentQuantity: true },
    }),
    prisma.inventoryLot.count({ where: { status: "LOW_STOCK", inventoryItem: { deletedAt: null } } }),
    prisma.inventoryLot.count({ where: { status: "OUT_OF_STOCK", inventoryItem: { deletedAt: null } } }),
    prisma.inventoryLot.count({ where: { isActiveStock: true, inventoryItem: { deletedAt: null } } }),
    // Printing job/cost figures are historical billing data and are never
    // filtered by a since-deleted item — deleting an item must never change
    // reports or billing.
    prisma.printingRecord.count({ where: { date: { gte: startOfToday() } } }),
    prisma.printingRecord.aggregate({
      where: { date: { gte: startOfMonth() } },
      _sum: { totalCost: true },
    }),
    prisma.lecturer.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.count({
      where: { status: { in: ["DRAFT", "GENERATED", "ISSUED"] } },
    }),
  ]);

  return {
    totalInventoryItems,
    totalActiveStock: activeLotsAgg._sum.currentQuantity ?? 0,
    lowStockItems: lowStockLots,
    outOfStockItems: outOfStockLots,
    activePaperLots,
    todaysPrintingJobs,
    currentMonthPrintingCost: Number(monthCostAgg._sum.totalCost ?? 0),
    lecturerCount,
    pendingInvoices,
  };
}

export async function getRecentActivity() {
  const [recentInventory, recentLots, recentPrinting, recentInvoices] =
    await Promise.all([
      prisma.inventoryItem.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, itemCode: true, createdAt: true },
      }),
      prisma.inventoryLot.findMany({
        where: { inventoryItem: { deletedAt: null } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          lotCode: true,
          createdAt: true,
          inventoryItem: { select: { name: true } },
        },
      }),
      prisma.printingRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          documentName: true,
          totalCost: true,
          createdAt: true,
          lecturer: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          grandTotal: true,
          createdAt: true,
          lecturer: { select: { name: true } },
        },
      }),
    ]);

  return { recentInventory, recentLots, recentPrinting, recentInvoices };
}
