import { z } from "zod";

export const createPaperSizeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
});

export const createPaperTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
});

export const createGsmTypeSchema = z.object({
  value: z.coerce.number().int().positive("GSM must be a positive number"),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
});

export const createGradeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
});

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});
