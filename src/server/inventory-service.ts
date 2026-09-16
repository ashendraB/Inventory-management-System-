import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import type { z } from "zod";
import type {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createSupplierSchema,
  updateSupplierSchema,
  createCategorySchema,
} from "@/lib/validation/inventory";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories() {
  return prisma.inventoryCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  data: z.infer<typeof createCategorySchema>
) {
  return prisma.inventoryCategory.create({ data: { name: data.name } });
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function listSuppliers(includeInactive = false) {
  return prisma.supplier.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({ where: { id } });
}

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

export async function createSupplier(
  data: z.infer<typeof createSupplierSchema>
) {
  return prisma.supplier.create({
    data: {
      name: data.name,
      contactPerson: cleanOptional(data.contactPerson),
      phone: cleanOptional(data.phone),
      email: cleanOptional(data.email),
      address: cleanOptional(data.address),
      notes: cleanOptional(data.notes),
    },
  });
}

export async function updateSupplier(
  id: string,
  data: z.infer<typeof updateSupplierSchema>
) {
  return prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.contactPerson !== undefined && {
        contactPerson: cleanOptional(data.contactPerson),
      }),
      ...(data.phone !== undefined && { phone: cleanOptional(data.phone) }),
      ...(data.email !== undefined && { email: cleanOptional(data.email) }),
      ...(data.address !== undefined && {
        address: cleanOptional(data.address),
      }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

// ---------------------------------------------------------------------------
// Inventory items
// ---------------------------------------------------------------------------

export interface InventoryItemFilters {
  search?: string;
  categoryId?: string;
  status?: "ACTIVE" | "INACTIVE";
  supplierId?: string;
  sort?: "name" | "quantity" | "price" | "date";
  page?: number;
  pageSize?: number;
}

export async function listInventoryItems(filters: InventoryItemFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;

  const where = {
    ...(filters.status && { status: filters.status }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.supplierId && { supplierId: filters.supplierId }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search } },
        { itemCode: { contains: filters.search } },
        { barcode: { contains: filters.search } },
      ],
    }),
  };

  const orderBy =
    filters.sort === "price"
      ? { defaultPrice: "desc" as const }
      : filters.sort === "date"
        ? { createdAt: "desc" as const }
        : { name: "asc" as const };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true, supplier: true, lots: { select: { currentQuantity: true } } },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      totalStock: item.lots.reduce((sum, l) => sum + l.currentQuantity, 0),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: true,
      lots: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createInventoryItem(
  data: z.infer<typeof createInventoryItemSchema>
) {
  const seq = await nextSequence("inventory_item");
  const itemCode = `INV-${padSequence(seq)}`;

  return prisma.inventoryItem.create({
    data: {
      itemCode,
      barcode: itemCode, // Code128-compatible; scanning it looks up this same record.
      name: data.name,
      categoryId: data.categoryId,
      itemType: cleanOptional(data.itemType),
      description: cleanOptional(data.description),
      brand: cleanOptional(data.brand),
      unit: data.unit,
      minStock: data.minStock ?? 0,
      defaultPrice: data.defaultPrice ?? 0,
      supplierId: cleanOptional(data.supplierId),
      location: cleanOptional(data.location),
      notes: cleanOptional(data.notes),
    },
  });
}

export async function updateInventoryItem(
  id: string,
  data: z.infer<typeof updateInventoryItemSchema>
) {
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.itemType !== undefined && { itemType: cleanOptional(data.itemType) }),
      ...(data.description !== undefined && {
        description: cleanOptional(data.description),
      }),
      ...(data.brand !== undefined && { brand: cleanOptional(data.brand) }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.minStock !== undefined && { minStock: data.minStock }),
      ...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
      ...(data.supplierId !== undefined && {
        supplierId: cleanOptional(data.supplierId),
      }),
      ...(data.location !== undefined && { location: cleanOptional(data.location) }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
    },
  });
}

export async function setInventoryItemStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE"
) {
  return prisma.inventoryItem.update({ where: { id }, data: { status } });
}
