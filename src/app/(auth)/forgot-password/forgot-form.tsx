"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ActionForm, FieldError, FormMessage, SubmitButton, useFormCtx } from "@/components/action-form";
import { forgotPasswordAction } from "@/app/actions/auth";

export function ForgotForm() {
  return (
    <ActionForm action={forgotPasswordAction} showToast={false} className="space-y-5">
      <Result />
    </ActionForm>
  );
}

function Result() {
  const ctx = useFormCtx();
  const state = ctx?.state;
  if (state?.ok)
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-800">
          <MailCheck className="size-5 shrink-0" />
          <p>{state.message}</p>
        </div>
        {state.data?.link && (
          <div className="rounded-2xl border border-dashed border-gold-300 bg-gold-50 p-4 text-sm text-gold-700">
            <p className="font-semibold">Demo mode: no email service is configured.</p>
            <p className="mt-1">Use this link to reset the password:</p>
            <Link href={state.data.link} className="mt-2 inline-block font-semibold break-all text-brand-700 underline">Open reset link →</Link>
          </div>
        )}
        <Link href="/login" className="btn btn-outline w-full">Back to log in</Link>
      </div>
    );
  return (
    <>
      <FormMessage />
      <div>
        <label htmlFor="email" className="label">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@unique.edu" className="input" required />
        <FieldError name="email" />
      </div>
      <SubmitButton className="btn-lg w-full" pendingText="Sending…">Send reset link</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Remembered it? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
      </p>
    </>
  );
}
