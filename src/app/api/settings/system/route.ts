import { NextRequest, NextResponse } from "next/server";
import { requireRole, handleApiError } from "@/lib/api-auth";
import { getAllSettings, updateSettings } from "@/server/system-settings-service";
import { updateSystemSettingsSchema } from "@/lib/validation/systemSettings";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole(["ADMINISTRATOR"]);
    const settings = await getAllSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole(["ADMINISTRATOR"]);
    const body = await request.json().catch(() => null);
    const parsed = updateSystemSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const existing = await getAllSettings();
    const settings = await updateSettings(parsed.data);
    await logAudit({
      userId: session.userId,
      action: "UPDATE_SYSTEM_SETTINGS",
      entityType: "SystemSetting",
      oldValue: existing,
      newValue: settings,
    });
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
