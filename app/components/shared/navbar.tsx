"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {

  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(stored);

    const handleStorage = () => loadCartCount();

  window.addEventListener("cartUpdated", handleStorage);

  return () => {
    window.removeEventListener("cartUpdated", handleStorage);
  };
  }, []);

  const loadCartCount = () => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(stored);
  } 


  return (
    <div className="topbar flex justify-between items-center px-10 py-2 bg-white shadow-sm">
      {/* Logo */}
      <a className="logo text-2xl font-bold"><img src="/images/web-logo.avif"></img></a>

      {/* Links */}
      <div className="space-x-6 navbar hidden md:flex">
        <Link href="/">Home</Link>
        <Link href="/products">Menu</Link>
        <Link href="/contact">Contact</Link>
      </div>

      {/* Auth */}
      <div className="space-x-4">
        <Link className="cartIcon" href="/cart">
          <i className="fa fa-cart-arrow-down"></i>
          <span className="qty">{cart?.length}</span>
        
        </Link>
        {/* <button className="bg-black text-white px-4 py-2 rounded-full">
          Sign Up
        </button> */}
      </div>
    </div>
  );
}