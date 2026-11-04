"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, Button, DataTable, FilterBar, Modal, PageHeader, Pagination, SearchInput, Select, statusTone, Tabs, useToast } from "@/components/ui";
import { api, downloadCsv, fmtDateTime, humanize, Page, qs, useFetch } from "@/lib/api";
import { Professional, Question, User } from "@/lib/types";

type TabValue = "" | "new" | "assigned" | "answered";

export default function QuestionsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>("new");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Question | null>(null);
  const [assignee, setAssignee] = useState("");
  const { data, loading, reload } = useFetch<Page<Question>>(`/admin/questions${qs({ status: tab, q, page, size: 20 })}`);
  const { data: contributors } = useFetch<Page<User>>("/admin/users?status=contributors&size=100");
  const { data: pros } = useFetch<Professional[]>("/admin/professionals?active=true");

  const people = useMemo(() => {
    const list = (contributors?.items ?? []).map((u) => ({ value: String(u.id), label: `${u.full_name || u.alias} · ${humanize(u.role)}` }));
    for (const p of pros ?? []) if (!list.some((l) => l.value === String(p.user_id))) list.push({ value: String(p.user_id), label: `${p.display_name} · ${p.specialty}` });
    return list;
  }, [contributors, pros]);

  const nameFor = (id: number | null) => people.find((p) => p.value === String(id))?.label.split(" · ")[0] ?? "—";

  const assign = async () => {
    if (!target || !assignee) return;
    try {
      await api(`/admin/questions/${target.id}/assign`, { method: "POST", body: { assignee_id: Number(assignee) } });
      toast("Question routed");
      setTarget(null);
      setAssignee("");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Suggested questions" subtitle="Questions members want answered. Route them to a contributor or professional who will reply with a post." />
      <Tabs<TabValue> value={tab} onChange={(v) => { setTab(v); setPage(1); }} tabs={[{ value: "new", label: "New" }, { value: "assigned", label: "Assigned" }, { value: "answered", label: "Answered" }, { value: "", label: "All" }]} />
      <FilterBar onExport={() => downloadCsv("questions", (data?.items ?? []) as unknown as Record<string, unknown>[])}>
        <SearchInput value={q} onChange={setQ} placeholder="Search question text" />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(x) => x.id}
        columns={[
          { key: "t", header: "Question", render: (x) => <p className="max-w-xl font-medium">{x.text}</p> },
          { key: "h", header: "Topic", render: (x) => (x.topic_hint ? <Badge tone="plum">{humanize(x.topic_hint)}</Badge> : "—") },
          { key: "s", header: "Status", render: (x) => <Badge tone={statusTone(x.status)}>{humanize(x.status)}</Badge> },
          { key: "a", header: "Assignee", render: (x) => nameFor(x.assignee_id) },
          { key: "d", header: "Asked", render: (x) => fmtDateTime(x.created_at) },
          { key: "x", header: "", render: (x) => x.status !== "answered" && <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={() => setTarget(x)}>{x.assignee_id ? "Reassign" : "Assign"}</Button> },
        ]}
      />
      {data && <Pagination page={page} size={20} total={data.total} onPage={setPage} />}
      <Modal open={!!target} onClose={() => setTarget(null)} title="Route question" footer={<><Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button><Button onClick={assign} disabled={!assignee}>Assign</Button></>}>
        <p className="rounded-xl bg-blush p-3 text-sm">{target?.text}</p>
        <Select label="Assign to" value={assignee} onChange={(e) => setAssignee(e.target.value)} options={[{ value: "", label: "Choose a privileged poster" }, ...people]} />
      </Modal>
    </>
  );
}
