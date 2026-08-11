// lib/orders.ts
// Shared order status config used by the list tabs, badges, and detail flow.

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

// The ordered kitchen/delivery pipeline (drives the "next status" buttons)
export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Tabs shown on the orders list. `value` maps to the API's ?status= filter;
// "all" and "active" are client groupings.
export const STATUS_TABS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "New", statuses: ["pending", "confirmed"] },
  { key: "preparing", label: "Preparing", statuses: ["preparing"] },
  { key: "out_for_delivery", label: "Out for delivery", statuses: ["out_for_delivery"] },
  { key: "delivered", label: "Completed", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

// Given the current status, what's the next forward action (or null if terminal)
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  if (i === -1 || i === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

export const money = (n: number, currency = "eur") =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: currency.toUpperCase() }).format(n);

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}