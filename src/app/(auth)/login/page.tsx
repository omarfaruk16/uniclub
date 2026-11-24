import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { LoginForm } from "./login-form";
import { GoogleButton, GOOGLE_ERRORS } from "@/components/google-button";
import { getSettings, googleReady } from "@/lib/settings";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");
  const [{ next, error }, settings] = await Promise.all([searchParams, getSettings()]);
  const message = error ? GOOGLE_ERRORS[error] : undefined;
  return (
    <>
      <h1>Welcome back</h1>
      <p className="mt-2 mb-8 text-slate-500">Log in to join clubs, register for events and follow campus news.</p>
      {message && <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
      {googleReady(settings) && <GoogleButton next={next ?? ""} />}
      <LoginForm next={next ?? ""} demo={process.env.DEMO_MODE === "true"} />
    </>
  );
}
