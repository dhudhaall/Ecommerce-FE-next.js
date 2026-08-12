"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./globals.css";

interface Zone {
  id: number;
  mainPostalCode: string;
  areaName: string;
  city: string;
  deliveryFee: number;
  minOrder: number;
  coveredPrefixes: string[]; // Json column — array of postal prefixes, e.g. ["5466"]
}

/* Same matching logic as the checkout / backend:
 * exact main code, or the typed code starts with a covered prefix. */
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_baseURL}/delivery-zones`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load delivery areas (${res.status})`);
      const data: { zones: Zone[] } = await res.json();
      setZones(data.zones ?? []);
    } catch (err: any) {
      setZonesError(err.message || "Could not load delivery areas.");
    } finally {
      setZonesLoading(false);
    }
  };

  /* -------- Close the dropdown on outside click -------- */

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* -------- Suggestions --------
   * While typing: match by postal code (prefix logic) or by area/city name.
   * Empty input: show all served areas. */

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
            z.coveredPrefixes.some((p) => q.startsWith(p) || p.startsWith(q)))
      );
    }
    return zones.filter(
      (z) =>
        z.areaName.toLowerCase().includes(q) || z.city.toLowerCase().includes(q)
    );
  }, [zones, query]);

  /* -------- Handlers -------- */

  const handleInputChange = (value: string) => {
    setQuery(value);
    setError("");
    setDropdownOpen(true);

    // Auto-resolve street-level codes to their main area as the user types
    const matched = matchZone(zones, value);
    setSelectedZone(matched);
  };

  const handleSelectZone = (zone: Zone) => {
    setSelectedZone(zone);
    setQuery(`${zone.areaName} — ${zone.mainPostalCode}`);
    setError("");
    setDropdownOpen(false);
  };

  const handleSearch = () => {
    setDropdownOpen(false);

    if (selectedZone) {
      // Hand the chosen zone to the menu/checkout flow
      window.location.href = `/products?zoneId=${selectedZone.id}`;
      return;
    }

    if (!query.trim()) {
      setError("Please enter your postal code or pick your area.");
      return;
    }

    // Typed something, nothing matched
    setError("Sorry, we don't deliver to this address yet.");
  };

  const money = (n: number) => `$${n.toFixed(2)}`;

  /* -------- Render -------- */

  return (
    <main className="hm">
      {/* ---------------- HERO ---------------- */}
      <section className="hm-hero">
        {/* Left: headline + search */}
        <div className="hm-hero-left">
          <h1>
            Order food
            <br />
            and more
          </h1>
          <p className="hm-sub">Fresh from our kitchen, delivered to your area</p>

          <div className="hm-search" ref={boxRef}>
            <div className={`hm-search-bar ${error ? "invalid" : ""}`}>
              <svg className="hm-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                placeholder={zonesLoading ? "Loading delivery areas…" : "Enter your postal code or area"}
                value={query}
                disabled={zonesLoading}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                aria-label="Postal code or area"
                aria-invalid={!!error}
              />
              <button type="button" className="hm-search-btn" onClick={handleSearch} disabled={zonesLoading}>
                Search
              </button>
            </div>

            {/* Dropdown */}
            {dropdownOpen && !zonesLoading && (
              <div className="hm-dropdown" role="listbox">
                {zonesError ? (
                  <div className="hm-dd-state">
                    <span>{zonesError}</span>
                    <button type="button" className="hm-dd-retry" onClick={fetchZones}>
                      Try again
                    </button>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="hm-dd-label">We deliver to</div>
                    {suggestions.map((z) => (
                      <button
                        type="button"
                        key={z.id}
                        role="option"
                        aria-selected={selectedZone?.id === z.id}
                        className={`hm-dd-item ${selectedZone?.id === z.id ? "sel" : ""}`}
                        onClick={() => handleSelectZone(z)}
                      >
                        <span className="hm-dd-area">
                          {z.areaName}
                          <span className="hm-dd-city">
                            {z.mainPostalCode} · {z.city}
                          </span>
                        </span>
                        <span className="hm-dd-fee">{money(z.deliveryFee)} delivery</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="hm-dd-state">No matching area — try your postal code</div>
                )}
              </div>
            )}

            {/* Feedback under the input */}
            {error && (
              <p className="hm-error" role="alert">
                {error}
              </p>
            )}
            {!error && selectedZone && (
              <p className="hm-ok">
                ✓ Great — we deliver to {selectedZone.areaName} ({money(selectedZone.deliveryFee)} delivery
                {selectedZone.minOrder > 0 ? `, min. order ${money(selectedZone.minOrder)}` : ""})
              </p>
            )}
          </div>
        </div>

        {/* Right: visual panel */}
        <div className="hm-hero-right">
          <div className="hm-badge">Fresh · Local · Fast</div>
          <div className="hm-plate" aria-hidden>
            <span className="hm-plate-emoji">🍕</span>
          </div>
          <div className="hm-wordmark">
            verd<span>ora</span>.
          </div>
        </div>
      </section>

      {/* ---------------- PIZZA DELIVERY ---------------- */}
      <section className="hm-pizza">
        <div className="hm-pizza-inner">
          <div className="hm-pizza-copy">
            <p className="hm-kicker">Straight from the stone oven</p>
            <h2>
              Hot pizza at your door
              <br />
              in 30 minutes.
            </h2>
            <p className="hm-pizza-lead">
              Hand-stretched dough proved for 48 hours, San Marzano tomatoes, and fior di latte —
              baked at 400°C and boxed the moment it leaves the oven, so it reaches you with the
              crust still crackling.
            </p>

            <ul className="hm-pizza-points">
              <li>
                <span className="hm-point-ic">🔥</span>
                <div>
                  <strong>Baked to order</strong>
                  <span>Nothing sits under a heat lamp — we fire it when you order.</span>
                </div>
              </li>
              <li>
                <span className="hm-point-ic">🛵</span>
                <div>
                  <strong>Insulated delivery</strong>
                  <span>Thermal bags keep it oven-hot the whole way to your door.</span>
                </div>
              </li>
              <li>
                <span className="hm-point-ic">🌿</span>
                <div>
                  <strong>Fresh toppings daily</strong>
                  <span>Produce delivered each morning, never frozen.</span>
                </div>
              </li>
            </ul>

            <a href="/menu" className="hm-pizza-cta">
              See the pizza menu →
            </a>
          </div>

          <div className="hm-pizza-visual" aria-hidden>
            <div className="hm-pizza-disc">
              <span className="hm-pizza-emoji">🍕</span>
            </div>
            <div className="hm-pizza-chip chip-1">
              <strong>30 min</strong>
              <span>avg. delivery</span>
            </div>
            <div className="hm-pizza-chip chip-2">
              <strong>400°C</strong>
              <span>stone oven</span>
            </div>
            <div className="hm-pizza-chip chip-3">
              <strong>48h</strong>
              <span>proved dough</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- HOW TO ORDER ---------------- */}
      <section className="hm-how">
        <p className="hm-how-kicker">How to order</p>
        <h2>It&apos;s as easy as this.</h2>

        <div className="hm-steps">
          <div className="hm-step">
            <div className="hm-step-num">1</div>
            <h3>Find your area</h3>
            <p>Enter your postal code and we&apos;ll check if you&apos;re in one of our delivery zones.</p>
          </div>
          <div className="hm-step">
            <div className="hm-step-num">2</div>
            <h3>Pick your food</h3>
            <p>Choose your dishes, sizes, and add-ons — everything is made fresh to order.</p>
          </div>
          <div className="hm-step">
            <div className="hm-step-num">3</div>
            <h3>Pay your way</h3>
            <p>Cash on delivery, card, or PayPal — then sit back while we bring it over.</p>
          </div>
        </div>
      </section>

   
    </main>
  );
}