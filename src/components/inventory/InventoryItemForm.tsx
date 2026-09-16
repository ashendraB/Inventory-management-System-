"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";

export interface InventoryItemFormValues {
  name: string;
  categoryId: string;
  itemType: string;
  description: string;
  brand: string;
  unit: string;
  minStock: string;
  defaultPrice: string;
  supplierId: string;
  location: string;
  notes: string;
}

const EMPTY: InventoryItemFormValues = {
  name: "",
  categoryId: "",
  itemType: "",
  description: "",
  brand: "",
  unit: "",
  minStock: "0",
  defaultPrice: "0",
  supplierId: "",
  location: "",
  notes: "",
};

export function InventoryItemForm({
  categories,
  suppliers,
  initialValues,
  itemId,
  allowNewCategory = false,
}: {
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  initialValues?: Partial<InventoryItemFormValues>;
  itemId?: string; // presence = edit mode
  allowNewCategory?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<InventoryItemFormValues>({
    ...EMPTY,
    ...initialValues,
  });
  const [categoryList, setCategoryList] = useState(categories);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  function set<K extends keyof InventoryItemFormValues>(
    key: K,
    value: InventoryItemFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not add category.");
        return;
      }
      const category = data.category as { id: string; name: string };
      setCategoryList((list) => [...list, category].sort((a, b) => a.name.localeCompare(b.name)));
      set("categoryId", category.id);
      setNewCategoryName("");
      setAddingCategory(false);
      toast.success(`Category "${category.name}" added`);
    } catch {
      toast.error("Could not add category.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        minStock: Number(values.minStock || 0),
        defaultPrice: Number(values.defaultPrice || 0),
      };
      const res = await fetch(
        itemId ? `/api/inventory/items/${itemId}` : "/api/inventory/items",
        {
          method: itemId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save this item.");
        return;
      }
      toast.success(itemId ? "Item updated" : `Item ${data.item.itemCode} created`);
      router.push(`/inventory/items/${data.item.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrapper label="Item Name" htmlFor="name" required>
          <TextInput
            id="name"
            required
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="A4 Paper 80 GSM Plain"
          />
        </FieldWrapper>

        <FieldWrapper label="Category" htmlFor="categoryId" required>
          {!addingCategory ? (
            <div className="flex gap-2">
              <Select
                id="categoryId"
                required
                value={values.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                <option value="">Select category</option>
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {allowNewCategory && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAddingCategory(true)}
                >
                  + New
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <TextInput
                autoFocus
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button type="button" onClick={handleAddCategory}>
                Add
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAddingCategory(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </FieldWrapper>

        <FieldWrapper label="Item Type" htmlFor="itemType">
          <TextInput
            id="itemType"
            value={values.itemType}
            onChange={(e) => set("itemType", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper label="Brand" htmlFor="brand">
          <TextInput
            id="brand"
            value={values.brand}
            onChange={(e) => set("brand", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper label="Unit" htmlFor="unit" required hint="e.g. Sheet, Box, Unit">
          <TextInput
            id="unit"
            required
            value={values.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="Sheet"
          />
        </FieldWrapper>

        <FieldWrapper label="Minimum Stock Level" htmlFor="minStock">
          <TextInput
            id="minStock"
            type="number"
            min={0}
            step="any"
            value={values.minStock}
            onChange={(e) => set("minStock", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper label="Default Price" htmlFor="defaultPrice">
          <TextInput
            id="defaultPrice"
            type="number"
            min={0}
            step="any"
            value={values.defaultPrice}
            onChange={(e) => set("defaultPrice", e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper label="Supplier" htmlFor="supplierId">
          <Select
            id="supplierId"
            value={values.supplierId}
            onChange={(e) => set("supplierId", e.target.value)}
          >
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FieldWrapper>

        <FieldWrapper label="Location" htmlFor="location">
          <TextInput
            id="location"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Store Room A, Shelf 3"
          />
        </FieldWrapper>
      </div>

      <FieldWrapper label="Description" htmlFor="description">
        <TextArea
          id="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </FieldWrapper>

      <FieldWrapper label="Notes" htmlFor="notes">
        <TextArea
          id="notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </FieldWrapper>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : itemId ? "Save Changes" : "Create Item"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
