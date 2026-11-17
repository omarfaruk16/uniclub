import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card"><Compass className="size-8" /></div>
      <p className="font-display text-sm font-semibold tracking-widest text-gold-600">404</p>
      <h1 className="mt-1 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-500">The page you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/events" className="btn btn-outline">Browse events</Link>
      </div>
    </div>
  );
}
