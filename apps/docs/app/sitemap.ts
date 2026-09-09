import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/shared";
import { source } from "@/lib/source";

/* One entry per rendered page, from the same collection the pages render
 * from, so a page cannot exist without being listed. Absolute URLs are
 * required by the sitemap format; `siteUrl` says where the origin comes from
 * and what it falls back to. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/` },
    ...source.getPages().map((page) => ({ url: `${siteUrl}${page.url}` })),
  ];
}
