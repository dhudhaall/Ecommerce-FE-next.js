import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AboutClient from "./AboutClient";
import { getAlternates } from "../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: t("about.title"),
    description: t("about.description"),
    alternates: getAlternates("about", locale),
    openGraph: {
      title: t("about.title"),
      description: t("about.description"),
      url: `/${locale}/about/`,
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}