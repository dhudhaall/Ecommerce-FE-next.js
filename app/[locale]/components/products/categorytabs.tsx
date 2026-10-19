"use client";

import { useState, useRef, useEffect } from "react";
import AddToCart from "./addtoCartModal";
import { useTranslations } from "next-intl";

export default function CategoryTabs({ categories }: any) {
  const [active, setActive] = useState(categories?.[0] || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("ProductsPage");

  const openCartModal = (product: any) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProduct(null);
  };

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 300;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="w-full">
      {/* Tabs with Left & Right Arrow Buttons */}
      <div className="relative flex items-center w-full gap-2 mb-4">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll categories left"
          className={`flex-shrink-0 z-10 w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm flex items-center justify-center transition-all ${
            canScrollLeft
              ? "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-400 cursor-pointer shadow-md active:scale-95"
              : "opacity-35 cursor-not-allowed bg-gray-50 text-gray-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable Category Tabs Track */}
        <div
          ref={tabsRef}
          onScroll={checkScroll}
          className="category-tabs flex-1 flex overflow-x-auto no-scrollbar gap-3 py-2 scroll-smooth"
        >
          {categories?.length > 0 &&
            categories.map((category: any) => (
              <button
                key={category?.id}
                onClick={() => setActive(category)}
                className={`whitespace-nowrap px-5 py-2 rounded-full border text-sm font-medium transition-all flex-shrink-0 ${
                  active?.id === category?.id
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {category?.name}
              </button>
            ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Scroll categories right"
          className={`flex-shrink-0 z-10 w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm flex items-center justify-center transition-all ${
            canScrollRight
              ? "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-400 cursor-pointer shadow-md active:scale-95"
              : "opacity-35 cursor-not-allowed bg-gray-50 text-gray-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Active Content */}
      <div className="mt-6">
         <div className="products-list">
           {active?.products?.length > 0 ? active.products.map((product: any) =>  (
             <div className="product-card" key={product.id}>
                <div className="product-image">
                    <img src={product.images?.[0]?.url  || '/images/no-image.jpeg'} alt="Product 1" />
                </div>
                <div className="product-details">
                <div className="product-info">
                    <div className="product-name">{product?.name}</div>
                    <div className="product-desp">{product?.description}</div>
                    <div className="product-price">€{product?.price}</div>
                </div>
                <div className="product-actions">
                   <button onClick={() =>openCartModal(product)} type="button" className="add-to-cart-btn">{t("add_to_cart")}</button>

                  </div>
                </div>
            </div>)): t("no_products_found")}
         
        </div>
      </div>


      <AddToCart
        isOpen={isOpen}
        onClose={closeModal}
        product={selectedProduct}
      />

    </div>
  );
}