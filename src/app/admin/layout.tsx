import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { shellData } from "@/lib/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ADMIN"], "/admin/dashboard");
  const [settings, shell] = await Promise.all([getSettings(), shellData(user.id, "admin")]);
  return (
    <DashboardShell area="admin" user={user} siteName={settings.siteName} notifications={shell.notifications} unread={shell.unread} badges={shell.badges}>
      {children}
    </DashboardShell>
  );
}
