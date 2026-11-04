"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge, Button, DataTable, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, statusTone, Textarea, useToast } from "@/components/ui";
import { api, fmtDate, humanize, Page, qs, useFetch } from "@/lib/api";
import { Opportunity } from "@/lib/types";

const CATEGORIES = ["scholarship", "academic", "job", "internship", "life_skills", "competition", "mentorship", "zero_cost_idea"];
const blank = { category: "scholarship", title: "", organization: "", description: "", country: "ANY", cost_level: "free", deadline: "", url: "", status: "draft" };

export default function OpportunitiesPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<(typeof blank & { id?: number }) | null>(null);
  const { data, loading, reload } = useFetch<Page<Opportunity>>(`/admin/opportunities${qs({ q, category, status, page, size: 20 })}`);

  const save = async () => {
    if (!editing) return;
    const { id, ...body } = editing;
    try {
      await api(id ? `/admin/opportunities/${id}` : "/admin/opportunities", { method: id ? "PUT" : "POST", body: { ...body, deadline: body.deadline || null } });
      toast("Opportunity saved");
      setEditing(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Opportunities" subtitle="Scholarships, jobs, skills and zero-cost ideas shown in the Grow tab" actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ ...blank })}>New opportunity</Button>} />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search title or organisation" />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: "", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]} className="w-48" />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "", label: "Any" }, { value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} className="w-36" />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(o) => o.id}
        onRowClick={(o) => setEditing({ ...blank, ...o, deadline: o.deadline ?? "" })}
        columns={[
          { key: "t", header: "Opportunity", render: (o) => <div><p className="font-semibold">{o.title}</p><p className="text-xs text-muted">{o.organization}</p></div> },
          { key: "c", header: "Category", render: (o) => <Badge tone="plum">{humanize(o.category)}</Badge> },
          { key: "co", header: "Cost", render: (o) => <Badge tone="teal">{humanize(o.cost_level)}</Badge> },
          { key: "cn", header: "Country", render: (o) => o.country },
          { key: "d", header: "Deadline", render: (o) => fmtDate(o.deadline) },
          { key: "s", header: "Status", render: (o) => <Badge tone={statusTone(o.status)}>{humanize(o.status)}</Badge> },
        ]}
      />
      {data && <Pagination page={page} size={20} total={data.total} onPage={setPage} />}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit opportunity" : "New opportunity"} wide footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Input label="Organisation" value={editing.organization} onChange={(e) => setEditing({ ...editing, organization: e.target.value })} />
              <Select label="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))} />
              <Select label="Cost" value={editing.cost_level} onChange={(e) => setEditing({ ...editing, cost_level: e.target.value })} options={[{ value: "free", label: "Free" }, { value: "low", label: "Low cost" }, { value: "paid", label: "Paid" }]} />
              <Input label="Country code (or ANY)" value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value.toUpperCase() })} />
              <Input label="Deadline" type="date" value={editing.deadline} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} />
            </div>
            <Input label="Official link" type="url" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
            <Textarea label="Description" rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <Select label="Status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} />
          </>
        )}
      </Modal>
    </>
  );
}
