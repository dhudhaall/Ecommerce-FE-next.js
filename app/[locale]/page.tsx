import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HomePageClient from "./HomePageClient";
import { getAlternates, getRestaurantJsonLd } from "./lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: t("home.title"),
    description: t("home.description"),
    alternates: getAlternates("", locale),
    openGraph: {
      title: t("home.title"),
      description: t("home.description"),
      url: `/${locale}/`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const jsonLd = getRestaurantJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient />
    </>
  );
}