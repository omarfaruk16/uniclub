import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ConfirmAction } from "@/components/confirm";
import { ProposeClubButton } from "@/components/propose-club";
import { Badge, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ClubLogo, Cover } from "@/components/visuals";
import { leaveClubAction } from "@/app/actions/student";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Clubs" };

export default async function MyClubsPage() {
  const user = await requireUser();
  const [memberships, proposals, managed] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { club: { include: { _count: { select: { memberships: { where: { status: "APPROVED" } } } } } } },
    }),
    db.club.findMany({ where: { proposedById: user.id }, orderBy: { createdAt: "desc" } }),
    db.club.findUnique({ where: { repId: user.id }, select: { id: true } }),
  ]);
  const visible = memberships.filter((m) => m.club.status === "APPROVED" || m.club.id === managed?.id);

  return (
    <>
      <PageHeader
        title="My Clubs"
        description="Clubs you belong to and requests waiting for approval."
        actions={
          <>
            <Link href="/clubs" className="btn btn-outline">Explore clubs</Link>
            {user.role === "STUDENT" && <ProposeClubButton />}
          </>
        }
      />

      {visible.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <article key={m.id} className="card flex flex-col overflow-hidden">
              <Cover kind="club" src={m.club.cover} seed={m.club.name} category={m.club.category} className="h-20" iconSize="size-10" />
              <div className="flex flex-1 flex-col px-5 pb-5">
                <div className="-mt-7 mb-3 flex items-end justify-between">
                  <ClubLogo name={m.club.name} src={m.club.logo} category={m.club.category} size={54} className="ring-4 ring-white" />
                  <StatusBadge status={m.status} label={m.status === "APPROVED" ? "Member" : m.status === "PENDING" ? "Awaiting approval" : "Not accepted"} />
                </div>
                <Link href={`/clubs/${m.club.slug}`} className="font-display font-semibold text-slate-900 hover:text-brand-700">{m.club.name}</Link>
                <p className="mt-0.5 text-sm text-slate-500">{m.club.category} · {m.club._count.memberships} members</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {m.status === "APPROVED" && <Badge tone="green">{m.position}</Badge>}
                  <span>{m.status === "APPROVED" ? "Joined" : "Requested"} {formatDate(m.createdAt)}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <Link href={`/clubs/${m.club.slug}`} className="text-sm font-semibold text-brand-600 hover:underline">View club</Link>
                  {m.club.id !== managed?.id && (
                    <ConfirmAction
                      action={leaveClubAction}
                      fields={{ clubId: m.clubId }}
                      label={m.status === "PENDING" ? "Withdraw" : m.status === "REJECTED" ? "Dismiss" : "Leave"}
                      title={m.status === "PENDING" ? "Withdraw request?" : m.status === "REJECTED" ? "Remove this entry?" : `Leave ${m.club.name}?`}
                      message={m.status === "APPROVED" ? "You'll stop receiving this club's announcements and lose access to members-only events." : "You can request to join again later."}
                      confirmLabel={m.status === "APPROVED" ? "Leave club" : "Confirm"}
                    />
                  )}
                  {m.club.id === managed?.id && <Link href="/club/dashboard" className="btn btn-sm btn-primary">Manage club</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="You haven't joined any clubs yet" description="Explore clubs and send a membership request." action={<Link href="/clubs" className="btn btn-primary">Explore clubs</Link>} />
      )}

      {proposals.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">My club proposals</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Club</th><th>Category</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-slate-900">{p.name}{p.rejectionReason && <p className="text-xs font-normal text-red-600">{p.rejectionReason}</p>}</td>
                    <td>{p.category}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td><StatusBadge status={p.status} label={p.status === "PENDING" ? "Under review" : undefined} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
