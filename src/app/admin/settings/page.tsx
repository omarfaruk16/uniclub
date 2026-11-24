import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSettings, googleReady } from "@/lib/settings";
import { googleRedirectUri, publicOrigin } from "@/lib/google";
import { Badge, Card, PageHeader } from "@/components/ui";
import { PasswordForm, ProfileForm } from "@/components/profile-forms";
import { SystemSettingsForm } from "./system-form";
import { GoogleSettingsForm } from "./google-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, settings, origin, redirectUri] = await Promise.all([requireRole(["ADMIN"]), getSettings(), publicOrigin(), googleRedirectUri()]);
  // The Google client secret never leaves the server.
  const { googleClientSecret, ...general } = settings;
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile and platform-wide preferences."
        actions={<Link href="/admin/appearance" className="btn btn-outline"><ImageIcon className="size-4" /> Logo, images &amp; ads</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Card title="Profile information"><ProfileForm user={user} /></Card>
          <Card title="Change password"><PasswordForm /></Card>
          <Card title="System preferences"><SystemSettingsForm settings={general} /></Card>
        </div>
        <Card
          className="h-fit"
          title="Google sign-in"
          subtitle="Let students and staff log in with their Google account."
          actions={googleReady(settings) ? <Badge tone="green" dot>On</Badge> : <Badge tone="slate" dot>Off</Badge>}
        >
          <GoogleSettingsForm
            enabled={settings.googleEnabled === "true"}
            clientId={settings.googleClientId}
            hasSecret={Boolean(googleClientSecret)}
            domain={settings.googleAllowedDomain}
            redirectUri={redirectUri}
            origin={origin}
          />
        </Card>
      </div>
    </>
  );
}
