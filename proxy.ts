import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic check on the cookie only. Pages and server actions validate the
// session against the database before touching any data.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the login page, the auth API, Next.js internals and static files.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
