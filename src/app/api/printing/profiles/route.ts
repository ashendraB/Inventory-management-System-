import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { listPrintingProfiles, createPrintingProfile } from "@/server/printing-service";
import { createPrintingProfileSchema } from "@/lib/validation/printing";

export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const profiles = await listPrintingProfiles();
    return NextResponse.json({ profiles });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR", "PRINTING_OPERATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = createPrintingProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const profile = await createPrintingProfile(parsed.data, session.userId);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
