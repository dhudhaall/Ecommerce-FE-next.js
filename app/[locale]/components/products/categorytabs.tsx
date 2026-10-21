"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import AddToCart from "./addtoCartModal";
import { useTranslations } from "next-intl";

interface Product {
  id: number | string;
  name: string;
  description?: string;
  price: number | string;
  images?: { id?: number; url: string; alt?: string | null }[];
  sizes?: any[];
  addons?: any[];
  categoryId?: number | string;
  categoryName?: string;
}

interface Category {
  id: number | string;
  name: string;
  products?: Product[];
}

interface CategoryTabsProps {
  categories: Category[];
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
  const t = useTranslations("ProductsPage");

  // Flatten all products across all categories
  const allProducts = useMemo<Product[]>(() => {
    if (!categories || !Array.isArray(categories)) return [];
    const items: Product[] = [];
    for (const cat of categories) {
      if (Array.isArray(cat?.products)) {
        for (const prod of cat.products) {
          items.push({
            ...prod,
            categoryId: cat.id,
            categoryName: cat.name,
          });
        }
      }
    }
    return items;
  }, [categories]);

  // Initial category is "all" if categories exist, or the first category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name_asc" | "name_desc">("default");
  const [priceFilter, setPriceFilter] = useState<"all" | "under_10" | "10_20" | "over_20">("all");

  // Cart modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Tabs scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Helper to calculate product matches count per category
  const getCategoryMatchCount = (catId: string | number) => {
    const query = searchQuery.trim().toLowerCase();
    const terms = query ? query.split(/\s+/).filter(Boolean) : [];

    return allProducts.filter((p) => {
      if (catId !== "all" && p.categoryId !== catId) return false;
      if (terms.length > 0) {
        const haystack = `${p.name || ""} ${p.description || ""} ${p.categoryName || ""}`.toLowerCase();
        if (!terms.every((term) => haystack.includes(term))) return false;
      }
      if (priceFilter !== "all") {
        const price = Number(p.price) || 0;
        if (priceFilter === "under_10" && price >= 10) return false;
        if (priceFilter === "10_20" && (price < 10 || price > 20)) return false;
        if (priceFilter === "over_20" && price <= 20) return false;
      }
      return true;
    }).length;
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    // 1. Category Filter
    if (selectedCategoryId !== "all") {
      list = list.filter((p) => p.categoryId === selectedCategoryId);
    }

    // 2. Search Text Query (across all products or within selected category)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const cat = (p.categoryName || "").toLowerCase();
        const haystack = `${name} ${desc} ${cat}`;
        return terms.every((term) => haystack.includes(term));
      });
    }

    // 3. Price Filter
    if (priceFilter !== "all") {
      list = list.filter((p) => {
        const price = Number(p.price) || 0;
        if (priceFilter === "under_10") return price < 10;
        if (priceFilter === "10_20") return price >= 10 && price <= 20;
        if (priceFilter === "over_20") return price > 20;
        return true;
      });
    }

    // 4. Sort
    if (sortBy !== "default") {
      list = [...list].sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
        return 0;
      });
    }

    return list;
  }, [allProducts, selectedCategoryId, searchQuery, priceFilter, sortBy]);

  // Is any filter currently applied?
  const isFiltered =
    searchQuery.trim().length > 0 ||
    priceFilter !== "all" ||
    sortBy !== "default" ||
    selectedCategoryId !== "all";

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setPriceFilter("all");
    setSortBy("default");
    setSelectedCategoryId("all");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="w-full">
      {/* Search and Filters Header Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <label htmlFor="product-search-input" className="sr-only">
              {t("search_label")}
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="product-search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-11 pr-10 py-3 text-sm md:text-base bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t("clear_search")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold">
                  ✕
                </span>
              </button>
            )}
          </div>

          {/* Controls: Price Filter + Sort Dropdown */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            
            {/* Price Filter Chips */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto text-xs font-medium">
              {[
                { id: "all", label: t("price_all") },
                { id: "under_10", label: t("price_under_10") },
                { id: "10_20", label: t("price_10_20") },
                { id: "over_20", label: t("price_over_20") },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriceFilter(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    priceFilter === p.id
                      ? "bg-white text-orange-600 font-semibold shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[170px]">
              <label htmlFor="product-sort-select" className="sr-only">
                {t("sort_by")}
              </label>
              <select
                id="product-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer transition-all"
              >
                <option value="default">{t("sort_by")}: {t("sort_default")}</option>
                <option value="price_asc">{t("sort_price_asc")}</option>
                <option value="price_desc">{t("sort_price_desc")}</option>
                <option value="name_asc">{t("sort_name_asc")}</option>
                <option value="name_desc">{t("sort_name_desc")}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Reset All Filters button if filtered */}
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl border border-gray-200 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t("clear_filters")}
              </button>
            )}

          </div>

        </div>

        {/* Results summary text */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
          <div>
            {searchQuery.trim() ? (
              <span>
                {t("found_results", {
                  count: filteredProducts.length,
                  query: searchQuery.trim(),
                })}
              </span>
            ) : (
              <span>
                {t("showing_products", { count: filteredProducts.length })}
              </span>
            )}
            {selectedCategoryId !== "all" && (
              <span className="ml-2 font-medium text-orange-600">
                • {categories?.find((c) => c.id === selectedCategoryId)?.name}
              </span>
            )}
          </div>

          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSelectedCategoryId("all")}
              className={`text-xs underline hover:text-orange-600 transition-colors ${
                selectedCategoryId === "all" ? "text-orange-600 font-semibold" : "text-gray-500"
              }`}
            >
              {selectedCategoryId === "all"
                ? t("all_categories")
                : `${t("all_categories")} (${allProducts.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs Track with Left & Right Arrow Buttons */}
      <div className="relative flex items-center w-full gap-2 mb-6">
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
          className="category-tabs flex-1 flex overflow-x-auto no-scrollbar gap-2.5 py-1.5 scroll-smooth"
        >
          {/* "All" Tab */}
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={`whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
              selectedCategoryId === "all"
                ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            <span>{t("all_categories")}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedCategoryId === "all"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {getCategoryMatchCount("all")}
            </span>
          </button>

          {/* Individual Category Tabs */}
          {categories?.length > 0 &&
            categories.map((category) => {
              const count = getCategoryMatchCount(category.id);
              const isSelected = selectedCategoryId === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30"
                      : count === 0 && searchQuery.trim()
                      ? "bg-gray-50 text-gray-400 border-gray-200 opacity-60"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <span>{category.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
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

      {/* Products Grid Content */}
      <div className="mt-2">
        {filteredProducts.length > 0 ? (
          <div className="products-list">
            {filteredProducts.map((product) => (
              <div className="product-card group relative" key={product.id}>
                <div className="product-image relative">
                  <img
                    src={product.images?.[0]?.url || "/images/no-image.jpeg"}
                    alt={product.name || "Product"}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/no-image.jpeg";
                    }}
                  />
                  {/* Category Pill Tag on Product Card */}
                  {product.categoryName && (
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {product.categoryName}
                    </span>
                  )}
                </div>

                <div className="product-details">
                  <div className="product-info">
                    <div className="product-name" title={product.name}>
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="product-desp" title={product.description}>
                        {product.description}
                      </div>
                    )}
                    <div className="product-price">
                      €{Number(product.price).toFixed(2)}
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                      onClick={() => openCartModal(product)}
                      type="button"
                      className="add-to-cart-btn hover:brightness-105 active:scale-95 transition-all"
                    >
                      {t("add_to_cart")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search Results State */
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center my-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {searchQuery.trim()
                ? t("no_search_results", { query: searchQuery.trim() })
                : t("no_products_found")}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t("no_search_desc")}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              {t("clear_filters")}
            </button>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <AddToCart
        isOpen={isOpen}
        onClose={closeModal}
        product={selectedProduct}
      />
    </div>
  );
}