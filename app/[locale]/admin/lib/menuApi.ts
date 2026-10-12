// app/[locale]/admin/lib/menuApi.ts
//
// Menu CRUD calls. Reuses api() from adminApi so every request carries the
// admin JWT and gets the shared 401 -> login handling.

import { api, getToken } from "./adminApi";

const BASE = process.env.NEXT_PUBLIC_baseURL;

/* ---------------- Types (mirror the Prisma schema) ---------------- */

export interface Category {
  id: number;
  name: string;
  image?: string | null;
  /** Optional — include a _count on the backend to show usage before deleting */
  productCount?: number;
}

export interface ProductRef {
  id: number;
  name: string;
}

export interface Size {
  id: number;
  name: string;
  price: number;
  productId: number;
  product?: ProductRef;
}

export interface Addon {
  id: number;
  name: string;
  price: number;
  productId: number;
  product?: ProductRef;
}

export interface ProductImage {
  id?: number;
  url: string;
  alt?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isActive: boolean;
  category?: { id: number; name: string };
  sizes?: Size[];
  addons?: Addon[];
  images?: ProductImage[];
}

/* ---------------- Response unwrapping ----------------
 * Tolerates [], { data: [] } and { <key>: [] } so the pages keep working
 * whichever shape the backend settles on. */

function unwrap<T>(res: any, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (key && Array.isArray(res?.[key])) return res[key];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

/* ---------------- Categories ---------------- */

export interface CategoryInput {
  name: string;
  image?: string;
  imageFile?: File | null;
}

export const categoriesApi = {
  list: async (): Promise<Category[]> =>
    unwrap<Category>(await api("/admin/categories"), "categories"),

  create: (body: CategoryInput) => {
    if (body.imageFile) {
      const fd = new FormData();
      fd.append("name", body.name);
      fd.append("image", body.imageFile);
      return api<Category>("/admin/categories", { method: "POST", body: fd });
    }
    return api<Category>("/admin/categories", { method: "POST", body: { name: body.name, image: body.image } });
  },

  update: (id: number, body: CategoryInput) => {
    if (body.imageFile) {
      const fd = new FormData();
      fd.append("name", body.name);
      fd.append("image", body.imageFile);
      return api<Category>(`/admin/categories/${id}`, { method: "PUT", body: fd });
    }
    return api<Category>(`/admin/categories/${id}`, { method: "PUT", body: { name: body.name, image: body.image } });
  },

  remove: (id: number) => api(`/admin/categories/${id}`, { method: "DELETE" }),
};

/* ---------------- Products ---------------- */

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isActive: boolean;
  sizes?: { id?: number; name: string; price: number }[];
  addons?: { id?: number; name: string; price: number }[];
  images?: { url: string; alt?: string }[];
}

export const productsApi = {
  list: async (categoryId?: number | null): Promise<Product[]> => {
    const qs = categoryId ? `?categoryId=${categoryId}` : "";
    return unwrap<Product>(await api(`/admin/products${qs}`), "products");
  },

  get: (id: number) => api<Product>(`/admin/products/${id}`),

  create: (body: ProductInput) => api<Product>("/admin/products", { method: "POST", body }),

  update: (id: number, body: ProductInput) =>
    api<Product>(`/admin/products/${id}`, { method: "PUT", body }),

  remove: (id: number) => api(`/admin/products/${id}`, { method: "DELETE" }),
};


/* ---------------- Media Upload ---------------- */

export const uploadImageApi = async (file: File): Promise<{ url: string }> => {
  const token = getToken();
  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch(`${BASE}/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Image upload failed (${res.status})`);
  }

  return res.json();
};

/* ---------------- Shared helpers ---------------- */

export const money = (n: number) => `€${Number(n ?? 0).toFixed(2)}`;

/** Parses a price input. Returns null when it isn't a usable number. */
export function parsePrice(raw: string): number | null {
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}