"use client";

import { Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge, Button, ConfirmDialog, DataTable, FilterBar, Input, Modal, PageHeader, Select, useToast } from "@/components/ui";
import { api, humanize, useFetch } from "@/lib/api";
import { Emergency } from "@/lib/types";

const CATEGORIES = ["general", "police", "health", "gbv", "child", "mental"];

export default function EmergencyPage() {
  const toast = useToast();
  const [country, setCountry] = useState("RW");
  const { data, loading, reload } = useFetch<Emergency[]>(`/emergency?country=${country}`);
  const [form, setForm] = useState<null | { country: string; label: string; label_rw: string; number: string; category: string; priority: number }>(null);
  const [remove, setRemove] = useState<Emergency | null>(null);

  const save = async () => {
    if (!form) return;
    try {
      await api("/admin/emergency", { method: "POST", body: { ...form, label_rw: form.label_rw || null } });
      toast("Contact added");
      setForm(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const destroy = async () => {
    if (!remove) return;
    try {
      await api(`/admin/emergency/${remove.id}`, { method: "DELETE" });
      toast("Contact removed");
      setRemove(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Emergency contacts" subtitle="Shown in the app SOS screen and cached for offline use. Verify numbers with official government sources." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ country, label: "", label_rw: "", number: "", category: "general", priority: 10 })}>Add contact</Button>} />
      <FilterBar>
        <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)} options={["RW", "KE", "UG", "TZ", "BI", "ZM"].map((c) => ({ value: c, label: c }))} className="w-32" />
      </FilterBar>
      <DataTable
        rows={data ?? []}
        loading={loading}
        rowKey={(c) => c.id}
        columns={[
          { key: "p", header: "Order", render: (c) => c.priority },
          { key: "l", header: "Service", render: (c) => <div><p className="font-semibold">{c.label}</p><p className="text-xs text-muted">{c.label_rw}</p></div> },
          { key: "n", header: "Number", render: (c) => <span className="inline-flex items-center gap-2 font-display text-xl text-plum"><Phone className="h-4 w-4" />{c.number}</span> },
          { key: "c", header: "Category", render: (c) => <Badge tone={c.category === "gbv" || c.category === "general" ? "alert" : "teal"}>{humanize(c.category)}</Badge> },
          { key: "x", header: "", render: (c) => <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => setRemove(c)} aria-label="Delete" /> },
        ]}
      />
      <Modal open={!!form} onClose={() => setForm(null)} title="Add emergency contact" footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Add</Button></>}>
        {form && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Country" maxLength={2} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} />
              <Input label="Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <Input label="Service name (English)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <Input label="Service name (Kinyarwanda)" value={form.label_rw} onChange={(e) => setForm({ ...form, label_rw: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))} />
              <Input label="Display order" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
          </>
        )}
      </Modal>
      <ConfirmDialog open={!!remove} title="Remove contact?" message={`${remove?.label} (${remove?.number}) will disappear from the SOS screen.`} confirmLabel="Remove" danger onConfirm={destroy} onCancel={() => setRemove(null)} />
    </>
  );
}
