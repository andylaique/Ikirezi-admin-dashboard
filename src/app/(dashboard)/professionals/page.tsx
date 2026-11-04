"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/brand";
import { Badge, Button, Card, FilterBar, Input, Modal, PageHeader, SearchInput, Select, Textarea, useToast } from "@/components/ui";
import { api, fmtDate, qs, useFetch } from "@/lib/api";
import { Professional } from "@/lib/types";

const SPECIALTIES = ["adolescent_srh", "gynaecology", "midwifery", "counselling", "nutrition", "mental_health", "gbv_support"];
const blank = { email: "", display_name: "", title: "", specialty: "adolescent_srh", bio: "", languages: "en,rw", license_number: "", avatar: "pro-1", temporary_password: "" };

export default function ProfessionalsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [active, setActive] = useState("");
  const { data, reload } = useFetch<Professional[]>(`/admin/professionals${qs({ q, specialty, active })}`);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    try {
      await api("/admin/professionals", { method: "POST", body: form });
      toast("Professional added. They must set up MFA at first login.");
      setOpen(false);
      setForm(blank);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p: Professional) => {
    try {
      await api(`/admin/professionals/${p.id}`, { method: "PATCH", body: { is_active: !p.is_active } });
      toast(p.is_active ? "Professional paused" : "Professional activated");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Professionals" subtitle="Doctors and counsellors. Each serves up to 2 members per day, first come first served." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Add professional</Button>} />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search by name" />
        <Select label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} options={[{ value: "", label: "All specialties" }, ...SPECIALTIES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))]} className="w-52" />
        <Select label="Status" value={active} onChange={(e) => setActive(e.target.value)} options={[{ value: "", label: "Any" }, { value: "true", label: "Active" }, { value: "false", label: "Paused" }]} className="w-36" />
      </FilterBar>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start gap-4">
              <Avatar id={p.avatar} size={60} />
              <div className="flex-1">
                <p className="font-display text-lg">{p.display_name}</p>
                <p className="text-sm text-muted">{p.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="teal">{p.specialty.replace(/_/g, " ")}</Badge>
                  <Badge tone="muted">{p.languages.toUpperCase()}</Badge>
                  <Badge tone={p.is_active ? "teal" : "alert"}>{p.is_active ? "Active" : "Paused"}</Badge>
                </div>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-ink/80">{p.bio}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
              <span>License {p.license_number} · {p.daily_capacity}/day · since {fmtDate(p.created_at)}</span>
              <Button size="sm" variant={p.is_active ? "secondary" : "success"} onClick={() => toggle(p)}>{p.is_active ? "Pause" : "Activate"}</Button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a professional" wide footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={saving} onClick={create}>Create account</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          <Input label="Work email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Title" placeholder="Youth-friendly nurse" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} options={SPECIALTIES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))} />
          <Input label="License number" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          <Input label="Languages" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          <Select label="Avatar" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} options={["pro-1", "pro-2", "pro-3", "pro-4"].map((a) => ({ value: a, label: a }))} />
          <Input label="Temporary password" type="password" value={form.temporary_password} onChange={(e) => setForm({ ...form, temporary_password: e.target.value })} />
        </div>
        <Textarea label="Short bio shown to members" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <div className="flex items-center gap-3 rounded-xl bg-blush p-3"><Avatar id={form.avatar} size={44} /><p className="text-xs text-muted">Members see this avatar, name, title, languages and bio only after they request a professional.</p></div>
      </Modal>
    </>
  );
}
