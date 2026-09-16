import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

/**
 * Atomically returns the next integer in a named sequence, creating it at 1
 * if new. Pass the transaction client (`tx`) when calling this from inside
 * `prisma.$transaction(...)` — SQLite only allows one writer at a time, so
 * using the top-level `prisma` client here instead would deadlock against
 * the outer transaction's write lock until it times out.
 */
export async function nextSequence(
  key: string,
  client: PrismaClientOrTx = prisma
): Promise<number> {
  const counter = await client.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

export function padSequence(value: number, width = 6): string {
  return String(value).padStart(width, "0");
}
