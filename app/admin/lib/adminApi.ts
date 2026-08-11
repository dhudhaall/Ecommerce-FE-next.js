// lib/adminApi.ts
// Small fetch wrapper for all admin API calls. Attaches the JWT from
// localStorage, and redirects to /admin/login on 401 (expired/invalid token).

const BASE = process.env.NEXT_PUBLIC_baseURL; // e.g. http://localhost:5000/api

export const TOKEN_KEY = "admin_token";
export const ADMIN_KEY = "admin_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, admin: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getAdmin(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function logout() {
  clearSession();
  if (typeof window !== "undefined") window.location.href = "/admin/login";
}

interface ApiOptions {
  method?: string;
  body?: any;
  auth?: boolean; // attach token (default true)
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  // Auth expired/invalid → clear and bounce to login
  if (res.status === 401 && auth) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || (data as any).message || `Request failed (${res.status})`);
  }
  return data as T;
}