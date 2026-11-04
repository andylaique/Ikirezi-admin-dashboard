import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const API_URL = process.env.IKIREZI_API_URL ?? "http://localhost:8000/api/v1";
export const ALLOWED_ROLES = (process.env.IKIREZI_ALLOWED_ROLES ?? "admin,super_admin").split(",");

const secure = process.env.NODE_ENV === "production";
const base = { httpOnly: true, secure, sameSite: "strict" as const, path: "/" };

export type TokenPair = { access_token: string; refresh_token: string; role: string };

export function setSession(response: NextResponse, tokens: TokenPair) {
  response.cookies.set("ik_access", tokens.access_token, { ...base, maxAge: 60 * 15 });
  response.cookies.set("ik_refresh", tokens.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 7 });
  response.cookies.set("ik_role", tokens.role, { ...base, maxAge: 60 * 60 * 24 * 7 });
}

export function clearSession(response: NextResponse) {
  for (const name of ["ik_access", "ik_refresh", "ik_role"]) response.cookies.set(name, "", { ...base, maxAge: 0 });
}

export function readSession() {
  const jar = cookies();
  return { access: jar.get("ik_access")?.value, refresh: jar.get("ik_refresh")?.value };
}

export async function backend(path: string, init: RequestInit & { token?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  return fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function refreshTokens(refresh: string): Promise<TokenPair | null> {
  const res = await backend("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refresh }) });
  return res.ok ? ((await res.json()) as TokenPair) : null;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
