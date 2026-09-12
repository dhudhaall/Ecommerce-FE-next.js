"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  loadStripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import {
  Elements,
} from "@stripe/react-stripe-js";
import { StripeCardSection } from "./StripeCardSection";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/* ---------------- Types ---------------- */

interface Product {
  id: number;
  name: string;
  price: number;
  image: string | null;
}

interface Size {
  id: number;
  name: string;
  price: number;
  productId: number;
}

interface Addon {
  id: number;
  name: string;
  price: number;
  productId: number;
}

interface CartItem {
  product: Product;
  productId: number;
  quantity: number;
  size: Size | null;
  addons: Addon[];
  itemTotal: number;
}

interface Cart {
  items: CartItem[];
  totalAmount: number;
}

type DeliveryType = "delivery" | "pickup";

type PaymentMethod = "cash" | "card" | "paypal";

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const DELIVERY_FEE = 3;

/* ---------------- Component ---------------- */

export default function Checkout() {
  const t = useTranslations("CheckoutPage");

  const router = useRouter();

  const [deliveryType, setDeliveryType] =
    useState<DeliveryType>("delivery");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Cart
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  const totalAmount = cart?.totalAmount ?? 0;

  const deliveryFee =
    deliveryType === "delivery" ? DELIVERY_FEE : 0;

  const grandTotal = totalAmount + deliveryFee;

  /* =========================================================
     Fetch order summary
  ========================================================= */

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setCartLoading(true);
    setCartError("");

    try {
      const stored = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      const payload = {
        items: stored?.map((item: CartItem) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size
            ? {
                id: item.size.id,
              }
            : null,
          addons: item.addons.map((a) => a.id),
        })),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_baseURL}/checkout/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load cart (${res.status})`
        );
      }

      const data: Cart = await res.json();

      if (!data?.items?.length) {
        throw new Error(
          t("errors.cart_empty")
        );
      }

      setCart(data);
    } catch (err: any) {
      setCartError(
        err.message || t("errors.could_not_load")
      );
    } finally {
      setCartLoading(false);
    }
  };

  /* =========================================================
     Validation
  ========================================================= */

  const validateField = (
    field: keyof FormState,
    value: string
  ): string => {
    const v = value.trim();

    const isPickup = deliveryType === "pickup";

    switch (field) {
      case "firstName":
        return !v
          ? t("validation.first_name_required")
          : v.length < 2
          ? t("validation.min_2_chars")
          : "";

      case "lastName":
        return !v
          ? t("validation.last_name_required")
          : v.length < 2
          ? t("validation.min_2_chars")
          : "";

      case "phone":
        return !v
          ? t("validation.phone_required")
          : !/^\+?[0-9\s()-]{7,16}$/.test(v)
          ? t("validation.phone_invalid")
          : "";

      case "email":
        return !v
          ? t("validation.email_required")
          : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
          ? t("validation.email_invalid")
          : "";

      case "address":
        if (isPickup) return "";

        return !v
          ? t("validation.address_required")
          : v.length < 5
          ? t("validation.address_invalid")
          : "";

      case "city":
        return isPickup
          ? ""
          : !v
          ? t("validation.city_required")
          : "";

      case "postalCode":
        if (isPickup) return "";

        return !v
          ? t("validation.postal_required")
          : !/^[A-Za-z0-9 -]{3,10}$/.test(v)
          ? t("validation.postal_invalid")
          : "";

      default:
        return "";
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    (
      Object.keys(form) as (keyof FormState)[]
    ).forEach((field) => {
      const message = validateField(
        field,
        form[field]
      );

      if (message) {
        newErrors[field] = message;
      }
    });

    setErrors(newErrors);

    // Scroll to first invalid field
    const firstInvalid = Object.keys(newErrors)[0];

    if (firstInvalid) {
      const el =
        formRef.current?.querySelector<HTMLInputElement>(
          `input[name="${firstInvalid}"]`
        );

      el?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      el?.focus({
        preventScroll: true,
      });
    }

    return Object.keys(newErrors).length === 0;
  };

  /* =========================================================
     Field handlers
  ========================================================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((f) => ({
      ...f,
      [name]: value,
    }));

    // Revalidate if field already has an error
    if (
      errors[name as keyof FormState] !== undefined
    ) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(
          name as keyof FormState,
          value
        ),
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(
        name as keyof FormState,
        value
      ),
    }));
  };

  /* =========================================================
     Payload
  ========================================================= */

  const buildPayload = () => ({
    customer: {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
    },

    deliveryType,

    shippingAddress:
      deliveryType === "delivery"
        ? {
            address: form.address.trim(),
            city: form.city.trim(),
            postalCode: form.postalCode.trim(),
          }
        : null,

    paymentMethod,

    items:
      cart?.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        sizeId: item.size?.id ?? null,
        addonIds: item.addons.map((a) => a.id),
      })) ?? [],

    currency: "eur",
  });

  type OrderPayload = ReturnType<
    typeof buildPayload
  >;

  /* =========================================================
     Checkout
  ========================================================= */

  const handlePayNow = async () => {
    setApiError("");

    if (!validate()) return;

    if (!cart || cart.items.length === 0) {
      setApiError(t("errors.cart_empty"));
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_baseURL}/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      console.log("Checkout response:", data);

      if (!data.success) {
        setApiError(
          data.message ||
            t("errors.checkout_failed")
        );

        setSubmitting(false);
        return;
      }

      localStorage.removeItem("cart");

      /* ---------------- CASH ---------------- */

      if (payload.paymentMethod === "cash") {
        router.push(
          `/success?orderId=${data.orderId}`
        );

        return;
      }

      /* ---------------- PAYPAL ---------------- */

      if (data.paymentType === "paypal") {
        window.location.href =
          data.approvalUrl;

        return;
      }

      setSubmitting(false);
    } catch (err) {
      console.error(err);

      setApiError(
        t("errors.checkout_failed")
      );

      setSubmitting(false);
    }
  };

  /* =========================================================
     PayPal
  ========================================================= */

  const handlePaypalPayment = async (
    payload: OrderPayload
  ) => {
    setSubmitting(true);

    try {
      const res = await fetch(
        "/api/paypal/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            t("errors.payment_failed")
        );
      }

      window.location.href =
        data.approvalUrl;
    } catch (err: any) {
      setApiError(
        err.message ||
          t("errors.payment_failed")
      );

      setSubmitting(false);
    }
  };

  /* =========================================================
     Stripe
  ========================================================= */

  const stripeOptions: StripeElementsOptions =
    useMemo(
      () => ({
        mode: "payment",

        amount: Math.max(
          Math.round(grandTotal * 100),
          50
        ),

        currency: "eur",

        appearance: {
          theme: "stripe",

          variables: {
            colorPrimary: "#1f5b3f",
            colorText: "#17251d",
            colorTextSecondary: "#6c7a70",
            colorDanger: "#c0392b",
            colorBackground: "#fbfcfa",
            fontFamily:
              "Poppins, ui-sans-serif, system-ui, sans-serif",
            borderRadius: "10px",
            spacingUnit: "4px",
          },

          rules: {
            ".Input": {
              border:
                "1.5px solid #dfe4dd",
              boxShadow: "none",
            },

            ".Input:focus": {
              border:
                "1.5px solid #1f5b3f",
              boxShadow:
                "0 0 0 3px #e7f0e9",
            },

            ".Label": {
              fontSize: "12.5px",
              fontWeight: "500",
            },
          },
        },

        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap",
          },
        ],
      }),
      [grandTotal]
    );

  /* =========================================================
     Helpers
  ========================================================= */

  const money = (n: number) =>
    `€${n.toFixed(2)}`;

  const itemMeta = (item: CartItem) => {
    const parts: string[] = [];

    if (item.size) {
      parts.push(item.size.name);
    }

    if (item.addons.length) {
      parts.push(
        item.addons
          .map((a) => a.name)
          .join(", ")
      );
    }

    return parts.join(" · ");
  };

  const showAddressFields =
    deliveryType === "delivery";

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="co-page">

      {/* ================= HEADER ================= */}

      <div className="co-head">
        <h1>{t("title")}</h1>

        <p>
          {t("subtitle")}
        </p>
      </div>

      <div className="co-cols">

        {/* ===================================================
            LEFT: FORM
        =================================================== */}

        <form
          ref={formRef}
          className="co-panel"
          noValidate
          onSubmit={(e) =>
            e.preventDefault()
          }
        >

          {/* Delivery / Pickup */}

          <div
            className="co-tabs"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                deliveryType ===
                "delivery"
              }
              className={
                deliveryType === "delivery"
                  ? "co-tab active"
                  : "co-tab"
              }
              onClick={() =>
                setDeliveryType(
                  "delivery"
                )
              }
            >
              {t("delivery")}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                deliveryType ===
                "pickup"
              }
              className={
                deliveryType === "pickup"
                  ? "co-tab active"
                  : "co-tab"
              }
              onClick={() =>
                setDeliveryType(
                  "pickup"
                )
              }
            >
              {t("pickup")}
            </button>
          </div>

          {/* Contact details */}

          <div className="co-panel-title">
            <span className="co-num">
              {t("section_number", {
                number: 1,
              })}
            </span>

            <h2>
              {t("contact_details")}
            </h2>
          </div>

          <div className="co-grid">

            <Field
              label={t(
                "fields.first_name"
              )}
              name="firstName"
              autoComplete="given-name"
              value={form.firstName}
              error={errors.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <Field
              label={t(
                "fields.last_name"
              )}
              name="lastName"
              autoComplete="family-name"
              value={form.lastName}
              error={errors.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <Field
              label={t(
                "fields.phone"
              )}
              name="phone"
              type="tel"
              placeholder="+92 300 1234567"
              autoComplete="tel"
              value={form.phone}
              error={errors.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <Field
              label={t(
                "fields.email"
              )}
              name="email"
              type="email"
              placeholder="you@email.com"
              autoComplete="email"
              value={form.email}
              error={errors.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />

          </div>

          {/* Delivery address */}

          {showAddressFields && (
            <>
              <hr className="co-divider" />

              <div className="co-panel-title">
                <span className="co-num">
                  {t("section_number", {
                    number: 2,
                  })}
                </span>

                <h2>
                  {t(
                    "delivery_address"
                  )}
                </h2>
              </div>

              <div className="co-grid">

                <Field
                  className="co-full"
                  label={t(
                    "fields.address"
                  )}
                  name="address"
                  placeholder={t(
                    "fields.address_placeholder"
                  )}
                  hint={t(
                    "fields.address_hint"
                  )}
                  autoComplete="street-address"
                  value={form.address}
                  error={errors.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <Field
                  label={t(
                    "fields.city"
                  )}
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  error={errors.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <Field
                  label={t(
                    "fields.postal_code"
                  )}
                  name="postalCode"
                  placeholder={t(
                    "fields.postal_code_placeholder"
                  )}
                  autoComplete="postal-code"
                  value={form.postalCode}
                  error={
                    errors.postalCode
                  }
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

              </div>
            </>
          )}
        </form>

        {/* ===================================================
            RIGHT: RECEIPT
        =================================================== */}

        <aside className="co-receipt-wrap">

          <div className="co-receipt">

            <h2 className="co-receipt-title">
              {t("order_summary")}
            </h2>

            {/* Loading */}

            {cartLoading && (
              <div className="co-cart-state">
                <span className="co-spinner" />

                {t("loading_order")}
              </div>
            )}

            {/* Error */}

            {cartError &&
              !cartLoading && (
                <div className="co-cart-state co-cart-error">

                  <p>
                    {cartError}
                  </p>

                  <button
                    type="button"
                    className="co-retry"
                    onClick={
                      fetchCart
                    }
                  >
                    {t("try_again")}
                  </button>

                </div>
              )}

            {/* Cart */}

            {cart &&
              !cartLoading &&
              !cartError && (
                <>

                  {/* Items */}

                  {cart.items.map(
                    (item, i) => (
                      <div
                        className="co-item"
                        key={`${item.product.id}-${item.size?.id ?? 0}-${i}`}
                      >

                        <div className="co-item-meta">

                          <div className="co-thumb">

                            {item?.product
                              .image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  process.env
                                    .NEXT_PUBLIC_baseURL_images +
                                  item.product
                                    .image
                                }
                                alt={
                                  item
                                    .product
                                    .name
                                }
                              />
                            ) : (
                              <span
                                aria-hidden
                              >
                                🍽️
                              </span>
                            )}

                          </div>

                          <div>

                            <div className="co-item-name">

                              {
                                item
                                  .product
                                  .name
                              }

                              <span className="co-qty-badge">
                                ×
                                {
                                  item.quantity
                                }
                              </span>

                            </div>

                            {itemMeta(
                              item
                            ) && (
                              <div className="co-item-sub">
                                {itemMeta(
                                  item
                                )}
                              </div>
                            )}

                          </div>

                        </div>

                        <div className="co-item-price">
                          {money(
                            item.itemTotal
                          )}
                        </div>

                      </div>
                    )
                  )}

                  <hr className="co-dashed" />

                  {/* Total */}

                  <div className="co-row">

                    <span className="co-lbl">
                      {t("total")}
                    </span>

                    <span>
                      {money(
                        totalAmount
                      )}
                    </span>

                  </div>

                  {/* Delivery */}

                  <div className="co-row">

                    <span className="co-lbl">
                      {t(
                        "delivery_fee"
                      )}
                    </span>

                    <span>
                      {deliveryFee ===
                      0
                        ? t("free")
                        : money(
                            deliveryFee
                          )}
                    </span>

                  </div>

                  <hr className="co-dashed" />

                  {/* Grand total */}

                  <div className="co-grand">

                    <span className="co-grand-lbl">
                      {t(
                        "grand_total"
                      )}
                    </span>

                    <span className="co-grand-val">
                      {money(
                        grandTotal
                      )}
                    </span>

                  </div>

                  {/* Payment method */}

                  <div
                    className="co-pay-title"
                    id="pay-label"
                  >
                    {t(
                      "payment_method"
                    )}
                  </div>

                  <div
                    role="radiogroup"
                    aria-labelledby="pay-label"
                  >

                    {/* CASH */}

                    <label
                      className={`co-pm ${
                        paymentMethod ===
                        "cash"
                          ? "sel"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={
                          paymentMethod ===
                          "cash"
                        }
                        onChange={() =>
                          setPaymentMethod(
                            "cash"
                          )
                        }
                      />

                      <span
                        className="co-radio"
                        aria-hidden
                      />

                      <span className="co-pm-text">

                        <span className="co-pm-name">
                          {t(
                            "payment_methods.cash.label"
                          )}
                        </span>

                        <span className="co-pm-sub">
                          {t(
                            "payment_methods.cash.sub"
                          )}
                        </span>

                      </span>

                    </label>

                    {/* CARD */}

                    <label
                      className={`co-pm ${
                        paymentMethod ===
                        "card"
                          ? "sel"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={
                          paymentMethod ===
                          "card"
                        }
                        onChange={() =>
                          setPaymentMethod(
                            "card"
                          )
                        }
                      />

                      <span
                        className="co-radio"
                        aria-hidden
                      />

                      <span className="co-pm-text">

                        <span className="co-pm-name">
                          {t(
                            "payment_methods.card.label"
                          )}
                        </span>

                        <span className="co-pm-sub">
                          {t(
                            "payment_methods.card.sub"
                          )}
                        </span>

                      </span>

                    </label>

                    {/* PAYPAL */}

                    <label
                      className={`co-pm ${
                        paymentMethod ===
                        "paypal"
                          ? "sel"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={
                          paymentMethod ===
                          "paypal"
                        }
                        onChange={() =>
                          setPaymentMethod(
                            "paypal"
                          )
                        }
                      />

                      <span
                        className="co-radio"
                        aria-hidden
                      />

                      <span className="co-pm-text">

                        <span className="co-pm-name">
                          {t(
                            "payment_methods.paypal.label"
                          )}
                        </span>

                        <span className="co-pm-sub">
                          {t(
                            "payment_methods.paypal.sub"
                          )}
                        </span>

                      </span>

                    </label>

                  </div>

                  {/* Stripe */}

                  {paymentMethod ===
                  "card" ? (
                    <Elements
                      stripe={
                        stripePromise
                      }
                      options={
                        stripeOptions
                      }
                    >
                      <StripeCardSection
                        grandTotal={
                          grandTotal
                        }
                        validateForm={
                          validate
                        }
                        buildPayload={
                          buildPayload
                        }
                      />
                    </Elements>
                  ) : (
                    <>
                      {/* API error */}

                      {apiError && (
                        <div
                          className="co-alert"
                          role="alert"
                        >
                          {apiError}
                        </div>
                      )}

                      {/* Pay button */}

                      <button
                        type="button"
                        className="co-paybtn"
                        onClick={
                          handlePayNow
                        }
                        disabled={
                          submitting ||
                          cartLoading
                        }
                      >

                        {submitting ? (
                          <>
                            <span className="co-spinner light" />

                            {t(
                              "processing"
                            )}
                          </>
                        ) : (
                          <>
                            <LockIcon />

                            {paymentMethod ===
                            "paypal"
                              ? t(
                                  "continue_to_paypal"
                                )
                              : t(
                                  "pay_now"
                                )}

                            {" · "}

                            {money(
                              grandTotal
                            )}
                          </>
                        )}

                      </button>
                    </>
                  )}

                  {/* Trust message */}

                  <p className="co-trust">
                    {t(
                      "trust_message"
                    )}
                  </p>

                </>
              )}

          </div>

          <ReceiptEdge />

        </aside>

      </div>
    </div>
  );
}

/* =========================================================
   Field
========================================================= */

interface FieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
}

function Field({
  label,
  name,
  error,
  hint,
  className = "",
  ...rest
}: FieldProps) {
  return (
    <div
      className={`co-field ${className}`}
    >
      <label htmlFor={name}>
        {label}
      </label>

      <input
        id={name}
        name={name}
        className={`co-input ${
          error ? "invalid" : ""
        }`}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${name}-error`
            : undefined
        }
        {...rest}
      />

      {error ? (
        <span
          className="co-error"
          id={`${name}-error`}
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span className="co-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/* =========================================================
   Lock Icon
========================================================= */

function LockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      aria-hidden
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* =========================================================
   Receipt Edge
========================================================= */

function ReceiptEdge() {
  const teeth = Array.from(
    { length: 20 },
    (_, i) => {
      const x = 400 - i * 20;

      return `L${x - 10} 14 L${
        x - 20
      } 2`;
    }
  ).join(" ");

  return (
    <svg
      className="co-receipt-edge"
      viewBox="0 0 400 14"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={`M0 0 H400 V2 ${teeth} Z`}
        fill="#ffffff"
      />
    </svg>
  );
}