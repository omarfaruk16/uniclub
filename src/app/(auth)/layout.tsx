import Link from "next/link";
import { CalendarCheck, Megaphone, Users } from "lucide-react";
import { Logo } from "@/components/visuals";
import { getSettings } from "@/lib/settings";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link href="/" aria-label="Home"><Logo name={s.siteName} /></Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} {s.siteName} · {s.universityName}</p>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-800 lg:block">
        <div className="pattern-dots absolute inset-0" />
        <div className="absolute -top-20 -right-20 size-96 rounded-full bg-brand-600/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 size-96 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center p-14">
          <h2 className="max-w-md text-4xl leading-tight font-bold text-white">
            Every club. Every event. <span className="text-gold-400">One campus.</span>
          </h2>
          <p className="mt-4 max-w-md text-brand-100">{s.tagline}</p>
          <ul className="mt-10 space-y-4">
            {[
              [Users, "Join clubs and track your membership status"],
              [CalendarCheck, "Register for events in a single click"],
              [Megaphone, "Get university and club announcements instantly"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Users;
              return (
                <li key={text as string} className="flex items-center gap-3 text-brand-50">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold-300"><I className="size-5" /></span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
