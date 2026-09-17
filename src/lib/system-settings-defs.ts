/** Fixed, curated set of settings this app actually reads somewhere —
 * deliberately not a raw open-ended key/value editor, so every setting
 * shown here does something. Institute details print on invoices
 * (src/app/(app)/billing/invoices/[id]/page.tsx). The underlying
 * SystemSetting table is still a generic key/value store, so adding a new
 * setting later is just adding an entry here plus wherever it's read.
 *
 * Kept separate from system-settings-service.ts (which is server-only) so
 * the client settings form can import these constants/types too. */
export const SETTING_DEFS = [
  {
    key: "institute_name",
    label: "Institute Name",
    placeholder: "e.g. ABC Institute of Technology",
  },
  {
    key: "institute_address",
    label: "Institute Address",
    placeholder: "e.g. 123 Main Street, Colombo",
  },
  { key: "institute_phone", label: "Institute Phone", placeholder: "e.g. 011 234 5678" },
  { key: "institute_email", label: "Institute Email", placeholder: "e.g. info@institute.edu" },
  {
    key: "invoice_footer_note",
    label: "Invoice Footer Note",
    placeholder: "e.g. Payment due within 30 days of the invoice date.",
  },
] as const;

export type SettingKey = (typeof SETTING_DEFS)[number]["key"];
export type SettingsMap = Record<SettingKey, string>;
