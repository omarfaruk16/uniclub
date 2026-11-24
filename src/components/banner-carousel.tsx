"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Banner = { id: string; title: string; image: string; link: string | null };

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-slate-100" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, n) => {
          // eslint-disable-next-line @next/next/no-img-element
          const img = <img src={b.image} alt={b.title} className="aspect-[5/2] w-full object-cover sm:aspect-[4/1]" loading={n === 0 ? "eager" : "lazy"} />;
          const external = b.link?.startsWith("http");
          return (
            <div key={b.id} className="w-full shrink-0" aria-hidden={n !== i}>
              {b.link ? (
                <a href={b.link} tabIndex={n === i ? 0 : -1} {...(external ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}>{img}</a>
              ) : img}
            </div>
          );
        })}
      </div>
      {/* Outside links are ads, so they carry a disclosure label. */}
      {banners[i]?.link?.startsWith("http") && <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">Sponsored</span>}
      {banners.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {banners.map((b, n) => (
            <button key={b.id} onClick={() => setI(n)} aria-label={`Show banner ${n + 1}`} className={cn("h-1.5 rounded-full bg-white/70 transition-all", n === i ? "w-5 bg-white" : "w-1.5")} />
          ))}
        </div>
      )}
    </div>
  );
}
