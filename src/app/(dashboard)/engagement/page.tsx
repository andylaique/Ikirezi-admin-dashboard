"use client";

import { PartyPopper, Plus, Trophy } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Card, DataTable, Input, Modal, PageHeader, Tabs, Textarea, useToast } from "@/components/ui";
import { api, fmtDate, humanize, useFetch } from "@/lib/api";
import { Celebration, Challenge } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type TabValue = "challenges" | "celebrations";

export default function EngagementPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>("challenges");
  const { data: challenges, reload: reloadChallenges } = useFetch<Challenge[]>("/admin/challenges");
  const { data: celebrations, reload: reloadCelebrations } = useFetch<Celebration[]>("/celebrations");
  const [challenge, setChallenge] = useState<null | { title: string; title_rw: string; description: string; category: string; points: number; starts_on: string; ends_on: string }>(null);
  const [celebration, setCelebration] = useState<null | { month: number; day: number; title: string; title_rw: string; message: string; theme_color: string; source_url: string }>(null);
  const today = new Date().toISOString().slice(0, 10);

  const saveChallenge = async () => {
    if (!challenge) return;
    try {
      await api("/admin/challenges", { method: "POST", body: { ...challenge, title_rw: challenge.title_rw || null } });
      toast("Challenge created");
      setChallenge(null);
      reloadChallenges();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const saveCelebration = async () => {
    if (!celebration) return;
    try {
      await api("/admin/celebrations", { method: "POST", body: { ...celebration, title_rw: celebration.title_rw || null } });
      toast("Celebration added");
      setCelebration(null);
      reloadCelebrations();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Challenges & women's days"
        subtitle="Weekly challenges motivate action. Celebration days show a themed banner on the app home screen."
        actions={
          tab === "challenges" ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setChallenge({ title: "", title_rw: "", description: "", category: "health", points: 10, starts_on: today, ends_on: today })}>New challenge</Button>
          ) : (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCelebration({ month: 3, day: 8, title: "", title_rw: "", message: "", theme_color: "#F26D5B", source_url: "https://www.un.org/en/observances" })}>New celebration</Button>
          )
        }
      />
      <Tabs<TabValue> value={tab} onChange={setTab} tabs={[{ value: "challenges", label: "Weekly challenges" }, { value: "celebrations", label: "Celebration days" }]} />
      {tab === "challenges" && (
        <DataTable
          rows={challenges ?? []}
          rowKey={(c) => c.id}
          columns={[
            { key: "t", header: "Challenge", render: (c) => <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-soft text-plum"><Trophy className="h-4 w-4" /></span><div><p className="font-semibold">{c.title}</p><p className="text-xs text-muted">{c.description}</p></div></div> },
            { key: "c", header: "Category", render: (c) => <Badge tone="plum">{humanize(c.category)}</Badge> },
            { key: "p", header: "Points", render: (c) => `+${c.points}` },
            { key: "d", header: "Runs", render: (c) => `${fmtDate(c.starts_on)} → ${fmtDate(c.ends_on)}` },
            { key: "s", header: "Status", render: (c) => (c.starts_on <= today && c.ends_on >= today ? <Badge tone="coral">Live</Badge> : c.starts_on > today ? <Badge tone="gold">Upcoming</Badge> : <Badge tone="muted">Ended</Badge>) },
          ]}
        />
      )}
      {tab === "celebrations" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(celebrations ?? []).map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4 text-white" style={{ background: c.theme_color }}>
                <PartyPopper className="h-6 w-6" />
                <div><p className="text-xs font-bold uppercase opacity-80">{c.day} {MONTHS[c.month - 1]}</p><p className="font-display text-lg leading-tight">{c.title}</p></div>
              </div>
              <div className="p-4 text-sm">
                <p>{c.message}</p>
                {c.title_rw && <p className="mt-2 text-xs text-muted">{c.title_rw}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!challenge} onClose={() => setChallenge(null)} title="New weekly challenge" footer={<><Button variant="secondary" onClick={() => setChallenge(null)}>Cancel</Button><Button onClick={saveChallenge}>Create</Button></>}>
        {challenge && (
          <>
            <Input label="Title (English)" value={challenge.title} onChange={(e) => setChallenge({ ...challenge, title: e.target.value })} />
            <Input label="Title (Kinyarwanda)" value={challenge.title_rw} onChange={(e) => setChallenge({ ...challenge, title_rw: e.target.value })} />
            <Textarea label="What to do" rows={3} value={challenge.description} onChange={(e) => setChallenge({ ...challenge, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Category" value={challenge.category} onChange={(e) => setChallenge({ ...challenge, category: e.target.value })} />
              <Input label="Points" type="number" value={challenge.points} onChange={(e) => setChallenge({ ...challenge, points: Number(e.target.value) })} />
              <Input label="Starts" type="date" value={challenge.starts_on} onChange={(e) => setChallenge({ ...challenge, starts_on: e.target.value })} />
              <Input label="Ends" type="date" value={challenge.ends_on} onChange={(e) => setChallenge({ ...challenge, ends_on: e.target.value })} />
            </div>
          </>
        )}
      </Modal>
      <Modal open={!!celebration} onClose={() => setCelebration(null)} title="New celebration day" footer={<><Button variant="secondary" onClick={() => setCelebration(null)}>Cancel</Button><Button onClick={saveCelebration}>Add</Button></>}>
        {celebration && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Month" type="number" min={1} max={12} value={celebration.month} onChange={(e) => setCelebration({ ...celebration, month: Number(e.target.value) })} />
              <Input label="Day" type="number" min={1} max={31} value={celebration.day} onChange={(e) => setCelebration({ ...celebration, day: Number(e.target.value) })} />
              <Input label="Colour" type="color" value={celebration.theme_color} onChange={(e) => setCelebration({ ...celebration, theme_color: e.target.value.toUpperCase() })} className="p-1" />
            </div>
            <Input label="Title (English)" value={celebration.title} onChange={(e) => setCelebration({ ...celebration, title: e.target.value })} />
            <Input label="Title (Kinyarwanda)" value={celebration.title_rw} onChange={(e) => setCelebration({ ...celebration, title_rw: e.target.value })} />
            <Textarea label="Message" rows={2} value={celebration.message} onChange={(e) => setCelebration({ ...celebration, message: e.target.value })} />
            <Input label="Official source" type="url" value={celebration.source_url} onChange={(e) => setCelebration({ ...celebration, source_url: e.target.value })} />
          </>
        )}
      </Modal>
    </>
  );
}
