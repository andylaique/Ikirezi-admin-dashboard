"use client";

import { useState } from "react";

import { Badge, DataTable, DateRange, FilterBar, Input, Modal, PageHeader, Pagination, Select, statusTone } from "@/components/ui";
import { downloadCsv, fmtDateTime, Page, qs, useFetch } from "@/lib/api";
import { Audit } from "@/lib/types";

const ENTITIES = ["", "user", "story", "post", "booking", "professional", "question", "topic", "lesson", "opportunity", "curated_item", "challenge", "celebration", "emergency_contact", "settings"];

export default function AuditPage() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Audit | null>(null);
  const { data, loading } = useFetch<Page<Audit>>(`/admin/audit${qs({ actor_id: actor, action, entity, page, size: 50, date_from: from && `${from}T00:00:00Z`, date_to: to && `${to}T23:59:59Z` })}`);

  return (
    <>
      <PageHeader title="Audit log" subtitle="Tamper-evident history of every sign-in, moderation decision and admin change" />
      <FilterBar onExport={() => downloadCsv("audit-log", (data?.items ?? []) as unknown as Record<string, unknown>[])}>
        <Input label="Actor ID" value={actor} onChange={(e) => setActor(e.target.value.replace(/\D/g, ""))} className="w-28" />
        <Input label="Action contains" value={action} onChange={(e) => setAction(e.target.value)} placeholder="auth.login" className="w-48" />
        <Select label="Entity" value={entity} onChange={(e) => setEntity(e.target.value)} options={ENTITIES.map((x) => ({ value: x, label: x || "Any entity" }))} className="w-48" />
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(a) => a.id}
        onRowClick={setDetail}
        columns={[
          { key: "w", header: "When", render: (a) => <span className="whitespace-nowrap">{fmtDateTime(a.created_at)}</span> },
          { key: "a", header: "Action", render: (a) => <Badge tone={a.action.includes("failed") || a.action.includes("ban") ? "alert" : statusTone(a.action.split(".")[1])}>{a.action}</Badge> },
          { key: "who", header: "Actor", render: (a) => (a.actor_id ? <span>#{a.actor_id} <span className="text-xs text-muted">{a.actor_role}</span></span> : <span className="text-muted">system</span>) },
          { key: "e", header: "Entity", render: (a) => `${a.entity}${a.entity_id ? ` #${a.entity_id}` : ""}` },
          { key: "ip", header: "IP", render: (a) => <span className="font-mono text-xs">{a.ip_address ?? "—"}</span> },
        ]}
      />
      {data && <Pagination page={page} size={50} total={data.total} onPage={setPage} />}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.action ?? ""}>
        <pre className="max-h-80 overflow-auto rounded-xl bg-ink p-4 text-xs text-white">{detail ? JSON.stringify({ ...detail, meta: JSON.parse(detail.meta || "{}") }, null, 2) : ""}</pre>
      </Modal>
    </>
  );
}
