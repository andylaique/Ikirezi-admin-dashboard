"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/brand";
import { Badge, Button, Card, ConfirmDialog, DataTable, Input, Modal, PageHeader, SearchInput, useToast } from "@/components/ui";
import { api, fmtDate, Page, qs, useFetch } from "@/lib/api";
import { User } from "@/lib/types";

export default function ContributorsPage() {
  const toast = useToast();
  const { data, loading, reload } = useFetch<Page<User>>("/admin/users?status=contributors&size=100");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const { data: candidates } = useFetch<Page<User>>(adding && search.length > 1 ? `/admin/users${qs({ q: search, role: "member", size: 8 })}` : null);
  const [revoke, setRevoke] = useState<User | null>(null);
  const [reason, setReason] = useState("");

  const setAccess = async (user: User, canPost: boolean) => {
    try {
      await api(`/admin/users/${user.id}/contributor`, { method: "PATCH", body: { can_post: canPost, reason: reason || null } });
      toast(canPost ? `${user.alias} can now post` : "Access removed");
      setRevoke(null);
      setReason("");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Contributors"
        subtitle="Qualified mentors allowed to publish named posts on the weekly topic"
        actions={<Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add contributor</Button>}
      />
      <Card className="mb-4 bg-lilac p-4 text-sm text-plum">
        Qualification checklist: verified identity, relevant experience (health worker, educator, youth leader), signed community code, and safeguarding training. Every post is still AI-reviewed and must match the active weekly topic.
      </Card>
      <DataTable
        rows={(data?.items ?? []).filter((u) => u.role !== "professional")}
        loading={loading}
        rowKey={(u) => u.id}
        empty="No contributors yet"
        columns={[
          { key: "u", header: "Contributor", render: (u) => <div className="flex items-center gap-3"><Avatar id={u.avatar} size={36} /><div><p className="font-semibold">{u.full_name || u.alias}</p><p className="text-xs text-muted">{u.email}</p></div></div> },
          { key: "c", header: "Country", render: (u) => u.country },
          { key: "s", header: "Strikes", render: (u) => `${u.abusive_strikes}/5` },
          { key: "st", header: "Status", render: (u) => (u.posting_banned ? <Badge tone="alert">Banned</Badge> : <Badge tone="teal">Can post</Badge>) },
          { key: "j", header: "Member since", render: (u) => fmtDate(u.created_at) },
          { key: "a", header: "", render: (u) => <Button size="sm" variant="secondary" onClick={() => setRevoke(u)}>Remove</Button> },
        ]}
      />
      <Modal open={adding} onClose={() => setAdding(false)} title="Approve a contributor">
        <SearchInput value={search} onChange={setSearch} placeholder="Search members by alias or email" />
        <ul className="space-y-2">
          {(candidates?.items ?? []).map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <Avatar id={u.avatar} size={36} />
              <div className="flex-1"><p className="font-semibold">{u.alias}</p><p className="text-xs text-muted">{u.email}</p></div>
              <Button size="sm" variant="success" disabled={u.posting_banned} onClick={() => setAccess(u, true)}>{u.posting_banned ? "Banned" : "Approve"}</Button>
            </li>
          ))}
        </ul>
      </Modal>
      <ConfirmDialog open={!!revoke} title="Remove contributor access?" message="They will no longer be able to publish posts." confirmLabel="Remove" danger onConfirm={() => revoke && setAccess(revoke, false)} onCancel={() => setRevoke(null)}>
        <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
    </>
  );
}
