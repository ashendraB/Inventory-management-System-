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

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(200),
  categoryId: z.string().trim().min(1, "Category is required"),
  itemType: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Unit is required").max(50),
  minStock: z.coerce.number().min(0, "Minimum stock cannot be negative").default(0),
  defaultPrice: z.coerce.number().min(0, "Price cannot be negative").default(0),
  supplierId: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();
