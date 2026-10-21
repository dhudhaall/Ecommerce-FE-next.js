import type { MetadataRoute } from "next";
import { getSiteUrl } from "./[locale]/lib/seo";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const pages = ["", "products", "about", "contact"];
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    const pagePath = page ? `${page}/` : "";
    for (const locale of routing.locales) {
      entries.push({
        url: `${siteUrl}/${locale}/${pagePath}`,
        lastModified,
        changeFrequency:
          page === "" || page === "products" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : page === "products" ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${siteUrl}/${l}/${pagePath}`,
            ])
          ),
        },
      });
    }
  }

  return entries;
}
