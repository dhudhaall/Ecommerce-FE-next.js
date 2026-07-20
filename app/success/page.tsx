"use client";

import { useSearchParams } from "next/navigation";

export default function OrderSuccess() {
   const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const backToHome = () =>{
    window.location.href = "/products"
  }

  return (
    <div className="success-container">
      <div className="success-card">
        
        {/* Check Icon */}
        <div className="checkmark">✓</div>

        {/* Title */}
        <h1>Order Confirmed!</h1>

        <p className="subtitle">
          Thank you for your order 🎉
        </p>

        {/* Order Info */}
        <div className="order-info">
          <p><strong>Order ID:</strong> {orderId}</p>
          <p><strong>Estimated Delivery:</strong> 40 minutes</p>
        </div>

        {/* CTA Buttons */}
        <div className="actions">
          {/* <button className="btn primary">Track Order</button> */}
          <button onClick={backToHome} className="btn secondary">Back to Home</button>
        </div>

      </div>
    </div>
  );
}