import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import { ApiError } from "@/lib/api-auth";
import type { z } from "zod";
import type { InvoiceStatus } from "@prisma/client";
import type { updateInvoiceSchema } from "@/lib/validation/billing";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

/** Printing records in the given month, grouped by lecturer, that have no
 * InvoiceItem yet — what a new invoice generation run would pick up. */
export async function getUnbilledSummary(year: number, month: number) {
  const { start, end } = monthRange(year, month);
  const records = await prisma.printingRecord.findMany({
    where: { date: { gte: start, lt: end }, invoiceItem: null },
    include: { lecturer: { select: { id: true, name: true, lecturerCode: true } } },
  });

  const byLecturer = new Map<
    string,
    {
      lecturerId: string;
      lecturerName: string;
      lecturerCode: string;
      jobCount: number;
      totalPaperCost: number;
      totalPrintingCharge: number;
      grandTotal: number;
    }
  >();

  for (const r of records) {
    const existing = byLecturer.get(r.lecturerId) ?? {
      lecturerId: r.lecturerId,
      lecturerName: r.lecturer.name,
      lecturerCode: r.lecturer.lecturerCode,
      jobCount: 0,
      totalPaperCost: 0,
      totalPrintingCharge: 0,
      grandTotal: 0,
    };
    existing.jobCount += 1;
    existing.totalPaperCost += Number(r.totalPaperCost);
    existing.totalPrintingCharge += Number(r.totalPrintingCharge);
    existing.grandTotal += Number(r.totalCost);
    byLecturer.set(r.lecturerId, existing);
  }

  return Array.from(byLecturer.values()).sort((a, b) =>
    a.lecturerName.localeCompare(b.lecturerName)
  );
}

/** Generates (or tops up) a lecturer's invoice for one month. Idempotent and
 * safe to re-run: if a DRAFT invoice already exists for this lecturer/month
 * (spec's one-invoice-per-lecturer-per-month rule), newly unbilled records
 * are appended to it and totals recomputed, rather than erroring or
 * creating a duplicate. If that invoice has already moved past DRAFT, it's
 * left alone — those records stay unbilled rather than being silently
 * folded into an already-finalized invoice. */
export async function generateInvoiceForLecturer(
  lecturerId: string,
  year: number,
  month: number,
  userId: string
) {
  const { start, end } = monthRange(year, month);

  return prisma.$transaction(async (tx) => {
    const unbilled = await tx.printingRecord.findMany({
      where: { lecturerId, date: { gte: start, lt: end }, invoiceItem: null },
    });

    let invoice = await tx.invoice.findUnique({
      where: {
        lecturerId_billingMonth_billingYear: {
          lecturerId,
          billingMonth: month,
          billingYear: year,
        },
      },
    });

    if (invoice && invoice.status !== "DRAFT") {
      return { invoice, attached: 0, skipped: true as const };
    }
    if (unbilled.length === 0 && !invoice) {
      return null;
    }

    if (!invoice) {
      const seq = await nextSequence(`invoice:${year}:${pad2(month)}`, tx);
      const invoiceNumber = `INV-${year}-${pad2(month)}-${padSequence(seq, 4)}`;
      invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          lecturerId,
          billingMonth: month,
          billingYear: year,
          totalPaperCost: 0,
          totalPrintingCharge: 0,
          grandTotal: 0,
        },
      });
    }

    for (const record of unbilled) {
      await tx.invoiceItem.create({
        data: { invoiceId: invoice.id, printingRecordId: record.id, amount: record.totalCost },
      });
    }

    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId: invoice.id },
      include: {
        printingRecord: { select: { totalPaperCost: true, totalPrintingCharge: true } },
      },
    });
    const totalPaperCost = allItems.reduce(
      (sum, i) => sum + Number(i.printingRecord.totalPaperCost),
      0
    );
    const totalPrintingCharge = allItems.reduce(
      (sum, i) => sum + Number(i.printingRecord.totalPrintingCharge),
      0
    );
    const grandTotal =
      totalPaperCost + totalPrintingCharge + Number(invoice.otherCharges) - Number(invoice.discount);

    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: { totalPaperCost, totalPrintingCharge, grandTotal },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "GENERATE_INVOICE",
        entityType: "Invoice",
        entityId: updated.id,
        newValue: JSON.stringify({
          invoiceNumber: updated.invoiceNumber,
          attached: unbilled.length,
        }),
      },
    });

    return { invoice: updated, attached: unbilled.length, skipped: false as const };
  });
}

export async function generateInvoicesForMonth(year: number, month: number, userId: string) {
  const summary = await getUnbilledSummary(year, month);
  const results = [];
  for (const row of summary) {
    const result = await generateInvoiceForLecturer(row.lecturerId, year, month, userId);
    results.push({ lecturerId: row.lecturerId, lecturerName: row.lecturerName, result });
  }
  return results;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  lecturerId?: string;
}

export async function listInvoices(filters: InvoiceFilters = {}) {
  return prisma.invoice.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.lecturerId && { lecturerId: filters.lecturerId }),
    },
    include: {
      lecturer: { select: { name: true, lecturerCode: true } },
      _count: { select: { items: true } },
    },
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }, { createdAt: "desc" }],
  });
}

/** The archive view — invoices whose workflow has ended, one way or the
 * other. Paid invoices are never edited/deleted again; cancelled ones stay
 * here as a record that the attempt happened. */
export async function listInvoiceHistory() {
  return prisma.invoice.findMany({
    where: { status: { in: ["PAID", "CANCELLED"] } },
    include: {
      lecturer: { select: { name: true, lecturerCode: true } },
      _count: { select: { items: true } },
    },
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }, { createdAt: "desc" }],
  });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lecturer: true,
      items: { include: { printingRecord: true } },
    },
  });
  if (!invoice) return null;
  return {
    ...invoice,
    items: [...invoice.items].sort(
      (a, b) => a.printingRecord.date.getTime() - b.printingRecord.date.getTime()
    ),
  };
}

/** Only a DRAFT invoice can have these adjusted — once it's GENERATED it's
 * considered finalized for sending, same historical-protection rule as
 * everything else that's already been acted on. */
export async function updateInvoiceDraftFields(
  id: string,
  data: z.infer<typeof updateInvoiceSchema>
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  if (invoice.status !== "DRAFT") {
    throw new ApiError(409, "Only a draft invoice can be edited.");
  }

  const otherCharges = data.otherCharges !== undefined ? data.otherCharges : Number(invoice.otherCharges);
  const discount = data.discount !== undefined ? data.discount : Number(invoice.discount);
  const grandTotal =
    Number(invoice.totalPaperCost) + Number(invoice.totalPrintingCharge) + otherCharges - discount;

  return prisma.invoice.update({
    where: { id },
    data: {
      ...(data.otherCharges !== undefined && { otherCharges }),
      ...(data.discount !== undefined && { discount }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      grandTotal,
    },
  });
}

const FORWARD_STATUS: Partial<Record<InvoiceStatus, InvoiceStatus>> = {
  DRAFT: "GENERATED",
  GENERATED: "ISSUED",
  ISSUED: "PAID",
};

/** DRAFT -> GENERATED -> ISSUED -> PAID, one step at a time, or CANCELLED
 * from anywhere except PAID/already-CANCELLED. Cancelling deletes the
 * invoice's line items (freeing those printing records to be billed again
 * in a future run) but keeps the Invoice row itself — spec: never
 * hard-delete an issued invoice, and this doubles as a record that this
 * billing attempt happened and was cancelled. */
export async function transitionInvoiceStatus(
  id: string,
  targetStatus: InvoiceStatus,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id } });
    if (!invoice) throw new ApiError(404, "Invoice not found.");

    if (targetStatus === "CANCELLED") {
      if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
        throw new ApiError(409, `A ${invoice.status.toLowerCase()} invoice can't be cancelled.`);
      }
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    } else if (FORWARD_STATUS[invoice.status] !== targetStatus) {
      throw new ApiError(409, `Can't move this invoice from ${invoice.status} to ${targetStatus}.`);
    }

    const updated = await tx.invoice.update({ where: { id }, data: { status: targetStatus } });

    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE_INVOICE_STATUS",
        entityType: "Invoice",
        entityId: id,
        oldValue: JSON.stringify({ status: invoice.status }),
        newValue: JSON.stringify({ status: targetStatus }),
      },
    });

    return updated;
  });
}

/** Emails the invoice to the lecturer on file and stamps emailedAt (audit +
 * a "Last emailed" note on the page double as the send history — no
 * separate log table needed for something this simple). */
export async function markInvoiceEmailed(id: string) {
  return prisma.invoice.update({ where: { id }, data: { emailedAt: new Date() } });
}

/** Only a DRAFT invoice can be deleted outright — it hasn't been sent
 * anywhere yet, so undoing it is just undoing a generation run. Anything
 * past DRAFT is cancelled instead (transitionInvoiceStatus), never deleted. */
export async function deleteInvoice(id: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id } });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    if (invoice.status !== "DRAFT") {
      throw new ApiError(409, "Only a draft invoice can be deleted. Cancel it instead.");
    }
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.delete({ where: { id } });
  });
}
