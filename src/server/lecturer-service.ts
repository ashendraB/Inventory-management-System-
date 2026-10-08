import "server-only";
import { prisma } from "@/lib/prisma";
import { nextSequence, padSequence } from "@/server/sequence-service";
import { findOrCreateSubjectByName } from "@/server/paper-config-service";
import type { z } from "zod";
import type { createLecturerSchema, updateLecturerSchema } from "@/lib/validation/lecturer";

function cleanOptional(v?: string) {
  return v && v.length > 0 ? v : null;
}

const withSubjects = { subjects: { orderBy: { name: "asc" as const } } };

/** Typed subject names -> subject ids (created if new, duplicates and blanks
 * dropped). undefined leaves the lecturer's subjects untouched; an empty
 * list clears them. */
async function resolveSubjectIds(names?: string[]) {
  if (names === undefined) return undefined;
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const ids: string[] = [];
  for (const name of unique) {
    const id = (await findOrCreateSubjectByName(name)).id;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

export async function listActiveLecturers() {
  return prisma.lecturer.findMany({
    where: { status: "ACTIVE" },
    include: withSubjects,
    orderBy: { name: "asc" },
  });
}

export async function listLecturers(includeInactive = false) {
  return prisma.lecturer.findMany({
    where: includeInactive ? undefined : { status: "ACTIVE" },
    include: withSubjects,
    orderBy: { name: "asc" },
  });
}

export async function getLecturer(id: string) {
  return prisma.lecturer.findUnique({ where: { id }, include: withSubjects });
}

export async function createLecturer(
  data: z.infer<typeof createLecturerSchema>
) {
  const seq = await nextSequence("lecturer");
  const lecturerCode = `LEC-${padSequence(seq, 4)}`;
  const subjectIds = await resolveSubjectIds(data.subjects);
  return prisma.lecturer.create({
    data: {
      lecturerCode,
      name: data.name,
      email: cleanOptional(data.email),
      phone: cleanOptional(data.phone),
      subjects: { connect: (subjectIds ?? []).map((id) => ({ id })) },
      notes: cleanOptional(data.notes),
    },
    include: withSubjects,
  });
}

export async function updateLecturer(
  id: string,
  data: z.infer<typeof updateLecturerSchema>
) {
  const subjectIds = await resolveSubjectIds(data.subjects);
  return prisma.lecturer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: cleanOptional(data.email) }),
      ...(data.phone !== undefined && { phone: cleanOptional(data.phone) }),
      ...(subjectIds !== undefined && { subjects: { set: subjectIds.map((id) => ({ id })) } }),
      ...(data.notes !== undefined && { notes: cleanOptional(data.notes) }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: withSubjects,
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
