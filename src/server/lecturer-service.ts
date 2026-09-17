import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import type { z } from "zod";
import type { createLecturerSchema, updateLecturerSchema } from "@/lib/validation/lecturer";

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

export async function listActiveLecturers() {
  return prisma.lecturer.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

export async function listLecturers(includeInactive = false) {
  return prisma.lecturer.findMany({
    where: includeInactive ? undefined : { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

export async function getLecturer(id: string) {
  return prisma.lecturer.findUnique({ where: { id } });
}

export async function createLecturer(
  data: z.infer<typeof createLecturerSchema>
) {
  const seq = await nextSequence("lecturer");
  const lecturerCode = `LEC-${padSequence(seq, 4)}`;
  return prisma.lecturer.create({
    data: {
      lecturerCode,
      name: data.name,
      department: cleanOptional(data.department),
      email: cleanOptional(data.email),
      phone: cleanOptional(data.phone),
      notes: cleanOptional(data.notes),
    },
  });
}

export async function updateLecturer(
  id: string,
  data: z.infer<typeof updateLecturerSchema>
) {
  return prisma.lecturer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.department !== undefined && { department: cleanOptional(data.department) }),
      ...(data.email !== undefined && { email: cleanOptional(data.email) }),
      ...(data.phone !== undefined && { phone: cleanOptional(data.phone) }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
}

/** Whether this lecturer has any printing history. PrintingRecord.lecturerId
 * is required (not nullable), so a lecturer with printing records can't be
 * hard-deleted at all — the delete would fail on the foreign key. Blocked
 * here with a clear message instead of a raw DB error; Deactivate is the
 * right move once a lecturer has real usage, same pattern as inventory
 * items/lots and printing price rules. */
export async function lecturerInUse(id: string) {
  const count = await prisma.printingRecord.count({ where: { lecturerId: id } });
  return count > 0;
}

export async function deleteLecturer(id: string) {
  return prisma.lecturer.delete({ where: { id } });
}
