"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/action";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
const FormCtx = createContext<{ state: ActionResult | null; pending: boolean } | null>(null);

/**
 * Form wired to a server action: shows success/error toasts, field errors and a pending state.
 * Submits through a transition so React does not wipe the user's input on validation errors.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  showToast = true,
  onSuccess,
  ...rest
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showToast?: boolean;
  onSuccess?: () => void;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit">) {
  const [state, formAction, pending] = useActionState(action, null);
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.message && showToast) toast(state.message, state.ok ? "success" : "error");
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form
        ref={ref}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => formAction(fd));
        }}
        {...rest}
      >
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export function useFormCtx() {
  return useContext(FormCtx);
}

export function FieldError({ name }: { name: string }) {
  const ctx = useContext(FormCtx);
  const msg = ctx?.state?.errors?.[name];
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>;
}

/** Inline error/success banner for forms where a toast is not enough (e.g. login). */
export function FormMessage() {
  const ctx = useContext(FormCtx);
  const s = ctx?.state;
  if (!s?.message || s.ok) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {s.message}
    </div>
  );
}

export function SubmitButton({
  children,
  className,
  pendingText,
  name,
  value,
  variant = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
  variant?: string;
}) {
  const ctx = useContext(FormCtx);
  const status = useFormStatus();
  const pending = ctx ? ctx.pending : status.pending;
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={cn("btn", variant, className)}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
