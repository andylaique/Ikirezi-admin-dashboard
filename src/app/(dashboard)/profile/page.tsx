"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/brand";
import { Badge, Button, Card, Input, PageHeader, Select, useToast } from "@/components/ui";
import { api, fmtDateTime, useFetch } from "@/lib/api";
import { Audit } from "@/lib/types";

type Me = { id: number; alias: string; full_name?: string | null; email: string; avatar: string; role: string; language: string; country: string; mfa_enabled: boolean; created_at: string };
const AVATARS = ["pearl-1", "pearl-2", "pearl-3", "pearl-4", "pearl-5", "pearl-6", "pearl-7", "pearl-8"];

export default function ProfilePage() {
  const toast = useToast();
  const { data: me, setData } = useFetch<Me>("/me");
  const { data: activity } = useFetch<Audit[]>(me ? `/admin/users/${me.id}/activity` : null);
  const [form, setForm] = useState({ alias: "", full_name: "", avatar: "pearl-4", language: "en", country: "RW" });

  useEffect(() => {
    if (me) setForm({ alias: me.alias, full_name: me.full_name ?? "", avatar: me.avatar, language: me.language, country: me.country });
  }, [me]);

  const save = async () => {
    try {
      const updated = await api<Me>("/me", { method: "PATCH", body: { ...form, full_name: form.full_name || null } });
      setData(updated);
      toast("Profile updated");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="How you appear across the Ikirezi admin tools" />
      <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
        <Card className="p-6 text-center">
          <div className="mx-auto w-fit rounded-full bg-gradient-to-br from-coral to-gold p-1"><Avatar id={form.avatar} size={112} /></div>
          <p className="mt-4 font-display text-2xl">{form.full_name || form.alias}</p>
          <p className="text-sm text-muted">{me?.email}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Badge tone="plum">{me?.role?.replace("_", " ")}</Badge>
            <Badge tone={me?.mfa_enabled ? "teal" : "alert"}>{me?.mfa_enabled ? "MFA on" : "MFA off"}</Badge>
          </div>
          <p className="mt-3 text-xs text-muted">Member since {fmtDateTime(me?.created_at)}</p>
          <Link href="/security" className="mt-4 inline-block text-sm font-semibold text-coral">Security settings →</Link>
        </Card>
        <Card className="space-y-5 p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Avatar</p>
            <div className="flex flex-wrap gap-3">
              {AVATARS.map((a) => (
                <button key={a} onClick={() => setForm({ ...form, avatar: a })} className={clsx("rounded-full p-0.5 ring-2 transition", form.avatar === a ? "ring-coral" : "ring-transparent hover:ring-line")} aria-label={a}>
                  <Avatar id={a} size={52} />
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Display name" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
            <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Select label="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} options={[{ value: "en", label: "English" }, { value: "rw", label: "Kinyarwanda" }]} />
            <Input label="Country" maxLength={2} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} />
          </div>
          <Button onClick={save}>Save profile</Button>
        </Card>
        <Card className="p-6 xl:col-span-2">
          <h3 className="mb-3 font-semibold">My recent activity</h3>
          <ul className="space-y-2">
            {(activity ?? []).slice(0, 15).map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg bg-blush px-3 py-2 text-sm">
                <span><Badge tone="plum">{a.action}</Badge> <span className="ml-2 text-muted">{a.entity} {a.entity_id}</span></span>
                <span className="text-xs text-muted">{fmtDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
