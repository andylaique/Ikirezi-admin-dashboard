"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge, Button, DataTable, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, statusTone, Textarea, useToast } from "@/components/ui";
import { api, humanize, Page, qs, useFetch } from "@/lib/api";
import { Lesson } from "@/lib/types";

const TOPICS = ["periods", "puberty", "hygiene", "contraception", "hiv_sti", "consent", "pregnancy", "mental_health"];
const STATUSES = ["draft", "in_review", "published", "archived"];
const blank = { topic: "periods", title: "", title_rw: "", summary: "", body: "", body_rw: "", source_title: "", source_url: "", minutes: 5, is_preview: false, status: "draft" };

export default function LibraryPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<(typeof blank & { id?: number }) | null>(null);
  const { data, loading, reload } = useFetch<Page<Lesson>>(`/admin/lessons${qs({ q, topic, status, page, size: 20 })}`);

  const open = async (lesson?: Lesson) => {
    if (!lesson) return setEditing({ ...blank });
    const full = await api<Lesson>(`/admin/lessons/${lesson.id}`).catch(() => lesson);
    setEditing({ ...blank, ...full, title_rw: full.title_rw ?? "", body: full.body ?? "", body_rw: full.body_rw ?? "", source_title: full.source_title ?? "", source_url: full.source_url ?? "" });
  };

  const save = async () => {
    if (!editing) return;
    const { id, ...body } = editing;
    try {
      await api(id ? `/admin/lessons/${id}` : "/admin/lessons", { method: id ? "PUT" : "POST", body: { ...body, title_rw: body.title_rw || null, body_rw: body.body_rw || null } });
      toast(body.status === "published" ? "Lesson published" : "Lesson saved");
      setEditing(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Learn library" subtitle="Every lesson must cite a credible source and be reviewed by an SRH expert before publishing." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => open()}>New lesson</Button>} />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search lessons" />
        <Select label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} options={[{ value: "", label: "All topics" }, ...TOPICS.map((t) => ({ value: t, label: humanize(t) }))]} className="w-44" />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "", label: "Any status" }, ...STATUSES.map((s) => ({ value: s, label: humanize(s) }))]} className="w-40" />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(l) => l.id}
        onRowClick={open}
        columns={[
          { key: "t", header: "Lesson", render: (l) => <div><p className="font-semibold">{l.title}</p><p className="text-xs text-muted">{l.title_rw ?? "No Kinyarwanda title yet"}</p></div> },
          { key: "tp", header: "Topic", render: (l) => <Badge tone="plum">{humanize(l.topic)}</Badge> },
          { key: "m", header: "Length", render: (l) => `${l.minutes} min` },
          { key: "p", header: "Access", render: (l) => (l.is_preview ? <Badge tone="teal">Public preview</Badge> : <Badge tone="muted">Members</Badge>) },
          { key: "s", header: "Status", render: (l) => <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge> },
        ]}
      />
      {data && <Pagination page={page} size={20} total={data.total} onPage={setPage} />}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit lesson" : "New lesson"} wide footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Topic" value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} options={TOPICS.map((t) => ({ value: t, label: humanize(t) }))} />
              <Input label="Minutes" type="number" min={1} max={60} value={editing.minutes} onChange={(e) => setEditing({ ...editing, minutes: Number(e.target.value) })} />
              <Select label="Status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Title (English)" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Input label="Title (Kinyarwanda)" value={editing.title_rw} onChange={(e) => setEditing({ ...editing, title_rw: e.target.value })} />
            </div>
            <Input label="Summary" value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Textarea label="Body (English)" rows={8} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              <Textarea label="Body (Kinyarwanda)" rows={8} value={editing.body_rw} onChange={(e) => setEditing({ ...editing, body_rw: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Source title" value={editing.source_title} onChange={(e) => setEditing({ ...editing, source_title: e.target.value })} />
              <Input label="Source URL" type="url" value={editing.source_url} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.is_preview} onChange={(e) => setEditing({ ...editing, is_preview: e.target.checked })} /> Free preview for guests</label>
          </>
        )}
      </Modal>
    </>
  );
}
