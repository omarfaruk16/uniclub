"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = { id: number; message: string; type: "success" | "error" };
const ToastContext = createContext<(message: string, type?: Toast["type"]) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <Suspense fallback={null}>
        <FlashReader push={push} />
      </Suspense>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lift ${
              t.type === "success" ? "border-brand-200" : "border-red-200"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
            ) : (
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
            )}
            <p className="flex-1 text-slate-700">{t.message}</p>
            <button
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Shows the one-shot flash cookie set by server actions before a redirect. */
function FlashReader({ push }: { push: (m: string, t?: Toast["type"]) => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )unique_flash=([^;]*)/);
    if (!match) return;
    document.cookie = "unique_flash=; Max-Age=0; path=/";
    try {
      const b64 = decodeURIComponent(match[1]!).replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const { message, type } = JSON.parse(new TextDecoder().decode(bytes));
      if (message) push(message, type);
    } catch {}
  }, [pathname, search, push]);
  return null;
}
