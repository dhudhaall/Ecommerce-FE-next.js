"use client";

import { Suspense, useEffect, useState } from "react";
import { api } from "@/app/[locale]/admin/lib/adminApi";
import {
  STATUS_FLOW,
  STATUS_LABEL,
  nextStatus,
  money,
  type OrderStatus,
  type PaymentStatus,
} from "../../lib/orders";
import { printSlip } from "./OrderSlip";
import { useSearchParams, useRouter } from "next/navigation";
interface OrderItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  size: { id: number | null; name: string; price: number | null } | null;
  addons: { id: number | null; name: string }[];
  addonTotal: number;
  itemTotal: number;
  notes: string | null;
}

interface OrderDetail {
  id: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  customer: { name: string; email: string; phone: string };
  delivery: { type: string; address: string | null; city: string | null; postalCode: string | null };
  notes: string | null;
  items: OrderItem[];
  pricing: { subtotal: number; deliveryFee: number; totalAmount: number; currency: string };
  createdAt: string;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <OrderDetailPage />
    </Suspense>
  );
}

 function OrderDetailPage() {
 const id = useSearchParams().get("id");
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<OrderStatus | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ order: OrderDetail }>(`/admin/orders/${id}`);
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const changeStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(status);
    try {
      await api(`/admin/orders/${order.id}/status`, { method: "PATCH", body: { status } });
      setOrder({ ...order, status });
    } catch (err: any) {
      setError(err.message || "Could not update status.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="ad-page">
        <div className="ad-state">
          <span className="ad-spinner" /> Loading order…
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="ad-page">
        <button type="button" className="ad-back" onClick={() => router.push("/admin/orders")}>
          ‹ Back to orders
        </button>
        <div className="ad-state">
          <p className="ad-err-text">{error || "Order not found."}</p>
          <button type="button" className="ad-btn ghost" onClick={load}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const next = nextStatus(order.status);
  const cardUnpaid = order.paymentMethod !== "cash" && order.paymentStatus !== "paid";
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="ad-page">
      <button type="button" className="ad-back" onClick={() => router.push("/admin/orders")}>
        ‹ Back to orders
      </button>

      <div className="ad-detail-head">
        <div>
          <h1>Order #{order.id}</h1>
          <p className="ad-page-sub">
            {new Date(order.createdAt).toLocaleString()} · {order.delivery.type === "pickup" ? "Pickup" : "Delivery"}
          </p>
        </div>
        <div className="ad-detail-head-right">
        <div className="ad-print-group">
            <button type="button" className="ad-btn ghost" onClick={() => printSlip(order, "kitchen")}>
              <PrintIcon /> Kitchen slip
            </button>
            <button type="button" className="ad-btn ghost" onClick={() => printSlip(order, "customer")}>
              <PrintIcon /> Customer receipt
            </button>
          </div>
        <span className={`ad-badge lg status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>
      </div>

      {cardUnpaid && (
        <div className="ad-warn">
          ⚠ This is a card order that is <strong>not paid yet</strong> — do not prepare until payment is confirmed.
        </div>
      )}

      {/* Status progress + actions */}
      <div className="ad-card">
        <div className="ad-card-title">Order status</div>

        <div className="ad-progress">
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className={`ad-step ${i <= currentIndex ? "done" : ""} ${i === currentIndex ? "current" : ""}`}>
              <span className="ad-step-dot">{i < currentIndex ? "✓" : i + 1}</span>
              <span className="ad-step-label">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>

        <div className="ad-status-actions">
          {order.status === "cancelled" ? (
            <span className="ad-muted">This order was cancelled.</span>
          ) : order.status === "delivered" ? (
            <span className="ad-done-msg">✓ Order completed.</span>
          ) : (
            <>
              {next && (
                <button
                  type="button"
                  className="ad-btn primary"
                  onClick={() => changeStatus(next)}
                  disabled={!!updating}
                >
                  {updating === next ? <span className="ad-spinner light" /> : `Mark as ${STATUS_LABEL[next]}`}
                </button>
              )}
              <button
                type="button"
                className="ad-btn danger-ghost"
                onClick={() => changeStatus("cancelled")}
                disabled={!!updating}
              >
                {updating === "cancelled" ? <span className="ad-spinner" /> : "Cancel order"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ad-detail-grid">
        {/* Items */}
        <div className="ad-card">
          <div className="ad-card-title">Items ({order.items.length})</div>
          {order.items.map((item) => (
            <div key={item.id} className="ad-item">
              <div className="ad-item-qty">{item.quantity}×</div>
              <div className="ad-item-body">
                <div className="ad-item-name">{item.name}</div>
                {item.size && <div className="ad-item-line">Size: {item.size.name}</div>}
                {item.addons.length > 0 && (
                  <div className="ad-item-line">Add-ons: {item.addons.map((a) => a.name).join(", ")}</div>
                )}
                {item.notes && <div className="ad-item-note">📝 {item.notes}</div>}
              </div>
              <div className="ad-item-price">{money(item.itemTotal, order.pricing.currency)}</div>
            </div>
          ))}

          <div className="ad-totals">
            <div className="ad-total-row">
              <span>Subtotal</span>
              <span>{money(order.pricing.subtotal, order.pricing.currency)}</span>
            </div>
            <div className="ad-total-row">
              <span>Delivery fee</span>
              <span>{money(order.pricing.deliveryFee, order.pricing.currency)}</span>
            </div>
            <div className="ad-total-row grand">
              <span>Total</span>
              <span>{money(order.pricing.totalAmount, order.pricing.currency)}</span>
            </div>
          </div>
        </div>

        {/* Customer + delivery */}
        <div className="ad-card">
          <div className="ad-card-title">Customer</div>
          <dl className="ad-info">
            <dt>Name</dt>
            <dd>{order.customer.name}</dd>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
            </dd>
            <dt>Email</dt>
            <dd>{order.customer.email}</dd>
          </dl>

          <div className="ad-card-title mt">
            {order.delivery.type === "pickup" ? "Pickup" : "Delivery address"}
          </div>
          {order.delivery.type === "pickup" ? (
            <p className="ad-muted">Customer will collect this order.</p>
          ) : (
            <dl className="ad-info">
              <dt>Address</dt>
              <dd>{order.delivery.address}</dd>
              <dt>City</dt>
              <dd>{order.delivery.city}</dd>
              <dt>Postal</dt>
              <dd>{order.delivery.postalCode}</dd>
            </dl>
          )}

          <div className="ad-card-title mt">Payment</div>
          <dl className="ad-info">
            <dt>Method</dt>
            <dd style={{ textTransform: "capitalize" }}>{order.paymentMethod}</dd>
            <dt>Status</dt>
            <dd>
              <span className={`ad-badge ${order.paymentStatus === "paid" ? "pay-paid" : order.paymentStatus === "failed" ? "pay-failed" : order.paymentMethod === "cash" ? "pay-cod" : "pay-unpaid"}`}>
                {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "failed" ? "Failed" : order.paymentMethod === "cash" ? "Cash (COD)" : "Unpaid"}
              </span>
            </dd>
          </dl>

          {order.notes && (
            <>
              <div className="ad-card-title mt">Order notes</div>
              <p className="ad-item-note block">📝 {order.notes}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}




function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}