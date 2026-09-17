import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  role: z.enum(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]),
  canManagePricing: z.boolean().optional(),
  canManageSettings: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["ADMINISTRATOR", "INVENTORY_OPERATOR", "PRINTING_OPERATOR"]).optional(),
  canManagePricing: z.boolean().optional(),
  canManageSettings: z.boolean().optional(),
  isActive: z.boolean().optional(),
  // Only set when resetting a password — blank/omitted leaves it unchanged.
  password: z.string().min(6, "Password must be at least 6 characters").max(200).optional().or(z.literal("")),
});
