"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Eye, EyeOff, GraduationCap, ShieldCheck, Building2 } from "lucide-react";
import { ActionForm, FieldError, FormMessage, SubmitButton } from "@/components/action-form";
import { loginAction } from "@/app/actions/auth";

const DEMO = [
  { label: "Student", email: "student@unique.edu", password: "Student@123", icon: GraduationCap },
  { label: "Club Rep", email: "rep@unique.edu", password: "Rep@12345", icon: Building2 },
  { label: "Admin", email: "admin@unique.edu", password: "Admin@123", icon: ShieldCheck },
];

export function LoginForm({ next, demo }: { next: string; demo: boolean }) {
  const [show, setShow] = useState(false);
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  return (
    <ActionForm action={loginAction} showToast={false} className="space-y-5">
      <FormMessage />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email address</label>
        <input ref={email} id="email" name="email" type="email" autoComplete="email" placeholder="you@unique.edu" className="input" required />
        <FieldError name="email" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
          <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <div className="relative">
          <input ref={password} id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className="input pr-11" required />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FieldError name="password" />
      </div>
      <SubmitButton className="btn-lg w-full" pendingText="Signing in…">Log in</SubmitButton>

      {demo && (
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-line" /> or try a demo account <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {DEMO.map(({ label, email: e, password: p, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (email.current) email.current.value = e;
                  if (password.current) password.current.value = p;
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand-50 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="pt-2 text-center text-sm text-slate-500">
        New to UniQue? <Link href="/register" className="font-semibold text-brand-600 hover:underline">Create a student account</Link>
      </p>
    </ActionForm>
  );
}
