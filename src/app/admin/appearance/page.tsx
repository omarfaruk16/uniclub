import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getSettings, MEDIA_SLOTS } from "@/lib/settings";
import { BANNER_PLACEMENTS } from "@/lib/constants";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MediaSlot } from "./media-slot";
import { BannerManager } from "./banner-manager";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireRole(["ADMIN"]);
  const [{ tab }, settings, banners] = await Promise.all([
    searchParams,
    getSettings(),
    db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }] }),
  ]);
  const showBanners = tab === "banners";
  const groups = [...new Set(MEDIA_SLOTS.map((m) => m.group))];

  return (
    <>
      <PageHeader title="Appearance" description="Replace the logo and every graphic on the site, and manage banners and ads." />
      <div className="mb-5 inline-flex gap-1 rounded-xl border border-line bg-white p-1">
        {[["", "Site graphics"], ["banners", `Banners & ads (${banners.length})`]].map(([v, l]) => (
          <Link key={v} href={v ? `/admin/appearance?tab=${v}` : "/admin/appearance"} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap", (v === "banners") === showBanners ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100")}>
            {l}
          </Link>
        ))}
      </div>

      {showBanners ? (
        <BannerManager banners={banners} placements={BANNER_PLACEMENTS.map((p) => ({ value: p.value, label: p.label }))} />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g}>
              <h2 className="mb-3 text-base font-semibold">{g}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {MEDIA_SLOTS.filter((m) => m.group === g).map((m) => (
                  <MediaSlot key={m.key} slot={m.key} label={m.label} hint={m.hint} aspect={m.aspect} fallback={m.fallback} current={settings[m.key]} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
