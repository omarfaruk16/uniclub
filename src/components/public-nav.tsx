"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Avatar, Logo } from "./visuals";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/announcements", label: "Announcements" },
  { href: "/about", label: "About Us" },
];

type NavUser = { name: string; role: string; avatar: string | null; home: string } | null;

export function PublicNav({ user, siteName }: { user: NavUser; siteName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${siteName} home`}>
          <Logo name={siteName} />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-line bg-slate-50/70 p-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                isActive(l.href) ? "bg-ink text-white" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 hover:border-slate-300" aria-expanded={menu} aria-haspopup="menu">
                <Avatar name={user.name} src={user.avatar} size={30} />
                <span className="max-w-32 truncate text-sm font-medium text-slate-700">{user.name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").split(" ")[0]}</span>
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-56 animate-fade-in rounded-xl border border-slate-100 bg-white p-1.5 shadow-lift">
                  <Link href={user.home} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  {user.role === "REP" && (
                    <Link href="/student/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                      <LayoutDashboard className="size-4" /> Student dashboard
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost rounded-full">Log in</Link>
              <Link href="/register" className="btn btn-primary rounded-full">Register</Link>
            </>
          )}
        </div>

        <button className="icon-btn md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-slate-100 bg-white md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={cn("rounded-xl px-4 py-3 text-[15px] font-medium", isActive(l.href) ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-50")}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Link href={user.home} className="btn btn-primary flex-1">Dashboard</Link>
                  <form action={logoutAction} className="flex-1">
                    <button className="btn btn-outline w-full">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-outline flex-1">Log in</Link>
                  <Link href="/register" className="btn btn-primary flex-1">Register</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
