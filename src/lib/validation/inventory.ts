import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, "Supplier name is required").max(200),
  contactPerson: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const baseItemFields = {
  name: z.string().trim().min(1, "Item name is required").max(200),
  categoryId: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  supplierId: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
};

// Generic items (toner, ink, stationery, equipment, ...): a plain on-hand
// count, no lot tracking.
export const createGenericItemSchema = z.object({
  ...baseItemFields,
  kind: z.literal("generic"),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  defaultPrice: z.coerce.number().min(0, "Price cannot be negative").default(0),
  currentQuantity: z.coerce.number().min(0, "Count cannot be negative").default(0),
  minStock: z.coerce.number().min(0, "Minimum stock cannot be negative").default(0),
});

// Paper items: entered as packs, which become the item's initial stock lot
// (packs * sheetsPerPack sheets, at packPrice / sheetsPerPack per sheet) —
// this is what the printing calculator will read its paper cost from.
// Paper Size/GSM/Type are required — they're the structured identity that
// Printing Price Rules and the printing calculator match against (spec §24),
// not the free-text name.
export const createPaperItemSchema = z.object({
  ...baseItemFields,
  kind: z.literal("paper"),
  paperSizeId: z.string().trim().min(1, "Paper size is required"),
  gsmId: z.string().trim().min(1, "GSM is required"),
  paperTypeId: z.string().trim().min(1, "Paper type is required"),
  packs: z.coerce.number().positive("Number of packs must be greater than 0"),
  sheetsPerPack: z.coerce.number().positive("Sheets per pack must be greater than 0"),
  packPrice: z.coerce.number().positive("Pack price must be greater than 0"),
});

export const createInventoryItemSchema = z.discriminatedUnion("kind", [
  createGenericItemSchema,
  createPaperItemSchema,
]);

// For non-paper items only (a plain on-hand count, no lots) — mirrors
// adjustLotQuantitySchema exactly, so "used 1" / "stock is finished" go
// through the same audited delta+type+reason pattern lots already use,
// instead of silently overwriting currentQuantity.
export const adjustItemQuantitySchema = z.object({
  delta: z.coerce.number().refine((v) => v !== 0, "Change must not be zero"),
  type: z.enum(["MANUAL_ADJUSTMENT", "DAMAGED", "RETURN", "TRANSFER"]),
  reason: z.string().trim().min(1, "Reason is required").max(500),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  categoryId: z.string().trim().min(1).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  defaultPrice: z.coerce.number().min(0).optional(),
  currentQuantity: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
  supplierId: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  paperSizeId: z.string().trim().optional().or(z.literal("")),
  gsmId: z.string().trim().optional().or(z.literal("")),
  paperTypeId: z.string().trim().optional().or(z.literal("")),
});
