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
    prisma.inventoryItem.count({ where: { status: "ACTIVE" } }),
    prisma.inventoryLot.aggregate({
      where: { status: { in: ["ACTIVE", "LOW_STOCK"] } },
      _sum: { currentQuantity: true },
    }),
    prisma.inventoryLot.count({ where: { status: "LOW_STOCK" } }),
    prisma.inventoryLot.count({ where: { status: "OUT_OF_STOCK" } }),
    prisma.inventoryLot.count({ where: { isActiveStock: true } }),
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
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, itemCode: true, createdAt: true },
      }),
      prisma.inventoryLot.findMany({
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
