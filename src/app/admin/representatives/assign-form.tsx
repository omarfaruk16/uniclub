"use client";

import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field } from "@/components/ui";
import { assignRepAction } from "@/app/actions/admin";

type Opt = { id: string; label: string };

export function AssignRepForm({ clubs, users }: { clubs: Opt[]; users: Opt[] }) {
  return (
    <ActionForm action={assignRepAction} resetOnSuccess className="space-y-4">
      <Field label="Club" name="clubId" required>
        <select id="clubId" name="clubId" defaultValue="" className="input">
          <option value="" disabled>Choose a club</option>
          {clubs.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Student" name="userId" required>
        <select id="userId" name="userId" defaultValue="" className="input">
          <option value="" disabled>Choose a student</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </Field>
      <p className="text-xs text-slate-500">
        The student becomes a club representative and the club&apos;s President. A previous representative of this club goes back to a student account.
        A representative already managing another club is moved to this one.
      </p>
      <SubmitButton className="w-full" pendingText="Assigning…">Assign representative</SubmitButton>
    </ActionForm>
  );
}
