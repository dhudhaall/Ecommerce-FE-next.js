"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ---- Loose types — match whatever you store in localStorage ---- */
type Addon = { id?: string | number; name?: string; price?: number };
type CartItem = {
  productId?: string | number;
  product?: { name?: string; images?: { url?: string }[] };
  size?: { name?: string };
  addons?: Addon[];
  quantity?: number;
  totalPrice?: number;
};
type Pricing = {
  subtotal: number;
  delivery?: number;
  tax?: number;
  discount?: number;
  total: number;
};

/**
 * Point this at the SAME endpoint your /checkout page uses to price the cart.
 * Whatever server-side math checkout does (delivery, tax, discounts, price
 * re-validation) is then reflected here too, so the two never disagree.
 * If the call fails, we fall back to the client-side subtotal — nothing breaks.
 *
 * >>> TODO: replace with your real route + request/response shape <<<
 */
const PRICING_ENDPOINT = "/api/cart/price";
const ENABLE_SERVER_PRICING = true; // flip to false until the route exists

const euro = (n: number) => `€${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  /* Load once from localStorage */
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    } catch {
      setCart([]);
    }
    setHydrated(true);
  }, []);

  /* Persist on every change — guarded so we never clobber storage on mount */
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  /* Instant, client-side subtotal — NaN-safe, always correct (incl. empty = 0) */
  const subtotal = useMemo(
    () => round2(cart.reduce((sum, it) => sum + (Number(it?.totalPrice) || 0), 0)),
    [cart]
  );

  /* Authoritative totals from the checkout pricing API (debounced) */
  useEffect(() => {
    if (!ENABLE_SERVER_PRICING || !hydrated) return;
    if (cart.length === 0) {
      setPricing(null);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(() => priceCart(cart, controller.signal), 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [cart, hydrated]);

  async function priceCart(items: CartItem[], signal: AbortSignal) {
    try {
      setPricingLoading(true);
      const res = await fetch(PRICING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal,
      });
      if (!res.ok) throw new Error(`Pricing failed (${res.status})`);
      const data = await res.json();
      setPricing({
        subtotal: Number(data.subtotal),
        delivery: data.delivery != null ? Number(data.delivery) : undefined,
        tax: data.tax != null ? Number(data.tax) : undefined,
        discount: data.discount != null ? Number(data.discount) : undefined,
        total: Number(data.total),
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") setPricing(null); // graceful fallback
    } finally {
      setPricingLoading(false);
    }
  }

  /* Per-unit price derived from stored total (totalPrice already includes qty) */
  const unitPrice = (item: CartItem) => {
    const q = Number(item?.quantity) || 1;
    const tp = Number(item?.totalPrice) || 0;
    return q > 0 ? tp / q : tp;
  };

  /* Change qty AND recompute this item's totalPrice so the total stays correct */
  const changeQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextQty = Math.max(1, (Number(item?.quantity) || 1) + delta);
        return { ...item, quantity: nextQty, totalPrice: round2(unitPrice(item) * nextQty) };
      })
    );
  };

  const removeItem = (index: number) =>
     setCart((prev) => prev.filter((_, i) => i !== index));
     window.dispatchEvent(new Event("cartUpdated"));
  const count = cart.reduce((n, it) => n + (Number(it?.quantity) || 1), 0);
  const displayTotal =
    pricing && Number.isFinite(pricing.total) ? pricing.total : subtotal;

  return (
    <main className="cart-page">
      <div className="cart-container">
        <header className="cart-head">
          <h1 className="cart-title">Your Cart</h1>
          {hydrated && cart.length > 0 && (
            <span className="cart-count">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </header>

        {!hydrated ? (
          <div className="cart-loading">Loading your cart…</div>
        ) : cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon" aria-hidden="true">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven’t added anything yet.</p>
            <button className="ghost-btn" onClick={() => router.push("/")}>
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-list" aria-label="Cart items">
              {cart.map((item, i) => {
                const addons = (item?.addons || []).filter((a) => a?.name);
                const qty = Number(item?.quantity) || 1;
                return (
                  <article className="cart-item" key={`product-${i}`}>
                    <img
                      className="cart-img"
                      src={item?.product?.images?.[0]?.url || "/images/no-image.jpeg"}
                      alt={item?.product?.name || "Product image"}
                      loading="lazy"
                    />

                    <div className="cart-details">
                      <h3 className="cart-name">{item?.product?.name || "Unnamed item"}</h3>

                      {(item?.size?.name || addons.length > 0) && (
                        <div className="cart-tags">
                          {item?.size?.name && <span className="chip">{item.size.name}</span>}
                          {addons.map((a, idx) => (
                            <span className="chip chip-muted" key={a?.id ?? idx}>
                              + {a.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="cart-price">{euro(Number(item?.totalPrice) || 0)}</div>
                    </div>

                    <div className="cart-actions">
                      <div className="qty" role="group" aria-label="Quantity">
                        <button
                          className="qty-btn"
                          onClick={() => changeQty(i, -1)}
                          disabled={qty <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => changeQty(i, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => removeItem(i)}
                        aria-label={`Remove ${item?.product?.name || "item"}`}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="cart-summary" aria-label="Order summary">
              <h2 className="summary-title">Order summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{euro(pricing?.subtotal ?? subtotal)}</span>
              </div>

              {pricing?.discount ? (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>−{euro(pricing.discount)}</span>
                </div>
              ) : null}

              {pricing?.delivery != null && (
                <div className="summary-row">
                  <span>Delivery</span>
                  <span>{pricing.delivery === 0 ? "Free" : euro(pricing.delivery)}</span>
                </div>
              )}

              {pricing?.tax != null && (
                <div className="summary-row">
                  <span>Tax</span>
                  <span>{euro(pricing.tax)}</span>
                </div>
              )}

              <div className="summary-row summary-total">
                <span>Total</span>
                <span className={pricingLoading ? "is-loading" : ""}>{euro(displayTotal)}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={() => router.push("/checkout")}
                disabled={cart.length === 0}
              >
                Checkout <span aria-hidden="true">→</span>
              </button>

              {!pricing && (
                <p className="summary-note">Taxes &amp; delivery calculated at checkout.</p>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}