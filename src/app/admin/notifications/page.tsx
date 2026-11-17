import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications-list";
import { pageParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const user = await requireRole(["ADMIN"]);
  const sp = await searchParams;
  return <NotificationsList userId={user.id} basePath="/admin/notifications" page={pageParam(sp.page)} filter={sp.filter ?? "all"} />;
}
