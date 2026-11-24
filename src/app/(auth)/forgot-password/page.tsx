import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1>Forgot your password?</h1>
      <p className="mt-2 mb-8 text-slate-500">Enter your account email and we&apos;ll send you a link to reset it.</p>
      <ForgotForm />
    </>
  );
}
