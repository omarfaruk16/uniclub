import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import { getSettings, publicMedia } from "@/lib/settings";
import { MediaProvider } from "@/components/brand";

// Settings (site name, registration toggle…) can change at any time, so never prerender.
export const dynamic = "force-dynamic";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

export const viewport: Viewport = { themeColor: "#176B50", width: "device-width", initialScale: 1, viewportFit: "cover" };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.siteName} | University Club & Event Management`, template: `%s | ${s.siteName}` },
    description: s.tagline,
    icons: { icon: s.favicon || "/icon.svg" },
    openGraph: { siteName: s.siteName, description: s.tagline, ...(s.ogImage ? { images: [s.ogImage] } : {}) },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen">
        <MediaProvider value={publicMedia(s)}><ToastProvider>{children}</ToastProvider></MediaProvider>
      </body>
    </html>
  );
}
