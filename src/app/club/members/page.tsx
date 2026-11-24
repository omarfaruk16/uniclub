import type { Metadata } from "next";
import Link from "next/link";
import { Check, Users, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireRepClub } from "@/lib/rep";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Avatar } from "@/components/visuals";
import { ConfirmAction, QuickAction } from "@/components/confirm";
import { Filters } from "@/components/filters";
import { PositionEditor } from "./position-editor";
import { approveMemberAction, rejectMemberAction, removeMemberAction } from "@/app/actions/club";
import { cn, formatDate, strParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, club } = await requireRepClub();
  const sp = await searchParams;
  const tab = strParam(sp.tab) === "pending" ? "PENDING" : "APPROVED";
  const q = strParam(sp.q);
  const [counts, members] = await Promise.all([
    db.membership.groupBy({ by: ["status"], where: { clubId: club.id }, _count: true }),
    db.membership.findMany({
      where: {
        clubId: club.id,
        status: tab,
        ...(q ? { user: { OR: [{ name: { contains: q } }, { studentId: { contains: q } }, { email: { contains: q } }] } } : {}),
      },
      orderBy: tab === "PENDING" ? { createdAt: "asc" } : [{ position: "asc" }, { createdAt: "asc" }],
      include: { user: true },
    }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Members" description={`Manage who belongs to ${club.name}.`} />
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-line bg-white p-1">
        {[["APPROVED", "Members", ""], ["PENDING", "Pending requests", "pending"]].map(([s, l, v]) => (
          <Link key={s} href={v ? `/club/members?tab=${v}` : "/club/members"} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", tab === s ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100")}>
            {l} ({count(s!)})
          </Link>
        ))}
      </div>
      <Filters placeholder="Search by name, student ID or email…" />
      {members.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Student ID</th><th>Department</th><th>{tab === "PENDING" ? "Requested" : "Position"}</th><th>{tab === "PENDING" ? "Status" : "Joined"}</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.user.name} src={m.user.avatar} size={36} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{m.user.name}{m.userId === user.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</p>
                        <p className="text-xs text-slate-500">{m.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{m.user.studentId ?? "—"}</td>
                  <td>{m.user.department ?? "—"}</td>
                  <td>{tab === "PENDING" ? formatDate(m.createdAt) : <PositionEditor membershipId={m.id} position={m.position} disabled={m.userId === user.id} />}</td>
                  <td>{tab === "PENDING" ? <StatusBadge status="PENDING" /> : formatDate(m.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {tab === "PENDING" ? (
                        <>
                          <QuickAction action={approveMemberAction} fields={{ membershipId: m.id }} className="btn btn-sm btn-primary"><Check className="size-3.5" /> Approve</QuickAction>
                          <QuickAction action={rejectMemberAction} fields={{ membershipId: m.id }} className="btn btn-sm btn-danger-outline"><X className="size-3.5" /> Decline</QuickAction>
                        </>
                      ) : m.userId !== user.id ? (
                        <ConfirmAction
                          action={removeMemberAction}
                          fields={{ membershipId: m.id }}
                          label="Remove"
                          title="Remove member?"
                          message={`${m.user.name} will be removed from ${club.name} and notified.`}
                          confirmLabel="Remove member"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title={tab === "PENDING" ? "No pending requests" : q ? "No members match your search" : "No members yet"} />
      )}
    </>
  );
}
