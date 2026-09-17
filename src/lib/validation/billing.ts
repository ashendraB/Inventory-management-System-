import { z } from "zod";

export const generateInvoiceSchema = z.object({
  lecturerId: z.string().trim().min(1, "Lecturer is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const generateMonthInvoicesSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updateInvoiceSchema = z.object({
  otherCharges: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const invoiceStatusSchema = z.object({
  status: z.enum(["GENERATED", "ISSUED", "PAID", "CANCELLED"]),
});
