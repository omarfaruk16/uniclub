import { db } from "@/lib/db";
import type { BannerPlacement } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "./banner-carousel";

/** Live admin-managed banners for one place on the site. Renders nothing when there are none. */
export async function AdSlot({ placement, className }: { placement: BannerPlacement; className?: string }) {
  const banners = await db.banner.findMany({
    where: { placement, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, image: true, link: true },
  });
  if (banners.length === 0) return null;
  return (
    <aside aria-label="Promotion" className={cn(className)}>
      <BannerCarousel banners={banners} />
    </aside>
  );
}
