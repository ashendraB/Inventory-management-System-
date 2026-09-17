import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import type { z } from "zod";
import type { createUserSchema, updateUserSchema } from "@/lib/validation/user";

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

// Never select passwordHash outside of login — every read in this file
// goes through this so a user's hash can never leak into an API response.
const SAFE_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  canManagePricing: true,
  canManageSettings: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({ select: SAFE_SELECT, orderBy: { name: "asc" } });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: cleanOptional(data.email),
      passwordHash,
      role: data.role,
      canManagePricing: data.canManagePricing ?? false,
      canManageSettings: data.canManageSettings ?? false,
    },
    select: SAFE_SELECT,
  });
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  const passwordHash = data.password ? await hashPassword(data.password) : undefined;
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: cleanOptional(data.email) }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.canManagePricing !== undefined && { canManagePricing: data.canManagePricing }),
      ...(data.canManageSettings !== undefined && { canManageSettings: data.canManageSettings }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(passwordHash !== undefined && { passwordHash }),
    },
    select: SAFE_SELECT,
  });
}
