import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import { findOrCreateSubjectByName } from "@/server/paper-config-service";
import type { z } from "zod";
import type { createLecturerSchema, updateLecturerSchema } from "@/lib/validation/lecturer";

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

/** Typed subject name -> subjectId. "" clears it (null), undefined leaves
 * it untouched. */
async function resolveSubjectId(name?: string) {
  if (name === undefined) return undefined;
  if (name === "") return null;
  return (await findOrCreateSubjectByName(name)).id;
}

export async function listActiveLecturers() {
  return prisma.lecturer.findMany({
    where: { status: "ACTIVE" },
    include: { subject: true },
    orderBy: { name: "asc" },
  });
}

export async function listLecturers(includeInactive = false) {
  return prisma.lecturer.findMany({
    where: includeInactive ? undefined : { status: "ACTIVE" },
    include: { subject: true },
    orderBy: { name: "asc" },
  });
}

export async function getLecturer(id: string) {
  return prisma.lecturer.findUnique({ where: { id }, include: { subject: true } });
}

export async function createLecturer(
  data: z.infer<typeof createLecturerSchema>
) {
  const seq = await nextSequence("lecturer");
  const lecturerCode = `LEC-${padSequence(seq, 4)}`;
  const subjectId = await resolveSubjectId(data.subject);
  return prisma.lecturer.create({
    data: {
      lecturerCode,
      name: data.name,
      department: cleanOptional(data.department),
      email: cleanOptional(data.email),
      phone: cleanOptional(data.phone),
      subjectId: subjectId ?? null,
      notes: cleanOptional(data.notes),
    },
    include: { subject: true },
  });
}

export async function updateLecturer(
  id: string,
  data: z.infer<typeof updateLecturerSchema>
) {
  const subjectId = await resolveSubjectId(data.subject);
  return prisma.lecturer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.department !== undefined && { department: cleanOptional(data.department) }),
      ...(data.email !== undefined && { email: cleanOptional(data.email) }),
      ...(data.phone !== undefined && { phone: cleanOptional(data.phone) }),
      ...(subjectId !== undefined && { subjectId }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: { subject: true },
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
