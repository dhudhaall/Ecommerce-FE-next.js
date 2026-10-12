"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * The page itself renders no client-only hooks — it just provides the
 * Suspense boundary Next.js requires around useSearchParams().
 */
export default function OrderSuccess() {
  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <SuccessContent />
    </Suspense>
  );
}

/* ---------- The part that actually reads the query string ---------- */

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token"); // PayPal approval parameter
  const paymentIntent = searchParams.get("payment_intent");

  useEffect(() => {
    if (token) {
      // Returning from PayPal flow
      fetch(`${process.env.NEXT_PUBLIC_baseURL}/checkout/paypal-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paypalOrderId: token }),
      }).catch((e) => console.error("PayPal capture error:", e));
    } else if (orderId) {
      // Card / Stripe payment confirmation
      fetch(`${process.env.NEXT_PUBLIC_baseURL}/checkout/stripe-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentIntentId: paymentIntent }),
      }).catch((e) => console.error("Stripe confirm error:", e));
    }
  }, [token, orderId, paymentIntent]);

  const backToHome = () => {
    window.location.href = "/products";
  };

  return (
    <div className="success-container">
      <div className="success-card">
        {/* Check Icon */}
        <div className="checkmark">✓</div>

        {/* Title */}
        <h1>Order Confirmed!</h1>

        <p className="subtitle">Thank you for your order 🎉</p>

        {/* Order Info */}
        <div className="order-info">
          <p>
            <strong>Order ID:</strong> {orderId ?? "—"}
          </p>
          <p>
            <strong>Estimated Delivery:</strong> 40 minutes
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="actions">
          {/* <button className="btn primary">Track Order</button> */}
          <button onClick={backToHome} className="btn secondary">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Shown briefly while the client resolves the query string ---------- */

function SuccessSkeleton() {
  return (
    <div className="success-container">
      <div className="success-card">
        <div className="checkmark">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="subtitle">Thank you for your order 🎉</p>
        <div className="order-info">
          <p>
            <strong>Order ID:</strong> …
          </p>
          <p>
            <strong>Estimated Delivery:</strong> 40 minutes
          </p>
        </div>
      </div>
    </div>
  );
}