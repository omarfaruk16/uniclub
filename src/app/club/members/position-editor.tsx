"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { updateMemberPositionAction } from "@/app/actions/club";

const POSITIONS = ["Member", "Vice President", "General Secretary", "Treasurer", "Event Coordinator", "Executive Member"];

export function PositionEditor({ membershipId, position, disabled }: { membershipId: string; position: string; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  if (disabled || !editing)
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={position === "Member" ? "text-slate-600" : "font-medium text-brand-700"}>{position}</span>
        {!disabled && (
          <button onClick={() => setEditing(true)} className="text-slate-300 hover:text-brand-600" aria-label="Change position"><Pencil className="size-3.5" /></button>
        )}
      </span>
    );
  return (
    <ActionForm action={updateMemberPositionAction} onSuccess={() => setEditing(false)} className="flex items-center gap-1.5">
      <input type="hidden" name="membershipId" value={membershipId} />
      <select name="position" defaultValue={POSITIONS.includes(position) ? position : "Member"} className="input w-40 py-1.5 text-xs">
        {POSITIONS.map((p) => <option key={p}>{p}</option>)}
      </select>
      <SubmitButton className="btn-sm">Save</SubmitButton>
      <button type="button" onClick={() => setEditing(false)} className="btn btn-sm btn-ghost">Cancel</button>
    </ActionForm>
  );
}
