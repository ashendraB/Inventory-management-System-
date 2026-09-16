import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  await clearSessionCookie();
  if (session) {
    await logAudit({
      userId: session.userId,
      action: "LOGOUT",
      entityType: "User",
      entityId: session.userId,
    });
  }
  return NextResponse.json({ ok: true });
}
