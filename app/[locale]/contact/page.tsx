"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/* ---------------- Store details — edit these in one place ---------------- */

const STORE = {
  name: "Pizzeria Con Amore",
  address: "123 Main Street",
  postalCode: "10115",
  city: "Berlin",
  country: "Germany",
  phone: "+49 123 456789",
  phoneHref: "+49123456789",
  email: "info@restaurant.com",
};

const HOURS: {
  day: string;
  time: string;
  closed?: boolean;
}[] = [
  {
    day: "Monday",
    time: "10:00 AM – 10:00 PM",
  },
  {
    day: "Tuesday",
    time: "10:00 AM – 10:00 PM",
  },
  {
    day: "Wednesday",
    time: "10:00 AM – 10:00 PM",
  },
  {
    day: "Thursday",
    time: "10:00 AM – 11:00 PM",
  },
  {
    day: "Friday",
    time: "10:00 AM – 11:30 PM",
  },
  {
    day: "Saturday",
    time: "12:00 PM – 11:30 PM",
  },
  {
    day: "Sunday",
    time: "Closed",
    closed: true,
  },
];

// JS getDay(): 0 = Sunday … 6 = Saturday
// → index into HOURS (Mon-first)
const todayIndex = (() => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
})();

const MAPS_QUERY = encodeURIComponent(
  `${STORE.address}, ${STORE.postalCode} ${STORE.city}, ${STORE.country}`
);

export default function Contact() {
  const t = useTranslations("ContactPage");

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [sending, setSending] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  /* ---------------- Validation ---------------- */

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) {
      e.name = t(
        "validation.name_required"
      );
    }

    if (!form.email.trim()) {
      e.email = t(
        "validation.email_required"
      );
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        form.email.trim()
      )
    ) {
      e.email = t(
        "validation.email_invalid"
      );
    }

    if (!form.message.trim()) {
      e.message = t(
        "validation.message_required"
      );
    } else if (
      form.message.trim().length < 10
    ) {
      e.message = t(
        "validation.message_short"
      );
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  /* ---------------- Field change ---------------- */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((f) => ({
      ...f,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = async () => {
    setApiError("");

    if (!validate()) return;

    setSending(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_baseURL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email
              .trim()
              .toLowerCase(),
            subject:
              form.subject.trim() ||
              t("default_subject"),
            message:
              form.message.trim(),
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as any).error ||
            t("errors.send_failed")
        );
      }

      setSent(true);

      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      setApiError(
        err.message ||
          t("errors.generic")
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="ct">

      {/* ================= HEADER ================= */}

      <section className="ct-head">

        <p className="ct-kicker">
          {t("header.kicker")}
        </p>

        <h1>
          {t("header.title")}
        </h1>

        <p className="ct-lead">
          {t("header.description")}
        </p>

      </section>

      <div className="ct-grid">

        {/* =================================================
            LEFT: INFO + HOURS
        ================================================= */}

        <div className="ct-col">

          {/* ---------------- Our information ---------------- */}

          <div className="ct-card">

            <h2 className="ct-card-title">
              {t("information.title")}
            </h2>

            <ul className="ct-info">

              {/* Address */}

              <li>
                <span className="ct-ic">
                  📍
                </span>

                <div>
                  <span className="ct-label">
                    {t(
                      "information.address"
                    )}
                  </span>

                  <span className="ct-value">
                    {STORE.address}
                    <br />
                    {STORE.postalCode}{" "}
                    {STORE.city}
                  </span>
                </div>
              </li>

              {/* City */}

              <li>
                <span className="ct-ic">
                  🏙️
                </span>

                <div>
                  <span className="ct-label">
                    {t(
                      "information.city"
                    )}
                  </span>

                  <span className="ct-value">
                    {STORE.city}
                  </span>
                </div>
              </li>

              {/* Phone */}

              <li>
                <span className="ct-ic">
                  📞
                </span>

                <div>
                  <span className="ct-label">
                    {t(
                      "information.phone"
                    )}
                  </span>

                  <a
                    className="ct-value link"
                    href={`tel:${STORE.phoneHref}`}
                  >
                    {STORE.phone}
                  </a>
                </div>
              </li>

              {/* Email */}

              <li>
                <span className="ct-ic">
                  ✉️
                </span>

                <div>
                  <span className="ct-label">
                    {t(
                      "information.email"
                    )}
                  </span>

                  <a
                    className="ct-value link"
                    href={`mailto:${STORE.email}`}
                  >
                    {STORE.email}
                  </a>
                </div>
              </li>

            </ul>

            {/* Quick actions */}

            <div className="ct-quick">

              <a
                className="ct-btn solid"
                href={`tel:${STORE.phoneHref}`}
              >
                {t("information.call_us")}
              </a>

              <a
                className="ct-btn outline"
                href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(
                  "information.get_directions"
                )}
              </a>

            </div>

          </div>

          {/* ---------------- Opening hours ---------------- */}

          <div className="ct-card">

            <h2 className="ct-card-title">
              {t("hours.title")}
            </h2>

            <ul className="ct-hours">

              {HOURS.map((h, i) => (
                <li
                  key={h.day}
                  className={`
                    ${i === todayIndex ? "today" : ""}
                    ${h.closed ? "closed" : ""}
                  `}
                >

                  <span className="ct-day">

                    {t(
                      `hours.days.${h.day.toLowerCase()}`
                    )}

                    {i === todayIndex && (
                      <em>
                        {t("hours.today")}
                      </em>
                    )}

                  </span>

                  <span className="ct-time">
                    {h.closed
                      ? t("hours.closed")
                      : h.time}
                  </span>

                </li>
              ))}

            </ul>

            <p className="ct-hours-note">
              {t(
                "hours.note"
              )}
            </p>

          </div>

        </div>

        {/* =================================================
            RIGHT: FORM
        ================================================= */}

        <div className="ct-col">

          <div className="ct-card">

            <h2 className="ct-card-title">
              {t("form.title")}
            </h2>

            {sent ? (

              /* ---------------- Success ---------------- */

              <div className="ct-success">

                <span className="ct-success-ic">
                  ✓
                </span>

                <h3>
                  {t(
                    "success.title"
                  )}
                </h3>

                <p>
                  {t(
                    "success.description"
                  )}
                </p>

                <button
                  type="button"
                  className="ct-btn outline"
                  onClick={() =>
                    setSent(false)
                  }
                >
                  {t(
                    "success.send_another"
                  )}
                </button>

              </div>

            ) : (

              /* ---------------- Form ---------------- */

              <>
                <div className="ct-form">

                  {/* Name */}

                  <div
                    className={`ct-field ${
                      errors.name
                        ? "has-error"
                        : ""
                    }`}
                  >

                    <label htmlFor="name">
                      {t(
                        "form.name"
                      )}
                    </label>

                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={
                        handleChange
                      }
                      placeholder={t(
                        "form.name_placeholder"
                      )}
                    />

                    {errors.name && (
                      <span className="ct-error">
                        {errors.name}
                      </span>
                    )}

                  </div>

                  {/* Email */}

                  <div
                    className={`ct-field ${
                      errors.email
                        ? "has-error"
                        : ""
                    }`}
                  >

                    <label htmlFor="email">
                      {t(
                        "form.email"
                      )}
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={
                        handleChange
                      }
                      placeholder={t(
                        "form.email_placeholder"
                      )}
                    />

                    {errors.email && (
                      <span className="ct-error">
                        {errors.email}
                      </span>
                    )}

                  </div>

                  {/* Subject */}

                  <div className="ct-field full">

                    <label htmlFor="subject">

                      {t(
                        "form.subject"
                      )}

                      <span className="ct-opt">
                        {" "}
                        ({t(
                          "form.optional"
                        )})
                      </span>

                    </label>

                    <input
                      id="subject"
                      name="subject"
                      value={
                        form.subject
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={t(
                        "form.subject_placeholder"
                      )}
                    />

                  </div>

                  {/* Message */}

                  <div
                    className={`ct-field full ${
                      errors.message
                        ? "has-error"
                        : ""
                    }`}
                  >

                    <label htmlFor="message">
                      {t(
                        "form.message"
                      )}
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={
                        form.message
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={t(
                        "form.message_placeholder"
                      )}
                    />

                    {errors.message && (
                      <span className="ct-error">
                        {
                          errors.message
                        }
                      </span>
                    )}

                  </div>

                </div>

                {/* API error */}

                {apiError && (
                  <div
                    className="ct-alert"
                    role="alert"
                  >
                    {apiError}
                  </div>
                )}

                {/* Submit */}

                <button
                  type="button"
                  className="ct-btn solid full"
                  onClick={
                    handleSubmit
                  }
                  disabled={sending}
                >
                  {sending
                    ? t("form.sending")
                    : t(
                        "form.send_message"
                      )}
                </button>

                <p className="ct-form-note">

                  {t(
                    "form.prefer_email"
                  )}{" "}

                  <a
                    href={`mailto:${STORE.email}`}
                  >
                    {STORE.email}
                  </a>

                </p>

              </>
            )}

          </div>

        </div>

      </div>

      {/* =================================================
          MAP
      ================================================= */}

      <section className="ct-map-section">

        <div className="ct-map-head">

          <div>

            <h2>
              {t("map.title")}
            </h2>

            <p>
              {STORE.address},{" "}
              {STORE.postalCode}{" "}
              {STORE.city}
            </p>

          </div>

          <a
            className="ct-btn outline"
            href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(
              "map.open_google_maps"
            )}{" "}
            ↗
          </a>

        </div>

        <div className="ct-map">

          <iframe
            title={t(
              "map.iframe_title",
              {
                name: STORE.name,
                address:
                  STORE.address,
                city: STORE.city,
              }
            )}
            src={`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`}
            width="100%"
            height="100%"
            style={{
              border: 0,
            }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />

        </div>

      </section>

    </main>
  );
}