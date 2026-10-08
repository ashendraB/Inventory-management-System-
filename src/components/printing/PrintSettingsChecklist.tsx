/** What to set in the print window (browser, system or Acrobat) so the paper
 * that comes out matches the job that was costed. The web page can't set the
 * printer's own options, so this puts the figures right next to the Print
 * button for the operator to match. */
export function PrintSettingsChecklist({
  copies,
  pages,
  sides,
  colourMode,
  layout,
  paper,
  className = "",
}: {
  copies: number | null;
  pages: number | null;
  sides: "SINGLE" | "DOUBLE";
  colourMode: "BW" | "COLOUR";
  layout: "NORMAL" | "BOOKLET";
  paper: string | null;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-gold-500/30 bg-white/5 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gold-400">Set these in the print window</h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Item label="Copies" value={copies ? String(copies) : "—"} />
        <Item
          label="Pages to print"
          value={pages ? `All (${pages} page${pages === 1 ? "" : "s"})` : "—"}
        />
        <Item label="Paper" value={paper ?? "—"} />
        <Item
          label="Both sides"
          value={sides === "DOUBLE" ? "Tick “Print on both sides”" : "Leave unticked (single-sided)"}
        />
        <Item
          label="Colour"
          value={colourMode === "BW" ? "Tick “Print in grayscale”" : "Colour — leave grayscale off"}
        />
        {layout === "BOOKLET" && <Item label="Layout" value="Booklet (2 pages per side)" />}
      </dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}
