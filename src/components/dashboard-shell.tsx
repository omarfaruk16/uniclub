"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3, Bell, CalendarCheck, CalendarPlus, CalendarRange, ClipboardList, Globe, History,
  LayoutDashboard, LogOut, Megaphone, Menu, Settings, Shield, UserCircle, UserCog, Users, Building2, X,
} from "lucide-react";
import { Avatar, ClubLogo, Logo } from "./visuals";
import { QuickAction } from "./confirm";
import { logoutAction } from "@/app/actions/auth";
import { markAllNotificationsReadAction, openNotificationAction } from "@/app/actions/student";
import { cn, timeAgo } from "@/lib/utils";

type Area = "student" | "club" | "admin";
type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

const NAV: Record<Area, { title: string; items: NavItem[] }> = {
  student: {
    title: "Student",
    items: [
      { href: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/student/clubs", label: "My Clubs", icon: Users },
      { href: "/student/registrations", label: "My Registrations", icon: CalendarCheck },
      { href: "/student/history", label: "Event History", icon: History },
      { href: "/student/announcements", label: "Announcements", icon: Megaphone },
      { href: "/student/notifications", label: "Notifications", icon: Bell },
      { href: "/student/profile", label: "My Profile", icon: UserCircle },
    ],
  },
  club: {
    title: "Club Representative",
    items: [
      { href: "/club/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/club/profile", label: "Club Profile", icon: Building2 },
      { href: "/club/members", label: "Members", icon: Users },
      { href: "/club/events/new", label: "Create Event", icon: CalendarPlus, exact: true },
      { href: "/club/events", label: "Manage Events", icon: CalendarRange },
      { href: "/club/registrations", label: "Registrations", icon: ClipboardList },
      { href: "/club/announcements", label: "Announcements", icon: Megaphone },
      { href: "/club/reports", label: "Reports", icon: BarChart3 },
      { href: "/club/notifications", label: "Notifications", icon: Bell },
    ],
  },
  admin: {
    title: "Administrator",
    items: [
      { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/clubs", label: "Club Management", icon: Building2 },
      { href: "/admin/users", label: "User Management", icon: UserCog },
      { href: "/admin/events", label: "Event Management", icon: CalendarRange },
      { href: "/admin/representatives", label: "Representatives", icon: Shield },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/analytics", label: "Analytics & Reports", icon: BarChart3 },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
};

type ShellUser = { name: string; email: string; avatar: string | null; role: string };
type Note = { id: string; title: string; body: string; read: boolean; createdAt: Date | string };

export function DashboardShell({
  area,
  user,
  siteName,
  club,
  notifications,
  unread,
  children,
}: {
  area: Area;
  user: ShellUser;
  siteName: string;
  club?: { name: string; logo: string | null; category: string; status: string } | null;
  notifications: Note[];
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = NAV[area];
  // The most specific matching item is active (so /club/events/new doesn't also light up /club/events).
  const activeHref = nav.items
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="Go to public site">
          <Logo name={siteName} light />
        </Link>
      </div>
      {club && (
        <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <ClubLogo name={club.name} src={club.logo} category={club.category} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{club.name}</p>
            <p className="text-xs text-brand-200">{club.status === "APPROVED" ? "Active club" : club.status.toLowerCase()}</p>
          </div>
        </div>
      )}
      <p className="px-5 pt-3 pb-2 text-[11px] font-semibold tracking-widest text-brand-300 uppercase">{nav.title}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label={`${nav.title} navigation`}>
        {nav.items.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-white text-brand-800 shadow-sm" : "text-brand-100 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className={cn("size-[18px]", active ? "text-brand-600" : "text-brand-300")} />
              {item.label}
              {item.label === "Notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-brand-950">{unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        {user.role === "REP" && area === "club" && (
          <Link href="/student/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-100 hover:bg-white/10">
            <UserCircle className="size-[18px] text-brand-300" /> Student dashboard
          </Link>
        )}
        {user.role === "REP" && area === "student" && (
          <Link href="/club/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-100 hover:bg-white/10">
            <Building2 className="size-[18px] text-brand-300" /> Club dashboard
          </Link>
        )}
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-100 hover:bg-white/10">
          <Globe className="size-[18px] text-brand-300" /> Public website
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-100 hover:bg-white/10">
            <LogOut className="size-[18px] text-brand-300" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-brand-800 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-brand-950/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] animate-slide-in bg-brand-800 shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-3 rounded-lg p-1.5 text-brand-100 hover:bg-white/10" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-brand-100 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-brand-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <p className="hidden truncate text-sm text-slate-500 sm:block">
            {nav.title} dashboard
          </p>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell notifications={notifications} unread={unread} viewAll={`/${area}/notifications`} />
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <Avatar name={user.name} src={user.avatar} size={34} />
              <div className="hidden leading-tight sm:block">
                <p className="max-w-40 truncate text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="max-w-40 truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell({ notifications, unread, viewAll }: { notifications: Note[]; unread: number; viewAll: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] leading-4 font-bold text-brand-950 ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 animate-fade-in rounded-2xl border border-slate-100 bg-white shadow-lift sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-display text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <QuickAction action={markAllNotificationsReadAction} fields={{}} className="text-xs font-semibold text-brand-600 hover:underline">
                Mark all read
              </QuickAction>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-400">You&apos;re all caught up.</li>}
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-slate-50 last:border-0">
                <form action={openNotificationAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className={cn("flex w-full gap-3 px-4 py-3 text-left transition hover:bg-brand-50/60", !n.read && "bg-gold-50/40")}>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-slate-200" : "bg-gold-400")} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                      <span className="line-clamp-2 block text-xs text-slate-500">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(new Date(n.createdAt))}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <Link href={viewAll} className="block rounded-b-2xl border-t border-slate-100 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
