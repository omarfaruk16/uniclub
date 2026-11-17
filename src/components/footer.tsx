import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./visuals";
import type { Settings } from "@/lib/settings";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-20 bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo name={settings.siteName} light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">
            The club and event platform for {settings.universityName}. {settings.tagline}
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/clubs", "Explore clubs"],
              ["/events", "Upcoming events"],
              ["/announcements", "Announcements"],
              ["/about", "About us"],
              ["/register", "Create an account"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="text-brand-200 transition hover:text-gold-300">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Contact</h3>
          <ul className="space-y-3 text-sm text-brand-200">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" />{settings.address}</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-gold-400" /><a href={`mailto:${settings.contactEmail}`} className="hover:text-gold-300">{settings.contactEmail}</a></li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-gold-400" />{settings.contactPhone}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-brand-300 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.siteName} · {settings.universityName}. All rights reserved.</p>
          <p>University Club &amp; Event Management System</p>
        </div>
      </div>
    </footer>
  );
}
