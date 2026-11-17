import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { flag, getSettings } from "@/lib/settings";
import { ROLE_HOME } from "@/lib/constants";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Student Registration" };

export default async function RegisterPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  if (user) redirect(ROLE_HOME[user.role] ?? "/");
  return (
    <>
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 mb-8 text-slate-500">Student registration for {settings.universityName}.</p>
      {flag(settings.allowRegistration) ? (
        <RegisterForm />
      ) : (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 text-sm text-gold-700">
          New registrations are temporarily closed. Please contact {settings.contactEmail}.{" "}
          <Link href="/login" className="font-semibold underline">Log in</Link> if you already have an account.
        </div>
      )}
    </>
  );
}
