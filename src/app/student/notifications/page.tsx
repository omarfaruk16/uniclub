import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications-list";
import { pageParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return <NotificationsList userId={user.id} basePath="/student/notifications" page={pageParam(sp.page)} filter={sp.filter ?? "all"} />;
}
