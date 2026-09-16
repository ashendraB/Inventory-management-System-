import { z } from "zod";

export const addStockLotSchema = z.object({
  packs: z.coerce.number().positive("Number of packs must be greater than 0"),
  sheetsPerPack: z.coerce.number().positive("Sheets per pack must be greater than 0"),
  packPrice: z.coerce.number().positive("Pack price must be greater than 0"),
  supplierId: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  setActive: z.boolean().default(true),
});

export const adjustLotQuantitySchema = z.object({
  delta: z.coerce.number().refine((v) => v !== 0, "Change must not be zero"),
  type: z.enum(["MANUAL_ADJUSTMENT", "DAMAGED", "RETURN", "TRANSFER"]),
  reason: z.string().trim().min(1, "Reason is required").max(500),
});
