import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export async function PageBanner({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  const { bannerImage } = await getSettings();
  const dark = Boolean(bannerImage);
  return (
    <section className={cn("relative overflow-hidden border-b border-line", dark ? "bg-ink" : "bg-canvas")}>
      {bannerImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerImage} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/20" />
        </>
      )}
      <div className="container-page relative py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className={cn("mb-3 flex items-center gap-1.5 text-sm", dark ? "text-white/70" : "text-slate-500")}>
          <Link href="/" className={dark ? "hover:text-white" : "hover:text-slate-900"}>Home</Link>
          <ChevronRight className="size-3.5" />
          <span className={cn("font-medium", dark ? "text-white" : "text-slate-900")}>{title}</span>
        </nav>
        <h1 className={cn("text-3xl font-bold sm:text-[2.5rem] sm:leading-tight", dark && "text-white")}>{title}</h1>
        <p className={cn("mt-2 max-w-2xl sm:text-lg", dark ? "text-white/80" : "text-slate-500")}>{text}</p>
        {children}
      </div>
    </section>
  );
}
