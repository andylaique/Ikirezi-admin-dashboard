"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge, Button, ConfirmDialog, DataTable, Input, Modal, PageHeader, Textarea, useToast } from "@/components/ui";
import { api, fmtDate, useFetch } from "@/lib/api";
import { Topic } from "@/lib/types";

const nextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
};

export default function TopicsPage() {
  const toast = useToast();
  const { data, loading, reload } = useFetch<Topic[]>("/admin/topics");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", title_rw: "", description: "", starts_on: nextMonday() });
  const [remove, setRemove] = useState<Topic | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const save = async () => {
    try {
      await api("/admin/topics", { method: "POST", body: { ...form, title_rw: form.title_rw || null } });
      toast("Topic scheduled for 7 days");
      setOpen(false);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const destroy = async () => {
    if (!remove) return;
    try {
      await api(`/admin/topics/${remove.id}`, { method: "DELETE" });
      toast("Topic deleted");
      setRemove(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Weekly topics" subtitle="Each topic lasts exactly one week. Mentor posts must relate to the active topic." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Schedule topic</Button>} />
      <DataTable
        rows={data ?? []}
        loading={loading}
        rowKey={(t) => t.id}
        columns={[
          { key: "t", header: "Topic", render: (t) => <div><p className="font-semibold">{t.title}</p><p className="text-xs text-muted">{t.title_rw}</p></div> },
          { key: "d", header: "Description", render: (t) => <p className="max-w-md text-sm text-muted">{t.description}</p> },
          { key: "w", header: "Week", render: (t) => `${fmtDate(t.starts_on)} → ${fmtDate(t.ends_on)}` },
          { key: "s", header: "Status", render: (t) => (t.starts_on <= today && t.ends_on >= today ? <Badge tone="coral">Active</Badge> : t.starts_on > today ? <Badge tone="gold">Upcoming</Badge> : <Badge tone="muted">Past</Badge>) },
          { key: "x", header: "", render: (t) => t.starts_on > today && <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => setRemove(t)} aria-label="Delete" /> },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Schedule a weekly topic" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={!form.title || !form.description}>Schedule</Button></>}>
        <Input label="Title (English)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Title (Kinyarwanda)" value={form.title_rw} onChange={(e) => setForm({ ...form, title_rw: e.target.value })} />
        <Textarea label="Description and keywords" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Starts on" type="date" value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} />
        <p className="text-xs text-muted">Ends automatically 6 days later. The AI uses the title and description to check that posts are on topic.</p>
      </Modal>
      <ConfirmDialog open={!!remove} title="Delete topic?" message={`"${remove?.title}" will be removed from the schedule.`} confirmLabel="Delete" danger onConfirm={destroy} onCancel={() => setRemove(null)} />
    </>
  );
}
