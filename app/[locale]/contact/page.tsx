"use client";

import { useState } from "react";

/* ---------------- Store details — edit these in one place ---------------- */

const STORE = {
  name: " Pizzeria Con Amore",
  address: "123 Main Street",
  postalCode: "10115",
  city: "Berlin",
  country: "Germany",
  phone: "+49 123 456789",
  phoneHref: "+49123456789",
  email: "info@restaurant.com",
};

const HOURS: { day: string; time: string; closed?: boolean }[] = [
  { day: "Monday", time: "10:00 AM – 10:00 PM" },
  { day: "Tuesday", time: "10:00 AM – 10:00 PM" },
  { day: "Wednesday", time: "10:00 AM – 10:00 PM" },
  { day: "Thursday", time: "10:00 AM – 11:00 PM" },
  { day: "Friday", time: "10:00 AM – 11:30 PM" },
  { day: "Saturday", time: "12:00 PM – 11:30 PM" },
  { day: "Sunday", time: "Closed", closed: true },
];

// JS getDay(): 0 = Sunday … 6 = Saturday → index into HOURS (Mon-first)
const todayIndex = (() => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
})();

const MAPS_QUERY = encodeURIComponent(
  `${STORE.address}, ${STORE.postalCode} ${STORE.city}, ${STORE.country}`
);

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.email.trim()) e.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    if (!form.message.trim()) e.message = "Please write a message";
    else if (form.message.trim().length < 10) e.message = "Message is a bit short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async () => {
    setApiError("");
    if (!validate()) return;

    setSending(true);
    try {
      // Point this at your backend contact endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_baseURL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          subject: form.subject.trim() || "Website enquiry",
          message: form.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any).error || "Could not send your message.");

      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="ct">
      {/* ---------------- HEADER ---------------- */}
      <section className="ct-head">
        <p className="ct-kicker">Contact us</p>
        <h1>We&apos;d love to hear from you</h1>
        <p className="ct-lead">
          Questions about an order, a booking, or just want to say hello? Drop by, call, or send us
          a message — we usually reply within a few hours.
        </p>
      </section>

      <div className="ct-grid">
        {/* ---------------- LEFT: INFO + HOURS ---------------- */}
        <div className="ct-col">
          {/* Our information */}
          <div className="ct-card">
            <h2 className="ct-card-title">Our information</h2>

            <ul className="ct-info">
              <li>
                <span className="ct-ic">📍</span>
                <div>
                  <span className="ct-label">Address</span>
                  <span className="ct-value">
                    {STORE.address}
                    <br />
                    {STORE.postalCode} {STORE.city}
                  </span>
                </div>
              </li>
              <li>
                <span className="ct-ic">🏙️</span>
                <div>
                  <span className="ct-label">City</span>
                  <span className="ct-value">{STORE.city}</span>
                </div>
              </li>
              <li>
                <span className="ct-ic">📞</span>
                <div>
                  <span className="ct-label">Phone</span>
                  <a className="ct-value link" href={`tel:${STORE.phoneHref}`}>
                    {STORE.phone}
                  </a>
                </div>
              </li>
              <li>
                <span className="ct-ic">✉️</span>
                <div>
                  <span className="ct-label">Email</span>
                  <a className="ct-value link" href={`mailto:${STORE.email}`}>
                    {STORE.email}
                  </a>
                </div>
              </li>
            </ul>

            <div className="ct-quick">
              <a className="ct-btn solid" href={`tel:${STORE.phoneHref}`}>
                Call us
              </a>
              <a
                className="ct-btn outline"
                href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
              </a>
            </div>
          </div>

          {/* Opening hours */}
          <div className="ct-card">
            <h2 className="ct-card-title">Opening hours</h2>
            <ul className="ct-hours">
              {HOURS.map((h, i) => (
                <li
                  key={h.day}
                  className={`${i === todayIndex ? "today" : ""} ${h.closed ? "closed" : ""}`}
                >
                  <span className="ct-day">
                    {h.day}
                    {i === todayIndex && <em>Today</em>}
                  </span>
                  <span className="ct-time">{h.time}</span>
                </li>
              ))}
            </ul>
            <p className="ct-hours-note">
              Kitchen closes 30 minutes before closing time. Delivery orders stop 45 minutes before.
            </p>
          </div>
        </div>

        {/* ---------------- RIGHT: FORM ---------------- */}
        <div className="ct-col">
          <div className="ct-card">
            <h2 className="ct-card-title">Send us a message</h2>

            {sent ? (
              <div className="ct-success">
                <span className="ct-success-ic">✓</span>
                <h3>Thanks — your message is on its way</h3>
                <p>We&apos;ll get back to you at the email you provided.</p>
                <button type="button" className="ct-btn outline" onClick={() => setSent(false)}>
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="ct-form">
                  <div className={`ct-field ${errors.name ? "has-error" : ""}`}>
                    <label htmlFor="name">Your name</label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                    />
                    {errors.name && <span className="ct-error">{errors.name}</span>}
                  </div>

                  <div className={`ct-field ${errors.email ? "has-error" : ""}`}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                    />
                    {errors.email && <span className="ct-error">{errors.email}</span>}
                  </div>

                  <div className="ct-field full">
                    <label htmlFor="subject">Subject <span className="ct-opt">(optional)</span></label>
                    <input
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="Order enquiry, feedback, booking…"
                    />
                  </div>

                  <div className={`ct-field full ${errors.message ? "has-error" : ""}`}>
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="How can we help?"
                    />
                    {errors.message && <span className="ct-error">{errors.message}</span>}
                  </div>
                </div>

                {apiError && <div className="ct-alert">{apiError}</div>}

                <button type="button" className="ct-btn solid full" onClick={handleSubmit} disabled={sending}>
                  {sending ? "Sending…" : "Send message"}
                </button>
                <p className="ct-form-note">
                  Prefer email? Write to{" "}
                  <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- MAP ---------------- */}
      <section className="ct-map-section">
        <div className="ct-map-head">
          <div>
            <h2>Find us</h2>
            <p>
              {STORE.address}, {STORE.postalCode} {STORE.city}
            </p>
          </div>
          <a
            className="ct-btn outline"
            href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps ↗
          </a>
        </div>

        <div className="ct-map">
          <iframe
            title={`Map showing ${STORE.name} at ${STORE.address}, ${STORE.city}`}
            src={`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </main>
  );
}