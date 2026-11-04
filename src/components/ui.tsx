"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Download, Inbox, Loader2, Search, X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orchid/50 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm",
        variant === "primary" && "bg-plum text-white hover:bg-plum-600",
        variant === "secondary" && "border border-line bg-white text-plum hover:bg-plum-50",
        variant === "ghost" && "text-muted hover:bg-plum-50 hover:text-plum",
        variant === "danger" && "bg-alert text-white hover:brightness-95",
        variant === "success" && "bg-teal-deep text-white hover:brightness-95",
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function Input({ label, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>}
      <input
        {...rest}
        className={clsx("h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-orchid focus:ring-2 focus:ring-orchid/20", className)}
      />
    </label>
  );
}

export function Textarea({ label, className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>}
      <textarea
        {...rest}
        className={clsx("w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-orchid focus:ring-2 focus:ring-orchid/20", className)}
      />
    </label>
  );
}

export function Select({ label, options, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>}
      <select {...rest} className={clsx("h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-orchid", className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const TONES = {
  plum: "bg-lilac text-plum",
  coral: "bg-coral-soft text-coral",
  teal: "bg-teal-soft text-teal",
  gold: "bg-gold-soft text-[#8A5A00]",
  alert: "bg-alert/10 text-alert",
  muted: "bg-ink/5 text-muted",
};

export type Tone = keyof typeof TONES;

export function Badge({ tone = "plum", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", TONES[tone])}>{children}</span>;
}

export function statusTone(status?: string | null): Tone {
  if (!status) return "muted";
  if (["published", "approved", "completed", "answered", "active", "attended", "closed"].includes(status)) return "teal";
  if (["pending_admin", "pending", "queued", "new", "assigned", "sent", "scheduled", "in_review"].includes(status)) return "gold";
  if (["ai_rejected", "rejected", "removed", "cancelled", "no_show", "suspended", "banned"].includes(status)) return "alert";
  if (["in_session", "referred", "accepted"].includes(status)) return "coral";
  return "plum";
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("rounded-xl2 border border-line bg-white shadow-card", className)}>{children}</div>;
}

export function StatCard({ label, value, hint, icon, tone = "plum" }: { label: string; value: ReactNode; hint?: string; icon: ReactNode; tone?: Tone }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <span className={clsx("grid h-11 w-11 place-items-center rounded-xl", TONES[tone])}>{icon}</span>
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => local !== value && onChange(local), 350);
    return () => clearTimeout(t);
  }, [local, value, onChange]);
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-orchid focus:ring-2 focus:ring-orchid/20"
      />
    </div>
  );
}

export function FilterBar({ children, onExport }: { children: ReactNode; onExport?: () => void }) {
  return (
    <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
      {children}
      {onExport && (
        <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={onExport} className="ml-auto">
          Export CSV
        </Button>
      )}
    </Card>
  );
}

export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="flex items-end gap-2">
      <Input label="From" type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="w-40" />
      <Input label="To" type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="w-40" />
    </div>
  );
}

export type Column<T> = { key: string; header: string; render: (row: T) => ReactNode; className?: string };

export function DataTable<T>({ columns, rows, loading, empty = "Nothing here yet", rowKey, onRowClick }: { columns: Column<T>[]; rows: T[]; loading?: boolean; empty?: string; rowKey: (row: T) => string | number; onRowClick?: (row: T) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush text-xs uppercase tracking-wide text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={clsx("px-4 py-3 font-semibold", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-orchid" />
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <Empty message={empty} />
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx("border-t border-line/70 transition", onRowClick && "cursor-pointer hover:bg-blush/60")}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={clsx("px-4 py-3 align-middle", c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Pagination({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>
        {total === 0 ? 0 : (page - 1) * size + 1}–{Math.min(page * size, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft className="h-4 w-4" />} aria-label="Previous page" />
        <span className="font-semibold text-ink">
          {page} / {pages}
        </span>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} icon={<ChevronRight className="h-4 w-4" />} aria-label="Next page" />
      </div>
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center text-muted">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-lilac text-orchid">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className={clsx("max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-plum-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, danger, loading, onConfirm, onCancel, children }: { open: boolean; title: string; message: string; confirmLabel: string; danger?: boolean; loading?: boolean; onConfirm: () => void; onCancel: () => void; children?: ReactNode }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
      {children}
    </Modal>
  );
}

type Toast = { id: number; message: string; tone: "success" | "error" };
const ToastContext = createContext<(message: string, tone?: "success" | "error") => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] space-y-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={clsx("rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg", t.tone === "success" ? "bg-ink" : "bg-alert")}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-card">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={clsx("rounded-lg px-3.5 py-2 text-sm font-semibold transition", value === t.value ? "bg-plum text-white" : "text-muted hover:text-plum")}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
