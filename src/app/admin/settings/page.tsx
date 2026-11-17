import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import { PasswordForm, ProfileForm } from "@/components/profile-forms";
import { SystemSettingsForm } from "./system-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([requireRole(["ADMIN"]), getSettings()]);
  return (
    <>
      <PageHeader title="Settings" description="Your profile and platform-wide preferences." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card title="Profile information"><ProfileForm user={user} /></Card>
          <Card title="Change password"><PasswordForm /></Card>
        </div>
        <Card title="System preferences" className="h-fit"><SystemSettingsForm settings={settings} /></Card>
      </div>
    </>
  );
}
