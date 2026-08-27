import { money, STATUS_LABEL, type OrderStatus, type PaymentStatus } from "@/app/admin/lib/orders";

/* ---------------- Types ---------------- */

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

const STORE_NAME = "Pizzeria Con Amore";
const STORE_PHONE = "+49 000 000000"; // TODO: your store phone
const STORE_ADDR = "Your street, City"; // TODO: your store address

/* ---------------- CSS (inlined into the iframe) ---------------- */

const SLIP_CSS = `
@page { size: 80mm auto; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
body {
  font-family: ui-monospace, "Courier New", Courier, monospace;
  font-size: 12px;
  line-height: 1.35;
  color: #000;
}
.slip { width: 72mm; padding: 4mm 2mm; page-break-after: always; break-after: page; }
.slip:last-child { page-break-after: auto; break-after: auto; }
.head { text-align: center; }
.store { font-size: 16px; font-weight: 700; letter-spacing: .5px; }
.tag { margin-top: 2px; font-size: 11px; letter-spacing: 2px; }
.line { border-top: 1px solid #000; margin: 6px 0; }
.line.dashed { border-top-style: dashed; }
.order-no { font-size: 18px; font-weight: 700; text-align: center; }
.row-sm { display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px; }
.badge { margin-top: 4px; text-align: center; font-weight: 700; letter-spacing: 1px; }
.item { margin-bottom: 6px; }
.item-top { display: flex; gap: 6px; font-weight: 700; }
.qty { flex: 0 0 auto; }
.name { flex: 1 1 auto; }
.price { flex: 0 0 auto; }
.sub { padding-left: 18px; font-size: 11px; }
.note { padding-left: 18px; font-size: 11px; font-weight: 700; }
.row { display: flex; justify-content: space-between; }
.row.grand { font-size: 15px; font-weight: 700; margin-top: 4px; }
.row.pay { font-size: 11px; margin-top: 4px; }
.cust-name { font-weight: 700; }
.note-label { font-weight: 700; letter-spacing: 1px; }
.order-note { font-weight: 700; }
.foot { text-align: center; font-size: 11px; }
.thanks { margin-top: 4px; font-weight: 700; }
`;

/* ---------------- HTML builders ---------------- */

/** Escape user-supplied text before it goes into the iframe document. */
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSlip(order: OrderDetail, type: SlipType): string {
  const isKitchen = type === "kitchen";
  const placed = new Date(order.createdAt);
  const cur = order.pricing.currency;

  const items = order.items
    .map((item) => {
      const price = isKitchen ? "" : `<span class="price">${esc(money(item.itemTotal, cur))}</span>`;
      const size = item.size ? `<div class="sub">- ${esc(item.size.name)}</div>` : "";
      const addons = item.addons.length
        ? `<div class="sub">+ ${esc(item.addons.map((a) => a.name).join(", "))}</div>`
        : "";
      const notes = item.notes ? `<div class="note">** ${esc(item.notes)} **</div>` : "";
      return `
        <div class="item">
          <div class="item-top">
            <span class="qty">${esc(item.quantity)}x</span>
            <span class="name">${esc(item.name)}</span>
            ${price}
          </div>
          ${size}${addons}${notes}
        </div>`;
    })
    .join("");

  const payLabel =
    order.paymentStatus === "paid"
      ? "PAID"
      : order.paymentMethod === "cash"
      ? "PAY ON DELIVERY"
      : "UNPAID";

  const totals = isKitchen
    ? ""
    : `
      <div class="line dashed"></div>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${esc(money(order.pricing.subtotal, cur))}</span></div>
        <div class="row"><span>Delivery</span><span>${esc(money(order.pricing.deliveryFee, cur))}</span></div>
        <div class="row grand"><span>TOTAL</span><span>${esc(money(order.pricing.totalAmount, cur))}</span></div>
        <div class="row pay"><span>${esc(order.paymentMethod.toUpperCase())}</span><span>${payLabel}</span></div>
      </div>`;

  const addressBlock =
    order.delivery.type === "delivery"
      ? `<div>${esc(order.delivery.address)}</div>
         <div>${esc(order.delivery.city)} ${esc(order.delivery.postalCode)}</div>`
      : "";

  const orderNote = order.notes
    ? `<div class="line dashed"></div>
       <div class="order-note"><div class="note-label">NOTE</div>${esc(order.notes)}</div>`
    : "";

  const foot = isKitchen
    ? `Status: ${esc(STATUS_LABEL[order.status])}`
    : `<div>${esc(STORE_NAME)}</div>
       <div>${esc(STORE_PHONE)}</div>
       <div>${esc(STORE_ADDR)}</div>
       <div class="thanks">Thank you for your order!</div>`;

  return `
    <div class="slip">
      <div class="head">
        <div class="store">${esc(STORE_NAME)}</div>
        <div class="tag">${isKitchen ? "KITCHEN COPY" : "CUSTOMER RECEIPT"}</div>
      </div>

      <div class="line"></div>

      <div class="meta">
        <div class="order-no">ORDER #${esc(order.id)}</div>
        <div class="row-sm">
          <span>${esc(placed.toLocaleDateString())}</span>
          <span>${esc(placed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span>
        </div>
        <div class="badge">${order.delivery.type === "pickup" ? "* PICKUP" : "&gt; DELIVERY"}</div>
      </div>

      <div class="line dashed"></div>

      <div class="items">${items}</div>

      ${totals}

      <div class="line dashed"></div>

      <div class="cust">
        <div class="cust-name">${esc(order.customer.name)}</div>
        <div>${esc(order.customer.phone)}</div>
        ${addressBlock}
      </div>

      ${orderNote}

      <div class="line"></div>

      <div class="foot">${foot}</div>
    </div>`;
}

/* ---------------- Public API ---------------- */

/**
 * Prints the slip from an isolated iframe with its own document and CSS.
 * Nothing from the admin app's stylesheets, layout or class-name hashing
 * can affect the output.
 */
export function printSlip(order: OrderDetail, which: "kitchen" | "customer" | "both" = "both") {
  const parts: string[] = [];
  if (which === "kitchen" || which === "both") parts.push(buildSlip(order, "kitchen"));
  if (which === "customer" || which === "both") parts.push(buildSlip(order, "customer"));

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    console.error("printSlip: could not open iframe document");
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>Order ${order.id}</title>` +
      `<style>${SLIP_CSS}</style></head><body>${parts.join("")}</body></html>`
  );
  doc.close();

  const run = () => {
    // One frame for layout, then print.
    requestAnimationFrame(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 2000);
    });
  };

  if (doc.readyState === "complete") run();
  else frame.addEventListener("load", run, { once: true });
}

/**
 * Debug helper: opens the slip in a new tab so you can see exactly what
 * would be sent to the printer. Call this from the console if a print
 * still comes out blank.
 */
export function previewSlip(order: OrderDetail, which: "kitchen" | "customer" | "both" = "both") {
  const parts: string[] = [];
  if (which === "kitchen" || which === "both") parts.push(buildSlip(order, "kitchen"));
  if (which === "customer" || which === "both") parts.push(buildSlip(order, "customer"));

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>Slip preview</title>` +
      `<style>${SLIP_CSS}</style></head><body>${parts.join("")}</body></html>`
  );
  win.document.close();
}