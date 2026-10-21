import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SuccessClient from "./SuccessClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: t("success.title"),
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default function SuccessPage() {
  return <SuccessClient />;
}