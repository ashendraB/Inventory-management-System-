import { listPriceRules } from "@/server/pricing-service";
import { listPaperSizes, listGsmTypes, listPaperTypes } from "@/server/paper-config-service";
import { PriceRuleManager } from "@/components/printing/PriceRuleManager";

export const dynamic = "force-dynamic";

export default async function PriceConfigPage() {
  const [rules, paperSizes, gsmTypes, paperTypes] = await Promise.all([
    listPriceRules(),
    listPaperSizes(),
    listGsmTypes(),
    listPaperTypes(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Printing Price Configuration</h1>
        <p className="text-sm text-slate-500">
          The printing calculator finds a rule by matching Paper Size + GSM + Paper Type + Colour
          + Sides. If none matches, a printing job can&apos;t be submitted.
        </p>
      </div>
      <PriceRuleManager
        paperSizes={paperSizes.map((p) => ({ id: p.id, label: p.name }))}
        gsmTypes={gsmTypes.map((g) => ({ id: g.id, label: String(g.value) }))}
        paperTypes={paperTypes.map((p) => ({ id: p.id, label: p.name }))}
        rules={rules.map((r) => ({
          id: r.id,
          paperSize: { name: r.paperSize.name },
          gsm: { value: r.gsm.value },
          paperType: { name: r.paperType.name },
          colourMode: r.colourMode,
          sides: r.sides,
          chargePerSheet: r.chargePerSheet.toString(),
          effectiveFrom: r.effectiveFrom.toISOString(),
          effectiveTo: r.effectiveTo ? r.effectiveTo.toISOString() : null,
          status: r.status,
        }))}
      />
    </div>
  );
}
