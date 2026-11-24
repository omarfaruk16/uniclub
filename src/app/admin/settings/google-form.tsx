"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { Field } from "@/components/ui";
import { saveGoogleSettingsAction } from "@/app/actions/admin";

type Props = { enabled: boolean; clientId: string; hasSecret: boolean; domain: string; redirectUri: string; origin: string };

export function GoogleSettingsForm({ enabled, clientId, hasSecret, domain, redirectUri, origin }: Props) {
  const [clear, setClear] = useState(false);
  return (
    <ActionForm action={saveGoogleSettingsAction} className="space-y-4">
      <ol className="space-y-2 rounded-xl border border-line bg-slate-50/70 p-4 text-sm text-slate-600">
        <li>
          1. Open{" "}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
            Google Cloud → Credentials <ExternalLink className="size-3" />
          </a>{" "}
          and create an <strong>OAuth client ID</strong> of type <strong>Web application</strong>.
        </li>
        <li>2. Add these two values to the client, then paste its ID and secret below.</li>
        <CopyRow label="Authorised JavaScript origin" value={origin} />
        <CopyRow label="Authorised redirect URI" value={redirectUri} />
      </ol>

      <Field label="Client ID" name="googleClientId">
        <input id="googleClientId" name="googleClientId" defaultValue={clientId} placeholder="1234567890-abc.apps.googleusercontent.com" className="input font-mono text-[13px]" autoComplete="off" spellCheck={false} />
      </Field>
      <div>
        <label htmlFor="googleClientSecret" className="label">Client secret</label>
        <input
          id="googleClientSecret"
          name="googleClientSecret"
          type="password"
          placeholder={hasSecret && !clear ? "Saved. Leave empty to keep it" : "GOCSPX-…"}
          className="input font-mono text-[13px]"
          autoComplete="new-password"
          spellCheck={false}
        />
        <p className="hint">
          {hasSecret ? "The saved secret is never shown again. " : "Stored on the server only. "}
          {hasSecret && (
            <button type="button" onClick={() => setClear((c) => !c)} className="font-semibold text-red-600 hover:underline">
              {clear ? "Keep saved secret" : "Remove saved secret"}
            </button>
          )}
        </p>
        {clear && <input type="hidden" name="clearSecret" value="1" />}
        <FieldError name="googleClientSecret" />
      </div>
      <Field label="Allowed email domain (optional)" name="googleAllowedDomain" hint="For example unique.edu. Only Google accounts on this domain can sign in. Leave empty to allow any Google account.">
        <input id="googleAllowedDomain" name="googleAllowedDomain" defaultValue={domain} placeholder="unique.edu" className="input" />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
        <input type="checkbox" name="googleEnabled" defaultChecked={enabled} className="peer sr-only" />
        <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
        <span>
          <span className="block text-sm font-medium text-slate-800">Show “Continue with Google” on the log-in and register pages</span>
          <span className="text-xs text-slate-500">Existing accounts are matched by email. New Google users get a student account (when student registration is allowed).</span>
        </span>
      </label>
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save Google settings</SubmitButton>
      </div>
    </ActionForm>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="rounded-lg border border-line bg-white p-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-[13px] text-slate-900">{value}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Check className="size-3.5 text-brand-600" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </li>
  );
}
