"use client";

import { ActionForm, SubmitButton } from "./action-form";
import { ImageInput } from "./image-input";
import { Field } from "./ui";
import { changePasswordAction, updateProfileAction } from "@/app/actions/student";

type ProfileUser = { name: string; email: string; studentId: string | null; department: string | null; phone: string | null; bio: string | null; avatar: string | null };

export function ProfileForm({ user }: { user: ProfileUser }) {
  return (
    <ActionForm action={updateProfileAction} className="space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <ImageInput name="avatar" label="Profile picture" current={user.avatar} round />
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" required className="sm:col-span-2">
            <input id="name" name="name" defaultValue={user.name} className="input" />
          </Field>
          <Field label="Email" name="email" hint="Contact the administrator to change your email.">
            <input id="email" value={user.email} disabled className="input" readOnly />
          </Field>
          <Field label="Student ID" name="studentId" hint="Your student ID cannot be changed.">
            <input id="studentId" value={user.studentId ?? "—"} disabled className="input" readOnly />
          </Field>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Department" name="department">
          <input id="department" name="department" defaultValue={user.department ?? ""} className="input" placeholder="e.g. CSE" />
        </Field>
        <Field label="Phone" name="phone">
          <input id="phone" name="phone" defaultValue={user.phone ?? ""} className="input" placeholder="+880 1XXX-XXXXXX" />
        </Field>
      </div>
      <Field label="Short bio" name="bio" hint="Up to 300 characters.">
        <textarea id="bio" name="bio" rows={3} defaultValue={user.bio ?? ""} className="input" maxLength={300} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
      <Field label="Current password" name="current">
        <input id="current" name="current" type="password" autoComplete="current-password" className="input" />
      </Field>
      <Field label="New password" name="password" hint="At least 8 characters with letters and numbers.">
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" />
      </Field>
      <Field label="Confirm new password" name="confirm">
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" />
      </Field>
      <div className="flex justify-end">
        <SubmitButton variant="btn-outline" pendingText="Updating…">Change password</SubmitButton>
      </div>
    </ActionForm>
  );
}
