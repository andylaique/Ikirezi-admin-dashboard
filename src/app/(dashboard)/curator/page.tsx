"use client";

import { Bot, Check, ExternalLink, Pencil, X } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Card, Empty, FilterBar, Input, Modal, PageHeader, Pagination, Select, statusTone, Tabs, Textarea, useToast } from "@/components/ui";
import { api, fmtDateTime, humanize, Page, qs, useFetch } from "@/lib/api";
import { Curated } from "@/lib/types";

type Kind = "" | "fun_fact" | "history" | "opportunity";

export default function CuratorPage() {
  const toast = useToast();
  const [kind, setKind] = useState<Kind>("");
  const [status, setStatus] = useState("pending");
  const [country, setCountry] = useState("RW");
  const [page, setPage] = useState(1);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState<Curated | null>(null);
  const { data, loading, reload } = useFetch<Page<Curated>>(`/admin/curated${qs({ kind, status, page, size: 12 })}`);

  const run = async () => {
    setRunning(true);
    try {
      const items = await api<Curated[]>("/admin/curated/run", { method: "POST", body: { kinds: kind ? [kind] : ["fun_fact", "history", "opportunity"], country } });
      toast(`${items.length} new drafts ready for review`);
      setStatus("pending");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setRunning(false);
    }
  };

  const decide = async (item: Curated, approve: boolean) => {
    try {
      await api(`/admin/curated/${item.id}/decision`, { method: "POST", body: { approve } });
      toast(approve ? "Approved and published" : "Rejected");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const save = async () => {
    if (!editing) return;
    try {
      await api(`/admin/curated/${editing.id}`, { method: "PATCH", body: { title: editing.title, body: editing.body, source_title: editing.source_title, source_url: editing.source_url, display_date: editing.display_date } });
      toast("Saved");
      setEditing(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="AI curator"
        subtitle="The curator AI gathers fun facts, opportunities and 'Today in History' women from allow-listed sources. Nothing is published until you approve it."
        actions={
          <>
            <Input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={2} className="w-20" aria-label="Country" />
            <Button icon={<Bot className="h-4 w-4" />} loading={running} onClick={run}>Run curator</Button>
          </>
        }
      />
      <Tabs<Kind> value={kind} onChange={(v) => { setKind(v); setPage(1); }} tabs={[{ value: "", label: "All" }, { value: "fun_fact", label: "Fun facts" }, { value: "history", label: "Today in history" }, { value: "opportunity", label: "Opportunities" }]} />
      <FilterBar>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "pending", label: "Pending review" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }, { value: "", label: "All" }]} className="w-48" />
      </FilterBar>
      {!loading && (data?.items.length ?? 0) === 0 && <Card><Empty message="No drafts. Run the curator to collect new items." /></Card>}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(data?.items ?? []).map((c) => (
          <Card key={c.id} className="flex flex-col p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="plum">{humanize(c.kind)}</Badge>
              <Badge tone={statusTone(c.status)}>{humanize(c.status)}</Badge>
              {c.country !== "ANY" && <Badge tone="muted">{c.country}</Badge>}
            </div>
            <h3 className="font-display text-lg">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm text-ink/80">{c.body}</p>
            <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal underline">
              {c.source_title} <ExternalLink className="h-3 w-3" />
            </a>
            <p className="mt-1 text-xs text-muted">Drafted {fmtDateTime(c.created_at)}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(c)}>Edit</Button>
              {c.status !== "approved" && <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} onClick={() => decide(c, true)}>Approve</Button>}
              {c.status !== "rejected" && <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5" />} onClick={() => decide(c, false)}>Reject</Button>}
            </div>
          </Card>
        ))}
      </div>
      {data && <Pagination page={page} size={12} total={data.total} onPage={setPage} />}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit draft" footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing && (
          <>
            <Input label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Textarea label="Body" rows={5} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            <Input label="Source title" value={editing.source_title} onChange={(e) => setEditing({ ...editing, source_title: e.target.value })} />
            <Input label="Source URL" value={editing.source_url} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} />
            {editing.kind === "history" && <Input label="Show on date" type="date" value={editing.display_date ?? ""} onChange={(e) => setEditing({ ...editing, display_date: e.target.value })} />}
            <p className="rounded-lg bg-gold-soft p-3 text-xs text-[#8A5A00]">Open the source and confirm every fact before approving.</p>
          </>
        )}
      </Modal>
    </>
  );
}
