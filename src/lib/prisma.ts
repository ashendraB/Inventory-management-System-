import { PrismaClient } from "@prisma/client";

function createClient() {
  return new PrismaClient({
    // PrintingRecord.documentData is the attached PDF's full bytes (up to
    // several MB). Excluded from every query by default so it can never be
    // loaded, copied into an API response, or written into an audit log by
    // accident — returning a freshly-saved record used to echo the whole
    // file back as a JSON array of numbers (a 4 MB PDF became a 51 MB
    // response, which the live server couldn't handle). The one place that
    // needs the bytes (getPrintingRecordDocument) opts back in explicitly.
    omit: { printingRecord: { documentData: true } },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
