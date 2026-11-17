"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { ActionForm, SubmitButton, useFormCtx } from "./action-form";
import { Modal } from "./modal";
import { Field } from "./ui";
import { createUserAction, setUserRoleAction } from "@/app/actions/admin";

/** Role dropdown that saves as soon as it changes. */
export function RoleSelect({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  return (
    <ActionForm action={setUserRoleAction}>
      <input type="hidden" name="userId" value={userId} />
      <RoleSelectInner role={role} disabled={disabled} />
    </ActionForm>
  );
}

function RoleSelectInner({ role, disabled }: { role: string; disabled?: boolean }) {
  const ctx = useFormCtx();
  if (role === "REP")
    return <span className="text-xs text-slate-500">Club Rep <span className="text-slate-400">(via Representatives)</span></span>;
  return (
    <select
      name="role"
      defaultValue={role}
      disabled={disabled || ctx?.pending}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="input w-36 py-1.5 text-xs"
      aria-label="Role"
    >
      <option value="STUDENT">Student</option>
      <option value="ADMIN">Administrator</option>
    </select>
  );
}

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><UserPlus className="size-4" /> Add user</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a user">
        <ActionForm action={createUserAction} resetOnSuccess onSuccess={() => setOpen(false)} className="space-y-4">
          <Field label="Full name" name="name" required><input id="name" name="name" className="input" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" required><input id="email" name="email" type="email" className="input" /></Field>
            <Field label="Student ID" name="studentId" hint="Required for students."><input id="studentId" name="studentId" className="input" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" name="role" required>
              <select id="role" name="role" className="input" defaultValue="STUDENT">
                <option value="STUDENT">Student</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </Field>
            <Field label="Temporary password" name="password" required hint="At least 8 characters."><input id="password" name="password" type="text" className="input" /></Field>
          </div>
          <p className="text-xs text-slate-500">To make someone a club representative, add them as a student and assign them from Representatives.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <SubmitButton pendingText="Adding…">Add user</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
