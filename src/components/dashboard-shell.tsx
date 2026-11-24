"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, Bell, Building2, CalendarCheck, CalendarPlus, CalendarRange, ChevronRight,
  ChevronsUpDown, ClipboardList, Compass, Globe, History, LayoutGrid, LogOut, Megaphone, Menu, Plus, Search,
  Settings, Shield, UserCircle, UserCog, Users, X,
} from "lucide-react";
import { Avatar, ClubLogo, Logo } from "./visuals";
import { QuickAction } from "./confirm";
import { logoutAction } from "@/app/actions/auth";
import { markAllNotificationsReadAction, openNotificationAction } from "@/app/actions/student";
import { cn, timeAgo } from "@/lib/utils";

type Area = "student" | "club" | "admin";
type Icon = React.ComponentType<{ className?: string }>;
type NavItem = { href: string; label: string; short?: string; icon: Icon; exact?: boolean };
type NavGroup = { title: string; items: NavItem[] };

const NAV: Record<Area, { title: string; groups: NavGroup[]; tabs: string[]; cta: { href: string; label: string; icon: Icon } }> = {
  student: {
    title: "Student",
    groups: [
      {
        title: "Main menu",
        items: [
          { href: "/student/dashboard", label: "Dashboard", short: "Home", icon: LayoutGrid },
          { href: "/student/clubs", label: "My Clubs", short: "Clubs", icon: Users },
          { href: "/student/registrations", label: "My Registrations", short: "Events", icon: CalendarCheck },
          { href: "/student/history", label: "Event History", icon: History },
        ],
      },
      {
        title: "Updates",
        items: [
          { href: "/student/announcements", label: "Announcements", icon: Megaphone },
          { href: "/student/notifications", label: "Notifications", short: "Alerts", icon: Bell },
        ],
      },
      { title: "General", items: [{ href: "/student/profile", label: "My Profile", icon: UserCircle }] },
    ],
    tabs: ["/student/dashboard", "/student/clubs", "/student/registrations", "/student/notifications"],
    cta: { href: "/events", label: "Browse events", icon: Compass },
  },
  club: {
    title: "Club",
    groups: [
      {
        title: "Main menu",
        items: [
          { href: "/club/dashboard", label: "Dashboard", short: "Home", icon: LayoutGrid },
          { href: "/club/members", label: "Members", icon: Users },
          { href: "/club/registrations", label: "Registrations", short: "Regs", icon: ClipboardList },
          { href: "/club/reports", label: "Reports", icon: BarChart3 },
        ],
      },
      {
        title: "Events",
        items: [
          { href: "/club/events/new", label: "Create Event", icon: CalendarPlus, exact: true },
          { href: "/club/events", label: "Manage Events", short: "Events", icon: CalendarRange },
        ],
      },
      {
        title: "Updates",
        items: [
          { href: "/club/announcements", label: "Announcements", icon: Megaphone },
          { href: "/club/notifications", label: "Notifications", icon: Bell },
        ],
      },
      { title: "General", items: [{ href: "/club/profile", label: "Club Profile", icon: Building2 }] },
    ],
    tabs: ["/club/dashboard", "/club/events", "/club/members", "/club/registrations"],
    cta: { href: "/club/events/new", label: "Create event", icon: Plus },
  },
  admin: {
    title: "Admin",
    groups: [
      {
        title: "Main menu",
        items: [
          { href: "/admin/dashboard", label: "Dashboard", short: "Home", icon: LayoutGrid },
          { href: "/admin/analytics", label: "Analytics & Reports", short: "Reports", icon: BarChart3 },
        ],
      },
      {
        title: "Manage",
        items: [
          { href: "/admin/clubs", label: "Clubs", icon: Building2 },
          { href: "/admin/users", label: "Users", icon: UserCog },
          { href: "/admin/events", label: "Events", icon: CalendarRange },
          { href: "/admin/representatives", label: "Representatives", icon: Shield },
        ],
      },
      {
        title: "Updates",
        items: [
          { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
          { href: "/admin/notifications", label: "Notifications", icon: Bell },
        ],
      },
      { title: "General", items: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
    ],
    tabs: ["/admin/dashboard", "/admin/clubs", "/admin/users", "/admin/events"],
    cta: { href: "/admin/announcements", label: "New announcement", icon: Megaphone },
  },
};

const PROFILE_HREF: Record<Area, string> = { student: "/student/profile", club: "/student/profile", admin: "/admin/settings" };

type ShellUser = { name: string; email: string; avatar: string | null; role: string };
type Note = { id: string; title: string; body: string; read: boolean; createdAt: Date | string };
type ShellClub = { name: string; logo: string | null; category: string; status: string; slug: string };

export function DashboardShell({
  area,
  user,
  siteName,
  club,
  notifications,
  unread,
  badges = {},
  children,
}: {
  area: Area;
  user: ShellUser;
  siteName: string;
  club?: ShellClub | null;
  notifications: Note[];
  unread: number;
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const nav = NAV[area];
  const allItems = nav.groups.flatMap((g) => g.items);
  // The most specific matching item is active (so /club/events/new doesn't also light up /club/events).
  const active = allItems
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const count = (href: string) => (href.endsWith("/notifications") ? unread : badges[href] ?? 0);

  const sidebarProps = { area, nav, user, club, activeHref: active?.href, count };

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-line bg-white lg:block">
        <Sidebar {...sidebarProps} siteName={siteName} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setDrawer(false)} />
          <aside className="relative h-full w-[300px] max-w-[86vw] animate-slide-in bg-white shadow-lift">
            <button onClick={() => setDrawer(false)} className="icon-btn absolute top-3.5 right-3 z-10 size-9" aria-label="Close menu">
              <X className="size-4" />
            </button>
            <Sidebar {...sidebarProps} siteName={siteName} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <Topbar
          area={area}
          user={user}
          siteName={siteName}
          section={active?.label ?? "Dashboard"}
          notifications={notifications}
          unread={unread}
          onMenu={() => setDrawer(true)}
        />
        <main className="mx-auto w-full max-w-[1320px] px-4 pt-4 pb-28 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {nav.tabs.map((href) => {
            const item = allItems.find((i) => i.href === href)!;
            const on = active?.href === href;
            const n = count(href);
            const I = item.icon;
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className="relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium">
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition", on ? "bg-ink text-white" : "text-slate-500")}>
                  <I className="size-[18px]" />
                </span>
                <span className={on ? "text-ink" : "text-slate-500"}>{item.short ?? item.label}</span>
                {n > 0 && <span className="absolute top-2 left-1/2 ml-2 min-w-4 rounded-full bg-gold-400 px-1 text-center text-[10px] leading-4 font-bold text-ink">{n > 9 ? "9+" : n}</span>}
              </Link>
            );
          })}
          <button onClick={() => setDrawer(true)} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500" aria-label="Open full menu">
            <span className="flex h-7 w-12 items-center justify-center rounded-full"><Menu className="size-[18px]" /></span>
            More
          </button>
        </div>
      </nav>
    </div>
  );
}

function Sidebar({
  area,
  nav,
  user,
  club,
  siteName,
  activeHref,
  count,
}: {
  area: Area;
  nav: (typeof NAV)[Area];
  user: ShellUser;
  club?: ShellClub | null;
  siteName: string;
  activeHref?: string;
  count: (href: string) => number;
}) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return nav.groups;
    const hits = nav.groups.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(term));
    return [{ title: "Results", items: hits }];
  }, [q, nav.groups]);

  const pendingClubs = count("/admin/clubs");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] shrink-0 items-center px-5">
        <Link href="/" aria-label="Go to public site"><Logo name={siteName} /></Link>
      </div>

      <div className="px-4 pb-2">
        <label className="relative block">
          <span className="sr-only">Search menu</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              const first = groups[0]?.items[0];
              if (e.key === "Enter" && q && first) {
                setQ("");
                router.push(first.href);
              }
              if (e.key === "Escape") setQ("");
            }}
            placeholder="Search"
            className="h-10 w-full rounded-xl border border-line bg-slate-50/60 pr-14 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 sm:block">⌘ K</kbd>
        </label>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label={`${nav.title} navigation`}>
        {groups.map((g) => (
          <div key={g.title} className="mt-3">
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{g.title}</p>
            {g.items.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No matches</p>}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const on = item.href === activeHref;
                const n = count(item.href);
                const I = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                        on ? "bg-gradient-to-r from-ink to-ink-2 text-white shadow-[0_6px_16px_-8px_rgb(17_23_20/0.6)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <I className={cn("size-[18px] shrink-0", on ? "text-white" : "text-slate-500")} />
                      <span className="truncate">{item.label}</span>
                      {n > 0 && (
                        <span className={cn("ml-auto min-w-6 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold", on ? "bg-white/15 text-white" : "border border-line bg-white text-slate-600")}>
                          {n > 99 ? "99+" : n}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {!q && (
          <ul className="mt-1 space-y-0.5">
            {user.role === "REP" && (
              <li>
                <Link href={area === "club" ? "/student/dashboard" : "/club/dashboard"} className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  {area === "club" ? <UserCircle className="size-[18px] text-slate-500" /> : <Building2 className="size-[18px] text-slate-500" />}
                  {area === "club" ? "Student view" : "Club dashboard"}
                </Link>
              </li>
            )}
            <li>
              <Link href="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <Globe className="size-[18px] text-slate-500" /> Public website
              </Link>
            </li>
            <li>
              <form action={logoutAction}>
                <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600">
                  <LogOut className="size-[18px]" /> Log out
                </button>
              </form>
            </li>
          </ul>
        )}
      </nav>

      {/* Context card at the bottom of the sidebar */}
      <div className="shrink-0 p-3">
        <div className="rounded-2xl border border-line bg-gradient-to-b from-brand-50 to-white p-4">
          {area === "club" && club ? (
            <>
              <div className="flex items-center gap-3">
                <ClubLogo name={club.name} src={club.logo} category={club.category} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{club.name}</p>
                  <p className="text-xs text-slate-500">{club.status === "APPROVED" ? "Active club" : `Status: ${club.status.toLowerCase()}`}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href="/club/events/new" className="btn btn-primary btn-sm flex-1"><Plus className="size-3.5" /> Event</Link>
                <Link href={`/clubs/${club.slug}`} className="btn btn-outline btn-sm flex-1">Public page</Link>
              </div>
            </>
          ) : area === "admin" ? (
            <>
              <p className="text-sm font-semibold text-slate-900">{pendingClubs ? `${pendingClubs} club${pendingClubs > 1 ? "s" : ""} to review` : "All caught up"}</p>
              <p className="mt-0.5 text-xs text-slate-500">{pendingClubs ? "New club proposals are waiting for your decision." : "No club proposals are waiting for review."}</p>
              <div className="mt-3 flex gap-2">
                <Link href="/admin/clubs?status=PENDING" className="btn btn-primary btn-sm flex-1">Review</Link>
                <Link href="/admin/clubs/new" className="btn btn-outline btn-sm flex-1">Add club</Link>
              </div>
            </>
          ) : user.role === "REP" ? (
            <>
              <p className="text-sm font-semibold text-slate-900">You run a club</p>
              <p className="mt-0.5 text-xs text-slate-500">Manage members, events and registrations from the club dashboard.</p>
              <Link href="/club/dashboard" className="btn btn-primary btn-sm mt-3 w-full">Open club dashboard</Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">Start your own club</p>
              <p className="mt-0.5 text-xs text-slate-500">Propose a club. Once approved, you become its representative.</p>
              <div className="mt-3 flex gap-2">
                <Link href="/student/clubs#propose" className="btn btn-primary btn-sm flex-1">Propose</Link>
                <Link href="/clubs" className="btn btn-outline btn-sm flex-1">Explore</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Topbar({
  area,
  user,
  siteName,
  section,
  notifications,
  unread,
  onMenu,
}: {
  area: Area;
  user: ShellUser;
  siteName: string;
  section: string;
  notifications: Note[];
  unread: number;
  onMenu: () => void;
}) {
  const router = useRouter();
  const nav = NAV[area];
  const Cta = nav.cta.icon;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:h-[68px] lg:px-8">
        {/* Mobile: menu + logo */}
        <button className="icon-btn lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="size-[18px]" />
        </button>
        <Link href={`/${area}/dashboard`} className="lg:hidden" aria-label="Dashboard home"><Logo name={siteName} compact /></Link>
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-sm font-semibold text-slate-900">{section}</p>
          <p className="truncate text-[11px] text-slate-500">{nav.title} panel</p>
        </div>

        {/* Desktop: history + breadcrumb */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <button onClick={() => router.back()} className="flex size-8 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:text-slate-900" aria-label="Go back">
            <ArrowLeft className="size-4" />
          </button>
          <button onClick={() => router.forward()} className="flex size-8 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:text-slate-900" aria-label="Go forward">
            <ArrowRight className="size-4" />
          </button>
        </div>
        <nav aria-label="Breadcrumb" className="ml-2 hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
          <Link href={`/${area}/dashboard`} className="text-slate-500 hover:text-slate-900">{nav.title}</Link>
          <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
          <span className="truncate font-medium text-slate-900">{section}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <Link href={`/${area}/announcements`} className="icon-btn hidden sm:inline-flex" aria-label="Announcements">
            <Megaphone className="size-[18px]" />
          </Link>
          <NotificationBell notifications={notifications} unread={unread} viewAll={`/${area}/notifications`} />
          <UserMenu area={area} user={user} />
          <Link href={nav.cta.href} className="btn btn-primary hidden md:inline-flex">
            <Cta className="size-4" /> {nav.cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}

function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  const pathname = usePathname();
  useEffect(() => close(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const firstName = (name: string) => name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").split(" ")[0];

const ROLE_NAME: Record<string, string> = { STUDENT: "Student", REP: "Club representative", ADMIN: "Administrator" };

function UserMenu({ area, user }: { area: Area; user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-1 transition hover:bg-slate-100 sm:pr-2" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu">
        <Avatar name={user.name} src={user.avatar} size={38} className="ring-0" />
        <span className="hidden max-w-32 truncate text-left text-sm font-semibold text-slate-800 xl:block">{firstName(user.name)}</span>
        <ChevronsUpDown className="hidden size-4 text-slate-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 animate-fade-in rounded-2xl border border-line bg-white p-1.5 shadow-lift">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={user.name} src={user.avatar} size={36} className="ring-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{ROLE_NAME[user.role] ?? user.role}</p>
            </div>
          </div>
          <div className="my-1 border-t border-line" />
          <Link role="menuitem" href={PROFILE_HREF[area]} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <UserCircle className="size-4 text-slate-500" /> {area === "admin" ? "Profile & settings" : "My profile"}
          </Link>
          {user.role === "REP" && (
            <Link role="menuitem" href={area === "club" ? "/student/dashboard" : "/club/dashboard"} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <Building2 className="size-4 text-slate-500" /> {area === "club" ? "Switch to student view" : "Switch to club dashboard"}
            </Link>
          )}
          <Link role="menuitem" href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <Globe className="size-4 text-slate-500" /> Public website
          </Link>
          <div className="my-1 border-t border-line" />
          <form action={logoutAction}>
            <button role="menuitem" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="size-4" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function NotificationBell({ notifications, unread, viewAll }: { notifications: Note[]; unread: number; viewAll: string }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="icon-btn relative"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-gold-400 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[72px] z-50 animate-fade-in rounded-2xl border border-line bg-white shadow-lift sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="font-display text-sm font-semibold text-slate-900">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] text-gold-700">{unread} new</span>}
            </p>
            {unread > 0 && (
              <QuickAction action={markAllNotificationsReadAction} fields={{}} className="text-xs font-semibold text-brand-600 hover:underline">
                Mark all read
              </QuickAction>
            )}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto px-1.5 sm:max-h-96">
            {notifications.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-400">You&apos;re all caught up.</li>}
            {notifications.map((n) => (
              <li key={n.id}>
                <form action={openNotificationAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-slate-200" : "bg-gold-400")} />
                    <span className="min-w-0">
                      <span className={cn("block text-sm text-slate-800", !n.read && "font-semibold")}>{n.title}</span>
                      <span className="line-clamp-2 block text-xs text-slate-500">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(new Date(n.createdAt))}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <Link href={viewAll} className="m-1.5 block rounded-xl border border-line py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
