"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Button } from "@/components/ui/Field";

export interface LecturerFormValues {
  name: string;
  department: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY: LecturerFormValues = {
  name: "",
  department: "",
  email: "",
  phone: "",
  notes: "",
};

export function LecturerForm({
  lecturerId,
  initialValues,
}: {
  lecturerId?: string; // presence = edit mode
  initialValues?: Partial<LecturerFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<LecturerFormValues>({ ...EMPTY, ...initialValues });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        lecturerId ? `/api/lecturers/${lecturerId}` : "/api/lecturers",
        {
          method: lecturerId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save this lecturer.");
        return;
      }
      toast.success(
        lecturerId ? "Lecturer updated" : `Lecturer ${data.lecturer.lecturerCode} created`
      );
      router.push("/lecturers");
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
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrapper label="Lecturer Name" htmlFor="l-name" required>
          <TextInput
            id="l-name"
            required
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            placeholder="Dr. Fernando"
          />
        </FieldWrapper>
        <FieldWrapper label="Department" htmlFor="l-department">
          <TextInput
            id="l-department"
            value={values.department}
            onChange={(e) => setValues({ ...values, department: e.target.value })}
            placeholder="Computer Science"
          />
        </FieldWrapper>
        <FieldWrapper label="Email" htmlFor="l-email">
          <TextInput
            id="l-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </FieldWrapper>
        <FieldWrapper label="Phone" htmlFor="l-phone">
          <TextInput
            id="l-phone"
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
          />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Notes" htmlFor="l-notes">
        <TextArea
          id="l-notes"
          value={values.notes}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
        />
      </FieldWrapper>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : lecturerId ? "Save Changes" : "Add Lecturer"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
