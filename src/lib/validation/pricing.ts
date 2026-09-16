import { z } from "zod";

export const createPriceRuleSchema = z.object({
  paperSizeId: z.string().trim().min(1, "Paper size is required"),
  gsmId: z.string().trim().min(1, "GSM is required"),
  paperTypeId: z.string().trim().min(1, "Paper type is required"),
  colourMode: z.enum(["BW", "COLOUR"]),
  sides: z.enum(["SINGLE", "DOUBLE"]),
  chargePerSheet: z.coerce.number().positive("Printing charge must be greater than 0"),
  effectiveFrom: z.string().trim().min(1, "Effective from date is required"),
  effectiveTo: z.string().trim().optional().or(z.literal("")),
});

export const updatePriceRuleSchema = z.object({
  chargePerSheet: z.coerce.number().positive().optional(),
  effectiveTo: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
