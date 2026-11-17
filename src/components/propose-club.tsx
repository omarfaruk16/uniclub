"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./modal";
import { ActionForm, SubmitButton } from "./action-form";
import { Field } from "./ui";
import { proposeClubAction } from "@/app/actions/student";
import { CLUB_CATEGORIES } from "@/lib/constants";

export function ProposeClubButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Propose a new club
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Propose a new club" size="lg">
        <p className="mb-5 text-sm text-slate-500">
          The Student Affairs Office reviews every proposal. If it&apos;s approved you become the club&apos;s representative.
        </p>
        <ActionForm action={proposeClubAction} resetOnSuccess onSuccess={() => setOpen(false)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Club name" name="name" required>
              <input id="name" name="name" className="input" placeholder="e.g. Science & Astronomy Club" />
            </Field>
            <Field label="Category" name="category" required>
              <select id="category" name="category" className="input" defaultValue="">
                <option value="" disabled>Choose a category</option>
                {CLUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="One-line summary" name="shortDescription" required>
            <input id="shortDescription" name="shortDescription" className="input" maxLength={160} placeholder="What is the club about, in one sentence?" />
          </Field>
          <Field label="Description" name="description" required>
            <textarea id="description" name="description" rows={4} className="input" placeholder="What will the club do? Who is it for?" />
          </Field>
          <Field label="Objectives" name="objectives" hint="One objective per line.">
            <textarea id="objectives" name="objectives" rows={3} className="input" placeholder={"Hold monthly meetups\nRun a yearly competition"} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <SubmitButton pendingText="Submitting…">Submit proposal</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
