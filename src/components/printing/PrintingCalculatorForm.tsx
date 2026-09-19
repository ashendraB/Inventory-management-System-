"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";
import { DocumentUpload, type DocumentUploadHandle } from "@/components/printing/DocumentUpload";
import { formatCurrency } from "@/lib/format";
import { calculatePrintingJob } from "@/lib/printing-calculation";

/** Chunked to avoid a stack-overflow from String.fromCharCode(...bytes) on
 * larger PDFs — btoa() itself has no size limit, spreading a huge array
 * onto the call stack does. */
async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

interface Lecturer {
  id: string;
  name: string;
  department: string | null;
}

interface LookupOption {
  id: string;
  name: string;
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

interface PreviewState {
  loading: boolean;
  error: string | null;
  priceError: string | null;
  chargePerSheet: number | null;
}

export function PrintingCalculatorForm({
  lecturers,
  initialItems,
  subjects,
  grades,
}: {
  lecturers: Lecturer[];
  initialItems: PaperItem[];
  subjects: LookupOption[];
  grades: LookupOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [lecturerId, setLecturerId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [colourMode, setColourMode] = useState<"BW" | "COLOUR">("BW");
  const [itemId, setItemId] = useState("");
  const [sides, setSides] = useState<"SINGLE" | "DOUBLE">("SINGLE");
  const [layout, setLayout] = useState<"NORMAL" | "BOOKLET">("NORMAL");
  const [pages, setPages] = useState("");
  const [copies, setCopies] = useState("");
  const [notes, setNotes] = useState("");

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
      layout,
      pages: p,
      copies: c,
      paperCostPerSheet: 0,
      printingChargePerSheet: 0,
      availableStock: 0,
    }).physicalSheets;
  }, [pages, copies, sides, layout]);

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
            layout,
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
  }, [itemId, colourMode, sides, layout, pages, copies]);

  const calculation = useMemo(() => {
    if (!selectedItem?.activeLot || preview.chargePerSheet === null || !pages || !copies) {
      return null;
    }
    return calculatePrintingJob({
      sides,
      layout,
      pages: Number(pages),
      copies: Number(copies),
      paperCostPerSheet: Number(selectedItem.activeLot.costPerSheet),
      printingChargePerSheet: preview.chargePerSheet,
      availableStock: selectedItem.activeLot.currentQuantity,
    });
  }, [selectedItem, preview.chargePerSheet, sides, layout, pages, copies]);

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
    setSubjectId("");
    setGradeId("");
    setColourMode("BW");
    setItemId("");
    setSides("SINGLE");
    setLayout("NORMAL");
    setPages("");
    setCopies("");
    setNotes("");
    setSubmitError(null);
    setPrintedRecord(null);
  }

  function handlePrint() {
    setSubmitError(null);
    setPrintedRecord(null);
    if (!lecturerId || !documentName || !itemId || !pages || !copies) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    if (documentReady) {
      documentRef.current?.print();
    }

    void submitRecord();
  }

  async function submitRecord() {
    setSubmitting(true);
    try {
      const pdfFile = documentRef.current?.getPdfFile() ?? null;
      const documentBase64 = pdfFile ? await fileToBase64(pdfFile) : undefined;

      const res = await fetch("/api/printing/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecturerId,
          inventoryItemId: itemId,
          documentName,
          subjectId,
          gradeId,
          colourMode,
          sides,
          layout,
          pages: Number(pages),
          copies: Number(copies),
          notes,
          documentBase64,
          documentFileName: pdfFile?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not submit this printing job.");
        return;
      }

      if (documentReady) {
        setPrintedRecord({ id: data.record.id, printingCode: data.record.printingCode });
        toast.success(`Printing record ${data.record.printingCode} saved`);
      } else {
        toast.success(`Printing record ${data.record.printingCode} saved`);
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
          onFileSelected={setDocumentName}
          onReadyChange={setDocumentReady}
        />

        <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
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
            <FieldWrapper label="Subject" htmlFor="subjectId">
              <Select id="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Grade" htmlFor="gradeId">
              <Select id="gradeId" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
                <option value="">None</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
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
            <FieldWrapper
              label="Layout"
              htmlFor="layout"
              required
              hint={layout === "BOOKLET" ? "2 pages per side, folded (e.g. A4 pages on A3)" : undefined}
            >
              <Select id="layout" value={layout} onChange={(e) => setLayout(e.target.value as "NORMAL" | "BOOKLET")}>
                <option value="NORMAL">Normal</option>
                <option value="BOOKLET">Booklet</option>
              </Select>
            </FieldWrapper>

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
              Printing record {printedRecord.printingCode} saved. Finish printing in the dialog
              that just opened, then view it whenever you&apos;re ready.
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
          <Button type="button" onClick={handlePrint} disabled={!canSubmit || submitting}>
            {submitting ? "Printing..." : "Print"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gold-400">Active Stock</h2>
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

        <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gold-400">Calculation</h2>
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
              <div className="border-t border-white/10 pt-2">
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
      <dt className="text-slate-400">{label}</dt>
      <dd className={bold ? "text-base font-semibold text-white" : "text-slate-100"}>{value}</dd>
    </div>
  );
}
