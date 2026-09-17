"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Button } from "@/components/ui/Field";
import { SETTING_DEFS, type SettingsMap } from "@/lib/system-settings-defs";

export function SystemSettingsForm({ initialValues }: { initialValues: SettingsMap }) {
  const router = useRouter();
  const [values, setValues] = useState<SettingsMap>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {SETTING_DEFS.filter((d) => d.key !== "invoice_footer_note").map((def) => (
        <FieldWrapper key={def.key} label={def.label} htmlFor={def.key}>
          <TextInput
            id={def.key}
            value={values[def.key]}
            onChange={(e) => setValues({ ...values, [def.key]: e.target.value })}
            placeholder={def.placeholder}
          />
        </FieldWrapper>
      ))}
      <FieldWrapper label="Invoice Footer Note" htmlFor="invoice_footer_note">
        <TextArea
          id="invoice_footer_note"
          value={values.invoice_footer_note}
          onChange={(e) => setValues({ ...values, invoice_footer_note: e.target.value })}
          placeholder="e.g. Payment due within 30 days of the invoice date."
        />
      </FieldWrapper>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
