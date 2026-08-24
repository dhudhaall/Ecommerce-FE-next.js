"use client";

import { money, STATUS_LABEL, type OrderStatus, type PaymentStatus } from "@/app/[locale]/admin/lib/orders";

/* ---------------- Types (mirror the detail page) ---------------- */

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

type SlipType = "kitchen" | "customer";

const STORE_NAME = " Pizzeria Con Amore.";
const STORE_PHONE = "+49 000 000000"; // TODO: your store phone
const STORE_ADDR = "Your street, City"; // TODO: your store address

/**
 * Hidden on screen (see .slip-print-root in admin.css); only visible when
 * printing. Which slip prints is controlled by a body attribute set just
 * before window.print() — see printSlip() below.
 */
export default function OrderSlip({ order }: { order: OrderDetail }) {
  return (
    <div className="slip-print-root" aria-hidden>
      <Slip order={order} type="kitchen" />
      <Slip order={order} type="customer" />
    </div>
  );
}

function Slip({ order, type }: { order: OrderDetail; type: SlipType }) {
  const isKitchen = type === "kitchen";
  const placed = new Date(order.createdAt);
  const cur = order.pricing.currency;

  return (
    <div className={`slip slip-${type}`}>
      {/* Header */}
      <div className="slip-head">
        <div className="slip-store">{STORE_NAME}</div>
        <div className="slip-tag">{isKitchen ? "KITCHEN COPY" : "CUSTOMER RECEIPT"}</div>
      </div>

      <div className="slip-line" />

      {/* Order meta */}
      <div className="slip-meta">
        <div className="slip-order-no">ORDER #{order.id}</div>
        <div className="slip-row-sm">
          <span>{placed.toLocaleDateString()}</span>
          <span>{placed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="slip-type-badge">
          {order.delivery.type === "pickup" ? "★ PICKUP" : "▶ DELIVERY"}
        </div>
      </div>

      <div className="slip-line dashed" />

      {/* Items */}
      <div className="slip-items">
        {order.items.map((item) => (
          <div className="slip-item" key={item.id}>
            <div className="slip-item-top">
              <span className="slip-qty">{item.quantity}×</span>
              <span className="slip-name">{item.name}</span>
              {!isKitchen && (
                <span className="slip-price">{money(item.itemTotal, cur)}</span>
              )}
            </div>
            {item.size && <div className="slip-sub">— {item.size.name}</div>}
            {item.addons.length > 0 && (
              <div className="slip-sub">+ {item.addons.map((a) => a.name).join(", ")}</div>
            )}
            {item.notes && <div className="slip-note">** {item.notes} **</div>}
          </div>
        ))}
      </div>

      {/* Customer-only: price totals */}
      {!isKitchen && (
        <>
          <div className="slip-line dashed" />
          <div className="slip-totals">
            <div className="slip-row">
              <span>Subtotal</span>
              <span>{money(order.pricing.subtotal, cur)}</span>
            </div>
            <div className="slip-row">
              <span>Delivery</span>
              <span>{money(order.pricing.deliveryFee, cur)}</span>
            </div>
            <div className="slip-row grand">
              <span>TOTAL</span>
              <span>{money(order.pricing.totalAmount, cur)}</span>
            </div>
            <div className="slip-row pay">
              <span>{order.paymentMethod.toUpperCase()}</span>
              <span>{order.paymentStatus === "paid" ? "PAID" : order.paymentMethod === "cash" ? "PAY ON DELIVERY" : "UNPAID"}</span>
            </div>
          </div>
        </>
      )}

      <div className="slip-line dashed" />

      {/* Customer + delivery */}
      <div className="slip-cust">
        <div className="slip-cust-name">{order.customer.name}</div>
        <div>{order.customer.phone}</div>
        {order.delivery.type === "delivery" && (
          <>
            <div>{order.delivery.address}</div>
            <div>
              {order.delivery.city} {order.delivery.postalCode}
            </div>
          </>
        )}
      </div>

      {/* Whole-order note — important for kitchen */}
      {order.notes && (
        <>
          <div className="slip-line dashed" />
          <div className="slip-order-note">
            <div className="slip-note-label">NOTE</div>
            {order.notes}
          </div>
        </>
      )}

      <div className="slip-line" />

      {/* Footer */}
      <div className="slip-foot">
        {isKitchen ? (
          <>Status: {STATUS_LABEL[order.status]}</>
        ) : (
          <>
            <div>{STORE_NAME}</div>
            <div>{STORE_PHONE}</div>
            <div>{STORE_ADDR}</div>
            <div className="slip-thanks">Thank you for your order!</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Print trigger ----------------
 * Sets a data attribute on <body> so CSS shows only the chosen slip,
 * prints, then clears it. Import and call from the detail page buttons. */

export function printSlip(which: "kitchen" | "customer" | "both") {
  document.body.setAttribute("data-print-slip", which);
  window.print();
  // Clean up after the print dialog closes
  const clear = () => {
    document.body.removeAttribute("data-print-slip");
    window.removeEventListener("afterprint", clear);
  };
  window.addEventListener("afterprint", clear);
}