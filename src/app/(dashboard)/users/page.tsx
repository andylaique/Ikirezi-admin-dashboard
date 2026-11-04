"use client";

import { Ban, ShieldOff, UserCheck, UserX } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/brand";
import { Badge, Button, ConfirmDialog, DataTable, DateRange, FilterBar, Input, Modal, PageHeader, Pagination, SearchInput, Select, statusTone, useToast } from "@/components/ui";
import { api, downloadCsv, fmtDate, fmtDateTime, humanize, Page, qs, useFetch } from "@/lib/api";
import { Audit, User } from "@/lib/types";

const ROLES = ["", "member", "contributor", "professional", "reviewer", "admin", "super_admin"];
const STATUSES = [
  { value: "", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "contributors", label: "Contributors" },
  { value: "banned_posting", label: "Banned from posting" },
];

type Action = { kind: "suspend" | "activate" | "ban" | "contributor" | "revoke"; user: User } | null;

export default function UsersPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const path = `/admin/users${qs({ q, role, status, country, page, size: 20, date_from: from && `${from}T00:00:00Z`, date_to: to && `${to}T23:59:59Z` })}`;
  const { data, loading, reload } = useFetch<Page<User>>(path);
  const { data: activity } = useFetch<Audit[]>(selected ? `/admin/users/${selected.id}/activity` : null);

  const run = async () => {
    if (!action) return;
    setBusy(true);
    try {
      const { kind, user } = action;
      if (kind === "suspend" || kind === "activate") await api(`/admin/users/${user.id}/status`, { method: "PATCH", body: { is_active: kind === "activate", reason: reason || kind } });
      if (kind === "ban") await api(`/admin/users/${user.id}/ban`, { method: "POST", body: { is_active: false, reason: reason || "Policy violation" } });
      if (kind === "contributor" || kind === "revoke") await api(`/admin/users/${user.id}/contributor`, { method: "PATCH", body: { can_post: kind === "contributor", reason } });
      toast("User updated");
      setAction(null);
      setReason("");
      setSelected(null);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (user: User, next: string) => {
    try {
      await api(`/admin/users/${user.id}/role`, { method: "PATCH", body: { role: next } });
      toast(`Role changed to ${humanize(next)}`);
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const labels: Record<string, [string, string, boolean]> = {
    suspend: ["Suspend user?", "They will be signed out everywhere and cannot log in until reactivated.", true],
    activate: ["Reactivate user?", "They will be able to log in again.", false],
    ban: ["Ban permanently?", "The account is closed and the email, phone and device are blocked from registering again.", true],
    contributor: ["Approve as contributor?", "They will be able to publish named posts on the weekly topic. Every post is still reviewed by AI.", false],
    revoke: ["Remove contributor access?", "They will no longer be able to publish posts.", true],
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Members, contributors and staff" />
      <FilterBar onExport={() => downloadCsv("users", (data?.items ?? []).map(({ id, alias, email, role, country, is_active, can_post, abusive_strikes, created_at }) => ({ id, alias, email, role, country, is_active, can_post, abusive_strikes, created_at })))}>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search alias, email or name" />
        <Select label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} options={ROLES.map((r) => ({ value: r, label: r ? humanize(r) : "Any role" }))} className="w-40" />
        <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUSES} className="w-48" />
        <Input label="Country" value={country} maxLength={2} onChange={(e) => setCountry(e.target.value.toUpperCase())} className="w-24" placeholder="RW" />
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); setPage(1); }} />
      </FilterBar>
      <DataTable
        rows={data?.items ?? []}
        loading={loading}
        rowKey={(u) => u.id}
        onRowClick={setSelected}
        columns={[
          { key: "user", header: "User", render: (u) => (
            <div className="flex items-center gap-3">
              <Avatar id={u.avatar} size={36} />
              <div>
                <p className="font-semibold">{u.full_name || u.alias}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
            </div>
          ) },
          { key: "role", header: "Role", render: (u) => <Badge tone={u.role === "member" ? "muted" : "plum"}>{humanize(u.role)}</Badge> },
          { key: "country", header: "Country", render: (u) => u.country },
          { key: "status", header: "Status", render: (u) => (
            <div className="flex flex-wrap gap-1">
              <Badge tone={u.is_active ? "teal" : "alert"}>{u.is_active ? "Active" : "Suspended"}</Badge>
              {u.can_post && <Badge tone="coral">Contributor</Badge>}
              {u.posting_banned && <Badge tone="alert">Posting banned</Badge>}
            </div>
          ) },
          { key: "strikes", header: "Strikes", render: (u) => <span className={u.abusive_strikes >= 3 ? "font-bold text-alert" : ""}>{u.abusive_strikes}/5</span> },
          { key: "mfa", header: "MFA", render: (u) => (u.mfa_enabled ? <Badge tone="teal">On</Badge> : <Badge tone="muted">Off</Badge>) },
          { key: "joined", header: "Joined", render: (u) => fmtDate(u.created_at) },
          { key: "seen", header: "Last login", render: (u) => fmtDateTime(u.last_login_at) },
        ]}
      />
      {data && <Pagination page={page} size={20} total={data.total} onPage={setPage} />}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="User details" wide>
        {selected && (
          <>
            <div className="flex items-center gap-4">
              <Avatar id={selected.avatar} size={64} />
              <div className="flex-1">
                <p className="font-display text-2xl">{selected.full_name || selected.alias}</p>
                <p className="text-sm text-muted">{selected.email} · {selected.country} · born {selected.birth_year ?? "—"}</p>
              </div>
              <Select value={selected.role} onChange={(e) => changeRole(selected, e.target.value)} options={ROLES.filter(Boolean).map((r) => ({ value: r, label: humanize(r) }))} className="w-40" />
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.can_post ? (
                <Button variant="secondary" icon={<ShieldOff className="h-4 w-4" />} onClick={() => setAction({ kind: "revoke", user: selected })}>Remove contributor</Button>
              ) : (
                <Button variant="success" icon={<UserCheck className="h-4 w-4" />} disabled={selected.posting_banned} onClick={() => setAction({ kind: "contributor", user: selected })}>Approve contributor</Button>
              )}
              {selected.is_active ? (
                <Button variant="secondary" icon={<UserX className="h-4 w-4" />} onClick={() => setAction({ kind: "suspend", user: selected })}>Suspend</Button>
              ) : (
                <Button variant="secondary" onClick={() => setAction({ kind: "activate", user: selected })}>Reactivate</Button>
              )}
              <Button variant="danger" icon={<Ban className="h-4 w-4" />} onClick={() => setAction({ kind: "ban", user: selected })}>Ban</Button>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Activity history</h4>
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {(activity ?? []).length === 0 && <li className="text-sm text-muted">No recorded activity yet.</li>}
                {(activity ?? []).map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg bg-blush px-3 py-2 text-sm">
                    <span><Badge tone={statusTone(a.action.split(".")[1])}>{a.action}</Badge> <span className="ml-2 text-muted">{a.entity} {a.entity_id}</span></span>
                    <span className="text-xs text-muted">{fmtDateTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!action}
        title={action ? labels[action.kind][0] : ""}
        message={action ? labels[action.kind][1] : ""}
        confirmLabel="Confirm"
        danger={action ? labels[action.kind][2] : false}
        loading={busy}
        onConfirm={run}
        onCancel={() => setAction(null)}
      >
        <Input label="Reason (saved in audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
    </>
  );
}
