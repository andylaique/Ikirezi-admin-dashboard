"use client";

import { AlertTriangle, Bot, CalendarCheck, Clock, Droplets, MessageSquareWarning, Stethoscope, UserPlus, Users, Activity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BarList, Donut, TrendChart } from "@/components/charts";
import { Card, DateRange, PageHeader, Select, StatCard } from "@/components/ui";
import { qs, useFetch } from "@/lib/api";
import { Metrics } from "@/lib/types";

const COUNTRIES = [
  { value: "", label: "All countries" },
  { value: "RW", label: "Rwanda" },
  { value: "KE", label: "Kenya" },
  { value: "UG", label: "Uganda" },
  { value: "TZ", label: "Tanzania" },
  { value: "BI", label: "Burundi" },
  { value: "ZM", label: "Zambia" },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export default function OverviewPage() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysAgo(0));
  const [country, setCountry] = useState("");
  const { data: m, loading, error } = useFetch<Metrics>(
    `/admin/metrics${qs({ date_from: from ? `${from}T00:00:00Z` : undefined, date_to: to ? `${to}T23:59:59Z` : undefined, country })}`,
  );
  const pct = (v?: number) => `${Math.round((v ?? 0) * 100)}%`;

  return (
    <>
      <PageHeader
        title="Good to see you"
        subtitle="Live health of the Ikirezi platform"
        actions={
          <>
            <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)} options={COUNTRIES} className="w-44" />
          </>
        }
      />
      {error && <p className="mb-4 rounded-xl bg-alert/10 p-3 text-sm font-semibold text-alert">{error}</p>}
      {m && m.stories_pending > 0 && (
        <Link href="/moderation/stories" className="mb-6 flex items-center gap-3 rounded-xl2 bg-gradient-to-r from-coral to-gold p-4 font-semibold text-white shadow-card">
          <AlertTriangle className="h-5 w-5" /> {m.stories_pending} stories passed AI review and are waiting for your decision
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={loading ? "…" : m?.total_users ?? 0} hint={`+${m?.new_users_7d ?? 0} this week`} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active (7 days)" value={m?.active_users_7d ?? 0} hint="Logged in this week" icon={<Activity className="h-5 w-5" />} tone="teal" />
        <StatCard label="Queue" value={m?.bookings_queued ?? 0} hint={`Median wait ${m?.median_wait_days ?? 0} days`} icon={<CalendarCheck className="h-5 w-5" />} tone="coral" />
        <StatCard label="Sessions completed" value={m?.bookings_completed ?? 0} hint={`${m?.professionals ?? 0} active professionals`} icon={<Stethoscope className="h-5 w-5" />} tone="gold" />
        <StatCard label="Stories published" value={m?.stories_published ?? 0} hint={`AI rejection rate ${pct(m?.ai_rejection_rate)}`} icon={<MessageSquareWarning className="h-5 w-5" />} />
        <StatCard label="AI questions (7d)" value={m?.chat_questions_7d ?? 0} hint={`Refused (no source) ${pct(m?.chat_refusal_rate)}`} icon={<Bot className="h-5 w-5" />} tone="teal" />
        <StatCard label="Cycle trackers" value={m?.cycle_trackers ?? 0} hint="Members logging cycles" icon={<Droplets className="h-5 w-5" />} tone="coral" />
        <StatCard label="Reminders set" value={m?.reminders_set ?? 0} hint={`${m?.contributors ?? 0} contributors · ${m?.posts_published ?? 0} posts`} icon={<Clock className="h-5 w-5" />} tone="gold" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Sign-ups over time</h3>
            <span className="inline-flex items-center gap-1 text-xs text-muted"><UserPlus className="h-3.5 w-3.5" /> daily</span>
          </div>
          <TrendChart data={m?.signups_by_day ?? []} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Bookings by status</h3>
          <Donut data={m?.bookings_by_status ?? []} height={180} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Members by country</h3>
          <BarList data={m?.users_by_country ?? []} />
        </Card>
        <Card className="p-5 xl:col-span-2">
          <h3 className="mb-3 font-semibold">Library lessons by topic</h3>
          <BarList data={m?.content_by_topic ?? []} color="#1F8A82" />
        </Card>
      </div>
    </>
  );
}
