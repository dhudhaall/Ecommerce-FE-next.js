"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api, getToken } from "../lib/adminApi";
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
  items: any[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
}

/* Synthesize a loud, clear 3-ring restaurant alarm chime using Web Audio API */
function playAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // 3 loud bell rings
    [0, 0.45, 0.9].forEach((delay) => {
      playTone(880, delay, 0.35); // High A5
      playTone(1046.5, delay + 0.12, 0.45); // High C6
    });
  } catch (err) {
    console.error("Failed to play alarm sound:", err);
  }
}

export default function OrdersPage() {
  const { locale } = useParams<{ locale: string }>();

  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New-order detection & Alarm state
  const [newCount, setNewCount] = useState(0);
  const [latestOrder, setLatestOrder] = useState<OrderRow | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownIds = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTab = STATUS_TABS.find((t) => t.key === tab)!;

  // Request browser Notification permission on mount if supported
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  /* -------- Load (visible) -------- */
  const load = async () => {
    setLoading(true);
    setError("");
    stopAlarmRinging();
    try {
      const rows = await fetchRows();
      setOrders(rows);
      rows.forEach((o) => knownIds.current.add(o.id));
      setNewCount(0);
      setLatestOrder(null);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  };

  /* -------- Fetch rows for the current tab -------- */
  const fetchRows = async (): Promise<OrderRow[]> => {
    const statuses = activeTab.statuses;
    const params = new URLSearchParams({ limit: "100" });
    if (statuses && statuses.length === 1) params.set("status", statuses[0]);

    const data = await api<{ data: OrderRow[] }>(`/admin/orders?${params.toString()}`);
    let rows = data.data || [];
    if (statuses && statuses.length > 1) {
      rows = rows.filter((o) => statuses.includes(o.status));
    }
    return rows;
  };

  const stopAlarmRinging = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const triggerNewOrderAlarm = (freshOrders: OrderRow[]) => {
    if (soundEnabled) {
      playAlarmSound();
      stopAlarmRinging();
      // Repeat ring sound every 3.5s while unhandled
      alarmIntervalRef.current = setInterval(() => {
        playAlarmSound();
      }, 3500);
    }

    // Show desktop notification if available
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const latest = freshOrders[0];
      new Notification("🔔 New Order Received!", {
        body: `Order #${latest.id} - ${latest.customerName || "Customer"} (${money(latest.totalAmount, latest.currency)})`,
        icon: "/images/web-logo.avif",
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* -------- Real-time stream (Server-Sent Events) --------
   * Only triggers and updates when a new order arrives, completely eliminating polling! */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const streamUrl = `${process.env.NEXT_PUBLIC_baseURL}/admin/orders/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "new_order" && payload.order) {
          const newOrder = payload.order;
          if (!knownIds.current.has(newOrder.id)) {
            knownIds.current.add(newOrder.id);
            setNewCount((c) => c + 1);
            setLatestOrder(newOrder);
            triggerNewOrderAlarm([newOrder]);

            // Auto-fetch updated list to show new order immediately
            fetchRows().then((rows) => {
              setOrders(rows);
            }).catch(() => {});
          }
        } else if (payload.type === "status_updated") {
          fetchRows().then((rows) => {
            setOrders(rows);
          }).catch(() => {});
        }
      } catch {
        // Heartbeat or non-json message
      }
    };

    return () => {
      eventSource.close();
      stopAlarmRinging();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, tab]);

  const handleTestSound = () => {
    playAlarmSound();
  };

  return (
    <div className="ad-page">
      {/* Alarm Alert Banner */}
      {newCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-600 text-white flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="font-bold text-base">
                NEW ORDER ARRIVED! ({newCount} new {newCount === 1 ? "order" : "orders"})
              </h3>
              {latestOrder && (
                <p className="text-xs text-red-100">
                  Latest: #{latestOrder.id} from {latestOrder.customerName} ({money(latestOrder.totalAmount, latestOrder.currency)})
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-white text-red-700 font-bold rounded-lg hover:bg-red-50 transition shadow"
            onClick={load}
          >
            Stop Alarm & Refresh View
          </button>
        </div>
      )}

      <div className="ad-page-head">
        <div>
          <h1>Orders</h1>
          <p className="ad-page-sub">Manage and prepare incoming orders</p>
        </div>
        <div className="ad-head-actions">
          <button
            type="button"
            className={`ad-btn ${soundEnabled ? "ghost" : "ghost text-gray-400"}`}
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) handleTestSound();
              else stopAlarmRinging();
            }}
            title="Toggle or test alarm sound"
          >
            {soundEnabled ? "🔔 Alarm: ON (Test)" : "🔕 Alarm: OFF"}
          </button>

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
              onClick={() => router.push(`/${locale}/admin/orders/details?id=${o.id}`)}
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
               {o.items?.slice(0, 2).map((item) => item?.name).join(", ")}
                {o.items?.length > 2 ? ` +${o.items.length - 2}` : ""}
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

