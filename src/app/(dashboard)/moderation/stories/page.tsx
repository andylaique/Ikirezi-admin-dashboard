"use client";

import { Bot, Check, EyeOff, X } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Card, DateRange, Empty, FilterBar, Modal, PageHeader, Pagination, Select, statusTone, Tabs, Textarea, useToast } from "@/components/ui";
import { api, downloadCsv, fmtDateTime, humanize, Page, qs, useFetch } from "@/lib/api";
import { Story } from "@/lib/types";

type TabValue = "pending_admin" | "ai_rejected" | "published" | "rejected";
const VERDICTS = ["", "approved", "abusive_language", "personal_information", "unsafe_advice", "spam", "ai_flagged"];

export default function StoryModerationPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>("pending_admin");
  const [verdict, setVerdict] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<{ story: Story; approve: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, reload } = useFetch<Page<Story>>(
    `/admin/stories${qs({ status: tab, verdict, page, size: 12, date_from: from && `${from}T00:00:00Z`, date_to: to && `${to}T23:59:59Z` })}`,
  );

  const decide = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      await api(`/admin/stories/${decision.story.id}/decision`, { method: "POST", body: { approve: decision.approve, note: note || null } });
      toast(decision.approve ? "Story published anonymously" : "Story rejected, author notified");
      setDecision(null);
      setNote("");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Story moderation" subtitle="Stories pass AI screening first. You make the final call. Authors are never shown." />
      <Tabs<TabValue>
        value={tab}
        onChange={(v) => { setTab(v); setPage(1); }}
        tabs={[
          { value: "pending_admin", label: "Awaiting decision" },
          { value: "ai_rejected", label: "Blocked by AI" },
          { value: "published", label: "Published" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      <FilterBar onExport={() => downloadCsv("stories", (data?.items ?? []).map(({ id, title, status, ai_verdict, created_at }) => ({ id, title, status, ai_verdict, created_at })))}>
        <Select label="AI verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)} options={VERDICTS.map((v) => ({ value: v, label: v ? humanize(v) : "Any verdict" }))} className="w-56" />
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </FilterBar>
      {!loading && (data?.items.length ?? 0) === 0 && <Card><Empty message="No stories in this queue." /></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.items ?? []).map((s) => (
          <Card key={s.id} className="flex flex-col p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="muted"><EyeOff className="h-3 w-3" /> Anonymous</Badge>
              <Badge tone={statusTone(s.status)}>{humanize(s.status)}</Badge>
              {s.ai_verdict && <Badge tone={s.ai_verdict === "approved" ? "teal" : "alert"}><Bot className="h-3 w-3" /> {humanize(s.ai_verdict)}</Badge>}
              <span className="ml-auto text-xs text-muted">{fmtDateTime(s.created_at)}</span>
            </div>
            <h3 className="font-display text-xl">{s.title}</h3>
            <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm text-ink/80">{s.body}</p>
            {s.ai_reasons && <p className="mt-3 rounded-lg bg-gold-soft px-3 py-2 text-xs font-semibold text-[#8A5A00]">AI: {s.ai_reasons}</p>}
            {s.admin_note && <p className="mt-2 text-xs text-muted">Note: {s.admin_note}</p>}
            {s.status === "published" && <p className="mt-2 text-xs text-muted">♥ {s.like_count} · ★ {s.rating_count} ratings</p>}
            {(s.status === "pending_admin" || s.status === "ai_rejected") && (
              <div className="mt-4 flex gap-2 pt-1">
                <Button variant="success" size="sm" icon={<Check className="h-4 w-4" />} onClick={() => setDecision({ story: s, approve: true })}>Publish</Button>
                <Button variant="secondary" size="sm" icon={<X className="h-4 w-4" />} onClick={() => setDecision({ story: s, approve: false })}>Reject</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {data && <Pagination page={page} size={12} total={data.total} onPage={setPage} />}
      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.approve ? "Publish this story?" : "Reject this story?"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>Cancel</Button>
            <Button variant={decision?.approve ? "success" : "danger"} loading={busy} onClick={decide}>{decision?.approve ? "Publish" : "Reject"}</Button>
          </>
        }
      >
        <p className="text-sm text-muted">{decision?.approve ? "It will be shown to members without any name or identifier." : "The author will be notified with your note so they can improve it."}</p>
        <Textarea label="Note to author (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </>
  );
}
