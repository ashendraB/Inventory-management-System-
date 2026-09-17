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
