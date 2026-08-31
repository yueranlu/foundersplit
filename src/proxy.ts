import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection. Anything not in the public list requires the session
 * cookie; miss it and you land on /login. The cookie signature check happens
 * in `requireMember()` at page level — this middleware is just a cheap gate to
 * avoid rendering protected pages for signed-out visitors.
 */

const PUBLIC_PATHS = new Set(["/login"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const hasSession = req.cookies.has("foundersplit_session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
