import "server-only";
import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { ColourMode, PrintSides } from "@prisma/client";
import type { createPriceRuleSchema, updatePriceRuleSchema } from "@/lib/validation/pricing";

export interface PriceRuleFilters {
  paperSizeId?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export async function listPriceRules(filters: PriceRuleFilters = {}) {
  return prisma.printingPriceRule.findMany({
    where: {
      ...(filters.paperSizeId && { paperSizeId: filters.paperSizeId }),
      ...(filters.status && { status: filters.status }),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { paperSize: true, gsm: true, paperType: true },
  });
}

/** Creating a rule for a combination that already has an active, open-ended
 * rule supersedes it (same "one active price at a time" pattern as stock
 * lots) — never silently leaves two active rules matching the same job. */
export async function createPriceRule(
  data: z.infer<typeof createPriceRuleSchema>,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    await tx.printingPriceRule.updateMany({
      where: {
        paperSizeId: data.paperSizeId,
        gsmId: data.gsmId,
        paperTypeId: data.paperTypeId,
        colourMode: data.colourMode,
        sides: data.sides,
        status: "ACTIVE",
      },
      data: { status: "INACTIVE" },
    });

    const rule = await tx.printingPriceRule.create({
      data: {
        paperSizeId: data.paperSizeId,
        gsmId: data.gsmId,
        paperTypeId: data.paperTypeId,
        colourMode: data.colourMode,
        sides: data.sides,
        chargePerSheet: data.chargePerSheet,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE_PRICE_RULE",
        entityType: "PrintingPriceRule",
        entityId: rule.id,
        newValue: JSON.stringify(rule),
      },
    });

    return rule;
  });
}

export async function updatePriceRule(
  id: string,
  data: z.infer<typeof updatePriceRuleSchema>
) {
  return prisma.printingPriceRule.update({
    where: { id },
    data: {
      ...(data.chargePerSheet !== undefined && { chargePerSheet: data.chargePerSheet }),
      ...(data.effectiveTo !== undefined && {
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
}

/** Price rule matching (spec §24): paperSize + GSM + paperType + colour +
 * sides, active and within its effective date range. If more than one still
 * qualifies, the most recently effective one wins. */
export async function findMatchingPriceRule(params: {
  paperSizeId: string;
  gsmId: string;
  paperTypeId: string;
  colourMode: ColourMode;
  sides: PrintSides;
  at?: Date;
}) {
  const at = params.at ?? new Date();
  return prisma.printingPriceRule.findFirst({
    where: {
      paperSizeId: params.paperSizeId,
      gsmId: params.gsmId,
      paperTypeId: params.paperTypeId,
      colourMode: params.colourMode,
      sides: params.sides,
      status: "ACTIVE",
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
}
