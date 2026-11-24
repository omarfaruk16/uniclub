"use client";

import { useState } from "react";
import { Eye, EyeOff, ExternalLink, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { ActionForm, FieldError, SubmitButton } from "@/components/action-form";
import { ConfirmAction, QuickAction } from "@/components/confirm";
import { Badge, EmptyState, Field } from "@/components/ui";
import { ImageInput, MEDIA_ACCEPT } from "@/components/image-input";
import { deleteBannerAction, saveBannerAction, toggleBannerAction } from "@/app/actions/admin";

type Banner = { id: string; title: string; image: string; link: string | null; placement: string; active: boolean; sortOrder: number };
type Placement = { value: string; label: string };

export function BannerManager({ banners, placements }: { banners: Banner[]; placements: Placement[] }) {
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);
  const start = (b: Banner | null) => {
    setEditing(b);
    setOpen(true);
  };
  const placeLabel = (v: string) => placements.find((p) => p.value === v)?.label ?? v;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Wide images work best: <strong className="text-slate-700">1600 × 400 px</strong> (4 : 1). Several live banners in one place rotate automatically.</p>
        <button className="btn btn-primary shrink-0" onClick={() => start(null)}><Plus className="size-4" /> Add banner</button>
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={Megaphone} title="No banners yet" description="Add a promotional banner or sponsor ad and choose the page where it appears." action={<button className="btn btn-primary btn-sm" onClick={() => start(null)}>Add banner</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {banners.map((b) => (
            <article key={b.id} className="card flex flex-col p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt={b.title} className={`aspect-[4/1] w-full rounded-xl bg-slate-100 object-cover ${b.active ? "" : "opacity-50 grayscale"}`} />
              <div className="flex flex-1 flex-col gap-2 px-2 pt-3 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{b.title}</p>
                    <p className="truncate text-xs text-slate-500">{placeLabel(b.placement)} · order {b.sortOrder}</p>
                  </div>
                  {b.active ? <Badge tone="green" dot>Live</Badge> : <Badge tone="slate" dot>Hidden</Badge>}
                </div>
                {b.link && (
                  <a href={b.link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-brand-700 hover:underline">
                    <ExternalLink className="size-3 shrink-0" /> <span className="truncate">{b.link}</span>
                  </a>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <button className="btn btn-sm btn-outline" onClick={() => start(b)}><Pencil className="size-3.5" /> Edit</button>
                  <QuickAction action={toggleBannerAction} fields={{ id: b.id }} className="btn btn-sm btn-outline">
                    {b.active ? <><EyeOff className="size-3.5" /> Hide</> : <><Eye className="size-3.5" /> Show</>}
                  </QuickAction>
                  <ConfirmAction
                    action={deleteBannerAction}
                    fields={{ id: b.id }}
                    className="btn btn-sm btn-danger-outline"
                    icon={<Trash2 className="size-3.5" />}
                    label="Delete"
                    title="Delete banner?"
                    message={`“${b.title}” and its image will be removed. This cannot be undone.`}
                    confirmLabel="Delete"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit banner" : "Add banner"} size="lg">
        <ActionForm key={editing?.id ?? "new"} action={saveBannerAction} onSuccess={() => setOpen(false)} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div>
            <ImageInput name="image" label="Banner image" current={editing?.image} aspect="aspect-[4/1]" accept={MEDIA_ACCEPT} formats="1600 × 400 px · PNG, JPG, WEBP, AVIF, GIF or SVG · 5 MB" />
            <FieldError name="image" />
          </div>
          <Field label="Name" name="title" required hint="Only admins see this; it is also read out by screen readers.">
            <input id="title" name="title" defaultValue={editing?.title} className="input" placeholder="e.g. Spring Tech Fest sponsor" />
          </Field>
          <Field label="Link (optional)" name="link" hint="Where a click goes: https://sponsor.com or a page here such as /events.">
            <input id="link" name="link" defaultValue={editing?.link ?? ""} className="input" placeholder="https://" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Show on" name="placement" required>
              <select id="placement" name="placement" defaultValue={editing?.placement ?? placements[0]?.value} className="input">
                {placements.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Order" name="sortOrder" hint="Lower shows first.">
              <input id="sortOrder" name="sortOrder" type="number" min={0} max={999} defaultValue={editing?.sortOrder ?? 0} className="input" />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input type="checkbox" name="active" defaultChecked={editing?.active ?? true} className="size-4 accent-brand-600" /> Live on the site
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <SubmitButton pendingText="Saving…">{editing ? "Save changes" : "Add banner"}</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
