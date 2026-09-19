import "server-only";
import { prisma } from "@/lib/prisma";

// Supabase's free-tier project database size cap. If this project is ever
// upgraded to a paid plan, update this constant to match the new limit.
const FREE_TIER_LIMIT_BYTES = 500 * 1024 * 1024;

export async function getDatabaseSizeStats() {
  const rows = await prisma.$queryRaw<{ bytes: bigint }[]>`
    SELECT pg_database_size(current_database())::bigint AS bytes
  `;
  const bytes = Number(rows[0].bytes);
  return { bytes, limitBytes: FREE_TIER_LIMIT_BYTES };
}
