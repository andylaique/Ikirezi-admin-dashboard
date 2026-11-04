"use client";

import { KeyRound, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { FormEvent, useState } from "react";

import { authStep } from "@/lib/api";

import { Avatar, Logo } from "./brand";
import { Button, Input } from "./ui";

type Step = "password" | "otp" | "mfa" | "mfa_setup";
type Challenge = { challenge_token: string; next_step: string; email_hint: string };

export function LoginFlow({ portal, avatar }: { portal: string; avatar: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [hint, setHint] = useState("");
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (result: Challenge | { next_step: "done" }) => {
    if (result.next_step === "done") {
      router.replace(params.get("next") || "/");
      return;
    }
    const challenge = result as Challenge;
    setToken(challenge.challenge_token);
    setHint(challenge.email_hint);
    setCode("");
    if (challenge.next_step === "mfa_setup") {
      const data = await authStep<{ secret: string; otpauth_uri: string }>("mfa-setup", { challenge_token: challenge.challenge_token });
      setSetup(data);
    }
    setStep(challenge.next_step as Step);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (step === "password") await handle(await authStep<Challenge>("login", { email, password }));
      if (step === "otp") await handle(await authStep<Challenge>("verify-otp", { challenge_token: token, code }));
      if (step === "mfa") await handle(await authStep("verify-mfa", { challenge_token: token, code }) as { next_step: "done" });
      if (step === "mfa_setup") await handle(await authStep("mfa-confirm", { challenge_token: token, code }) as { next_step: "done" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "password", label: "Password", icon: <KeyRound className="h-4 w-4" /> },
    { key: "otp", label: "Email code", icon: <Mail className="h-4 w-4" /> },
    { key: step === "mfa_setup" ? "mfa_setup" : "mfa", label: "Authenticator", icon: <Smartphone className="h-4 w-4" /> },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-plum to-orchid p-12 text-white lg:flex lg:flex-col">
        <Logo size={44} wordmark light />
        <div className="my-auto max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> {portal}
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight">Every girl deserves trusted answers.</h1>
          <p className="mt-4 text-white/80">Secure access with password, email code and authenticator app. All actions are recorded in the audit log.</p>
          <div className="mt-10 flex -space-x-3">
            {["pearl-1", "pearl-2", "pearl-3", avatar, "pearl-5"].map((a) => (
              <span key={a} className="rounded-full ring-4 ring-plum">
                <Avatar id={a} size={56} />
              </span>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-coral/30 blur-3xl" />
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            <Logo size={40} wordmark />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-muted">{portal}</p>
          </div>
          <ol className="flex items-center gap-2">
            {steps.map((s, i) => (
              <li key={s.key} className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold ${i <= activeIndex ? "bg-lilac text-plum" : "bg-white text-muted"}`}>
                {s.icon}
                {s.label}
              </li>
            ))}
          </ol>
          {step === "password" && (
            <>
              <Input label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          )}
          {step === "otp" && (
            <>
              <p className="text-sm text-muted">Enter the 6-digit code sent to {hint}.</p>
              <Input label="Email code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoFocus required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="text-center text-xl tracking-[0.5em]" />
              <button type="button" className="text-sm font-semibold text-coral" onClick={() => authStep("resend-otp", { challenge_token: token }).catch(() => undefined)}>
                Resend code
              </button>
            </>
          )}
          {step === "mfa_setup" && setup && (
            <div className="space-y-3 rounded-xl border border-line bg-white p-4">
              <p className="text-sm font-semibold">Set up two-step verification</p>
              <p className="text-xs text-muted">Scan with Google Authenticator, Microsoft Authenticator or Authy, then enter the 6-digit code.</p>
              <div className="flex justify-center rounded-lg bg-blush p-3">
                <QRCodeSVG value={setup.otpauth_uri} size={160} fgColor="#4A1D5E" />
              </div>
              <p className="break-all text-center font-mono text-xs text-muted">{setup.secret}</p>
            </div>
          )}
          {(step === "mfa" || step === "mfa_setup") && (
            <Input label="Authenticator code" inputMode="numeric" maxLength={6} autoFocus required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="text-center text-xl tracking-[0.5em]" />
          )}
          {error && <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-semibold text-alert">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            {step === "password" ? "Continue" : "Verify"}
          </Button>
        </form>
      </div>
    </div>
  );
}
