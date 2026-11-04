"use client";

import { KeyRound, LogOut, Monitor, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { Badge, Button, Card, ConfirmDialog, Input, PageHeader, useToast } from "@/components/ui";
import { api, fmtDateTime, useFetch } from "@/lib/api";
import { Session } from "@/lib/types";

type Me = { mfa_enabled: boolean; email: string };

export default function SecurityPage() {
  const toast = useToast();
  const router = useRouter();
  const { data: me, reload } = useFetch<Me>("/me");
  const { data: sessions } = useFetch<Session[]>("/me/sessions");
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [everywhere, setEverywhere] = useState(false);

  const startMfa = async () => setSetup(await api("/auth/mfa/setup", { method: "POST" }));
  const confirmMfa = async () => {
    try {
      await api("/auth/mfa/confirm", { method: "POST", body: { code } });
      toast("Two-step verification is on");
      setSetup(null);
      setCode("");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) return toast("Passwords do not match", "error");
    try {
      await api("/auth/change-password", { method: "POST", body: { current_password: pw.current, new_password: pw.next } });
      toast("Password changed. Other sessions were signed out.");
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const logoutEverywhere = async () => {
    await fetch("/api/auth/logout?everywhere=true", { method: "POST" });
    router.replace("/login");
  };

  return (
    <>
      <PageHeader title="Security" subtitle="Protect your admin account" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-teal"><ShieldCheck className="h-5 w-5" /></span>
            <div className="flex-1"><h3 className="font-semibold">Two-step verification (TOTP)</h3><p className="text-sm text-muted">Required for every staff account</p></div>
            <Badge tone={me?.mfa_enabled ? "teal" : "alert"}>{me?.mfa_enabled ? "Enabled" : "Not set up"}</Badge>
          </div>
          {!setup && <Button className="mt-5" variant={me?.mfa_enabled ? "secondary" : "primary"} onClick={startMfa}>{me?.mfa_enabled ? "Reset authenticator" : "Set up authenticator"}</Button>}
          {setup && (
            <div className="mt-5 grid gap-4 sm:grid-cols-[auto,1fr]">
              <div className="rounded-xl bg-blush p-3"><QRCodeSVG value={setup.otpauth_uri} size={150} fgColor="#4A1D5E" /></div>
              <div className="space-y-3">
                <p className="text-sm text-muted">Scan the code, then enter the 6-digit number from your app.</p>
                <p className="break-all font-mono text-xs">{setup.secret}</p>
                <Input label="Code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                <Button onClick={confirmMfa} disabled={code.length !== 6}>Confirm</Button>
              </div>
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-lilac text-plum"><KeyRound className="h-5 w-5" /></span>
            <div><h3 className="font-semibold">Change password</h3><p className="text-sm text-muted">10+ characters with upper, lower, number and symbol</p></div>
          </div>
          <div className="space-y-3">
            <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <Input label="Confirm new password" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            <Button onClick={changePassword} disabled={!pw.current || !pw.next}>Update password</Button>
          </div>
        </Card>
        <Card className="p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="font-semibold">Active sessions</h3><p className="text-sm text-muted">Devices currently signed in to your account</p></div>
            <Button variant="danger" icon={<LogOut className="h-4 w-4" />} onClick={() => setEverywhere(true)}>Sign out everywhere</Button>
          </div>
          <ul className="divide-y divide-line">
            {(sessions ?? []).map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3 text-sm">
                <Monitor className="h-5 w-5 text-muted" />
                <div className="flex-1"><p className="font-medium">{s.user_agent || "Unknown device"}</p><p className="text-xs text-muted">{s.ip_address} · signed in {fmtDateTime(s.created_at)}</p></div>
                <span className="text-xs text-muted">expires {fmtDateTime(s.expires_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <ConfirmDialog open={everywhere} title="Sign out everywhere?" message="All devices, including this one, will be signed out." confirmLabel="Sign out everywhere" danger onConfirm={logoutEverywhere} onCancel={() => setEverywhere(false)} />
    </>
  );
}
