import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CategoryTabs from "../components/products/categorytabs";
import { getAlternates } from "../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: t("menu.title"),
    description: t("menu.description"),
    alternates: getAlternates("products", locale),
    openGraph: {
      title: t("menu.title"),
      description: t("menu.description"),
      url: `/${locale}/products/`,
    },
  };
}

async function getCategories() {
  const url = `${process.env.NEXT_PUBLIC_baseURL}/categories`; // ← keep your real URL here

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  if (!res.ok || !res.headers.get("content-type")?.includes("json")) {
    console.error("getCategories failed:", res.status, text.slice(0, 1500));
    throw new Error(`Categories API returned ${res.status}`);
  }

  return JSON.parse(text);
}

export default async function Products() {
  const categories = await getCategories();

  return (
    <>
      <div className="products-page-wrapper">
        <div className="container mx-auto px-4">
          <CategoryTabs categories={categories} />
        </div>
      </div>
    </>
  );
}