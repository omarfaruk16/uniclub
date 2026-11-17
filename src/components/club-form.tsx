"use client";

import Link from "next/link";
import { ActionForm, SubmitButton } from "./action-form";
import { ImageInput } from "./image-input";
import { Field } from "./ui";
import { CLUB_CATEGORIES } from "@/lib/constants";
import type { ActionResult } from "@/lib/action";

type ClubDefaults = {
  id?: string;
  name?: string;
  category?: string;
  shortDescription?: string;
  description?: string;
  objectives?: string;
  email?: string | null;
  foundedYear?: number | null;
  logo?: string | null;
  cover?: string | null;
  repId?: string | null;
};

/** Club profile form shared by the representative (own club) and the administrator. */
export function ClubForm({
  action,
  defaults = {},
  reps,
  cancelHref,
  submitLabel = "Save changes",
}: {
  action: (p: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  defaults?: ClubDefaults;
  reps?: { id: string; label: string }[];
  cancelHref?: string;
  submitLabel?: string;
}) {
  return (
    <ActionForm action={action} className="space-y-6">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <div className="card grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
        <ImageInput name="logo" label="Logo" current={defaults.logo} round />
        <ImageInput name="cover" label="Cover image" current={defaults.cover} aspect="aspect-[16/5]" />
      </div>
      <div className="card space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Club name" name="name" required>
            <input id="name" name="name" defaultValue={defaults.name} className="input" />
          </Field>
          <Field label="Category" name="category" required>
            <select id="category" name="category" defaultValue={defaults.category ?? ""} className="input">
              <option value="" disabled>Choose a category</option>
              {CLUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Short description" name="shortDescription" required hint="Shown on club cards (max 160 characters).">
          <input id="shortDescription" name="shortDescription" maxLength={160} defaultValue={defaults.shortDescription} className="input" />
        </Field>
        <Field label="Full description" name="description" required>
          <textarea id="description" name="description" rows={5} defaultValue={defaults.description} className="input" />
        </Field>
        <Field label="Objectives" name="objectives" hint="One objective per line.">
          <textarea id="objectives" name="objectives" rows={4} defaultValue={defaults.objectives} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" name="email">
            <input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} className="input" placeholder="club@unique.edu" />
          </Field>
          {reps ? (
            <Field label="Representative" name="repId" hint="Optional. You can also assign later from Representatives.">
              <select id="repId" name="repId" defaultValue={defaults.repId ?? ""} className="input">
                <option value="">No representative</option>
                {reps.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Founded year" name="foundedYear">
              <input id="foundedYear" name="foundedYear" type="number" min={1900} defaultValue={defaults.foundedYear ?? ""} className="input" />
            </Field>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {cancelHref && <Link href={cancelHref} className="btn btn-outline">Cancel</Link>}
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
