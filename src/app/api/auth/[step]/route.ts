import { NextRequest, NextResponse } from "next/server";

import { ALLOWED_ROLES, backend, clearSession, json, readSession, setSession, TokenPair } from "@/lib/session";

const STEPS: Record<string, string> = {
  login: "/auth/login",
  "verify-otp": "/auth/verify-otp",
  "resend-otp": "/auth/resend-otp",
  "verify-mfa": "/auth/verify-mfa",
  "mfa-setup": "/auth/mfa/challenge-setup",
  "mfa-confirm": "/auth/mfa/challenge-confirm",
  "forgot-password": "/auth/forgot-password",
  "reset-password": "/auth/reset-password",
};

export async function POST(request: NextRequest, { params }: { params: { step: string } }) {
  if (params.step === "logout") {
    const { access, refresh } = readSession();
    const everywhere = request.nextUrl.searchParams.get("everywhere") === "true";
    if (access) {
      await backend(`/auth/logout?everywhere=${everywhere}`, {
        method: "POST",
        token: access,
        body: JSON.stringify({ refresh_token: refresh }),
      }).catch(() => null);
    }
    const response = NextResponse.json({ detail: "Logged out" });
    clearSession(response);
    return response;
  }
  const path = STEPS[params.step];
  if (!path) return json({ detail: "Not found" }, 404);
  const body = await request.text();
  const res = await backend(path, {
    method: "POST",
    body,
    headers: { "user-agent": request.headers.get("user-agent") ?? "", "x-forwarded-for": request.ip ?? "" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json(data, res.status);
  if (data && typeof data === "object" && "access_token" in data) {
    const tokens = data as TokenPair;
    if (!ALLOWED_ROLES.includes(tokens.role)) return json({ detail: "This portal is not available for your account" }, 403);
    const response = NextResponse.json({ role: tokens.role, next_step: "done" });
    setSession(response, tokens);
    return response;
  }
  return json(data, res.status);
}
