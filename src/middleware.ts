import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple cookie check in edge middleware; strict DB verification happens in server layouts / actions
export function middleware(request: NextRequest) {
  const token = request.cookies.get("galma_session_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isPublicStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") || // static assets like favicon
    pathname.startsWith("/favicon.ico");

  if (isPublicStatic) {
    return NextResponse.next();
  }

  // If user has no token and is trying to access protected route
  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and visits /login, send them to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
