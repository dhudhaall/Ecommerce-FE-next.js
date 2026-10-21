import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CheckoutClient from "./CheckoutClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: t("checkout.title"),
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}