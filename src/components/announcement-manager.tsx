"use client";

import { useState } from "react";
import { Pencil, Pin, Plus, Trash2 } from "lucide-react";
import { Modal } from "./modal";
import { ActionForm, SubmitButton } from "./action-form";
import { ConfirmAction } from "./confirm";
import { Badge, EmptyState, Field } from "./ui";
import { deleteAnnouncementAction, saveAnnouncementAction } from "@/app/actions/club";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Item = { id: string; title: string; body: string; category: string; pinned: boolean; createdAt: Date | string; scope: string; author: string | null };

export function AnnouncementManager({ items, admin = false, audience }: { items: Item[]; admin?: boolean; audience: string }) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const start = (item: Item | null) => {
    setEditing(item);
    setOpen(true);
  };

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button className="btn btn-primary" onClick={() => start(null)}><Plus className="size-4" /> Create announcement</button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No announcements yet" description={`Announcements you post are shown to ${audience}.`} />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <article key={a.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone={a.category === "Urgent" ? "red" : "green"}>{a.category}</Badge>
                  <span className="text-xs text-slate-500">{a.scope}</span>
                  {a.pinned && <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-600"><Pin className="size-3" /> Pinned</span>}
                </div>
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.body}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(new Date(a.createdAt))}{a.author ? ` · by ${a.author}` : ""}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn btn-sm btn-outline" onClick={() => start(a)}><Pencil className="size-3.5" /> Edit</button>
                <ConfirmAction
                  action={deleteAnnouncementAction}
                  fields={{ id: a.id }}
                  icon={<Trash2 className="size-3.5" />}
                  label="Delete"
                  title="Delete announcement?"
                  message={`“${a.title}” will be removed for everyone. This cannot be undone.`}
                  confirmLabel="Delete"
                />
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit announcement" : "Create announcement"} size="lg">
        <ActionForm key={editing?.id ?? "new"} action={saveAnnouncementAction} onSuccess={() => setOpen(false)} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Title" name="title" required>
            <input id="title" name="title" defaultValue={editing?.title} className="input" />
          </Field>
          <Field label="Category" name="category" required>
            <select id="category" name="category" defaultValue={editing?.category ?? "General"} className="input">
              {ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Message" name="body" required>
            <textarea id="body" name="body" rows={6} defaultValue={editing?.body} className="input" />
          </Field>
          {admin && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="pinned" defaultChecked={editing?.pinned} className="size-4 accent-brand-600" /> Pin to the top of the announcements page
            </label>
          )}
          {!editing && <p className="text-xs text-slate-500">Publishing sends an in-app notification to {audience}.</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <SubmitButton pendingText="Saving…">{editing ? "Save changes" : "Publish"}</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
