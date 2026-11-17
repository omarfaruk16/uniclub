"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CircleCheck } from "lucide-react";
import { Modal } from "./modal";
import { ActionForm, useFormCtx } from "./action-form";
import type { ActionResult } from "@/lib/action";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;

/**
 * A button that asks for confirmation before running a server action.
 * `fields` become hidden inputs on the submitted form.
 */
export function ConfirmAction({
  action,
  fields,
  label,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  className,
  icon,
  children,
}: {
  action: Action;
  fields: Record<string, string>;
  label?: React.ReactNode;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  className?: string;
  icon?: React.ReactNode;
  /** Extra inputs shown inside the dialog (e.g. a reason field). */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={typeof label === "string" ? undefined : title} title={typeof label === "string" ? undefined : title} className={className ?? "btn btn-sm btn-danger-outline"}>
        {icon}
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="sm">
        <ActionForm action={action} onSuccess={() => setOpen(false)}>
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="flex gap-3">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600")}>
              {tone === "danger" ? <AlertTriangle className="size-5" /> : <CircleCheck className="size-5" />}
            </div>
            <div className="text-sm text-slate-600">{message}</div>
          </div>
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <ConfirmSubmit tone={tone}>{confirmLabel}</ConfirmSubmit>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}

function ConfirmSubmit({ children, tone }: { children: React.ReactNode; tone: "danger" | "primary" }) {
  const ctx = useFormCtx();
  return (
    <button type="submit" disabled={ctx?.pending} className={cn("btn", tone === "danger" ? "btn-danger" : "btn-primary")}>
      {ctx?.pending ? "Working…" : children}
    </button>
  );
}

/** One-click action button (no confirmation) with pending state and toast. */
export function QuickAction({
  action,
  fields,
  children,
  className,
  title,
}: {
  action: Action;
  fields: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <ActionForm action={action} className="inline">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <QuickSubmit className={className} title={title}>
        {children}
      </QuickSubmit>
    </ActionForm>
  );
}

function QuickSubmit({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  const ctx = useFormCtx();
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} type="submit" title={title} aria-label={title} disabled={ctx?.pending} className={className ?? "btn btn-sm btn-outline"}>
      {children}
    </button>
  );
}
