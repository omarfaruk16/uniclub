"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/** File input with live preview. Sends the file as `name`; `remove_<name>`=1 clears an existing image. */
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";
export const MEDIA_ACCEPT = `${IMAGE_ACCEPT},image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg`;

export function ImageInput({
  name,
  current,
  label,
  aspect = "aspect-[16/7]",
  round = false,
  accept = IMAGE_ACCEPT,
  formats = "JPG, PNG, WEBP or AVIF, up to 5 MB",
  fit = "cover",
  hideLabel = false,
}: {
  name: string;
  current?: string | null;
  label: string;
  aspect?: string;
  round?: boolean;
  accept?: string;
  formats?: string;
  fit?: "cover" | "contain";
  hideLabel?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={hideLabel ? "sr-only" : "label"}>{label}</span>
      <div
        className={`relative flex ${round ? "size-28 rounded-2xl" : `w-full ${aspect} rounded-2xl`} cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-slate-300/80 bg-slate-50 transition hover:border-brand-400`}
        onClick={() => ref.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className={`absolute inset-0 size-full ${fit === "contain" ? "object-contain p-3" : "object-cover"}`} />
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 text-center text-xs text-slate-500">
            <ImagePlus className="size-6 text-brand-500" />
            <span>Click to upload</span>
            {!round && <span className="text-slate-400">{formats}</span>}
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
        accept={accept}
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
