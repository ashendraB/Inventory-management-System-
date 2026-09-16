import "server-only";
import { prisma } from "@/lib/prisma";

export async function listActiveLecturers() {
  return prisma.lecturer.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

export async function getLecturer(id: string) {
  return prisma.lecturer.findUnique({ where: { id } });
}
