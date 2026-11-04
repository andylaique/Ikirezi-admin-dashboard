"use client";

import { useState } from "react";

import { BarList, Donut, TrendChart } from "@/components/charts";
import { Card, DateRange, PageHeader } from "@/components/ui";
import { qs, useFetch } from "@/lib/api";
import { Metrics } from "@/lib/types";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function Target({ label, value, target, unit = "", inverse = false }: { label: string; value: number; target: number; unit?: string; inverse?: boolean }) {
  const ratio = target === 0 ? 0 : inverse ? Math.min(target / Math.max(value, 0.0001), 1) : Math.min(value / target, 1);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">
          <b className="text-ink">{value}{unit}</b> / target {target}{unit}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-lilac">
        <div className="h-full rounded-full bg-gradient-to-r from-coral to-gold" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [from, setFrom] = useState(daysAgo(90));
  const [to, setTo] = useState(daysAgo(0));
  const { data: m } = useFetch<Metrics>(`/admin/metrics${qs({ date_from: `${from}T00:00:00Z`, date_to: `${to}T23:59:59Z` })}`);
  const activeRate = m && m.total_users ? Math.round((m.active_users_7d / m.total_users) * 100) : 0;
  const trackerRate = m && m.total_users ? Math.round((m.cycle_trackers / m.total_users) * 100) : 0;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Impact indicators from the master plan, using de-identified aggregates only" actions={<DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-5 p-6">
          <h3 className="font-semibold">Progress to 24-month targets</h3>
          <Target label="Registered members" value={m?.total_users ?? 0} target={100000} />
          <Target label="Weekly active rate" value={activeRate} target={35} unit="%" />
          <Target label="Professional sessions completed" value={m?.bookings_completed ?? 0} target={10000} />
          <Target label="Median wait for a professional" value={m?.median_wait_days ?? 0} target={3} unit=" d" inverse />
          <Target label="Members tracking their cycle" value={trackerRate} target={40} unit="%" />
          <Target label="Opportunity reminders set" value={m?.reminders_set ?? 0} target={25000} />
        </Card>
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">AI safety</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-teal-soft p-4">
              <p className="text-xs font-bold uppercase text-teal">Grounded answers</p>
              <p className="mt-1 font-display text-3xl">{Math.round((1 - (m?.chat_refusal_rate ?? 0)) * 100)}%</p>
              <p className="text-xs text-muted">answered with citations</p>
            </div>
            <div className="rounded-xl bg-gold-soft p-4">
              <p className="text-xs font-bold uppercase text-[#8A5A00]">Safe refusals</p>
              <p className="mt-1 font-display text-3xl">{Math.round((m?.chat_refusal_rate ?? 0) * 100)}%</p>
              <p className="text-xs text-muted">no reviewed source → referred</p>
            </div>
            <div className="rounded-xl bg-coral-soft p-4">
              <p className="text-xs font-bold uppercase text-coral">Story AI rejections</p>
              <p className="mt-1 font-display text-3xl">{Math.round((m?.ai_rejection_rate ?? 0) * 100)}%</p>
              <p className="text-xs text-muted">blocked before human review</p>
            </div>
            <div className="rounded-xl bg-lilac p-4">
              <p className="text-xs font-bold uppercase text-plum">AI questions</p>
              <p className="mt-1 font-display text-3xl">{m?.chat_questions_7d ?? 0}</p>
              <p className="text-xs text-muted">in the last 7 days</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 xl:col-span-2">
          <h3 className="mb-3 font-semibold">Growth</h3>
          <TrendChart data={m?.signups_by_day ?? []} height={300} />
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 font-semibold">Reach by country</h3>
          <BarList data={m?.users_by_country ?? []} color="#F26D5B" />
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 font-semibold">Referral pipeline</h3>
          <Donut data={m?.bookings_by_status ?? []} height={200} />
        </Card>
      </div>
    </>
  );
}
