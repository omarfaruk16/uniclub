"use client";

import Link from "next/link";
import { ActionForm, FieldError, FormMessage, SubmitButton } from "@/components/action-form";
import { registerAction } from "@/app/actions/auth";

const FIELDS = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name", placeholder: "e.g. Nusrat Jahan" },
  { name: "studentId", label: "Student ID", type: "text", autoComplete: "off", placeholder: "e.g. 2211077108" },
  { name: "email", label: "University email", type: "email", autoComplete: "email", placeholder: "you@unique.edu" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "At least 8 characters, letters and numbers" },
  { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password", placeholder: "Type your password again" },
];

export function RegisterForm() {
  return (
    <ActionForm action={registerAction} showToast={false} className="space-y-4">
      <FormMessage />
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="label">{f.label}</label>
          <input id={f.name} name={f.name} type={f.type} autoComplete={f.autoComplete} placeholder={f.placeholder} className="input" required />
          <FieldError name={f.name} />
        </div>
      ))}
      <SubmitButton className="btn-lg mt-2 w-full" pendingText="Creating account…">Register</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Already registered? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
      </p>
    </ActionForm>
  );
}
