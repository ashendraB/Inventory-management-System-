"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FieldWrapper, TextInput, TextArea, Select, Button } from "@/components/ui/Field";
import { PrintSettingsChecklist } from "@/components/printing/PrintSettingsChecklist";
import { DocumentUpload, type DocumentUploadHandle } from "@/components/printing/DocumentUpload";
import { formatCurrency } from "@/lib/format";
import { calculatePrintingJob } from "@/lib/printing-calculation";

const MAX_STORED_PDF_BYTES = 6 * 1024 * 1024;

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
  subjectIds: string[];
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

/** A previous printing record whose details (and stored PDF) pre-fill the
 * form, so reprinting it runs through the normal calculator and creates a new
 * record, stock deduction and bill like any other job. */
export interface ReprintSource {
  recordId: string;
  printingCode: string;
  lecturerId: string;
  documentName: string;
  subjectId: string;
  gradeId: string;
  inventoryItemId: string;
  colourMode: "BW" | "COLOUR";
  sides: "SINGLE" | "DOUBLE";
  layout: "NORMAL" | "BOOKLET";
  pages: number;
  copies: number;
  documentFileName: string;
}

export function PrintingCalculatorForm({
  lecturers,
  initialItems,
  subjects,
  grades,
  reprint,
}: {
  lecturers: Lecturer[];
  initialItems: PaperItem[];
  subjects: LookupOption[];
  grades: LookupOption[];
  reprint?: ReprintSource;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [lecturerId, setLecturerId] = useState(reprint?.lecturerId ?? "");
  const [documentName, setDocumentName] = useState(reprint?.documentName ?? "");
  const [subjectId, setSubjectId] = useState(reprint?.subjectId ?? "");
  const [gradeId, setGradeId] = useState(reprint?.gradeId ?? "");
  const [colourMode, setColourMode] = useState<"BW" | "COLOUR">(reprint?.colourMode ?? "BW");
  const [itemId, setItemId] = useState(reprint?.inventoryItemId ?? "");
  const [sides, setSides] = useState<"SINGLE" | "DOUBLE">(reprint?.sides ?? "SINGLE");
  const [layout, setLayout] = useState<"NORMAL" | "BOOKLET">(reprint?.layout ?? "NORMAL");
  const [pages, setPages] = useState(reprint ? String(reprint.pages) : "");
  const [copies, setCopies] = useState(reprint ? String(reprint.copies) : "");
  // Loading the reprint PDF would otherwise overwrite the Document Name with
  // its file name; keep the original record's name instead.
  const keepDocumentName = useRef(!!reprint);
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
  const [printedRecord, setPrintedRecord] = useState<{ id: string; printingCode: string; viaAcrobat: boolean } | null>(null);

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

  // The (active) subjects the chosen lecturer teaches.
  const selectedLecturer = lecturers.find((l) => l.id === lecturerId);
  const lecturerSubjects = subjects.filter((s) => selectedLecturer?.subjectIds.includes(s.id));
  const otherSubjects = subjects.filter((s) => !lecturerSubjects.some((ls) => ls.id === s.id));

  // Picking a lecturer fills in the subject they teach. A lecturer with one
  // subject gets it filled in; with several, the field is cleared (unless the
  // current pick is one of theirs) so the operator chooses deliberately rather
  // than the job being tagged with a wrong guess. Still a normal dropdown, so
  // it can be changed for this one job. A lecturer with no subject (or whose
  // subjects were all deactivated) leaves the field alone.
  function handleLecturerChange(id: string) {
    setLecturerId(id);
    const lecturer = lecturers.find((l) => l.id === id);
    const mine = subjects.filter((s) => lecturer?.subjectIds.includes(s.id));
    if (mine.length === 1) {
      setSubjectId(mine[0].id);
    } else if (mine.length > 1 && !mine.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
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

  /** mode "browser": open the browser print dialog right away. mode
   * "acrobat": save the record, then download the PDF so it can be opened and
   * printed in Adobe Acrobat (full print window with printer Properties). */
  function handlePrint(mode: "browser" | "acrobat" = "browser") {
    setSubmitError(null);
    setPrintedRecord(null);
    if (!lecturerId || !documentName || !itemId || !pages || !copies) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    if (documentReady && mode === "browser") {
      documentRef.current?.print();
    }

    void submitRecord(mode);
  }

  async function submitRecord(mode: "browser" | "acrobat") {
    setSubmitting(true);
    try {
      const attached = documentRef.current?.getPdfFile() ?? null;
      // The request body is capped at 10 MB and base64 adds a third on top,
      // so a bigger PDF can't be stored for Reprint — the job itself is still
      // saved and printed normally.
      const tooBigToStore = !!attached && attached.size > MAX_STORED_PDF_BYTES;
      const pdfFile = tooBigToStore ? null : attached;
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

      if (tooBigToStore) {
        toast(
          `This PDF is over ${MAX_STORED_PDF_BYTES / 1024 / 1024} MB, so it wasn't saved for Reprint. The printing record itself is saved.`,
          { duration: 8000 }
        );
      }
      if (documentReady) {
        if (mode === "acrobat") documentRef.current?.download();
        setPrintedRecord({
          id: data.record.id,
          printingCode: data.record.printingCode,
          viaAcrobat: mode === "acrobat",
        });
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
        {reprint && (
          <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm text-slate-100">
            <strong className="text-gold-400">Reprinting {reprint.printingCode}.</strong> The
            details and PDF are filled in from that job — change the copies or anything else if
            needed, then print. This saves a <em>new</em> printing record (and uses new stock),
            like any other job.
          </div>
        )}

        <DocumentUpload
          ref={documentRef}
          onPagesDetected={(n) => setPages(String(n))}
          onFileSelected={(name) => {
            if (keepDocumentName.current) {
              keepDocumentName.current = false;
              return;
            }
            setDocumentName(name);
          }}
          initialDocument={
            reprint
              ? {
                  url: `/api/printing/records/${reprint.recordId}/document`,
                  name: reprint.documentFileName,
                }
              : undefined
          }
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
              <Select id="lecturerId" required value={lecturerId} onChange={(e) => handleLecturerChange(e.target.value)}>
                <option value="">Select lecturer</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
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
            <FieldWrapper
              label="Subject"
              htmlFor="subjectId"
              hint={
                lecturerSubjects.length > 1 && !subjectId
                  ? `${selectedLecturer?.name} teaches ${lecturerSubjects.map((s) => s.name).join(" and ")} — pick which one this job is for`
                  : "Filled in automatically from the lecturer — change it if this job is for a different subject"
              }
            >
              <Select id="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">None</option>
                {lecturerSubjects.length > 0 && otherSubjects.length > 0 ? (
                  <>
                    <optgroup label={`${selectedLecturer?.name}'s subjects`}>
                      {lecturerSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other subjects">
                      {otherSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
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
              {printedRecord.viaAcrobat
                ? `Printing record ${printedRecord.printingCode} saved and the PDF was downloaded. Open it in Acrobat (click it in the download bar) and print.`
                : `Printing record ${printedRecord.printingCode} saved. Finish printing in the dialog that just opened, then view it whenever you're ready.`}
            </span>
            <a
              href={`/printing/records/${printedRecord.id}`}
              className="font-medium text-emerald-900 underline"
            >
              View Summary
            </a>
          </div>
        )}

        {pages && copies && (
          <PrintSettingsChecklist
            copies={Number(copies)}
            pages={Number(pages)}
            sides={sides}
            colourMode={colourMode}
            layout={layout}
            paper={
              selectedItem
                ? [selectedItem.paperSizeName, selectedItem.gsmValue && `${selectedItem.gsmValue} GSM`, selectedItem.paperTypeName]
                    .filter(Boolean)
                    .join(" / ") || selectedItem.name
                : null
            }
          />
        )}

        <div className="flex gap-3">
          <Button type="button" onClick={() => handlePrint("browser")} disabled={!canSubmit || submitting}>
            {submitting ? "Printing..." : "Print"}
          </Button>
          {documentReady && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => handlePrint("acrobat")}
              disabled={!canSubmit || submitting}
              title="Saves the record, then downloads the PDF to print from Adobe Acrobat"
            >
              Save &amp; Print in Acrobat
            </Button>
          )}
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
