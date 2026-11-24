import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");
  const { next } = await searchParams;
  return (
    <>
      <h1>Welcome back</h1>
      <p className="mt-2 mb-8 text-slate-500">Log in to join clubs, register for events and follow campus news.</p>
      <LoginForm next={next ?? ""} demo={process.env.DEMO_MODE === "true"} />
    </>
  );
}
