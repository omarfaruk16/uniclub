import type { Metadata } from "next";
import { AdSlot } from "@/components/ad-slot";
import { Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { pageParam, strParam, toOptions } from "@/lib/utils";
import { AnnouncementCard } from "@/components/cards";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Announcements" };
const PER = 10;

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AnnouncementsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = strParam(sp.q);
  const category = strParam(sp.category);
  const scope = strParam(sp.scope);
  const page = pageParam(sp.page);

  const visible = { OR: [{ clubId: null }, { club: { status: "APPROVED" } }] };
  const where = {
    AND: [
      visible,
      scope === "university" ? { clubId: null } : scope === "club" ? { clubId: { not: null } } : {},
      category ? { category } : {},
      q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {},
    ],
  };
  const [total, items] = await Promise.all([
    db.announcement.count({ where }),
    db.announcement.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER,
      take: PER,
      include: { club: { select: { name: true, slug: true } } },
    }),
  ]);

  return (
    <>
      <PageBanner title="Announcements" text="University notices and updates from every club, in one place." />
      <div className="container-page max-w-4xl pt-10">
        <AdSlot placement="ANNOUNCEMENTS" className="mb-6" />
        <Filters
          placeholder="Search announcements…"
          tabs={{ name: "scope", options: [{ value: "all", label: "All" }, { value: "university", label: "University" }, { value: "club", label: "Club notices" }] }}
          selects={[{ name: "category", label: "All categories", options: toOptions(ANNOUNCEMENT_CATEGORIES) }]}
        />
        {items.length ? (
          <div className="space-y-4">{items.map((a) => <AnnouncementCard key={a.id} a={a} />)}</div>
        ) : (
          <EmptyState icon={Megaphone} title="No announcements found" />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PER)} basePath="/announcements" params={{ q, category, scope }} />
      </div>
    </>
  );
}
