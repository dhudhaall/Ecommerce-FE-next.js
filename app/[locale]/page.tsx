"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "../globals.css";
import { useTranslations } from "next-intl";

interface Zone {
  id: number;
  mainPostalCode: string;
  areaName: string;
  city: string;
  deliveryFee: number;
  minOrder: number;
  coveredPrefixes: string[];
}

/* Same matching logic as the checkout / backend:
 * exact main code, or the typed code starts with a covered prefix.
 */
function matchZone(zones: Zone[], typedCode: string): Zone | null {
  const code = (typedCode || "").trim();

  if (code.length < 3) return null;

  return (
    zones.find(
      (z) =>
        z.mainPostalCode === code ||
        (Array.isArray(z.coveredPrefixes) &&
          z.coveredPrefixes.some((p) => code.startsWith(p)))
    ) ?? null
  );
}

export default function Home() {
  const translation = useTranslations("HomePage");

  // Zones from API
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState("");

  // Search state
  const [query, setQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState("");

  const boxRef = useRef<HTMLDivElement>(null);

  /* -------- Fetch delivery zones from the API -------- */

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setZonesLoading(true);
    setZonesError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_baseURL}/delivery-zones`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load delivery areas (${res.status})`
        );
      }

      const data: { zones: Zone[] } = await res.json();

      setZones(data.zones ?? []);
    } catch (err: any) {
      setZonesError(
        err.message || translation("search.error_loading")
      );
    } finally {
      setZonesLoading(false);
    }
  };

  /* -------- Close dropdown on outside click -------- */

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  /* -------- Suggestions --------
   * While typing:
   * - postal code
   * - area name
   * - city name
   *
   * Empty input:
   * - show all served areas.
   */

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return zones;

    const isNumeric = /^[0-9]+$/.test(q);

    if (isNumeric) {
      return zones.filter(
        (z) =>
          z.mainPostalCode.startsWith(q) ||
          q.startsWith(z.mainPostalCode) ||
          (Array.isArray(z.coveredPrefixes) &&
            z.coveredPrefixes.some(
              (p) => q.startsWith(p) || p.startsWith(q)
            ))
      );
    }

    return zones.filter(
      (z) =>
        z.areaName.toLowerCase().includes(q) ||
        z.city.toLowerCase().includes(q)
    );
  }, [zones, query]);

  /* -------- Handlers -------- */

  const handleInputChange = (value: string) => {
    setQuery(value);
    setError("");
    setDropdownOpen(true);

    // Auto-resolve street-level codes to their main area
    const matched = matchZone(zones, value);

    setSelectedZone(matched);
  };

  const handleSelectZone = (zone: Zone) => {
    setSelectedZone(zone);

    setQuery(
      `${zone.areaName} — ${zone.mainPostalCode}`
    );

    setError("");
    setDropdownOpen(false);
  };

  const handleSearch = () => {
    setDropdownOpen(false);

    if (selectedZone) {
      window.location.href = `/products?zoneId=${selectedZone.id}`;
      return;
    }

    if (!query.trim()) {
      setError(translation("search.error_empty"));
      return;
    }

    setError(translation("search.error_not_available"));
  };

  const money = (n: number) => `$${n.toFixed(2)}`;

  /* -------- Render -------- */

  return (
    <main className="hm">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hm-hero">

        {/* Left: headline + search */}

        <div className="hm-hero-left">

          <h1>
            {translation("title_1")}
            <br />
            {translation("title_2")}
          </h1>

          <p className="hm-sub">
            {translation("sub_title")}
          </p>

          <div
            className="hm-search"
            ref={boxRef}
          >

            <div
              className={`hm-search-bar ${
                error ? "invalid" : ""
              }`}
            >

              {/* Location icon */}

              <svg
                className="hm-pin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>

              {/* Search input */}

              <input
                type="text"
                placeholder={
                  zonesLoading
                    ? translation("search.loading")
                    : translation("search.placeholder")
                }
                value={query}
                disabled={zonesLoading}
                onChange={(e) =>
                  handleInputChange(e.target.value)
                }
                onFocus={() =>
                  setDropdownOpen(true)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch()
                }
                aria-label={translation(
                  "search.aria_label"
                )}
                aria-invalid={!!error}
              />

              {/* Search button */}

              <button
                type="button"
                className="hm-search-btn"
                onClick={handleSearch}
                disabled={zonesLoading}
              >
                {translation("search.button")}
              </button>

            </div>

            {/* =================================================
                DROPDOWN
            ================================================= */}

            {dropdownOpen && !zonesLoading && (
              <div
                className="hm-dropdown"
                role="listbox"
              >

                {/* API error */}

                {zonesError ? (
                  <div className="hm-dd-state">

                    <span>
                      {zonesError}
                    </span>

                    <button
                      type="button"
                      className="hm-dd-retry"
                      onClick={fetchZones}
                    >
                      {translation(
                        "search.try_again"
                      )}
                    </button>

                  </div>
                ) : suggestions.length > 0 ? (
                  <>

                    <div className="hm-dd-label">
                      {translation(
                        "search.deliver_to"
                      )}
                    </div>

                    {suggestions.map((z) => (
                      <button
                        type="button"
                        key={z.id}
                        role="option"
                        aria-selected={
                          selectedZone?.id === z.id
                        }
                        className={`hm-dd-item ${
                          selectedZone?.id === z.id
                            ? "sel"
                            : ""
                        }`}
                        onClick={() =>
                          handleSelectZone(z)
                        }
                      >

                        <span className="hm-dd-area">

                          {z.areaName}

                          <span className="hm-dd-city">
                            {z.mainPostalCode} ·{" "}
                            {z.city}
                          </span>

                        </span>

                        <span className="hm-dd-fee">
                          {money(z.deliveryFee)}{" "}
                          {translation(
                            "search.delivery"
                          )}
                        </span>

                      </button>
                    ))}

                  </>
                ) : (
                  <div className="hm-dd-state">
                    {translation(
                      "search.no_matching_area"
                    )}
                  </div>
                )}

              </div>
            )}

            {/* =================================================
                FEEDBACK
            ================================================= */}

            {error && (
              <p
                className="hm-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {!error && selectedZone && (
              <p
                className="hm-ok"
                role="status"
              >
                ✓{" "}
                {translation("search.success", {
                  area: selectedZone.areaName,
                  fee: money(
                    selectedZone.deliveryFee
                  ),
                  minOrder:
                    selectedZone.minOrder > 0
                      ? translation(
                          "search.min_order",
                          {
                            amount: money(
                              selectedZone.minOrder
                            ),
                          }
                        )
                      : "",
                })}
              </p>
            )}

          </div>
        </div>

        {/* =====================================================
            HERO RIGHT
        ===================================================== */}

        <div className="hm-hero-right">

          <div className="hm-badge">
            {translation("hero.badge")}
          </div>

          <div
            className="hm-plate"
            aria-hidden="true"
          >
            <span className="hm-plate-emoji">
              🍕
            </span>
          </div>

          <div className="hm-wordmark">
            Pizzeria{" "}
            <span>Con Amore</span>.
          </div>

        </div>

      </section>


      {/* =====================================================
          PIZZA DELIVERY
      ===================================================== */}

      <section className="hm-pizza">

        <div className="hm-pizza-inner">

          {/* Copy */}

          <div className="hm-pizza-copy">

            <p className="hm-kicker">
              {translation("pizza.kicker")}
            </p>

            <h2>
              {translation("pizza.title_1")}
              <br />
              {translation("pizza.title_2")}
            </h2>

            <p className="hm-pizza-lead">
              {translation("pizza.lead")}
            </p>

            {/* Features */}

            <ul className="hm-pizza-points">

              {/* Baked to order */}

              <li>

                <span className="hm-point-ic">
                  🔥
                </span>

                <div>

                  <strong>
                    {translation(
                      "pizza.points.baked_to_order.title"
                    )}
                  </strong>

                  <span>
                    {translation(
                      "pizza.points.baked_to_order.description"
                    )}
                  </span>

                </div>

              </li>


              {/* Insulated delivery */}

              <li>

                <span className="hm-point-ic">
                  🛵
                </span>

                <div>

                  <strong>
                    {translation(
                      "pizza.points.insulated_delivery.title"
                    )}
                  </strong>

                  <span>
                    {translation(
                      "pizza.points.insulated_delivery.description"
                    )}
                  </span>

                </div>

              </li>


              {/* Fresh toppings */}

              <li>

                <span className="hm-point-ic">
                  🌿
                </span>

                <div>

                  <strong>
                    {translation(
                      "pizza.points.fresh_toppings.title"
                    )}
                  </strong>

                  <span>
                    {translation(
                      "pizza.points.fresh_toppings.description"
                    )}
                  </span>

                </div>

              </li>

            </ul>

            {/* CTA */}

            <a
              href="/menu"
              className="hm-pizza-cta"
            >
              {translation("pizza.cta")}
            </a>

          </div>


          {/* Visual */}

          <div
            className="hm-pizza-visual"
            aria-hidden="true"
          >

            <div className="hm-pizza-disc">

              <span className="hm-pizza-emoji">
                🍕
              </span>

            </div>


            {/* 30 minutes */}

            <div className="hm-pizza-chip chip-1">

              <strong>
                30 min
              </strong>

              <span>
                {translation(
                  "pizza.stats.delivery_time"
                )}
              </span>

            </div>


            {/* 400°C */}

            <div className="hm-pizza-chip chip-2">

              <strong>
                400°C
              </strong>

              <span>
                {translation(
                  "pizza.stats.stone_oven"
                )}
              </span>

            </div>


            {/* 48h */}

            <div className="hm-pizza-chip chip-3">

              <strong>
                48h
              </strong>

              <span>
                {translation(
                  "pizza.stats.proved_dough"
                )}
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW TO ORDER
      ===================================================== */}

      <section className="hm-how">

        <p className="hm-how-kicker">
          {translation(
            "how_to_order.kicker"
          )}
        </p>

        <h2>
          {translation(
            "how_to_order.title"
          )}
        </h2>


        <div className="hm-steps">

          {/* Step 1 */}

          <div className="hm-step">

            <div className="hm-step-num">
              1
            </div>

            <h3>
              {translation(
                "how_to_order.steps.find_area.title"
              )}
            </h3>

            <p>
              {translation(
                "how_to_order.steps.find_area.description"
              )}
            </p>

          </div>


          {/* Step 2 */}

          <div className="hm-step">

            <div className="hm-step-num">
              2
            </div>

            <h3>
              {translation(
                "how_to_order.steps.pick_food.title"
              )}
            </h3>

            <p>
              {translation(
                "how_to_order.steps.pick_food.description"
              )}
            </p>

          </div>


          {/* Step 3 */}

          <div className="hm-step">

            <div className="hm-step-num">
              3
            </div>

            <h3>
              {translation(
                "how_to_order.steps.pay.title"
              )}
            </h3>

            <p>
              {translation(
                "how_to_order.steps.pay.description"
              )}
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}