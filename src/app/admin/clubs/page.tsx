import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, Pencil, Plus, Star, Trash2, Ban, X, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ClubLogo } from "@/components/visuals";
import { ConfirmAction, QuickAction } from "@/components/confirm";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { approveClubAction, deleteClubAction, rejectClubAction, suspendClubAction, toggleClubFeaturedAction } from "@/app/actions/admin";
import { CLUB_CATEGORIES, TABLE_PAGE_SIZE } from "@/lib/constants";
import { cn, formatDate, pageParam, strParam, toOptions } from "@/lib/utils";

export const metadata: Metadata = { title: "Club Management" };

export default async function AdminClubsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const q = strParam(sp.q);
  const status = strParam(sp.status);
  const category = strParam(sp.category);
  const page = pageParam(sp.page);
  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { shortDescription: { contains: q } }] } : {}),
  };
  const [total, clubs] = await Promise.all([
    db.club.count({ where }),
    db.club.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      skip: (page - 1) * TABLE_PAGE_SIZE,
      take: TABLE_PAGE_SIZE,
      include: {
        rep: { select: { name: true } },
        proposedBy: { select: { name: true } },
        _count: { select: { memberships: { where: { status: "APPROVED" } }, events: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader title="Club Management" description="Approve new clubs, edit profiles and control what appears on the public site." actions={<Link href="/admin/clubs/new" className="btn btn-primary"><Plus className="size-4" /> Add club</Link>} />
      <Filters
        placeholder="Search clubs…"
        selects={[
          { name: "status", label: "All statuses", options: [{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }, { value: "SUSPENDED", label: "Suspended" }] },
          { name: "category", label: "All categories", options: toOptions(CLUB_CATEGORIES) },
        ]}
      />
      {clubs.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Club</th><th>Representative</th><th>Members</th><th>Events</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {clubs.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <ClubLogo name={c.name} src={c.logo} category={c.category} size={40} />
                      <div className="min-w-0">
                        <Link href={`/clubs/${c.slug}`} className="font-medium text-slate-900 hover:text-brand-700">{c.name}</Link>
                        <p className="text-xs text-slate-500">{c.category} · since {formatDate(c.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td>{c.rep?.name ?? (c.proposedBy ? <span className="text-xs text-slate-500">Proposed by {c.proposedBy.name}</span> : <span className="text-slate-400">—</span>)}</td>
                  <td>{c._count.memberships}</td>
                  <td>{c._count.events}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      {c.featured && <Star className="size-4 fill-gold-400 text-gold-400" aria-label="Featured" />}
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      {c.status === "PENDING" && (
                        <>
                          <ConfirmAction action={approveClubAction} fields={{ clubId: c.id }} tone="primary" className="btn btn-sm btn-primary" icon={<Check className="size-3.5" />} label="Approve" title={`Approve ${c.name}?`} message={c.proposedBy ? `${c.proposedBy.name} will become the representative of this club.` : "The club will appear on the public site."} confirmLabel="Approve" />
                          <ConfirmAction action={rejectClubAction} fields={{ clubId: c.id }} icon={<X className="size-3.5" />} label="Reject" title={`Reject ${c.name}?`} message="The proposer will be notified." confirmLabel="Reject">
                            <label className="label" htmlFor={`reason-${c.id}`}>Reason (optional)</label>
                            <textarea id={`reason-${c.id}`} name="reason" rows={2} className="input" placeholder="e.g. A similar club already exists." />
                          </ConfirmAction>
                        </>
                      )}
                      {(c.status === "SUSPENDED" || c.status === "REJECTED") && (
                        <ConfirmAction action={approveClubAction} fields={{ clubId: c.id }} tone="primary" className="btn btn-sm btn-outline" icon={<RotateCcw className="size-3.5" />} label="Reactivate" title={`Reactivate ${c.name}?`} message="The club will be visible on the public site again." confirmLabel="Reactivate" />
                      )}
                      {c.status === "APPROVED" && (
                        <>
                          <QuickAction action={toggleClubFeaturedAction} fields={{ clubId: c.id }} title={c.featured ? "Remove from featured" : "Feature on home page"} className={cn("btn btn-sm", c.featured ? "bg-gold-50 text-gold-700 ring-1 ring-gold-200" : "btn-outline")}>
                            <Star className={cn("size-3.5", c.featured && "fill-gold-400")} />
                          </QuickAction>
                          <ConfirmAction action={suspendClubAction} fields={{ clubId: c.id }} className="btn btn-sm btn-outline" icon={<Ban className="size-3.5" />} title={`Suspend ${c.name}?`} message="The club and its events will be hidden from the public site until reactivated." confirmLabel="Suspend" />
                        </>
                      )}
                      <Link href={`/admin/clubs/${c.id}/edit`} className="btn btn-sm btn-outline" aria-label={`Edit ${c.name}`}><Pencil className="size-3.5" /></Link>
                      <ConfirmAction action={deleteClubAction} fields={{ clubId: c.id }} icon={<Trash2 className="size-3.5" />} title={`Delete ${c.name}?`} message="This permanently deletes the club with all its memberships, events, registrations and announcements. This cannot be undone." confirmLabel="Delete club" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Building2} title="No clubs found" />
      )}
      <Pagination page={page} totalPages={Math.ceil(total / TABLE_PAGE_SIZE)} basePath="/admin/clubs" params={{ q, status, category }} />
    </>
  );
}
