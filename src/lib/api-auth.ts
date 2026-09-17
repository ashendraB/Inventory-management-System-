import "server-only";
import { NextResponse } from "next/server";
import { Prisma, type UserRole } from "@prisma/client";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Every API route handler that touches protected data should start with this. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Not authenticated.");

  // A session cookie can outlive the user it points to (deleted/deactivated
  // account, or a dev database reset) — writes that reference session.userId
  // as a foreign key would otherwise fail with an opaque 500.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true },
  });
  if (!user || !user.isActive) {
    throw new ApiError(401, "Your session is no longer valid. Please log in again.");
  }

  return session;
}

export async function requireRole(
  roles: UserRole[]
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new ApiError(403, "You do not have permission to do this.");
  }
  return session;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  // A unique-constraint violation (e.g. a username/email/code that's
  // already taken) is a normal, expected user error, not a server fault —
  // surface it as one instead of an opaque 500.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const fields = (error.meta?.target as string[] | undefined)?.join(", ") ?? "value";
    return NextResponse.json(
      { error: `That ${fields} is already in use.` },
      { status: 409 }
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
