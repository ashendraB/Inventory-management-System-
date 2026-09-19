import "server-only";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Paper Sizes
// ---------------------------------------------------------------------------

export async function listPaperSizes(includeInactive = false) {
  return prisma.paperSize.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createPaperSize(name: string) {
  return prisma.paperSize.create({ data: { name } });
}

export async function setPaperSizeActive(id: string, isActive: boolean) {
  return prisma.paperSize.update({ where: { id }, data: { isActive } });
}

// ---------------------------------------------------------------------------
// GSM
// ---------------------------------------------------------------------------

export async function listGsmTypes(includeInactive = false) {
  return prisma.gsmType.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { value: "asc" },
  });
}

export async function createGsmType(value: number) {
  return prisma.gsmType.create({ data: { value } });
}

export async function setGsmTypeActive(id: string, isActive: boolean) {
  return prisma.gsmType.update({ where: { id }, data: { isActive } });
}

// ---------------------------------------------------------------------------
// Paper Types
// ---------------------------------------------------------------------------

export async function listPaperTypes(includeInactive = false) {
  return prisma.paperType.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createPaperType(name: string) {
  return prisma.paperType.create({ data: { name } });
}

export async function setPaperTypeActive(id: string, isActive: boolean) {
  return prisma.paperType.update({ where: { id }, data: { isActive } });
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export async function listSubjects(includeInactive = false) {
  return prisma.subject.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createSubject(name: string) {
  return prisma.subject.create({ data: { name } });
}

export async function setSubjectActive(id: string, isActive: boolean) {
  return prisma.subject.update({ where: { id }, data: { isActive } });
}

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

export async function listGrades(includeInactive = false) {
  return prisma.grade.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createGrade(name: string) {
  return prisma.grade.create({ data: { name } });
}

export async function setGradeActive(id: string, isActive: boolean) {
  return prisma.grade.update({ where: { id }, data: { isActive } });
}
