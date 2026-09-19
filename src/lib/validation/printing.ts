import { z } from "zod";

export const printingJobInputSchema = z.object({
  lecturerId: z.string().trim().min(1, "Lecturer is required"),
  inventoryItemId: z.string().trim().min(1, "Paper is required"),
  documentName: z.string().trim().min(1, "Document name is required").max(200),
  subjectId: z.string().trim().optional().or(z.literal("")),
  gradeId: z.string().trim().optional().or(z.literal("")),
  course: z.string().trim().max(200).optional().or(z.literal("")),
  batchClass: z.string().trim().max(200).optional().or(z.literal("")),
  colourMode: z.enum(["BW", "COLOUR"]),
  sides: z.enum(["SINGLE", "DOUBLE"]),
  layout: z.enum(["NORMAL", "BOOKLET"]).default("NORMAL"),
  pages: z.coerce.number().int().positive("Pages must be greater than 0"),
  copies: z.coerce.number().int().positive("Copies must be greater than 0"),
  printingMachine: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const previewJobInputSchema = printingJobInputSchema.pick({
  inventoryItemId: true,
  colourMode: true,
  sides: true,
  layout: true,
  pages: true,
  copies: true,
});

export const updatePrintingRecordSchema = z.object({
  wastedSheets: z.coerce.number().int().min(0, "Wasted sheets can't be negative").optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
