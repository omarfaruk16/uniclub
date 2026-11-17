import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { shellData } from "@/lib/shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["STUDENT", "REP"], "/student/dashboard");
  const [settings, shell] = await Promise.all([getSettings(), shellData(user.id)]);
  return (
    <DashboardShell area="student" user={user} siteName={settings.siteName} notifications={shell.notifications} unread={shell.unread}>
      {children}
    </DashboardShell>
  );
}
