import "server-only";
import { cookies } from "next/headers";

/** One-shot toast message that survives a redirect; read and cleared by <FlashToast/>. */
export async function setFlash(message: string, type: "success" | "error" = "success") {
  const jar = await cookies();
  jar.set("unique_flash", Buffer.from(JSON.stringify({ message, type })).toString("base64url"), {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
  });
}
