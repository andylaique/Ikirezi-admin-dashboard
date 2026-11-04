"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MetricPoint } from "@/lib/types";

export const SERIES = ["#4A1D5E", "#F26D5B", "#1F8A82", "#F5B83D", "#7B3F98", "#D93F4C", "#9C6644"];

const tooltip = { contentStyle: { borderRadius: 12, border: "1px solid #E6DDEB", fontSize: 12 } };

export function TrendChart({ data, height = 260 }: { data: MetricPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F26D5B" stopOpacity={0.35} />
            <stop offset="1" stopColor="#F26D5B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#F0E9F3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B6177" }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6177" }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltip} />
        <Area type="monotone" dataKey="value" name="Sign-ups" stroke="#F26D5B" strokeWidth={2.5} fill="url(#trend)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarList({ data, height = 260, color = "#4A1D5E" }: { data: MetricPoint[]; height?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="#F0E9F3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6177" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 12, fill: "#1E1726" }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltip} cursor={{ fill: "#F5EEF8" }} />
        <Bar dataKey="value" name="Count" fill={color} radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 240 }: { data: MetricPoint[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES[i % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl font-semibold">{total}</p>
            <p className="text-xs text-muted">total</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
            <span className="capitalize text-muted">{d.label.replace(/_/g, " ")}</span>
            <span className="ml-auto pl-4 font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
