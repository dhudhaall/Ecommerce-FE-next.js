"use client";

import { Suspense } from "react";
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