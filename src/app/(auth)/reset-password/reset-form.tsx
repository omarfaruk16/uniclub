"use client";

import { ActionForm, FieldError, FormMessage, SubmitButton } from "@/components/action-form";
import { resetPasswordAction } from "@/app/actions/auth";

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetPasswordAction} showToast={false} className="space-y-4">
      <FormMessage />
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" placeholder="At least 8 characters, letters and numbers" />
        <FieldError name="password" />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" />
        <FieldError name="confirm" />
      </div>
      <SubmitButton className="btn-lg w-full" pendingText="Saving…">Update password</SubmitButton>
    </ActionForm>
  );
}
