"use client";

import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field } from "@/components/ui";
import { saveSettingsAction } from "@/app/actions/admin";
import type { Settings } from "@/lib/settings";

type General = Omit<Settings, "googleClientSecret">;

export function SystemSettingsForm({ settings }: { settings: General }) {
  const text: [keyof General, string, string?][] = [
    ["siteName", "Platform name"],
    ["universityName", "University name"],
    ["tagline", "Tagline", "Shown in the footer and on sign-in pages."],
    ["contactEmail", "Contact email"],
    ["contactPhone", "Contact phone"],
    ["address", "Office address"],
  ];
  return (
    <ActionForm action={saveSettingsAction} className="space-y-4">
      {text.map(([key, label, hint]) => (
        <Field key={key} label={label} name={key} hint={hint}>
          <input id={key} name={key} defaultValue={settings[key]} className="input" />
        </Field>
      ))}
      <Field label="Events per page" name="eventsPerPage" hint="Number of events shown per page on the public events list.">
        <input id="eventsPerPage" name="eventsPerPage" type="number" min={3} max={48} defaultValue={settings.eventsPerPage} className="input w-32" />
      </Field>
      <div className="space-y-3 rounded-xl border border-line p-4">
        <Toggle name="allowRegistration" checked={settings.allowRegistration === "true"} label="Allow student self-registration" hint="When off, only administrators can create accounts." />
        <Toggle name="membershipApproval" checked={settings.membershipApproval === "true"} label="Require approval to join clubs" hint="When off, students join clubs instantly." />
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </ActionForm>
  );
}

function Toggle({ name, checked, label, hint }: { name: string; checked: boolean; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={checked} className="peer sr-only" />
      <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}
