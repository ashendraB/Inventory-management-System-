import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth";
import { findRouteRule } from "@/config/nav";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function getSecretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function readSession(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? "/dashboard" : "/login", request.url)
    );
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Backend enforcement of role-based access — never trust the frontend alone.
  const rule = findRouteRule(pathname);
  if (rule && (!rule.roles.includes(session.role) || !rule.implemented)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excludes _next internals plus any static file served straight out of
  // public/ (logo.png, icon.png, ...) by extension — those aren't pages and
  // must never redirect to /login just because the visitor isn't signed in
  // yet, or the login page's own logo would be invisible to exactly the
  // people who need to see it.
  matcher: [
    "/((?!api/auth/login|_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|mjs|css|woff2?)$).*)",
  ],
};
