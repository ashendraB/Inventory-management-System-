"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/format";

export interface Category {
  id: string;
  name: string;
}

export interface LookupOption {
  id: string;
  label: string;
}

export interface EditableItemValues {
  name: string;
  categoryId: string;
  brand: string;
  defaultPrice: string;
  currentQuantity: string;
  minStock: string;
  supplierId: string;
  location: string;
  description: string;
  notes: string;
  paperSizeId: string;
  gsmId: string;
  paperTypeId: string;
}

const EMPTY_EDIT: EditableItemValues = {
  name: "",
  categoryId: "",
  brand: "",
  defaultPrice: "0",
  currentQuantity: "0",
  minStock: "0",
  supplierId: "",
  location: "",
  description: "",
  notes: "",
  paperSizeId: "",
  gsmId: "",
  paperTypeId: "",
};

function isPaperCategory(categories: Category[], categoryId: string) {
  return categories.find((c) => c.id === categoryId)?.name.toLowerCase() === "paper";
}

export function InventoryItemForm({
  categories,
  suppliers,
  paperSizes,
  gsmTypes,
  paperTypes,
  initialValues,
  itemId,
  isPaperItem = false,
  allowNewCategory = false,
}: {
  categories: Category[];
  suppliers: { id: string; name: string }[];
  paperSizes: LookupOption[];
  gsmTypes: LookupOption[];
  paperTypes: LookupOption[];
  initialValues?: Partial<EditableItemValues>;
  itemId?: string; // presence = edit mode (always the plain generic field set)
  isPaperItem?: boolean; // edit mode only: is the item being edited a Paper item?
  allowNewCategory?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(itemId);

  const [values, setValues] = useState<EditableItemValues>({
    ...EMPTY_EDIT,
    ...initialValues,
  });
  const [packs, setPacks] = useState("");
  const [sheetsPerPack, setSheetsPerPack] = useState("");
  const [packPrice, setPackPrice] = useState("");

  const [categoryList, setCategoryList] = useState(categories);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const paperMode = isEdit ? isPaperItem : isPaperCategory(categoryList, values.categoryId);

  const costPerSheet = useMemo(() => {
    const p = Number(packPrice);
    const s = Number(sheetsPerPack);
    if (!p || !s) return null;
    return p / s;
  }, [packPrice, sheetsPerPack]);

  function set<K extends keyof EditableItemValues>(key: K, value: EditableItemValues[K]) {
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
      const category = data.category as Category;
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
      const common = {
        name: values.name,
        categoryId: values.categoryId,
        description: values.description,
        supplierId: values.supplierId,
        location: values.location,
        notes: values.notes,
      };

      const payload = isEdit
        ? {
            ...common,
            brand: values.brand,
            defaultPrice: Number(values.defaultPrice || 0),
            currentQuantity: Number(values.currentQuantity || 0),
            minStock: Number(values.minStock || 0),
            ...(isPaperItem && {
              paperSizeId: values.paperSizeId,
              gsmId: values.gsmId,
              paperTypeId: values.paperTypeId,
            }),
          }
        : paperMode
          ? {
              ...common,
              kind: "paper" as const,
              paperSizeId: values.paperSizeId,
              gsmId: values.gsmId,
              paperTypeId: values.paperTypeId,
              packs: Number(packs || 0),
              sheetsPerPack: Number(sheetsPerPack || 0),
              packPrice: Number(packPrice || 0),
            }
          : {
              ...common,
              kind: "generic" as const,
              brand: values.brand,
              defaultPrice: Number(values.defaultPrice || 0),
              currentQuantity: Number(values.currentQuantity || 0),
              minStock: Number(values.minStock || 0),
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
                disabled={isEdit}
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
              {allowNewCategory && !isEdit && (
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

        {paperMode ? (
          <>
            <FieldWrapper label="Paper Size" htmlFor="paperSizeId" required>
              <Select
                id="paperSizeId"
                required
                value={values.paperSizeId}
                onChange={(e) => set("paperSizeId", e.target.value)}
              >
                <option value="">Select size</option>
                {paperSizes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="GSM" htmlFor="gsmId" required>
              <Select
                id="gsmId"
                required
                value={values.gsmId}
                onChange={(e) => set("gsmId", e.target.value)}
              >
                <option value="">Select GSM</option>
                {gsmTypes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Paper Type" htmlFor="paperTypeId" required>
              <Select
                id="paperTypeId"
                required
                value={values.paperTypeId}
                onChange={(e) => set("paperTypeId", e.target.value)}
              >
                <option value="">Select type</option>
                {paperTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Number of Packs" htmlFor="packs" required>
              <TextInput
                id="packs"
                type="number"
                min={1}
                step="any"
                required
                value={packs}
                onChange={(e) => setPacks(e.target.value)}
                placeholder="10"
              />
            </FieldWrapper>
            <FieldWrapper
              label="Sheets per Pack"
              htmlFor="sheetsPerPack"
              required
              hint="e.g. a ream of A4 is usually 500 sheets"
            >
              <TextInput
                id="sheetsPerPack"
                type="number"
                min={1}
                step="any"
                required
                value={sheetsPerPack}
                onChange={(e) => setSheetsPerPack(e.target.value)}
                placeholder="500"
              />
            </FieldWrapper>
            <FieldWrapper label="Pack Price (Rs.)" htmlFor="packPrice" required>
              <TextInput
                id="packPrice"
                type="number"
                min={0}
                step="any"
                required
                value={packPrice}
                onChange={(e) => setPackPrice(e.target.value)}
                placeholder="2750"
              />
            </FieldWrapper>
            <FieldWrapper
              label="Price per Sheet"
              htmlFor="costPerSheet"
              hint="Calculated automatically from pack price ÷ sheets per pack"
            >
              <TextInput
                id="costPerSheet"
                readOnly
                disabled
                value={costPerSheet !== null ? formatCurrency(costPerSheet) : "—"}
              />
            </FieldWrapper>
          </>
        ) : (
          <>
            <FieldWrapper label="Brand" htmlFor="brand">
              <TextInput
                id="brand"
                value={values.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Price" htmlFor="defaultPrice">
              <TextInput
                id="defaultPrice"
                type="number"
                min={0}
                step="any"
                value={values.defaultPrice}
                onChange={(e) => set("defaultPrice", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Count" htmlFor="currentQuantity" hint="Current quantity on hand">
              <TextInput
                id="currentQuantity"
                type="number"
                min={0}
                step="any"
                value={values.currentQuantity}
                onChange={(e) => set("currentQuantity", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Minimum Stock Level"
              htmlFor="minStock"
              hint="Optional — used for low-stock alerts"
            >
              <TextInput
                id="minStock"
                type="number"
                min={0}
                step="any"
                value={values.minStock}
                onChange={(e) => set("minStock", e.target.value)}
              />
            </FieldWrapper>
          </>
        )}

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
