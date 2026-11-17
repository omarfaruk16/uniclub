import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadResult = { url: string } | { error: string } | null;

/** Saves an uploaded image and returns its public URL. Returns null when no file was chosen. */
export async function saveImage(file: FormDataEntryValue | null, prefix: string): Promise<UploadResult> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) return { error: "Images must be JPG, PNG, WEBP or GIF." };
  if (file.size > MAX_BYTES) return { error: "Images must be 5 MB or smaller." };
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${prefix}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/api/uploads/${name}` };
}

/** Removes a previously uploaded file (ignored for seed/remote images). */
export async function removeImage(url: string | null | undefined) {
  if (!url?.startsWith("/api/uploads/")) return;
  const name = path.basename(url);
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
