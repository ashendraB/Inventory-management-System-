"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";
import { DocumentUpload, type DocumentUploadHandle } from "@/components/printing/DocumentUpload";
import { formatCurrency } from "@/lib/format";
import { calculatePrintingJob } from "@/lib/printing-calculation";

interface Lecturer {
  id: string;
  name: string;
  department: string | null;
}

interface PaperItem {
  id: string;
  itemCode: string;
  name: string;
  barcode: string;
  paperSizeName: string | null;
  gsmValue: number | null;
  paperTypeName: string | null;
  activeLot: { id: string; lotCode: string; currentQuantity: number; costPerSheet: string } | null;
}

interface Profile {
  id: string;
  name: string;
  inventoryItemId: string;
  colourMode: "BW" | "COLOUR";
  sides: "SINGLE" | "DOUBLE";
}

interface PreviewState {
  loading: boolean;
  error: string | null;
  priceError: string | null;
  chargePerSheet: number | null;
}

export function PrintingCalculatorForm({
  lecturers,
  initialItems,
  initialProfiles,
}: {
  lecturers: Lecturer[];
  initialItems: PaperItem[];
  initialProfiles: Profile[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [lecturerId, setLecturerId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [colourMode, setColourMode] = useState<"BW" | "COLOUR">("BW");
  const [itemId, setItemId] = useState("");
  const [sides, setSides] = useState<"SINGLE" | "DOUBLE">("SINGLE");
  const [pages, setPages] = useState("");
  const [copies, setCopies] = useState("");
  const [notes, setNotes] = useState("");

  const [profiles, setProfiles] = useState(initialProfiles);
  const [profileId, setProfileId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [showSaveProfile, setShowSaveProfile] = useState(false);

  const [scanValue, setScanValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanPrompt, setScanPrompt] = useState<{ lotId: string; lotCode: string } | null>(null);

  const [preview, setPreview] = useState<PreviewState>({
    loading: false,
    error: null,
    priceError: null,
    chargePerSheet: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [printedRecord, setPrintedRecord] = useState<{ id: string; printingCode: string } | null>(null);

  const documentRef = useRef<DocumentUploadHandle>(null);
  const [documentReady, setDocumentReady] = useState(false);

  const selectedItem = items.find((i) => i.id === itemId) ?? null;

  // Local, instant math for the two numbers that don't need the server
  // (pages/copies/sides only) — the authoritative version (with real cost +
  // stock) still comes from /api/printing/preview below.
  const physicalSheets = useMemo(() => {
    const p = Number(pages);
    const c = Number(copies);
    if (!p || !c) return null;
    return calculatePrintingJob({
      sides,
      pages: p,
      copies: c,
      paperCostPerSheet: 0,
      printingChargePerSheet: 0,
      availableStock: 0,
    }).physicalSheets;
  }, [pages, copies, sides]);

  // Fetch the real preview (active lot cost + price rule + stock check)
  // whenever the inputs that affect it change.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;

      if (!itemId || !pages || !copies) {
        setPreview({ loading: false, error: null, priceError: null, chargePerSheet: null });
        return;
      }

      setPreview((p) => ({ ...p, loading: true, error: null, priceError: null }));
      try {
        const res = await fetch("/api/printing/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventoryItemId: itemId,
            colourMode,
            sides,
            pages: Number(pages),
            copies: Number(copies),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setPreview({
            loading: false,
            error: res.status === 409 ? null : data.error,
            priceError: res.status === 422 ? data.error : null,
            chargePerSheet: null,
          });
          return;
        }
        setPreview({
          loading: false,
          error: null,
          priceError: null,
          chargePerSheet: data.calculation.printingChargePerSheet,
        });
        // Refresh this item's active-lot snapshot so the displayed stock
        // stays current without a full refetch of the whole list.
        setItems((list) =>
          list.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  activeLot: {
                    id: data.activeLot.id,
                    lotCode: i.activeLot?.lotCode ?? "",
                    currentQuantity: data.activeLot.currentQuantity,
                    costPerSheet: data.activeLot.costPerSheet,
                  },
                }
              : i
          )
        );
      } catch {
        if (!cancelled) {
          setPreview({ loading: false, error: "Could not reach the server.", priceError: null, chargePerSheet: null });
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemId, colourMode, sides, pages, copies]);

  const calculation = useMemo(() => {
    if (!selectedItem?.activeLot || preview.chargePerSheet === null || !pages || !copies) {
      return null;
    }
    return calculatePrintingJob({
      sides,
      pages: Number(pages),
      copies: Number(copies),
      paperCostPerSheet: Number(selectedItem.activeLot.costPerSheet),
      printingChargePerSheet: preview.chargePerSheet,
      availableStock: selectedItem.activeLot.currentQuantity,
    });
  }, [selectedItem, preview.chargePerSheet, sides, pages, copies]);

  async function handleScan() {
    if (!scanValue.trim()) return;
    setScanning(true);
    setScanPrompt(null);
    try {
      const res = await fetch(`/api/printing/scan?barcode=${encodeURIComponent(scanValue.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Barcode not found.");
        return;
      }
      if (!items.some((i) => i.id === data.inventoryItemId)) {
        // Item exists but wasn't in our initial "has active lot maybe" list
        // (e.g. inactive item's lot) — refetch the full list to be safe.
        const listRes = await fetch("/api/printing/items");
        const listData = await listRes.json();
        setItems(listData.items);
      }
      setItemId(data.inventoryItemId);
      if (data.scannedLotId && !data.scannedLotIsActive) {
        setScanPrompt({ lotId: data.scannedLotId, lotCode: scanValue.trim() });
      }
      toast.success("Paper selected");
      setScanValue("");
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setScanning(false);
    }
  }

  async function handleActivateScannedLot() {
    if (!scanPrompt) return;
    const res = await fetch(`/api/inventory/lots/${scanPrompt.lotId}/activate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not set this lot active.");
      return;
    }
    toast.success("Lot set as active stock");
    setScanPrompt(null);
    const listRes = await fetch("/api/printing/items");
    const listData = await listRes.json();
    setItems(listData.items);
  }

  function handleReset() {
    setLecturerId("");
    setDocumentName("");
    setColourMode("BW");
    setItemId("");
    setSides("SINGLE");
    setPages("");
    setCopies("");
    setNotes("");
    setProfileId("");
    setSubmitError(null);
    setPrintedRecord(null);
  }

  function handleApplyProfile(id: string) {
    setProfileId(id);
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    setItemId(profile.inventoryItemId);
    setColourMode(profile.colourMode);
    setSides(profile.sides);
    toast.success(`Loaded profile "${profile.name}"`);
  }

  async function handleSaveProfile() {
    if (!newProfileName.trim() || !itemId) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/printing/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName.trim(),
          inventoryItemId: itemId,
          colourMode,
          sides,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save this profile.");
        return;
      }
      setProfiles((list) =>
        [...list, { ...data.profile }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setProfileId(data.profile.id);
      setNewProfileName("");
      setShowSaveProfile(false);
      toast.success(`Profile "${data.profile.name}" saved`);
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteProfile() {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    if (!window.confirm(`Delete the profile "${profile.name}"?`)) return;
    const res = await fetch(`/api/printing/profiles/${profile.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete this profile.");
      return;
    }
    setProfiles((list) => list.filter((p) => p.id !== profile.id));
    setProfileId("");
    toast.success("Profile deleted");
  }

  async function handleSubmit() {
    setSubmitError(null);
    setPrintedRecord(null);
    if (!lecturerId || !documentName || !itemId || !pages || !copies) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/printing/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecturerId,
          inventoryItemId: itemId,
          documentName,
          colourMode,
          sides,
          pages: Number(pages),
          copies: Number(copies),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not submit this printing job.");
        return;
      }

      if (documentReady) {
        // Print first, before navigating anywhere — leaving the page while
        // the native print dialog is open can dismiss it in some browsers.
        documentRef.current?.print();
        setPrintedRecord({ id: data.record.id, printingCode: data.record.printingCode });
        toast.success(`Printing record ${data.record.printingCode} saved`);
      } else {
        toast.success(`Printing record ${data.record.printingCode} submitted`);
        router.push(`/printing/records/${data.record.id}`);
      }
    } catch {
      setSubmitError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    lecturerId &&
    documentName &&
    itemId &&
    pages &&
    copies &&
    calculation?.sufficientStock &&
    !preview.priceError &&
    !preview.loading;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <DocumentUpload
          ref={documentRef}
          onPagesDetected={(n) => setPages(String(n))}
          onReadyChange={setDocumentReady}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <FieldWrapper
              label="Profile"
              htmlFor="profileId"
              hint="Load a saved paper/colour/sides preset"
              className="min-w-[220px] flex-1"
            >
              <Select
                id="profileId"
                value={profileId}
                onChange={(e) => (e.target.value ? handleApplyProfile(e.target.value) : setProfileId(""))}
              >
                <option value="">None — choose manually</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            {profileId && (
              <Button type="button" variant="secondary" onClick={handleDeleteProfile}>
                Delete Profile
              </Button>
            )}
            {itemId && !showSaveProfile && (
              <Button type="button" variant="secondary" onClick={() => setShowSaveProfile(true)}>
                Save as Profile
              </Button>
            )}
          </div>

          {showSaveProfile && (
            <div className="mb-4 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3">
              <FieldWrapper label="New Profile Name" htmlFor="newProfileName" className="min-w-[200px] flex-1">
                <TextInput
                  id="newProfileName"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="A3 Booklet Tute"
                />
              </FieldWrapper>
              <Button type="button" onClick={handleSaveProfile} disabled={savingProfile || !newProfileName.trim()}>
                {savingProfile ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowSaveProfile(false)}>
                Cancel
              </Button>
            </div>
          )}

          <div className="mb-4 flex gap-2">
            <TextInput
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScan();
                }
              }}
              placeholder="Scan or type a paper item / lot barcode..."
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={handleScan} disabled={scanning}>
              {scanning ? "Looking up..." : "Scan"}
            </Button>
          </div>

          {scanPrompt && (
            <div className="mb-4 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <span>
                Lot {scanPrompt.lotCode} isn&apos;t the active lot for this item — activate it?
              </span>
              <Button type="button" onClick={handleActivateScannedLot}>
                Set Active
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrapper label="Lecturer" htmlFor="lecturerId" required>
              <Select id="lecturerId" required value={lecturerId} onChange={(e) => setLecturerId(e.target.value)}>
                <option value="">Select lecturer</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.department ? ` (${l.department})` : ""}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Document Name" htmlFor="documentName" required>
              <TextInput
                id="documentName"
                required
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Economics Tutorial 03"
              />
            </FieldWrapper>

            <FieldWrapper label="Paper" htmlFor="itemId" required>
              <Select id="itemId" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">Select paper</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                    {i.paperSizeName ? ` — ${i.paperSizeName}/${i.gsmValue}/${i.paperTypeName}` : ""}
                    {!i.activeLot ? " (no active stock)" : ""}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Colour" htmlFor="colourMode" required>
              <Select
                id="colourMode"
                value={colourMode}
                onChange={(e) => setColourMode(e.target.value as "BW" | "COLOUR")}
              >
                <option value="BW">Black &amp; White</option>
                <option value="COLOUR">Colour</option>
              </Select>
            </FieldWrapper>

            <FieldWrapper label="Sides" htmlFor="sides" required>
              <Select id="sides" value={sides} onChange={(e) => setSides(e.target.value as "SINGLE" | "DOUBLE")}>
                <option value="SINGLE">Single Side</option>
                <option value="DOUBLE">Double Side</option>
              </Select>
            </FieldWrapper>
            <div />

            <FieldWrapper label="Number of Pages" htmlFor="pages" required>
              <TextInput
                id="pages"
                type="number"
                min={1}
                required
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Number of Copies" htmlFor="copies" required>
              <TextInput
                id="copies"
                type="number"
                min={1}
                required
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
              />
            </FieldWrapper>

          </div>

          <div className="mt-4">
            <FieldWrapper label="Notes" htmlFor="notes">
              <TextArea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FieldWrapper>
          </div>
        </div>

        {submitError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>
        )}

        {printedRecord && (
          <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>
              Printing record {printedRecord.printingCode} saved. Finish printing in the dialog,
              then view it whenever you&apos;re ready.
            </span>
            <a
              href={`/printing/records/${printedRecord.id}`}
              className="font-medium text-emerald-900 underline"
            >
              View Summary
            </a>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting
              ? "Submitting..."
              : documentReady
                ? "Submit & Print"
                : "Submit Printing Record"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Active Stock</h2>
          {!itemId ? (
            <p className="text-sm text-slate-400">Select a paper to see its active lot.</p>
          ) : !selectedItem?.activeLot ? (
            <p className="text-sm text-red-600">
              No active stock is available for this paper. Please scan or add a new stock lot.
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <Row label="Lot" value={selectedItem.activeLot.lotCode} />
              <Row label="Available" value={selectedItem.activeLot.currentQuantity.toLocaleString()} />
              <Row
                label="Cost"
                value={`${formatCurrency(Number(selectedItem.activeLot.costPerSheet))}/sheet`}
              />
            </dl>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Calculation</h2>
          {preview.priceError && (
            <p className="mb-2 text-sm text-red-600">{preview.priceError}</p>
          )}
          {physicalSheets === null ? (
            <p className="text-sm text-slate-400">Enter pages and copies to calculate.</p>
          ) : !calculation ? (
            <p className="text-sm text-slate-400">
              Physical Sheets: {physicalSheets.toLocaleString()}
              {preview.loading && " — calculating cost..."}
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <Row label="Physical Sheets" value={calculation.physicalSheets.toLocaleString()} />
              <Row label="Paper Cost" value={formatCurrency(calculation.totalPaperCost)} />
              <Row label="Printing Charge" value={formatCurrency(calculation.totalPrintingCharge)} />
              <div className="border-t border-slate-200 pt-2">
                <Row label="TOTAL" value={formatCurrency(calculation.totalCost)} bold />
              </div>
              {!calculation.sufficientStock && (
                <p className="pt-2 text-sm text-red-600">
                  Insufficient stock. Required: {calculation.physicalSheets.toLocaleString()} sheets.
                  Available: {selectedItem!.activeLot!.currentQuantity.toLocaleString()} sheets.
                  Shortage: {(calculation.physicalSheets - selectedItem!.activeLot!.currentQuantity).toLocaleString()} sheets.
                </p>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={bold ? "text-base font-semibold text-slate-900" : "text-slate-800"}>{value}</dd>
    </div>
  );
}
