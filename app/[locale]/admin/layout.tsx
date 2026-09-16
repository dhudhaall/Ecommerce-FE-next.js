"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAdmin, getToken, logout } from "@/app/[locale]/admin/lib/adminApi";
import "./admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const rawPath = usePathname();
  const pathname = (rawPath || "/").replace(/\/+$/, "") || "/";

  // Strip the locale prefix so comparisons work regardless of language
  const adminPath = pathname.replace(new RegExp(`^/${locale}`), "");
  const isLogin = adminPath === "/admin/login";

  const [ready, setReady] = useState(false);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace(`/${locale}/admin/login`);
      return;
    }
    setAdminName(getAdmin()?.name ?? "Admin");
    setReady(true);
  }, [isLogin, adminPath, locale, router]);

  if (!ready) {
    return (
      <div className="ad-boot">
        <span className="ad-spinner" />
      </div>
    );
  }

  if (isLogin) return <>{children}</>;

  return (
    <div className="ad-shell">
      <aside className="ad-sidebar">
        <div className="ad-brand">
          Pizzaria<span>Con Amore</span>. <em>admin</em>
        </div>
        <nav className="ad-nav">
          <Link
            href={`/${locale}/admin/orders`}
            className={`ad-nav-item ${adminPath.startsWith("/admin/orders") ? "active" : ""}`}
          >
            <OrderIcon /> Orders
          </Link>
        </nav>
        <div className="ad-side-foot">
          <div className="ad-who">
            <div className="ad-avatar">{adminName.charAt(0).toUpperCase()}</div>
            <span>{adminName}</span>
          </div>
          <button type="button" className="ad-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="ad-main">{children}</main>
    </div>
  );
}

function OrderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 4h13l-1 9H4L3 4Z" />
      <path d="M3 4 2.5 2H1" />
      <circle cx="6" cy="20" r="1.5" />
      <circle cx="14" cy="20" r="1.5" />
    </svg>
  );
}