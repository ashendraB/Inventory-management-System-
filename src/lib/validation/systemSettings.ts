import { z } from "zod";

export const updateSystemSettingsSchema = z.object({
  institute_name: z.string().trim().max(200).optional(),
  institute_address: z.string().trim().max(500).optional(),
  institute_phone: z.string().trim().max(50).optional(),
  institute_email: z.string().trim().max(200).optional(),
  invoice_footer_note: z.string().trim().max(1000).optional(),
});
