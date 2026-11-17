import { DashboardShell } from "@/components/dashboard-shell";
import { getRepClub, requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { shellData } from "@/lib/shell";

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["REP"], "/club/dashboard");
  const [settings, shell, club] = await Promise.all([getSettings(), shellData(user.id), getRepClub(user.id)]);
  return (
    <DashboardShell area="club" user={user} siteName={settings.siteName} club={club} notifications={shell.notifications} unread={shell.unread}>
      {children}
    </DashboardShell>
  );
}
