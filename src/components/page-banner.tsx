import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageBanner({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="container-page py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-900">{title}</span>
        </nav>
        <h1 className="text-3xl font-bold sm:text-[2.5rem] sm:leading-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-slate-500 sm:text-lg">{text}</p>
        {children}
      </div>
    </section>
  );
}
