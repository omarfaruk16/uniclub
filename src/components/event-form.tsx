"use client";

import Link from "next/link";
import { ActionForm, SubmitButton } from "./action-form";
import { ImageInput } from "./image-input";
import { Field } from "./ui";
import { saveEventAction } from "@/app/actions/club";
import { EVENT_CATEGORIES } from "@/lib/constants";

export type EventDefaults = {
  id?: string;
  title?: string;
  category?: string;
  description?: string;
  venue?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  capacity?: number | null;
  membersOnly?: boolean;
  image?: string | null;
  status?: string;
};

export function EventForm({ defaults = {}, today }: { defaults?: EventDefaults; today: string }) {
  const editing = !!defaults.id;
  const published = defaults.status === "PUBLISHED";
  return (
    <ActionForm action={saveEventAction} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <div className="card space-y-5 p-5 sm:p-6">
        <Field label="Event title" name="title" required>
          <input id="title" name="title" defaultValue={defaults.title} className="input" placeholder="e.g. Web Development Bootcamp" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" name="category" required>
            <select id="category" name="category" defaultValue={defaults.category ?? ""} className="input">
              <option value="" disabled>Choose a category</option>
              {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Venue" name="venue" required>
            <input id="venue" name="venue" defaultValue={defaults.venue} className="input" placeholder="e.g. Seminar Room 402, Block C" />
          </Field>
        </div>
        <Field label="Description" name="description" required hint="What will happen, who should attend, what to bring.">
          <textarea id="description" name="description" rows={6} defaultValue={defaults.description} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" name="date" required>
            <input id="date" name="date" type="date" min={editing ? undefined : today} defaultValue={defaults.date} className="input" />
          </Field>
          <Field label="Start time" name="startTime" required>
            <input id="startTime" name="startTime" type="time" defaultValue={defaults.startTime ?? "10:00"} className="input" />
          </Field>
          <Field label="End time" name="endTime" required>
            <input id="endTime" name="endTime" type="time" defaultValue={defaults.endTime ?? "12:00"} className="input" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Registration closes on" name="deadlineDate" required>
            <input id="deadlineDate" name="deadlineDate" type="date" defaultValue={defaults.deadlineDate} className="input" />
          </Field>
          <Field label="at" name="deadlineTime">
            <input id="deadlineTime" name="deadlineTime" type="time" defaultValue={defaults.deadlineTime ?? "23:59"} className="input" />
          </Field>
          <Field label="Capacity" name="capacity" hint="Leave empty for unlimited.">
            <input id="capacity" name="capacity" type="number" min={1} defaultValue={defaults.capacity ?? ""} className="input" placeholder="e.g. 50" />
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-brand-50 p-4">
          <input type="checkbox" name="membersOnly" defaultChecked={defaults.membersOnly} className="mt-0.5 size-4 accent-brand-600" />
          <span>
            <span className="block text-sm font-medium text-slate-800">Members only</span>
            <span className="text-xs text-slate-500">Only approved club members can register.</span>
          </span>
        </label>
        <p className="text-xs text-slate-400">All times are in Bangladesh time (GMT+6).</p>
      </div>

      <div className="grid h-fit gap-6 sm:grid-cols-2 xl:grid-cols-1">
        <div className="card p-5">
          <ImageInput name="image" label="Event banner" current={defaults.image} aspect="aspect-[16/9]" />
        </div>
        <div className="card h-fit space-y-3 p-5">
          {published ? (
            <SubmitButton name="intent" value="publish" className="w-full" pendingText="Saving…">Save changes</SubmitButton>
          ) : (
            <>
              <SubmitButton name="intent" value="publish" className="w-full" pendingText="Publishing…">Publish event</SubmitButton>
              <SubmitButton name="intent" value="draft" variant="btn-outline" className="w-full" pendingText="Saving…">Save as draft</SubmitButton>
            </>
          )}
          <Link href="/club/events" className="btn btn-ghost w-full">Cancel</Link>
          <p className="text-xs text-slate-500">
            {published ? "Registered students are notified when you change a published event." : "Publishing notifies all club members."}
          </p>
        </div>
      </div>
    </ActionForm>
  );
}
