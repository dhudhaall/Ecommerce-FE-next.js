"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/adminApi";
import { money } from "@/app/[locale]/admin/lib/orders";

interface SalesPeriod {
  totalSales: number;
  orderCount: number;
}

interface ChartPoint {
  key: string;
  shortLabel: string;
  label: string;
  orders: number;
  sales: number;
}

interface SalesData {
  today: SalesPeriod;
  thisWeek: SalesPeriod;
  thisMonth: SalesPeriod;
  allTime: SalesPeriod;
  charts: {
    daily: ChartPoint[];
    weekly: ChartPoint[];
    monthly: ChartPoint[];
    yearly: ChartPoint[];
  };
}

type PeriodFilter = "daily" | "weekly" | "monthly" | "yearly";
type MetricType = "orders" | "sales";

export default function SalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState<PeriodFilter>("daily");
  const [metric, setMetric] = useState<MetricType>("orders");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<{ success: boolean; data: SalesData }>("/admin/sales");
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load sales statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chartPoints = useMemo(() => {
    if (!data?.charts) return [];
    return data.charts[period] || [];
  }, [data, period]);

  const maxVal = useMemo(() => {
    if (chartPoints.length === 0) return 10;
    const values = chartPoints.map((p) => (metric === "orders" ? p.orders : p.sales));
    const highest = Math.max(...values, 0);
    if (highest === 0) return metric === "orders" ? 5 : 50;
    return metric === "orders" ? Math.ceil(highest * 1.25) : Math.ceil(highest * 1.2);
  }, [chartPoints, metric]);

  const totalPeriodVal = useMemo(() => {
    return chartPoints.reduce(
      (sum, p) => sum + (metric === "orders" ? p.orders : p.sales),
      0
    );
  }, [chartPoints, metric]);

  const peakPoint = useMemo(() => {
    if (chartPoints.length === 0) return null;
    return [...chartPoints].sort((a, b) =>
      metric === "orders" ? b.orders - a.orders : b.sales - a.sales
    )[0];
  }, [chartPoints, metric]);

  const avgPeriodVal = useMemo(() => {
    if (chartPoints.length === 0) return 0;
    return totalPeriodVal / chartPoints.length;
  }, [chartPoints, totalPeriodVal]);

  const aov =
    data && data.allTime.orderCount > 0
      ? (data.allTime.totalSales / data.allTime.orderCount).toFixed(2)
      : "0.00";

  return (
    <div className="ad-page">
      {/* Header */}
      <div className="ad-page-head">
        <div>
          <h1>Sales & Analytics</h1>
          <p className="ad-page-sub">Revenue performance, orders distribution, and period analytics</p>
        </div>
        <div className="ad-head-actions">
          <button type="button" className="ad-btn ghost" onClick={load} disabled={loading}>
            {loading ? <span className="ad-spinner" /> : <RefreshIcon />} Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ad-state">
          <span className="ad-spinner" /> Loading sales metrics…
        </div>
      ) : error ? (
        <div className="ad-state">
          <p className="ad-err-text">{error}</p>
          <button type="button" className="ad-btn ghost" onClick={load}>
            Try again
          </button>
        </div>
      ) : data ? (
        <>
          {/* Key Metric KPI Cards */}
          <div className="ad-stats-grid">
            {/* Today */}
            <div className="ad-stat-card">
              <div className="ad-stat-card-head">
                <span className="ad-stat-title">Today's Sales</span>
                <span className="ad-stat-icon-wrap today">☀️</span>
              </div>
              <div className="ad-stat-value">{money(data.today.totalSales, "eur")}</div>
              <div className="ad-stat-sub">
                <span className="ad-stat-pill success">
                  {data.today.orderCount} {data.today.orderCount === 1 ? "order" : "orders"}
                </span>
                <span>placed today</span>
              </div>
            </div>

            {/* This Week */}
            <div className="ad-stat-card">
              <div className="ad-stat-card-head">
                <span className="ad-stat-title">This Week</span>
                <span className="ad-stat-icon-wrap week">📅</span>
              </div>
              <div className="ad-stat-value">{money(data.thisWeek.totalSales, "eur")}</div>
              <div className="ad-stat-sub">
                <span className="ad-stat-pill info">
                  {data.thisWeek.orderCount} {data.thisWeek.orderCount === 1 ? "order" : "orders"}
                </span>
                <span>since Monday</span>
              </div>
            </div>

            {/* This Month */}
            <div className="ad-stat-card">
              <div className="ad-stat-card-head">
                <span className="ad-stat-title">This Month</span>
                <span className="ad-stat-icon-wrap month">📈</span>
              </div>
              <div className="ad-stat-value">{money(data.thisMonth.totalSales, "eur")}</div>
              <div className="ad-stat-sub">
                <span className="ad-stat-pill warning">
                  {data.thisMonth.orderCount} {data.thisMonth.orderCount === 1 ? "order" : "orders"}
                </span>
                <span>this calendar month</span>
              </div>
            </div>

            {/* All-Time */}
            <div className="ad-stat-card">
              <div className="ad-stat-card-head">
                <span className="ad-stat-title">All-Time Revenue</span>
                <span className="ad-stat-icon-wrap all">💎</span>
              </div>
              <div className="ad-stat-value">{money(data.allTime.totalSales, "eur")}</div>
              <div className="ad-stat-sub">
                <span>{data.allTime.orderCount} total orders</span>
                <span>·</span>
                <span>Avg. €{aov}</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Component */}
          <div className="ad-chart-card">
            <div className="ad-chart-header">
              <div className="ad-chart-title-area">
                <h2>Orders & Revenue Timeline</h2>
                <p>
                  Showing {metric === "orders" ? "orders volume" : "sales revenue"} over {period} intervals
                </p>
              </div>

              <div className="ad-chart-controls">
                {/* Metric Selector (Orders / Sales) */}
                <div className="ad-pill-group" role="group" aria-label="Metric Type">
                  <button
                    type="button"
                    className={`ad-pill-btn ${metric === "orders" ? "active" : ""}`}
                    onClick={() => setMetric("orders")}
                  >
                    📦 Orders
                  </button>
                  <button
                    type="button"
                    className={`ad-pill-btn ${metric === "sales" ? "active" : ""}`}
                    onClick={() => setMetric("sales")}
                  >
                    💶 Sales (€)
                  </button>
                </div>

                {/* Period Filter (Daily / Weekly / Monthly / Yearly) */}
                <div className="ad-pill-group" role="group" aria-label="Period Filter">
                  <button
                    type="button"
                    className={`ad-pill-btn ${period === "daily" ? "active" : ""}`}
                    onClick={() => {
                      setPeriod("daily");
                      setHoveredIndex(null);
                    }}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    className={`ad-pill-btn ${period === "weekly" ? "active" : ""}`}
                    onClick={() => {
                      setPeriod("weekly");
                      setHoveredIndex(null);
                    }}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    className={`ad-pill-btn ${period === "monthly" ? "active" : ""}`}
                    onClick={() => {
                      setPeriod("monthly");
                      setHoveredIndex(null);
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`ad-pill-btn ${period === "yearly" ? "active" : ""}`}
                    onClick={() => {
                      setPeriod("yearly");
                      setHoveredIndex(null);
                    }}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>

            {/* SVG Chart Rendering */}
            <div className="ad-chart-wrap">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 280"
                preserveAspectRatio="none"
                style={{ overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f5b3f" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#17452f" stopOpacity="0.75" />
                  </linearGradient>
                  <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2e7d32" stopOpacity="1" />
                    <stop offset="100%" stopColor="#1f5b3f" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal guidelines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = 230 - pct * 190;
                  const val = Math.round(pct * maxVal);
                  return (
                    <g key={i}>
                      <line
                        x1="45"
                        y1={y}
                        x2="790"
                        y2={y}
                        stroke="#eef1ec"
                        strokeDasharray={i === 0 ? "none" : "3,3"}
                        strokeWidth="1"
                      />
                      <text
                        x="35"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#8c988e"
                        fontFamily="inherit"
                      >
                        {metric === "orders" ? val : `€${val}`}
                      </text>
                    </g>
                  );
                })}

                {/* Bars & Interactive Rectangles */}
                {chartPoints.map((p, idx) => {
                  const totalBars = chartPoints.length;
                  const availableWidth = 745;
                  const slotWidth = availableWidth / totalBars;
                  const barWidth = Math.min(Math.max(slotWidth * 0.45, 14), 52);
                  const x = 55 + idx * slotWidth + (slotWidth - barWidth) / 2;

                  const currentVal = metric === "orders" ? p.orders : p.sales;
                  const barHeight = Math.max((currentVal / maxVal) * 190, currentVal > 0 ? 6 : 0);
                  const y = 230 - barHeight;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g
                      key={p.key}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Transparent wider target hit zone for easy hovering */}
                      <rect
                        x={55 + idx * slotWidth}
                        y="20"
                        width={slotWidth}
                        height="220"
                        fill="transparent"
                      />

                      {/* Bar Shadow / Placeholder Base */}
                      <rect
                        x={x}
                        y={228}
                        width={barWidth}
                        height={2}
                        rx={1}
                        fill="#dfe4dd"
                      />

                      {/* Actual Value Bar */}
                      {barHeight > 0 && (
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={Math.min(barWidth / 3, 6)}
                          fill={isHovered ? "url(#barGradientHover)" : "url(#barGradientPrimary)"}
                          style={{
                            transition: "all 0.2s ease",
                            filter: isHovered ? "drop-shadow(0 4px 10px rgba(31,91,63,0.3))" : "none",
                          }}
                        />
                      )}

                      {/* Value label on top of bar if active or non-zero */}
                      {currentVal > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 7}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={isHovered ? "700" : "500"}
                          fill={isHovered ? "#17452f" : "#556459"}
                          fontFamily="inherit"
                        >
                          {metric === "orders" ? currentVal : `€${Math.round(currentVal)}`}
                        </text>
                      )}

                      {/* X-axis Label */}
                      <text
                        x={x + barWidth / 2}
                        y="254"
                        textAnchor="middle"
                        fontSize="11.5"
                        fontWeight={isHovered ? "700" : "500"}
                        fill={isHovered ? "#17251d" : "#718076"}
                        fontFamily="inherit"
                      >
                        {p.shortLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip */}
              {hoveredIndex !== null && chartPoints[hoveredIndex] && (
                (() => {
                  const pt = chartPoints[hoveredIndex];
                  const totalBars = chartPoints.length;
                  const pct = (hoveredIndex + 0.5) / totalBars;
                  return (
                    <div
                      className="ad-chart-tooltip"
                      style={{
                        left: `${Math.max(10, Math.min(pct * 90 + 5, 90))}%`,
                        top: "35%",
                      }}
                    >
                      <div className="font-bold text-xs text-emerald-400 mb-1">{pt.label}</div>
                      <div>
                        <strong>{pt.orders}</strong> {pt.orders === 1 ? "order" : "orders"}
                      </div>
                      <div className="text-gray-300">
                        Revenue: <strong>{money(pt.sales, "eur")}</strong>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Chart Summary Stats */}
            <div className="ad-chart-summary-bar">
              <div className="ad-chart-summary-item">
                <span className="ad-chart-summary-label">Selected Total</span>
                <span className="ad-chart-summary-value">
                  {metric === "orders" ? `${totalPeriodVal} orders` : money(totalPeriodVal, "eur")}
                </span>
              </div>

              {peakPoint && (
                <div className="ad-chart-summary-item">
                  <span className="ad-chart-summary-label">Highest Peak</span>
                  <span className="ad-chart-summary-value">
                    {metric === "orders"
                      ? `${peakPoint.orders} orders (${peakPoint.shortLabel})`
                      : `${money(peakPoint.sales, "eur")} (${peakPoint.shortLabel})`}
                  </span>
                </div>
              )}

              <div className="ad-chart-summary-item">
                <span className="ad-chart-summary-label">Period Average</span>
                <span className="ad-chart-summary-value">
                  {metric === "orders"
                    ? `${avgPeriodVal.toFixed(1)} orders / ${period === "daily" ? "day" : period === "weekly" ? "week" : period === "monthly" ? "month" : "year"}`
                    : `${money(avgPeriodVal, "eur")} / ${period === "daily" ? "day" : period === "weekly" ? "week" : period === "monthly" ? "month" : "year"}`}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
