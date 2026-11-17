import Link from "next/link";
import { Bell, CalendarDays, CheckCircle2, Info, Megaphone, Trash2, TriangleAlert, Check } from "lucide-react";
import { db } from "@/lib/db";
import { QuickAction } from "./confirm";
import { EmptyState, PageHeader } from "./ui";
import { Pagination } from "./pagination";
import { deleteNotificationAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/student";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

const ICON = { info: Info, success: CheckCircle2, warning: TriangleAlert, event: CalendarDays, announcement: Megaphone } as const;
const TONE = {
  info: "bg-sky-50 text-sky-600",
  success: "bg-brand-50 text-brand-600",
  warning: "bg-gold-50 text-gold-600",
  event: "bg-violet-50 text-violet-600",
  announcement: "bg-rose-50 text-rose-600",
} as const;
const PER = 15;

export async function NotificationsList({ userId, basePath, page, filter }: { userId: string; basePath: string; page: number; filter: string }) {
  const where = { userId, ...(filter === "unread" ? { read: false } : {}) };
  const [items, total, unread] = await Promise.all([
    db.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId, read: false } }),
  ]);
  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `You have ${unread} unread ${unread === 1 ? "notification" : "notifications"}.` : "You're all caught up."}
        actions={unread > 0 && (
          <QuickAction action={markAllNotificationsReadAction} fields={{}} className="btn btn-outline">
            <Check className="size-4" /> Mark all as read
          </QuickAction>
        )}
      />
      <div className="mb-4 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {[["all", "All"], ["unread", `Unread (${unread})`]].map(([v, l]) => (
          <Link key={v} href={v === "all" ? basePath : `${basePath}?filter=unread`} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", filter === v || (v === "all" && filter !== "unread") ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-brand-50")}>
            {l}
          </Link>
        ))}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Bell} title={filter === "unread" ? "No unread notifications" : "No notifications yet"} description="Updates about your clubs, events and announcements will appear here." />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {items.map((n) => {
            const type = (n.type in ICON ? n.type : "info") as keyof typeof ICON;
            const Icon = ICON[type];
            return (
              <li key={n.id} className={cn("flex gap-4 p-4 sm:p-5", !n.read && "bg-gold-50/30")}>
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONE[type])}><Icon className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className={cn("text-sm text-slate-900", !n.read && "font-semibold")}>{n.title}</p>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold-400" aria-label="Unread" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-400" title={formatDateTime(n.createdAt)}>{timeAgo(n.createdAt)}</span>
                    {n.link && <Link href={n.link} className="font-semibold text-brand-600 hover:underline">Open</Link>}
                    {!n.read && (
                      <QuickAction action={markNotificationReadAction} fields={{ id: n.id }} className="font-semibold text-slate-500 hover:text-brand-600">
                        Mark as read
                      </QuickAction>
                    )}
                  </div>
                </div>
                <QuickAction action={deleteNotificationAction} fields={{ id: n.id }} title="Delete notification" className="self-start rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="size-4" />
                </QuickAction>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / PER)} basePath={basePath} params={{ filter: filter === "unread" ? "unread" : "" }} />
    </>
  );
}
