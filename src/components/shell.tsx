"use client";

import clsx from "clsx";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  CalendarHeart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Megaphone,
  PhoneCall,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trophy,
  UserCircle,
  Users,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

import { authStep, useFetch } from "@/lib/api";

import { Avatar, Logo } from "./brand";
import { ConfirmDialog } from "./ui";

const NAV = [
  { section: "Overview", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ] },
  { section: "Community", items: [
    { href: "/moderation/stories", label: "Story moderation", icon: MessageSquareWarning },
    { href: "/moderation/posts", label: "Mentor posts", icon: Megaphone },
    { href: "/contributors", label: "Contributors", icon: UserCheck },
    { href: "/questions", label: "Suggested questions", icon: HelpCircle },
    { href: "/topics", label: "Weekly topics", icon: CalendarHeart },
  ] },
  { section: "Care", items: [
    { href: "/professionals", label: "Professionals", icon: Stethoscope },
    { href: "/bookings", label: "Bookings queue", icon: CalendarCheck },
  ] },
  { section: "Content", items: [
    { href: "/curator", label: "AI curator", icon: Bot },
    { href: "/library", label: "Learn library", icon: BookOpen },
    { href: "/opportunities", label: "Opportunities", icon: Sparkles },
    { href: "/engagement", label: "Challenges & days", icon: Trophy },
    { href: "/emergency", label: "Emergency contacts", icon: PhoneCall },
  ] },
  { section: "Administration", items: [
    { href: "/users", label: "Users", icon: Users },
    { href: "/audit", label: "Audit log", icon: ScrollText },
    { href: "/security", label: "Security", icon: ShieldCheck },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/profile", label: "My profile", icon: UserCircle },
  ] },
];

type Me = { alias: string; email: string; avatar: string; role: string; mfa_enabled: boolean };

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { data: me } = useFetch<Me>("/me");

  const logout = async () => {
    setLeaving(true);
    await authStep("logout").catch(() => undefined);
    router.replace("/login");
  };

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo size={34} wordmark light />
        <p className="mt-1 pl-12 text-[11px] font-bold uppercase tracking-widest text-white/50">Admin</p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40">{group.section}</p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={clsx("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition", active ? "bg-white text-plum" : "text-white/75 hover:bg-white/10 hover:text-white")}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <button onClick={() => setConfirm(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-gradient-to-b from-plum to-[#3A1449] lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink/40" />
          <aside className="relative h-full w-64 bg-plum" onClick={(e) => e.stopPropagation()}>
            {nav}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-blush/85 px-4 backdrop-blur lg:px-8">
        <button className="rounded-lg p-2 text-plum lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-auto flex items-center gap-3">
          {me && !me.mfa_enabled && (
            <Link href="/security" className="rounded-full bg-alert/10 px-3 py-1 text-xs font-bold text-alert">
              Enable MFA
            </Link>
          )}
          <Link href="/profile" className="flex items-center gap-2.5 rounded-full bg-white py-1 pl-1 pr-3 shadow-card">
            <Avatar id={me?.avatar ?? "pearl-4"} size={32} />
            <span className="hidden text-sm sm:block">
              <span className="block font-semibold leading-tight">{me?.alias ?? "…"}</span>
              <span className="block text-[11px] capitalize text-muted">{me?.role?.replace("_", " ")}</span>
            </span>
          </Link>
          <button onClick={() => setConfirm(true)} className="rounded-full p-2 text-muted hover:bg-white hover:text-alert" aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">{children}</main>
      <ConfirmDialog
        open={confirm}
        title="Log out?"
        message="Are you sure you want to log out of the Ikirezi admin console? You will need your password, email code and authenticator to sign in again."
        confirmLabel="Log out"
        danger
        loading={leaving}
        onConfirm={logout}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
