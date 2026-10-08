import { z } from "zod";

export const createLecturerSchema = z.object({
  name: z.string().trim().min(1, "Lecturer name is required").max(200),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  // Subject *names* as typed — resolved to a Subject row (created if new) in
  // lecturer-service, so one spelling = one subject everywhere.
  subjects: z.array(z.string().trim().max(50)).max(20).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateLecturerSchema = createLecturerSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
