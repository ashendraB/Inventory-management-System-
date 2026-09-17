"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { FieldWrapper, TextInput, Select, Button } from "@/components/ui/Field";
import { formatDate } from "@/lib/format";
import type { UserRole } from "@prisma/client";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrator",
  INVENTORY_OPERATOR: "Inventory Operator",
  PRINTING_OPERATOR: "Printing Operator",
};

export interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  canManagePricing: boolean;
  canManageSettings: boolean;
  isActive: boolean;
  createdAt: Date | string;
}

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "PRINTING_OPERATOR" as UserRole,
  canManagePricing: false,
  canManageSettings: false,
};

export function UserManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setForm({
      name: u.name,
      username: u.username,
      email: u.email ?? "",
      password: "",
      role: u.role,
      canManagePricing: u.canManagePricing,
      canManageSettings: u.canManageSettings,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = editingId
        ? {
            name: form.name,
            email: form.email,
            role: form.role,
            canManagePricing: form.canManagePricing,
            canManageSettings: form.canManageSettings,
            ...(form.password && { password: form.password }),
          }
        : form;

      const res = await fetch(
        editingId ? `/api/settings/users/${editingId}` : "/api/settings/users",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save this user.");
        return;
      }
      toast.success(editingId ? "User updated" : `User ${data.user.username} created`);
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(u: UserRow) {
    if (u.id === currentUserId && u.isActive) {
      toast.error("You can't deactivate your own account.");
      return;
    }
    const res = await fetch(`/api/settings/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not update this user.");
      return;
    }
    toast.success(u.isActive ? "User deactivated" : "User reactivated");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!showForm && (
          <Button type="button" onClick={startAdd}>
            + Add User
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrapper label="Full Name" htmlFor="u-name" required>
              <TextInput
                id="u-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Username"
              htmlFor="u-username"
              required={!editingId}
              hint={editingId ? "Usernames can't be changed after creation." : undefined}
            >
              <TextInput
                id="u-username"
                required={!editingId}
                disabled={!!editingId}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label="Email" htmlFor="u-email">
              <TextInput
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Password"
              htmlFor="u-password"
              required={!editingId}
              hint={editingId ? "Leave blank to keep the current password." : "At least 6 characters."}
            >
              <TextInput
                id="u-password"
                type="password"
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label="Role" htmlFor="u-role" required>
              <Select
                id="u-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">
              Extra Permissions <span className="text-slate-400">(Operators only — Administrators already have everything)</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.canManagePricing}
                  onChange={(e) => setForm({ ...form, canManagePricing: e.target.checked })}
                />
                Can manage printing pricing
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.canManageSettings}
                  onChange={(e) => setForm({ ...form, canManageSettings: e.target.checked })}
                />
                Can manage settings
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Add User"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Extra Permissions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-1 text-xs text-slate-400">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.username}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.canManagePricing && <Badge tone="info">Pricing</Badge>}
                      {u.canManageSettings && <Badge tone="info">Settings</Badge>}
                      {!u.canManagePricing && !u.canManageSettings && (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "success" : "neutral"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(u)} className="text-indigo-600 hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className="text-slate-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={u.id === currentUserId && u.isActive}
                        title={u.id === currentUserId && u.isActive ? "You can't deactivate your own account" : undefined}
                      >
                        {u.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
