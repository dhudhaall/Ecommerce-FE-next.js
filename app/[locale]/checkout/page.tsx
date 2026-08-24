"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {StripeCardSection} from './StripeCardSection'
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/* ---------------- Types (match the cart API response) ---------------- */

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

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string }[] = [
  { id: "cash", label: "Cash on delivery", sub: "Pay when your order arrives" },
  { id: "card", label: "Credit / Debit card", sub: "Visa, Mastercard, Amex — via Stripe" },
  { id: "paypal", label: "PayPal", sub: "You'll be redirected to PayPal" },
];

/* ---------------- Component ---------------- */

export default function Checkout() {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash"); // Cash by default
	const router = useRouter();

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

  // Cart from API
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const totalAmount = cart?.totalAmount ?? 0;
  const deliveryFee = deliveryType === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = totalAmount + deliveryFee;

  /* -------- Fetch order summary from API -------- */

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setCartLoading(true);
     const stored = JSON.parse(localStorage.getItem("cart") || "[]");
     console.log("stored",stored);
     const payload = {
        items: stored?.map((item:CartItem) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size ? { id: item.size.id } : null,
            addons: item.addons.map(a => a.id)
        }))
        };
    setCartError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_baseURL}/checkout/summary`,
        {
            method: "POST", 
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...payload
            }),
        cache: "no-store" 
    });
   
      if (!res.ok) throw new Error(`Failed to load cart (${res.status})`);
      const data: Cart = await res.json();
      console.log("data",data);
       if (data?.items?.length == 0) throw new Error(`Your Cart is Empty. Please add items to cart first.`);
      setCart(data);
    } catch (err: any) {
      setCartError(err.message || "Could not load your order.");
    } finally {
      setCartLoading(false);
    }
  };

  /* -------- Validation -------- */

  const validateField = (field: keyof FormState, value: string): string => {
    const v = value.trim();
    const isPickup = deliveryType === "pickup";
    switch (field) {
      case "firstName":
        return !v ? "First name is required" : v.length < 2 ? "Must be at least 2 characters" : "";
      case "lastName":
        return !v ? "Last name is required" : v.length < 2 ? "Must be at least 2 characters" : "";
      case "phone":
        return !v
          ? "Phone number is required"
          : !/^\+?[0-9\s()-]{7,16}$/.test(v)
          ? "Enter a valid phone number"
          : "";
      case "email":
        return !v
          ? "Email is required"
          : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
          ? "Enter a valid email address"
          : "";
      case "address":
        if (isPickup) return "";
        return !v ? "Address is required" : v.length < 5 ? "Enter a complete address" : "";
      case "city":
        return isPickup ? "" : !v ? "City is required" : "";
      case "postalCode":
        if (isPickup) return "";
        return !v
          ? "Postal code is required"
          : !/^[A-Za-z0-9 -]{3,10}$/.test(v)
          ? "Enter a valid postal code"
          : "";
      default:
        return "";
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((field) => {
      const message = validateField(field, form[field]);
      if (message) newErrors[field] = message;
    });
    setErrors(newErrors);

    // Scroll to & focus the first invalid field
    const firstInvalid = Object.keys(newErrors)[0];
    if (firstInvalid) {
      const el = formRef.current?.querySelector<HTMLInputElement>(`input[name="${firstInvalid}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }
    return Object.keys(newErrors).length === 0;
  };

  /* -------- Field handlers -------- */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Re-validate live once a field already has an error
    if (errors[name as keyof FormState] !== undefined) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof FormState, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof FormState, value) }));
  };



  /* -------- Payload -------- */

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
        // notes: item.notes?.trim() || null,
      })) ?? [],
    currency: "eur",
  });

  type OrderPayload = ReturnType<typeof buildPayload>;

  /* -------- Pay now -------- */

//   const handlePayNow = () => {
//     setApiError("");
//     if (!validate()) return;
//     if (!cart || cart.items.length === 0) {
//       setApiError("Your cart is empty.");
//       return;
//     }

//     const payload = buildPayload();
//     console.log("ORDER PAYLOAD", payload);

//     if (paymentMethod === "cash") {
//       handleCashOrder(payload);
//     } else if (paymentMethod === "card") {
//       handleStripePayment(payload);
//     } else {
//       handlePaypalPayment(payload);
//     }
//   };

const handlePayNow = async () => {
     if (!validate()) return;
  try {
    const payload = buildPayload(); // your existing function

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_baseURL}/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();
   
    if(data.success){
        localStorage.removeItem('cart');
    }
    if(!data.success){
        setCartError("Checkout Failed.");
        return;
    }

    // 💵 CASH
    if (payload.paymentMethod === "cash") {
      
      router.push(`/success?orderId=$${data.orderId}`);
      return;
    }


    // 🟡 PAYPAL
    if (data.paymentType === "paypal") {
      window.location.href = data.approvalUrl;
    }

  } catch (err) {
    console.error(err);
    // alert("Checkout failed");
  }
};




  /* -------- PayPal: create order, redirect to approval URL -------- */

  const handlePaypalPayment = async (payload: OrderPayload) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start PayPal payment.");
      window.location.href = data.approvalUrl; // PayPal approval page
    } catch (err: any) {
      setApiError(err.message || "PayPal payment could not be started.");
      setSubmitting(false);
    }
  };

   const stripeOptions: StripeElementsOptions = useMemo(
    () => ({
      mode: "payment",
      amount: Math.max(Math.round(grandTotal * 100), 50), // cents; Stripe minimum ≥ $0.50
      currency: "eur",
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#1f5b3f",
          colorText: "#17251d",
          colorTextSecondary: "#6c7a70",
          colorDanger: "#c0392b",
          colorBackground: "#fbfcfa",
          fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
          borderRadius: "10px",
          spacingUnit: "4px",
        },
        rules: {
          ".Input": { border: "1.5px solid #dfe4dd", boxShadow: "none" },
          ".Input:focus": {
            border: "1.5px solid #1f5b3f",
            boxShadow: "0 0 0 3px #e7f0e9",
          },
          ".Label": { fontSize: "12.5px", fontWeight: "500" },
        },
      },
      fonts: [
        {
          cssSrc: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap",
        },
      ],
    }),
    [grandTotal]
  );
 

  /* -------- Helpers -------- */

  const money = (n: number) => `$${n.toFixed(2)}`;

  const itemMeta = (item: CartItem) => {
    const parts: string[] = [];
    if (item.size) parts.push(item.size.name);
    if (item.addons.length) parts.push(item.addons.map((a) => a.name).join(", "));
    return parts.join(" · ");
  };

  const showAddressFields = deliveryType === "delivery";

  /* -------- Render -------- */

  return (
    <div className="co-page">
      <div className="co-head">
        <h1>Checkout</h1>
        <p>Almost there — fill in your details and choose how you&apos;d like to pay.</p>
      </div>

      <div className="co-cols">
        {/* ---------------- LEFT: FORM ---------------- */}
        <form ref={formRef} className="co-panel" noValidate onSubmit={(e) => e.preventDefault()}>
          {/* Delivery / Pickup tabs */}
          <div className="co-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={deliveryType === "delivery"}
              className={deliveryType === "delivery" ? "co-tab active" : "co-tab"}
              onClick={() => setDeliveryType("delivery")}
            >
              Delivery
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={deliveryType === "pickup"}
              className={deliveryType === "pickup" ? "co-tab active" : "co-tab"}
              onClick={() => setDeliveryType("pickup")}
            >
              Pickup
            </button>
          </div>

          <div className="co-panel-title">
            <span className="co-num">No. 1</span>
            <h2>Contact details</h2>
          </div>

          <div className="co-grid">
            <Field
              label="First name"
              name="firstName"
              autoComplete="given-name"
              value={form.firstName}
              error={errors.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Field
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              value={form.lastName}
              error={errors.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Field
              label="Phone"
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
              label="Email"
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

          {showAddressFields && (
            <>
              <hr className="co-divider" />

              <div className="co-panel-title">
                <span className="co-num">No. 2</span>
                <h2>Delivery address</h2>
              </div>

              <div className="co-grid">
                <Field
                  className="co-full"
                  label="Address"
                  name="address"
                  placeholder="House, street, area"
                  hint="Street address, apartment, or landmark"
                  autoComplete="street-address"
                  value={form.address}
                  error={errors.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <Field
                  label="City"
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  error={errors.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <Field
                  label="Postal code"
                  name="postalCode"
                  placeholder="e.g. 54660"
                  autoComplete="postal-code"
                  value={form.postalCode}
                  error={errors.postalCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
            </>
          )}
        </form>

        {/* ---------------- RIGHT: RECEIPT ---------------- */}
        <aside className="co-receipt-wrap">
          <div className="co-receipt">
            <h2 className="co-receipt-title">Order summary</h2>

            {cartLoading && (
              <div className="co-cart-state">
                <span className="co-spinner" /> Loading your order…
              </div>
            )}

            {cartError && !cartLoading && (
              <div className="co-cart-state co-cart-error">
                <p>{cartError}</p>
                <button type="button" className="co-retry" onClick={fetchCart}>
                  Try again
                </button>
              </div>
            )}

            {cart && !cartLoading && !cartError && (
              <>
                {cart.items.map((item, i) => (
                  <div className="co-item" key={`${item.product.id}-${item.size?.id ?? 0}-${i}`}>
                    <div className="co-item-meta">
                      <div className="co-thumb">
                        {item.product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product.image} alt={item.product.name} />
                        ) : (
                          <span aria-hidden>🍽️</span>
                        )}
                      </div>
                      <div>
                        <div className="co-item-name">
                          {item.product.name}
                          <span className="co-qty-badge">×{item.quantity}</span>
                        </div>
                        {itemMeta(item) && <div className="co-item-sub">{itemMeta(item)}</div>}
                      </div>
                    </div>
                    <div className="co-item-price">{money(item.itemTotal)}</div>
                  </div>
                ))}

                <hr className="co-dashed" />

                <div className="co-row">
                  <span className="co-lbl">Total</span>
                  <span>{money(totalAmount)}</span>
                </div>
                <div className="co-row">
                  <span className="co-lbl">Delivery fee</span>
                  <span>{money(deliveryFee)}</span>
                </div>

                <hr className="co-dashed" />

                <div className="co-grand">
                  <span className="co-grand-lbl">Grand total</span>
                  <span className="co-grand-val">{money(grandTotal)}</span>
                </div>

                {/* Payment method — single select, Cash by default */}
                <div className="co-pay-title" id="pay-label">
                  Payment method
                </div>
                <div role="radiogroup" aria-labelledby="pay-label">
                  {PAYMENT_METHODS.map((pm) => (
                    <label key={pm.id} className={`co-pm ${paymentMethod === pm.id ? "sel" : ""}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                      />
                      <span className="co-radio" aria-hidden />
                      <span className="co-pm-text">
                        <span className="co-pm-name">{pm.label}</span>
                        <span className="co-pm-sub">{pm.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {paymentMethod === "card" ? (
                  /* Card selected → show Stripe inputs inline. The Pay button
                   * lives inside so it can use the Stripe hooks. */
                  <Elements stripe={stripePromise} options={stripeOptions}>
                    <StripeCardSection
                      grandTotal={grandTotal}
                      validateForm={validate}
                      buildPayload={buildPayload}
                    />
                  </Elements>
                ):(
                    <>
                {apiError && (
                  <div className="co-alert" role="alert">
                    {apiError}
                  </div>
                )}

                <button
                  type="button"
                  className="co-paybtn"
                  onClick={handlePayNow}
                  disabled={submitting || cartLoading}
                >
                  {submitting ? (
                    <>
                      <span className="co-spinner light" /> Processing…
                    </>
                  ) : (
                    <>
                      <LockIcon /> Pay now Cash · {money(grandTotal)}
                    </>
                  )}
                </button>
                </>
                )}
                <p className="co-trust">You won&apos;t be charged until your order is confirmed.</p>
              
              </>
            )}
          </div>
          <ReceiptEdge />
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Small components ---------------- */

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
}

function Field({ label, name, error, hint, className = "", ...rest }: FieldProps) {
  return (
    <div className={`co-field ${className}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        className={`co-input ${error ? "invalid" : ""}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span className="co-error" id={`${name}-error`} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="co-hint">{hint}</span>
      ) : null}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ReceiptEdge() {
  // Perforated bottom edge of the receipt card
  const teeth = Array.from({ length: 20 }, (_, i) => {
    const x = 400 - i * 20;
    return `L${x - 10} 14 L${x - 20} 2`;
  }).join(" ");
  return (
    <svg className="co-receipt-edge" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden>
      <path d={`M0 0 H400 V2 ${teeth} Z`} fill="#ffffff" />
    </svg>
  );
}