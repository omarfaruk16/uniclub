import { DashboardShell } from "@/components/dashboard-shell";
import { getRepClub, requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { shellData } from "@/lib/shell";

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["REP"], "/club/dashboard");
  const [settings, club] = await Promise.all([getSettings(), getRepClub(user.id)]);
  const shell = await shellData(user.id, "club", club?.id);
  return (
    <DashboardShell area="club" user={user} siteName={settings.siteName} club={club ? { name: club.name, logo: club.logo, category: club.category, status: club.status, slug: club.slug } : null} notifications={shell.notifications} unread={shell.unread} badges={shell.badges}>
      {children}
    </DashboardShell>
  );
}
