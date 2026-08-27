import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";

interface StripeCardSectionProps {
  grandTotal: number;
  validateForm: () => boolean;
  buildPayload: () => any;
}

export function StripeCardSection({ grandTotal, validateForm, buildPayload }: StripeCardSectionProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState("");
  const [cardReady, setCardReady] = useState(false);
 
  const handleCardPay = async () => {
    setCardError("");
 
    // 1) Validate the checkout form first (same rules as cash/paypal)
    if (!validateForm()) return;
    if (!stripe || !elements) return;
 
    setProcessing(true);
    try {
      // 2) Validate the card inputs — shows Stripe's inline field errors
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setCardError(submitError.message ?? "Please check your card details.");
        return;
      }
 
      // 3) Create the PaymentIntent on the server with the order payload
      const payload = buildPayload();
      const res = await fetch(`${process.env.NEXT_PUBLIC_baseURL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      const orderId =
<<<<<<< HEAD:app/[locale]/checkout/StripeCardSection.tsx
  data.orderId ?? data.orderId ?? data.order_id ?? data.id ?? data.order?.id;
=======
  data.orderId ?? data?.data?.id;
>>>>>>> main:app/checkout/StripeCardSection.tsx
      
        if(res.ok){
            localStorage.removeItem('cart');
        }
     
      if (!res.ok) throw new Error(data.error || "Could not start card payment.");
 
      // 4) Confirm the payment with the card the user entered
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          // Used only if the bank requires a redirect (e.g. 3D Secure)
          return_url: `${window.location.origin}/success?orderId=${orderId}`,
        },
        redirect: "if_required",
      });
 
      if (error) {
        // Card declined, authentication failed, etc.
        setCardError(error.message ?? "Payment failed. Please try another card.");
        return;
      }
 
      // 5) Paid (or processing) — go to the success page
      if (paymentIntent && ["succeeded", "processing"].includes(paymentIntent.status)) {
       
        localStorage.removeItem('cart');
    
        window.location.href = `/success?orderId=${orderId}`;
      } else {
        setCardError("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      setCardError(err.message || "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };
 
  return (
    <div className="co-card-section">
      <PaymentElement
        options={{ layout: "tabs" }}
        onReady={() => setCardReady(true)}
      />
 
      {cardError && (
        <div className="co-alert" role="alert">
          {cardError}
        </div>
      )}
 
      <button
        type="button"
        className="co-paybtn"
        onClick={handleCardPay}
        disabled={processing || !stripe || !cardReady}
      >
        {processing ? (
          <>
            <span className="co-spinner light" /> Processing…
          </>
        ) : (
          <>
            <LockIcon /> Pay now ${grandTotal.toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
}
 
/* ---------------- Small components ---------------- */
 
 
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
 

 