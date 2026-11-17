"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/** File input with live preview. Sends the file as `name`; `remove_<name>`=1 clears an existing image. */
export function ImageInput({ name, current, label, aspect = "aspect-[16/7]", round = false }: { name: string; current?: string | null; label: string; aspect?: string; round?: boolean }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="label">{label}</span>
      <div
        className={`relative flex ${round ? "size-28 rounded-2xl" : `w-full ${aspect} rounded-2xl`} cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-brand-200 bg-brand-50/60 transition hover:border-brand-400`}
        onClick={() => ref.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 text-center text-xs text-slate-500">
            <ImagePlus className="size-6 text-brand-500" />
            <span>Click to upload</span>
            {!round && <span className="text-slate-400">JPG, PNG or WEBP, up to 5 MB</span>}
          </div>
        )}
        {preview && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
              setRemoved(true);
              if (ref.current) ref.current.value = "";
            }}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-slate-600 shadow hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setPreview(URL.createObjectURL(f));
            setRemoved(false);
          }
        }}
      />
      {removed && <input type="hidden" name={`remove_${name}`} value="1" />}
    </div>
  );
}
