"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FieldWrapper,
  TextInput,
  TextArea,
  Button,
} from "@/components/ui/Field";

export interface LecturerFormValues {
  name: string;
  subjects: string[];
  email: string;
  phone: string;
  notes: string;
}

const EMPTY: LecturerFormValues = {
  name: "",
  subjects: [],
  email: "",
  phone: "",
  notes: "",
};

export function LecturerForm({
  lecturerId,
  initialValues,
  subjectOptions = [],
}: {
  lecturerId?: string; // presence = edit mode
  initialValues?: Partial<LecturerFormValues>;
  subjectOptions?: string[]; // existing subjects, offered as suggestions
}) {
  const router = useRouter();
  const [values, setValues] = useState<LecturerFormValues>({
    ...EMPTY,
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");

  // Existing subjects, plus any this lecturer already has that are no longer
  // in the active list (e.g. a deactivated subject), plus ones just typed in.
  const allSubjects = [
    ...new Set([...subjectOptions, ...values.subjects]),
  ].sort((a, b) => a.localeCompare(b));

  function toggleSubject(name: string) {
    setValues((v) => ({
      ...v,
      subjects: v.subjects.includes(name)
        ? v.subjects.filter((s) => s !== name)
        : [...v.subjects, name],
    }));
  }

  function addNewSubject() {
    const name = newSubject.trim();
    if (!name) return;
    const existing = allSubjects.find(
      (s) => s.toLowerCase() === name.toLowerCase(),
    );
    const finalName = existing ?? name;
    setValues((v) =>
      v.subjects.includes(finalName)
        ? v
        : { ...v, subjects: [...v.subjects, finalName] },
    );
    setNewSubject("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // A subject typed but not yet "Add"-ed still counts.
    const pending = newSubject.trim();
    const submitSubjects =
      pending &&
      !values.subjects.some((s) => s.toLowerCase() === pending.toLowerCase())
        ? [...values.subjects, pending]
        : values.subjects;
    try {
      const res = await fetch(
        lecturerId ? `/api/lecturers/${lecturerId}` : "/api/lecturers",
        {
          method: lecturerId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, subjects: submitSubjects }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save this lecturer.");
        return;
      }
      toast.success(
        lecturerId
          ? "Lecturer updated"
          : `Lecturer ${data.lecturer.lecturerCode} created`,
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
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
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
        <div className="sm:col-span-2">
          <FieldWrapper
            label="Subjects"
            htmlFor="l-new-subject"
            hint="Tick every subject this lecturer teaches, or add a new one. In the Printing Calculator, picking the lecturer fills the subject in (or offers their subjects first if they teach more than one)."
          >
            <div className="mb-2 flex flex-wrap gap-2">
              {allSubjects.length === 0 && (
                <span className="text-sm text-slate-400">
                  No subjects yet — add one below.
                </span>
              )}
              {allSubjects.map((s) => {
                const on = values.subjects.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSubject(s)}
                    className={
                      "rounded-full border px-3 py-1 text-sm transition-colors " +
                      (on
                        ? "border-gold-500 bg-gold-500 font-medium text-brand-900"
                        : "border-white/20 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {on ? "✓ " : ""}
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <TextInput
                id="l-new-subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewSubject();
                  }
                }}
                placeholder="Add a new subject, e.g. Chemistry"
                autoComplete="off"
              />
              <Button type="button" variant="secondary" onClick={addNewSubject}>
                Add
              </Button>
            </div>
          </FieldWrapper>
        </div>
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
          {submitting
            ? "Saving..."
            : lecturerId
              ? "Save Changes"
              : "Add Lecturer"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
