"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Card, Input, PageHeader, Select, Textarea, useToast } from "@/components/ui";
import { api, useFetch } from "@/lib/api";

const FIELDS: { key: string; label: string; hint: string; type?: "number" | "select" | "textarea"; options?: string[] }[] = [
  { key: "professional_daily_capacity", label: "Members per professional per day", hint: "Policy value shown to members. Default 2.", type: "number" },
  { key: "max_abusive_strikes", label: "Offensive-language rejections before a posting ban", hint: "Default 5.", type: "number" },
  { key: "story_auto_publish", label: "Publish AI-approved stories without admin review", hint: "Keep off for maximum safety.", type: "select", options: ["off", "on"] },
  { key: "post_requires_admin", label: "Require admin approval for mentor posts", hint: "AI always reviews posts first.", type: "select", options: ["off", "on"] },
  { key: "ai_min_retrieval_score", label: "AI grounding threshold (0–1)", hint: "Higher = more refusals, fewer weak answers. Default 0.18." },
  { key: "curator_schedule", label: "AI curator run schedule", hint: "Cron expression for scheduled curator runs.", },
  { key: "default_country", label: "Default country", hint: "Used for guests' emergency numbers and history.", },
  { key: "support_email", label: "Support email", hint: "Shown in the app footer." },
  { key: "maintenance_banner", label: "Maintenance banner", hint: "Leave empty to hide.", type: "textarea" },
];

export default function SettingsPage() {
  const toast = useToast();
  const { data } = useFetch<Record<string, string>>("/admin/settings");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setValues({ professional_daily_capacity: "2", max_abusive_strikes: "5", story_auto_publish: "off", post_requires_admin: "off", ai_min_retrieval_score: "0.18", curator_schedule: "0 6 * * *", default_country: "RW", ...data });
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await api("/admin/settings", { method: "PUT", body: { values } });
      toast("Settings saved");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Platform-wide policies. Every change is recorded in the audit log." actions={<Button icon={<Save className="h-4 w-4" />} loading={saving} onClick={save}>Save changes</Button>} />
      <Card className="divide-y divide-line">
        {FIELDS.map((f) => (
          <div key={f.key} className="grid gap-3 p-5 md:grid-cols-[1fr,320px] md:items-center">
            <div>
              <p className="font-semibold">{f.label}</p>
              <p className="text-sm text-muted">{f.hint}</p>
            </div>
            {f.type === "select" ? (
              <Select value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} options={(f.options ?? []).map((o) => ({ value: o, label: o === "on" ? "On" : "Off" }))} />
            ) : f.type === "textarea" ? (
              <Textarea rows={2} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
            ) : (
              <Input type={f.type ?? "text"} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
      </Card>
    </>
  );
}
