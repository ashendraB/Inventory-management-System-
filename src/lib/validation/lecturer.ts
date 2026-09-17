import { z } from "zod";

export const createLecturerSchema = z.object({
  name: z.string().trim().min(1, "Lecturer name is required").max(200),
  department: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateLecturerSchema = createLecturerSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
