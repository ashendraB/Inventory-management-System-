import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });

  // Constant-shape failure path: don't reveal whether the username exists.
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    canManagePricing: user.canManagePricing,
    canManageSettings: user.canManageSettings,
  });
  await setSessionCookie(token);
  await logAudit({
    userId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
}
