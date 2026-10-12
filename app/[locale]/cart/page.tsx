"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/* ---- Loose types — match whatever you store in localStorage ---- */
type Addon = {
  id?: string | number;
  name?: string;
  price?: number;
};

type CartItem = {
  productId?: string | number;
  product?: {
    id?: string | number;
    name?: string;
    images?: any | null;
    price: number;
  };
  size?: {
    id?: string | number;
    name?: string;
    price?: number;
  };
  addons?: Addon[];
  quantity?: number;
  unitPrice?: number;
  itemTotal?: number;
  totalPrice?: number;
};

type Pricing = {
  subtotal: number;
  delivery?: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
};

const PRICING_ENDPOINT =
  `${process.env.NEXT_PUBLIC_baseURL}/checkout/summary`;

const ENABLE_SERVER_PRICING = true;

const euro = (n: number) =>
  `€${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

const round2 = (n: number) =>
  Math.round(n * 100) / 100;

export default function CartPage() {
  const router = useRouter();
  const translation = useTranslations("CartPage");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  /* Helper to calculate item price breakdown */
  const getItemPrices = (item: CartItem) => {
    const basePrice =
      Number(item?.size?.price) || Number(item?.product?.price) || 0;
    const addonsPrice = (item?.addons || []).reduce(
      (sum, a) => sum + (Number(a?.price) || 0),
      0
    );
    const unitPrice = basePrice + addonsPrice;
    const qty = Number(item?.quantity) || 1;
    const itemTotal = unitPrice * qty;
    return { basePrice, addonsPrice, unitPrice, itemTotal };
  };

  /* Load once from localStorage */
  useEffect(() => {
    try {
      setCart(
        JSON.parse(
          localStorage.getItem("cart") || "[]"
        )
      );
    } catch {
      setCart([]);
    }

    setHydrated(true);
  }, []);

  /* Persist on every change */
  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart, hydrated]);

  /* Client-side subtotal */
  const subtotal = useMemo(
    () =>
      round2(
        cart.reduce(
          (sum, it) => sum + getItemPrices(it).itemTotal,
          0
        )
      ),
    [cart]
  );

  /* Server-side pricing */
  useEffect(() => {
    if (!ENABLE_SERVER_PRICING || !hydrated)
      return;

    if (cart.length === 0) {
      setPricing(null);
      return;
    }

    const controller =
      new AbortController();

    const t = setTimeout(
      () =>
        priceCart(
          cart,
          controller.signal
        ),
      300
    );

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [cart, hydrated]);

  async function priceCart(
    items: CartItem[],
    signal: AbortSignal
  ) {
    try {
      setPricingLoading(true);

      const payloadItems = items.map((it) => ({
        productId: it.productId || it.product?.id,
        quantity: it.quantity || 1,
        sizeId: it.size?.id ?? null,
        addonIds: (it.addons || []).map((a) => a.id).filter(Boolean),
      }));

      const res = await fetch(
        PRICING_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({ items: payloadItems }),
          signal,
        }
      );

      if (!res.ok) {
        throw new Error(
          `Pricing failed (${res.status})`
        );
      }

      const data = await res.json();

      setPricing({
        subtotal: Number(data.subtotal ?? data.totalAmount ?? subtotal),
        delivery:
          data.delivery != null
            ? Number(data.delivery)
            : undefined,
        tax:
          data.tax != null
            ? Number(data.tax)
            : undefined,
        discount:
          data.discount != null
            ? Number(data.discount)
            : undefined,
        totalAmount: Number(
          data.totalAmount ?? data.subtotal ?? subtotal
        ),
      });
    } catch (err) {
      if (
        (err as Error).name !==
        "AbortError"
      ) {
        setPricing(null);
      }
    } finally {
      setPricingLoading(false);
    }
  }

  /* Change quantity */
  const changeQty = (
    index: number,
    delta: number
  ) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const nextQty = Math.max(
          1,
          (Number(item?.quantity) || 1) +
            delta
        );

        const { unitPrice, itemTotal } = getItemPrices({
          ...item,
          quantity: nextQty,
        });

        return {
          ...item,
          quantity: nextQty,
          unitPrice,
          itemTotal,
          totalPrice: itemTotal,
        };
      })
    );
  };

  /* Remove item */
  const removeItem = (index: number) =>
    setCart((prev) =>
      prev.filter((_, i) => i !== index)
    );

  const count = cart.reduce(
    (n, it) =>
      n +
      (Number(it?.quantity) || 1),
    0
  );

  const displayTotal =
    pricing &&
    Number.isFinite(
      pricing.totalAmount
    )
      ? pricing.totalAmount
      : subtotal;

  return (
    <main className="cart-page">
      <div className="cart-container">

        {/* Header */}
        <header className="cart-head">

          <h1 className="cart-title">
            {translation("title")}
          </h1>

          {hydrated &&
            cart.length > 0 && (
              <span className="cart-count">
                {count}{" "}
                {count === 1
                  ? translation("item")
                  : translation("items")}
              </span>
            )}

        </header>

        {/* Loading */}
        {!hydrated ? (
          <div className="cart-loading">
            {translation("loading")}
          </div>
        ) : cart.length === 0 ? (

          /* Empty cart */
          <div className="empty-cart">

            <div
              className="empty-cart-icon"
              aria-hidden="true"
            >
              🛒
            </div>

            <h2>
              {translation(
                "empty.title"
              )}
            </h2>

            <p>
              {translation(
                "empty.description"
              )}
            </p>

            <button
              className="ghost-btn"
              onClick={() =>
                router.push("/")
              }
            >
              {translation(
                "empty.continue_shopping"
              )}
            </button>

          </div>

        ) : (

          /* Cart layout */
          <div className="cart-layout">

            {/* Cart items */}
            <section
              className="cart-list"
              aria-label={translation(
                "items_label"
              )}
            >

              {cart.map((item, i) => {
                const addons = (
                  item?.addons || []
                ).filter(
                  (a) => a?.name
                );

                const qty =
                  Number(
                    item?.quantity
                  ) || 1;

                const { unitPrice, itemTotal } = getItemPrices(item);

                return (
                  <article
                    className="cart-item"
                    key={`product-${i}`}
                  >

                    {/* Product image */}
                    <img
                      className="cart-img"
                      src={
                        item?.product
                          ?.images?.[0]
                          ?.url ||
                        "/images/no-image.jpeg"
                      }
                      alt={
                        item?.product
                          ?.name ||
                        translation(
                          "product_image"
                        )
                      }
                      loading="lazy"
                    />

                    {/* Product details */}
                    <div className="cart-details">

                      <h3 className="cart-name">
                        {item?.product
                          ?.name ||
                          translation(
                            "unnamed_item"
                          )}
                      </h3>

                      {(item?.size?.name ||
                        addons.length >
                          0) && (
                        <div className="cart-tags">

                          {item?.size
                            ?.name && (
                            <span className="chip">
                              {
                                item.size
                                  .name
                              }
                              {item.size.price != null && ` (€${item.size.price})`}
                            </span>
                          )}

                          {addons.map(
                            (a, idx) => (
                              <span
                                className="chip chip-muted"
                                key={
                                  a?.id ??
                                  idx
                                }
                              >
                                +{" "}
                                {a.name}
                                {a.price != null && ` (€${a.price})`}
                              </span>
                            )
                          )}

                        </div>
                      )}

                      <div className="cart-price">
                        {euro(unitPrice)}
                        {qty > 1 && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            ({euro(itemTotal)} total)
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="cart-actions">

                      <div
                        className="qty"
                        role="group"
                        aria-label={translation(
                          "quantity"
                        )}
                      >

                        <button
                          className="qty-btn"
                          onClick={() =>
                            changeQty(
                              i,
                              -1
                            )
                          }
                          disabled={
                            qty <= 1
                          }
                          aria-label={translation(
                            "decrease_quantity"
                          )}
                        >
                          −
                        </button>

                        <span className="qty-value">
                          {qty}
                        </span>

                        <button
                          className="qty-btn"
                          onClick={() =>
                            changeQty(
                              i,
                              1
                            )
                          }
                          aria-label={translation(
                            "increase_quantity"
                          )}
                        >
                          +
                        </button>

                      </div>

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeItem(i)
                        }
                        aria-label={translation(
                          "remove_item",
                          {
                            item:
                              item
                                ?.product
                                ?.name ||
                              translation(
                                "item"
                              ),
                          }
                        )}
                        title={translation(
                          "remove"
                        )}
                      >
                        ✕
                      </button>

                    </div>

                  </article>
                );
              })}

            </section>

            {/* Order summary */}
            <aside
              className="cart-summary"
              aria-label={translation(
                "summary.aria_label"
              )}
            >

              <h2 className="summary-title">
                {translation(
                  "summary.title"
                )}
              </h2>

              {/* Pricing loading */}
              {pricingLoading && (
                <div className="co-cart-state">
                  <span className="co-spinner" />
                  {" "}
                  {translation(
                    "summary.loading"
                  )}
                </div>
              )}

              {pricing &&
                !pricingLoading && (
                  <>
                    {/* Subtotal */}
                    <div className="summary-row">
                      <span>
                        {translation(
                          "summary.subtotal"
                        )}
                      </span>

                      <span>
                        {euro(
                          pricing?.subtotal ??
                            subtotal
                        )}
                      </span>
                    </div>

                    {/* Discount */}
                    {pricing?.discount ? (
                      <div className="summary-row discount">

                        <span>
                          {translation(
                            "summary.discount"
                          )}
                        </span>

                        <span>
                          −
                          {euro(
                            pricing.discount
                          )}
                        </span>

                      </div>
                    ) : null}

                    {/* Delivery */}
                    {pricing?.delivery !=
                      null && (
                      <div className="summary-row">

                        <span>
                          {translation(
                            "summary.delivery"
                          )}
                        </span>

                        <span>
                          {pricing.delivery ===
                          0
                            ? translation(
                                "summary.free"
                              )
                            : euro(
                                pricing.delivery
                              )}
                        </span>

                      </div>
                    )}

                    {/* Tax */}
                    {pricing?.tax != null && (
                      <div className="summary-row">

                        <span>
                          {translation(
                            "summary.tax"
                          )}
                        </span>

                        <span>
                          {euro(
                            pricing.tax
                          )}
                        </span>

                      </div>
                    )}

                    {/* Total */}
                    <div className="summary-row summary-total">

                      <span>
                        {translation(
                          "summary.total"
                        )}
                      </span>

                      <span
                        className={
                          pricingLoading
                            ? "is-loading"
                            : ""
                        }
                      >
                        {euro(
                          displayTotal
                        )}
                      </span>

                    </div>

                    {/* Checkout */}
                    <button
                      className="checkout-btn"
                      onClick={() =>
                        router.push(
                          "/checkout"
                        )
                      }
                      disabled={
                        cart.length === 0
                      }
                    >
                      {translation(
                        "summary.checkout"
                      )}{" "}
                      <span aria-hidden="true">
                        →
                      </span>
                    </button>

                    {!pricing && (
                      <p className="summary-note">
                        {translation(
                          "summary.note"
                        )}
                      </p>
                    )}

                  </>
                )}

            </aside>

          </div>
        )}
      </div>
    </main>
  );
}