import "server-only";
import { prisma } from "@/lib/prisma";
import { totalStockOf } from "@/server/inventory-service";

export function defaultDateRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
}

/** Query-string dates are just "YYYY-MM-DD" — end is bumped to the start of
 * the next day so the range is inclusive of the whole end date. */
export function parseDateRange(from?: string, to?: string): { start: Date; end: Date } {
  const def = defaultDateRange();
  const start = from ? new Date(from) : def.start;
  const end = to ? new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000) : def.end;
  return { start, end };
}

// ---------------------------------------------------------------------------
// Inventory report — current snapshot, no date range
// ---------------------------------------------------------------------------

export async function getInventoryReport() {
  const items = await prisma.inventoryItem.findMany({
    where: { deletedAt: null },
    include: { category: true, lots: { select: { currentQuantity: true, status: true } } },
    orderBy: { name: "asc" },
  });

  const rows = items.map((item) => {
    const stock = totalStockOf(item);
    return {
      itemCode: item.itemCode,
      name: item.name,
      category: item.category.name,
      stock,
      price: Number(item.defaultPrice),
      value: stock * Number(item.defaultPrice),
      status: item.status,
      lowStock: stock > 0 && stock <= item.minStock,
      outOfStock: stock === 0,
    };
  });

  const byCategory = new Map<string, { category: string; itemCount: number; totalStock: number; totalValue: number }>();
  for (const r of rows) {
    const existing = byCategory.get(r.category) ?? {
      category: r.category,
      itemCount: 0,
      totalStock: 0,
      totalValue: 0,
    };
    existing.itemCount += 1;
    existing.totalStock += r.stock;
    existing.totalValue += r.value;
    byCategory.set(r.category, existing);
  }

  return {
    rows,
    categorySummary: Array.from(byCategory.values()).sort((a, b) => a.category.localeCompare(b.category)),
    totalItems: rows.length,
    totalValue: rows.reduce((s, r) => s + r.value, 0),
    lowStockCount: rows.filter((r) => r.lowStock).length,
    outOfStockCount: rows.filter((r) => r.outOfStock).length,
  };
}

// ---------------------------------------------------------------------------
// Stock usage report — StockTransaction log over a date range
// ---------------------------------------------------------------------------

export async function getStockUsageReport(start: Date, end: Date) {
  const transactions = await prisma.stockTransaction.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: {
      inventoryItem: { select: { itemCode: true, name: true } },
      lot: { select: { lotCode: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byType = new Map<string, { type: string; count: number; totalQuantity: number }>();
  for (const t of transactions) {
    const existing = byType.get(t.type) ?? { type: t.type, count: 0, totalQuantity: 0 };
    existing.count += 1;
    existing.totalQuantity += t.quantityChange;
    byType.set(t.type, existing);
  }

  return {
    transactions,
    typeSummary: Array.from(byType.values()).sort((a, b) => a.type.localeCompare(b.type)),
    totalTransactions: transactions.length,
  };
}

// ---------------------------------------------------------------------------
// Printing report — job/sheet volume over a date range
// ---------------------------------------------------------------------------

export async function getPrintingReport(start: Date, end: Date) {
  const records = await prisma.printingRecord.findMany({
    where: { date: { gte: start, lt: end } },
    include: {
      lecturer: { select: { name: true } },
      paperSize: true,
      gsm: true,
      paperType: true,
    },
    orderBy: { date: "desc" },
  });

  const byPaper = new Map<
    string,
    { paper: string; jobCount: number; sheets: number; totalCost: number }
  >();
  for (const r of records) {
    const key = `${r.paperSize.name}/${r.gsm.value}/${r.paperType.name}`;
    const existing = byPaper.get(key) ?? { paper: key, jobCount: 0, sheets: 0, totalCost: 0 };
    existing.jobCount += 1;
    existing.sheets += r.physicalSheets;
    existing.totalCost += Number(r.totalCost);
    byPaper.set(key, existing);
  }

  return {
    records,
    paperSummary: Array.from(byPaper.values()).sort((a, b) => b.sheets - a.sheets),
    totalJobs: records.length,
    totalSheets: records.reduce((s, r) => s + r.physicalSheets, 0),
    totalWastedSheets: records.reduce((s, r) => s + r.wastedSheets, 0),
    totalPaperCost: records.reduce((s, r) => s + Number(r.totalPaperCost), 0),
    totalPrintingCharge: records.reduce((s, r) => s + Number(r.totalPrintingCharge), 0),
    totalRevenue: records.reduce((s, r) => s + Number(r.totalCost), 0),
  };
}

// ---------------------------------------------------------------------------
// Lecturer report — per-lecturer usage + billed status over a date range
// ---------------------------------------------------------------------------

export async function getLecturerReport(start: Date, end: Date) {
  const records = await prisma.printingRecord.findMany({
    where: { date: { gte: start, lt: end } },
    include: { lecturer: { select: { id: true, name: true, lecturerCode: true } }, invoiceItem: true },
  });

  const byLecturer = new Map<
    string,
    {
      lecturerId: string;
      lecturerName: string;
      lecturerCode: string;
      jobCount: number;
      sheets: number;
      totalCost: number;
      billedJobCount: number;
    }
  >();
  for (const r of records) {
    const existing = byLecturer.get(r.lecturerId) ?? {
      lecturerId: r.lecturerId,
      lecturerName: r.lecturer.name,
      lecturerCode: r.lecturer.lecturerCode,
      jobCount: 0,
      sheets: 0,
      totalCost: 0,
      billedJobCount: 0,
    };
    existing.jobCount += 1;
    existing.sheets += r.physicalSheets;
    existing.totalCost += Number(r.totalCost);
    if (r.invoiceItem) existing.billedJobCount += 1;
    byLecturer.set(r.lecturerId, existing);
  }

  const rows = Array.from(byLecturer.values()).sort((a, b) => b.totalCost - a.totalCost);
  return {
    rows,
    totalJobs: records.length,
    totalCost: records.reduce((s, r) => s + Number(r.totalCost), 0),
  };
}

// ---------------------------------------------------------------------------
// Cost report — paper cost vs printing charge, by month, over a date range
// ---------------------------------------------------------------------------

export async function getCostReport(start: Date, end: Date) {
  const records = await prisma.printingRecord.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true, totalPaperCost: true, totalPrintingCharge: true, totalCost: true },
    orderBy: { date: "asc" },
  });

  const byMonth = new Map<
    string,
    { month: string; paperCost: number; printingCharge: number; total: number }
  >();
  for (const r of records) {
    const key = `${r.date.getUTCFullYear()}-${String(r.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const existing = byMonth.get(key) ?? { month: key, paperCost: 0, printingCharge: 0, total: 0 };
    existing.paperCost += Number(r.totalPaperCost);
    existing.printingCharge += Number(r.totalPrintingCharge);
    existing.total += Number(r.totalCost);
    byMonth.set(key, existing);
  }

  const totalPaperCost = records.reduce((s, r) => s + Number(r.totalPaperCost), 0);
  const totalPrintingCharge = records.reduce((s, r) => s + Number(r.totalPrintingCharge), 0);
  const totalRevenue = totalPaperCost + totalPrintingCharge;

  return {
    monthly: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)),
    totalPaperCost,
    totalPrintingCharge,
    totalRevenue,
    paperCostShare: totalRevenue > 0 ? totalPaperCost / totalRevenue : 0,
    printingChargeShare: totalRevenue > 0 ? totalPrintingCharge / totalRevenue : 0,
  };
}
