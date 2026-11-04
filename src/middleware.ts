import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/login", "/api/auth", "/_next", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const hasSession = request.cookies.get("ik_access") || request.cookies.get("ik_refresh");
  if (!hasSession) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ detail: "Cross-site request blocked" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!.*\\.(?:svg|png|ico)$).*)"] };
