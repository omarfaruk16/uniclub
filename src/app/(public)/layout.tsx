import { PublicNav } from "@/components/public-nav";
import { Footer } from "@/components/footer";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ROLE_HOME } from "@/lib/constants";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <>
      <PublicNav
        siteName={settings.siteName}
        user={user ? { name: user.name, role: user.role, avatar: user.avatar, home: ROLE_HOME[user.role] ?? "/" } : null}
      />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
