import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { Avatar } from "@/components/visuals";
import { PasswordForm, ProfileForm } from "@/components/profile-forms";
import { formatDate } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [clubs, events, attended] = await Promise.all([
    db.membership.count({ where: { userId: user.id, status: "APPROVED" } }),
    db.registration.count({ where: { userId: user.id, status: "REGISTERED" } }),
    db.registration.count({ where: { userId: user.id, attendance: "ATTENDED" } }),
  ]);
  return (
    <>
      <PageHeader title="My Profile" description="Your personal information and account security." />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="card h-fit overflow-hidden text-center">
          <div className="h-20 bg-gradient-to-r from-brand-600 to-brand-800" />
          <div className="-mt-12 px-6 pb-6">
            <Avatar name={user.name} src={user.avatar} size={96} className="mx-auto ring-4" />
            <h2 className="mt-3 text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-2 flex justify-center gap-2"><StatusBadge status={user.role} label={ROLE_LABEL[user.role]} /></div>
            <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
              {[[clubs, "Clubs"], [events, "Events"], [attended, "Attended"]].map(([n, l]) => (
                <div key={l as string}>
                  <dd className="font-display text-xl font-bold text-slate-900">{n}</dd>
                  <dt className="text-xs text-slate-500">{l}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-5 space-y-1 rounded-xl bg-brand-50 p-3 text-left text-sm">
              <p><span className="text-slate-500">Student ID:</span> <span className="font-medium text-slate-800">{user.studentId ?? "—"}</span></p>
              <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{user.department ?? "—"}</span></p>
              <p><span className="text-slate-500">Member since:</span> <span className="font-medium text-slate-800">{formatDate(user.createdAt)}</span></p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <Card title="Edit profile"><ProfileForm user={user} /></Card>
          <Card title="Change password"><PasswordForm /></Card>
        </div>
      </div>
    </>
  );
}
