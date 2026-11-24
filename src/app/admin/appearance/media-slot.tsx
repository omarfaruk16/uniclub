"use client";

import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { ImageInput, MEDIA_ACCEPT } from "@/components/image-input";
import { saveMediaAction } from "@/app/actions/admin";

/** One replaceable site graphic: preview, upload/replace, reset to the built-in graphic. */
export function MediaSlot({ slot, label, hint, aspect, fallback, current }: { slot: string; label: string; hint: string; aspect: string; fallback: string; current: string }) {
  const contain = slot === "logo" || slot === "favicon";
  return (
    <ActionForm action={saveMediaAction} className="card flex flex-col p-4">
      <input type="hidden" name="slot" value={slot} />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${current ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
          {current ? "Custom" : "Built-in"}
        </span>
      </div>
      <div className={contain ? "mx-auto w-36" : ""}>
        <ImageInput
          key={current}
          name="image"
          label={label}
          hideLabel
          current={current || null}
          aspect={aspect}
          accept={MEDIA_ACCEPT}
          formats="PNG, JPG, WEBP, AVIF, GIF, SVG or ICO · 5 MB"
          fit={contain ? "contain" : "cover"}
        />
      </div>
      <FieldError name="image" />
      {!current && <p className="mt-2 text-xs text-slate-400">Now showing: {fallback}</p>}
      <div className="mt-auto flex justify-end pt-3">
        <SubmitButton className="btn-sm" pendingText="Saving…">Save</SubmitButton>
      </div>
    </ActionForm>
  );
}
