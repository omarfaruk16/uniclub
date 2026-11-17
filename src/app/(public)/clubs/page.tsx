import type { Metadata } from "next";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { participation } from "@/lib/queries";
import { CLUB_CATEGORIES, PAGE_SIZE } from "@/lib/constants";
import { pageParam, strParam, toOptions } from "@/lib/utils";
import { ClubCard } from "@/components/cards";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Explore Clubs" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ClubsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = strParam(sp.q);
  const category = strParam(sp.category);
  const sort = strParam(sp.sort) || "popular";
  const page = pageParam(sp.page);

  const where = {
    status: "APPROVED",
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { shortDescription: { contains: q } }, { description: { contains: q } }] } : {}),
  };
  const user = await getCurrentUser();
  const [total, clubs, mine] = await Promise.all([
    db.club.count({ where }),
    db.club.findMany({
      where,
      orderBy: sort === "name" ? { name: "asc" } : sort === "newest" ? { createdAt: "desc" } : { memberships: { _count: "desc" } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { memberships: { where: { status: "APPROVED" } } } } },
    }),
    participation(user?.id),
  ]);

  return (
    <>
      <PageBanner title="Explore Clubs" text="Find communities that match your interests, from coding and robotics to music, sport and social service." />
      <div className="container-page pt-10">
        <Filters
          placeholder="Search clubs by name or interest…"
          selects={[
            { name: "category", label: "All categories", options: toOptions(CLUB_CATEGORIES) },
            { name: "sort", label: "Most popular", options: [{ value: "name", label: "Name (A–Z)" }, { value: "newest", label: "Newest" }] },
          ]}
        />
        <p className="mb-4 text-sm text-slate-500">{total} {total === 1 ? "club" : "clubs"} found</p>
        {clubs.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((c) => (
              <ClubCard key={c.id} club={c} memberCount={c._count.memberships} membership={user ? mine.memberships.get(c.id) : undefined} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No clubs match your search" description="Try a different keyword or category." />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} basePath="/clubs" params={{ q, category, sort: sort === "popular" ? "" : sort }} />
      </div>
    </>
  );
}
