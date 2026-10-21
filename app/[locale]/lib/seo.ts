import { routing } from "@/i18n/routing";

/**
 * Returns the base site URL for metadata and canonical tags.
 * Falls back to beyondlogicsinc.com if not specified in env.
 */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_baseURL_images ||
    "https://beyondlogicsinc.com";
  return url.replace(/\/+$/, "");
}

/**
 * Returns canonical and language alternates (hreflang) URLs.
 * Ensures compatibility with Next.js trailingSlash: true configuration.
 */
export function getAlternates(pathname: string, locale: string) {
  const siteUrl = getSiteUrl();
  const cleanPath = pathname ? `/${pathname.replace(/^\/|\/$/g, "")}/` : "/";

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteUrl}/${loc}${cleanPath}`;
  }
  // x-default points to defaultLocale ('en')
  languages["x-default"] = `${siteUrl}/${routing.defaultLocale}${cleanPath}`;

  return {
    canonical: `${siteUrl}/${locale}${cleanPath}`,
    languages,
  };
}

/**
 * Restaurant / FoodEstablishment JSON-LD Structured Data
 */
export function getRestaurantJsonLd(locale: string) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurant`,
    name: "Pizzeria Con Amore",
    image: `${siteUrl}/images/banner.png`,
    url: `${siteUrl}/${locale}/`,
    telephone: "+49 123 456789",
    priceRange: "€€",
    servesCuisine: ["Italian", "Pizza"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Main Street",
      addressLocality: "Berlin",
      postalCode: "10115",
      addressCountry: "DE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 52.52,
      longitude: 13.405,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "10:00",
        closes: "22:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday"],
        opens: "10:00",
        closes: "23:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "12:00",
        closes: "23:30",
      },
    ],
    menu: `${siteUrl}/${locale}/products/`,
  };
}
