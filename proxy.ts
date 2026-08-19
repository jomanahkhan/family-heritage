import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Fast, DB-free first filter: redirect if there's no session cookie at all.
// This is layer 1 of defense in depth — the real checks (session validity,
// role) happen server-side in (app)/layout.tsx, admin/layout.tsx, and every
// Server Action, since a cookie's mere presence doesn't prove it's valid.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)"],
};
