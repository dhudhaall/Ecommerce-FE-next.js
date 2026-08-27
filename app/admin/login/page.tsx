"use client";

import { useState } from "react";
import { api, setSession, getToken } from "@/app/admin/lib/adminApi";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in? Skip straight to orders.
  if (typeof window !== "undefined" && getToken()) {
    window.location.href = "/admin/orders";
  }

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ token: string; admin: any }>("/admin/login", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), password },
      });
      setSession(data.token, data.admin);
      window.location.href = "/admin/orders";
    } catch (err: any) {
      setError(err.message || "Login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="ad-login">
      <div className="ad-login-card">
        <div className="ad-brand center">
          Pizzaria<span> Con Amore</span>. <em>admin</em>
        </div>
        <p className="ad-login-sub">Sign in to manage orders</p>

        <div className="ad-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="admin@yourstore.com"
          />
        </div>

        <div className="ad-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="ad-alert">{error}</div>}

        <button type="button" className="ad-btn primary full" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="ad-spinner light" /> : "Sign in"}
        </button>
      </div>
    </div>
  );
}