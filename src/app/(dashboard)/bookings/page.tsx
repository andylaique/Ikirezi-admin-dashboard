"use client";

import { Shuffle } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, Button, Card, DataTable, DateRange, FilterBar, PageHeader, Pagination, Select, statusTone, useToast } from "@/components/ui";
import { api, downloadCsv, fmtDate, fmtDateTime, humanize, Page, qs, useFetch } from "@/lib/api";
import { Booking, Professional } from "@/lib/types";

const STATUSES = ["", "queued", "scheduled", "in_session", "completed", "referred", "cancelled", "no_show"];

export default function BookingsPage() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [pro, setPro] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [running, setRunning] = useState(false);
  const { data, loading, reload } = useFetch<Page<Booking>>(`/admin/bookings${qs({ status, professional_id: pro, page, size: 25, date_from: from && `${from}T00:00:00Z`, date_to: to && `${to}T23:59:59Z` })}`);
  const { data: pros } = useFetch<Professional[]>("/admin/professionals");
  const names = useMemo(() => Object.fromEntries((pros ?? []).map((p) => [p.id, p.display_name])), [pros]);
  const capacity = (pros ?? []).filter((p) => p.is_active).length * 2;

  const allocate = async () => {
    setRunning(true);
    try {
      const res = await api<{ detail: string }>("/admin/bookings/allocate", { method: "POST" });
      toast(res.detail);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <PageHeader title="Bookings queue" subtitle="Strict first-come-first-served. Each professional takes at most 2 members per day." actions={<Button icon={<Shuffle className="h-4 w-4" />} loading={running} onClick={allocate}>Run allocation</Button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs font-bold uppercase text-muted">Daily capacity</p><p className="font-display text-3xl">{capacity}</p><p className="text-xs text-muted">active professionals × 2</p></Card>
        <Card className="p-4"><p className="text-xs font-bold uppercase text-muted">Shown</p><p className="font-display text-3xl">{data?.total ?? 0}</p><p className="text-xs text-muted">requests matching filters</p></Card>
        <Card className="p-4"><p className="text-xs font-bold uppercase text-muted">Privacy</p><p className="mt-1 text-sm">Members appear as IDs here. Professionals see alias, avatar and age band only.</p></Card>
      </div>
      <FilterBar onExport={() => downloadCsv("bookings", (data?.items ?? []) as unknown as Record<string, unknown>[])}>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUSES.map((s) => ({ value: s, label: s ? humanize(s) : "Any status" }))} className="w-44" />
        <Select label="Professional" value={pro} onChange={(e) => setPro(e.target.value)} options={[{ value: "", label: "All professionals" }, ...(pros ?? []).map((p) => ({ value: String(p.id), label: p.display_name }))]} className="w-56" />
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(b) => b.id}
        columns={[
          { key: "id", header: "#", render: (b) => <span className="font-mono text-xs">#{b.id}</span> },
          { key: "m", header: "Member", render: (b) => <span className="font-mono text-xs">M-{b.member_id}</span> },
          { key: "t", header: "Topic", render: (b) => humanize(b.topic) },
          { key: "s", header: "Status", render: (b) => <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge> },
          { key: "p", header: "Professional", render: (b) => (b.professional_id ? names[b.professional_id] ?? `#${b.professional_id}` : "—") },
          { key: "d", header: "Session day", render: (b) => fmtDate(b.scheduled_for) },
          { key: "r", header: "Referral", render: (b) => (b.referral_status ? <Badge tone={statusTone(b.referral_status)}>{humanize(b.referral_status)}</Badge> : "—") },
          { key: "c", header: "Requested", render: (b) => fmtDateTime(b.created_at) },
        ]}
      />
      {data && <Pagination page={page} size={25} total={data.total} onPage={setPage} />}
    </>
  );
}
