import type { MetadataRoute } from "next";
import { getSiteUrl } from "./[locale]/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/*/admin/",
          "/*/admin/*",
          "/cart/",
          "/*/cart/",
          "/checkout/",
          "/*/checkout/",
          "/success/",
          "/*/success/",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
