"use client";

import { useTranslations } from "next-intl";

export default function About() {
  const translation = useTranslations("AboutPage");

  return (
    <>
      {/* HERO */}
      <div className="bg-[#f5efe6] py-20 text-center">
        <h1 className="text-5xl font-bold text-orange-600 mb-4">
          {translation("hero.title")}
        </h1>

        <p className="text-gray-600 max-w-2xl mx-auto">
          {translation("hero.description")}
        </p>
      </div>

      {/* ABOUT CONTENT */}
      <div className="py-16 px-10 grid md:grid-cols-2 gap-10 items-center">

        <div>
          <h2 className="text-3xl font-bold mb-4">
            {translation("about.title")}
          </h2>

          <p className="text-gray-600 mb-4">
            {translation("about.description_1")}
          </p>

          <p className="text-gray-600">
            {translation("about.description_2")}
          </p>
        </div>

        <img
          src="/food1.png"
          className="rounded-lg shadow-lg"
          alt={translation("about.image_alt")}
        />
      </div>

      {/* FOOD GALLERY */}
      <div className="py-16 px-10">
        <h2 className="text-3xl font-bold text-center mb-10">
          {translation("gallery.title")}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <img
            src="/food1.png"
            className="rounded-lg"
            alt={translation("gallery.dish_1_alt")}
          />

          <img
            src="/food2.png"
            className="rounded-lg"
            alt={translation("gallery.dish_2_alt")}
          />

          <img
            src="/food3.png"
            className="rounded-lg"
            alt={translation("gallery.dish_3_alt")}
          />
        </div>
      </div>

      {/* WHY US */}
      <div className="bg-gray-100 py-16 px-10">
        <h2 className="text-3xl font-bold text-center mb-10">
          {translation("why_us.title")}
        </h2>

        <div className="grid md:grid-cols-3 gap-10 text-center">

          {/* Fast Delivery */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              🚀 {translation("why_us.fast_delivery.title")}
            </h3>

            <p className="text-gray-600">
              {translation("why_us.fast_delivery.description")}
            </p>
          </div>

          {/* Best Quality */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              🍽️ {translation("why_us.best_quality.title")}
            </h3>

            <p className="text-gray-600">
              {translation("why_us.best_quality.description")}
            </p>
          </div>

          {/* Great Prices */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              💰 {translation("why_us.great_prices.title")}
            </h3>

            <p className="text-gray-600">
              {translation("why_us.great_prices.description")}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}