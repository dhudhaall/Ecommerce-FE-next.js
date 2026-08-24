"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/adminApi";
import {
  STATUS_TABS,
  STATUS_LABEL,
  money,
  timeAgo,
  type OrderStatus,
  type PaymentStatus,
} from "@/app/[locale]/admin/lib/orders";

interface OrderRow {
  id: number;
  customerName: string;
  phone: string;
  deliveryType: string;
  city: string | null;
  itemCount: number;
  itemsPreview: string[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
}

const POLL_MS = 25000; // background poll to detect new orders (pill only)

export default function OrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New-order detection
  const [newCount, setNewCount] = useState(0);
  const knownIds = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTab = STATUS_TABS.find((t) => t.key === tab)!;

  /* -------- Load (visible) -------- */
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchRows();
      setOrders(rows);
      rows.forEach((o) => knownIds.current.add(o.id));
      setNewCount(0);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  };

  /* -------- Fetch rows for the current tab --------
   * The API filters one status at a time; for the grouped "New" tab we
   * request its primary status and filter the rest client-side. */
  const fetchRows = async (): Promise<OrderRow[]> => {
    const statuses = activeTab.statuses;
    const params = new URLSearchParams({ limit: "100" });
    // Single-status tab → filter server-side; grouped tab → filter client-side below
    if (statuses && statuses.length === 1) params.set("status", statuses[0]);

    const data = await api<{ data: OrderRow[] }>(`/admin/orders?${params.toString()}`);
    console.log("Fetched orders:", data.data);
    let rows = data.data;
    if (statuses && statuses.length > 1) {
      rows = rows.filter((o) => statuses.includes(o.status));
    }
    return rows;
  };

  /* -------- Background poll: detect new orders without disrupting the view -------- */
  const poll = async () => {
    try {
      // Always poll the full unfiltered list to catch brand-new orders
      const data = await api<{ orders: OrderRow[] }>(`/admin/orders?limit=100`);
      const fresh = data.orders.filter((o) => !knownIds.current.has(o.id));
      if (fresh.length > 0 && !firstLoad.current) {
        setNewCount((c) => c + fresh.length);
        // Chime — browsers require prior user interaction; ignore autoplay errors
        audioRef.current?.play().catch(() => {});
      }
    } catch {
      /* silent — poll failures shouldn't disrupt the admin */
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ad-page">
      {/* tiny embedded chime (base64 blip) */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=" preload="auto" />

      <div className="ad-page-head">
        <div>
          <h1>Orders</h1>
          <p className="ad-page-sub">Manage and prepare incoming orders</p>
        </div>
        <div className="ad-head-actions">
          {newCount > 0 && (
            <button type="button" className="ad-newpill" onClick={load}>
              <span className="ad-pulse" /> {newCount} new order{newCount > 1 ? "s" : ""} · tap to load
            </button>
          )}
          <button type="button" className="ad-btn ghost" onClick={load} disabled={loading}>
            {loading ? <span className="ad-spinner" /> : <RefreshIcon />} Refresh
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="ad-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ad-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="ad-state">
          <span className="ad-spinner" /> Loading orders…
        </div>
      ) : error ? (
        <div className="ad-state">
          <p className="ad-err-text">{error}</p>
          <button type="button" className="ad-btn ghost" onClick={load}>
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="ad-state ad-empty">
          <span className="ad-empty-emoji">🍽️</span>
          No orders in this view.
        </div>
      ) : (
        <div className="ad-table">
          <div className="ad-tr ad-th">
            <span>Order</span>
            <span>Customer</span>
            <span>Items</span>
            <span>Total</span>
            <span>Payment</span>
            <span>Status</span>
            <span></span>
          </div>
          {orders.map((o) => (
            <div
              key={o.id}
              className="ad-tr ad-row"
              onClick={() => router.push(`/admin/orders/${o.id}`)}
              role="button"
            >
              <span className="ad-cell-id">
                #{o.id}
                <em>{timeAgo(o.createdAt)}</em>
              </span>
              <span>
                <strong>{o.customerName}</strong>
                <em className="ad-muted">{o.deliveryType === "pickup" ? "Pickup" : o.city || "Delivery"}</em>
              </span>
              <span className="ad-cell-items">
                {o.itemsPreview?.slice(0, 2).join(", ")}
                {o.itemsPreview?.length > 2 ? ` +${o.itemsPreview?.length - 2}` : ""}
              </span>
              <span className="ad-cell-total">{money(o.totalAmount, o.currency)}</span>
              <span>
                <PaymentBadge method={o.paymentMethod} status={o.paymentStatus} />
              </span>
              <span>
                <StatusBadge status={o.status} />
              </span>
              <span className="ad-cell-arrow">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Badges ---------- */

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`ad-badge status-${status}`}>{STATUS_LABEL[status]}</span>;
}

function PaymentBadge({ method, status }: { method: string; status: PaymentStatus }) {
  // Flag the dangerous case: a card order not yet paid
  const label =
    status === "paid" ? "Paid" : status === "failed" ? "Failed" : method === "cash" ? "Cash (COD)" : "Unpaid";
  const cls = status === "paid" ? "pay-paid" : status === "failed" ? "pay-failed" : method === "cash" ? "pay-cod" : "pay-unpaid";
  return <span className={`ad-badge ${cls}`}>{label}</span>;
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}