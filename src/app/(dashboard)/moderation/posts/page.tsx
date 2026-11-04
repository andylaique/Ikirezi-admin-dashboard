"use client";

import { useState } from "react";

import { Avatar } from "@/components/brand";
import { Badge, Button, ConfirmDialog, DataTable, DateRange, FilterBar, PageHeader, Pagination, Select, statusTone, useToast } from "@/components/ui";
import { api, downloadCsv, fmtDateTime, humanize, Page, qs, useFetch } from "@/lib/api";
import { Post } from "@/lib/types";

const STATUSES = ["", "published", "ai_rejected", "removed"];

export default function PostsPage() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Post | null>(null);
  const { data, loading, reload } = useFetch<Page<Post>>(`/admin/posts${qs({ status, page, size: 20, date_from: from && `${from}T00:00:00Z`, date_to: to && `${to}T23:59:59Z` })}`);

  const toggle = async () => {
    if (!target) return;
    try {
      await api(`/admin/posts/${target.id}/remove`, { method: "POST", body: { approve: target.status !== "published" } });
      toast(target.status === "published" ? "Post removed" : "Post restored");
      setTarget(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Mentor posts" subtitle="Named posts by approved contributors and professionals. AI reviews every post before it goes live." />
      <FilterBar onExport={() => downloadCsv("posts", (data?.items ?? []).map(({ id, title, author_alias, status, ai_verdict, like_count, average_rating, created_at }) => ({ id, title, author_alias, status, ai_verdict, like_count, average_rating, created_at })))}>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUSES.map((s) => ({ value: s, label: s ? humanize(s) : "Any status" }))} className="w-48" />
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(p) => p.id}
        columns={[
          { key: "author", header: "Author", render: (p) => <div className="flex items-center gap-2"><Avatar id={p.author_avatar} size={32} /><div><p className="font-semibold">{p.author_alias}</p><p className="text-xs text-muted">{humanize(p.author_role)}</p></div></div> },
          { key: "title", header: "Post", render: (p) => <div className="max-w-md"><p className="font-semibold">{p.title}</p><p className="line-clamp-2 text-xs text-muted">{p.body}</p></div> },
          { key: "ai", header: "AI review", render: (p) => <div><Badge tone={p.ai_verdict === "approved" ? "teal" : "alert"}>{humanize(p.ai_verdict ?? "—")}</Badge>{p.ai_reasons && <p className="mt-1 max-w-[200px] text-xs text-muted">{p.ai_reasons}</p>}</div> },
          { key: "status", header: "Status", render: (p) => <Badge tone={statusTone(p.status)}>{humanize(p.status)}</Badge> },
          { key: "eng", header: "Engagement", render: (p) => <span className="text-sm">♥ {p.like_count} · ★ {p.average_rating.toFixed(1)} ({p.rating_count})</span> },
          { key: "date", header: "Created", render: (p) => fmtDateTime(p.created_at) },
          { key: "act", header: "", render: (p) => p.status !== "ai_rejected" && <Button size="sm" variant={p.status === "published" ? "secondary" : "success"} onClick={() => setTarget(p)}>{p.status === "published" ? "Remove" : "Restore"}</Button> },
        ]}
      />
      {data && <Pagination page={page} size={20} total={data.total} onPage={setPage} />}
      <ConfirmDialog open={!!target} title={target?.status === "published" ? "Remove post?" : "Restore post?"} message="This action is recorded in the audit log." confirmLabel="Confirm" danger={target?.status === "published"} onConfirm={toggle} onCancel={() => setTarget(null)} />
    </>
  );
}
