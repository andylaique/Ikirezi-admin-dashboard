import { NextRequest, NextResponse } from "next/server";

import { backend, clearSession, readSession, refreshTokens, setSession, TokenPair } from "@/lib/session";

async function forward(request: NextRequest, path: string[]) {
  const { access, refresh } = readSession();
  if (!access && !refresh) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  const target = `/${path.join("/")}${request.nextUrl.search}`;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  const send = (token?: string) =>
    backend(target, { method: request.method, body, token, headers: { "x-forwarded-for": request.ip ?? "" } });

  let res = await send(access);
  let renewed: TokenPair | null = null;
  if (res.status === 401 && refresh) {
    renewed = await refreshTokens(refresh);
    if (renewed) res = await send(renewed.access_token);
  }
  const text = await res.text();
  const response = new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json" } });
  if (renewed) setSession(response, renewed);
  if (res.status === 401) clearSession(response);
  return response;
}

type Ctx = { params: { path: string[] } };

export const GET = (r: NextRequest, c: Ctx) => forward(r, c.params.path);
export const POST = (r: NextRequest, c: Ctx) => forward(r, c.params.path);
export const PUT = (r: NextRequest, c: Ctx) => forward(r, c.params.path);
export const PATCH = (r: NextRequest, c: Ctx) => forward(r, c.params.path);
export const DELETE = (r: NextRequest, c: Ctx) => forward(r, c.params.path);
