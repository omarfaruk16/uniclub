import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const reset = token ? await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { select: { email: true } } } }) : null;
  const valid = reset && !reset.usedAt && reset.expiresAt > new Date();
  return (
    <>
      <h1>Set a new password</h1>
      {valid ? (
        <>
          <p className="mt-2 mb-8 text-slate-500">For {reset.user.email}</p>
          <ResetForm token={token} />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="font-semibold underline">Request a new one</Link>.
        </div>
      )}
    </>
  );
}
