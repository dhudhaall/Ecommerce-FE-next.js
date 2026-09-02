"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [cart, setCart] = useState<any[]>([]);

  const router = useRouter();
  const pathname = usePathname();

  const [language, setLanguage] = useState("en");

  useEffect(() => {
    loadCartCount();

    const handleStorage = () => loadCartCount();

    window.addEventListener("cartUpdated", handleStorage);

    return () => {
      window.removeEventListener("cartUpdated", handleStorage);
    };
  }, []);

  // Detect current language from URL
  useEffect(() => {
    const match = pathname?.match(/^\/(en|de|fr)(\/|$)/);

    if (match) {
      setLanguage(match[1]);
    }
  }, [pathname]);

  const loadCartCount = () => {
    const stored = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    setCart(stored);
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLanguage = event.target.value;

    setLanguage(newLanguage);

    // Remove existing language from URL
    const pathWithoutLanguage = pathname.replace(
      /^\/(en|de|fr)/,
      ""
    );

    // Keep "/" if there is no remaining path
    const newPath =
      pathWithoutLanguage || "/";

    // Navigate to new language URL
    router.push(`/${newLanguage}${newPath}`);
  };

  return (
    <div className="topbar flex justify-between items-center px-10 py-2 bg-white shadow-sm">

      {/* Logo */}
      <Link href={`/${language}`} className="logo text-2xl font-bold">
        <img
          src="/images/web-logo.avif"
          alt="Logo"
          className="h-10 w-auto"
        />
      </Link>

      {/* Navigation */}
      <div className="space-x-6 navbar hidden md:flex">

        <Link href={`/${language}`}>
          Home
        </Link>

        <Link href={`/${language}/products`}>
          Menu
        </Link>

        <Link href={`/${language}/contact`}>
          Contact
        </Link>

      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Language */}
        <div className="relative">

          <div
            className="
              flex items-center gap-2
              px-3 py-2
              rounded-full
              border border-gray-200
              bg-white
              hover:border-gray-300
              hover:shadow-sm
              transition-all duration-200
            "
          >

            <i className="fa fa-globe text-gray-500 text-sm"></i>

            <select
              value={language}
              onChange={handleLanguageChange}
              className="
                appearance-none
                bg-transparent
                outline-none
                border-none
                text-sm
                font-medium
                text-gray-700
                cursor-pointer
                pr-5
              "
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>

            <i className="
              fa fa-chevron-down
              text-[10px]
              text-gray-400
              absolute
              right-3
              pointer-events-none
            " />
          </div>
        </div>
        {/* Cart */}
        <Link
          href={`/${language}/cart`}
          className="cartIcon relative flex items-center justify-center"
        >
          <i className="fa fa-cart-arrow-down text-xl"></i>

          {cart.length > 0 && (
            <span className="
              qty
              absolute
              -top-2
              -right-2
              flex
              items-center
              justify-center
              bg-black
              text-white
              text-[10px]
              font-bold
              rounded-full
              w-5
              h-5
            ">
              {cart.length}
            </span>
          )}
        </Link>
      </div>

    </div>
  );
}