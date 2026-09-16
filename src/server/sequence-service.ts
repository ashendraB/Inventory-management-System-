import "server-only";
import { prisma } from "@/lib/prisma";

/** Atomically returns the next integer in a named sequence, creating it at 1 if new. */
export async function nextSequence(key: string): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

export function padSequence(value: number, width = 6): string {
  return String(value).padStart(width, "0");
}
