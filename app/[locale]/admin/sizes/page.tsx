"use client";

// app/[locale]/admin/sizes/page.tsx
//
// Sizes belong to one product (Prisma: Size.productId is required). The size
// price replaces the product's base price rather than adding to it — that's
// how the checkout summary treats it.

import { useEffect, useState } from "react";
import {
  sizesApi,
  productsApi,
  money,
  parsePrice,
  type Size,
  type Product,
  type SizeInput,
} from "../lib/menuApi";
import {
  Modal,
  TextField,
  SelectField,
  ConfirmDialog,
  ListState,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "../components/MenuUI";


export default function SizesPage() {
  const [rows, setRows] = useState<Size[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Size | "new" | null>(null);
  const [deleting, setDeleting] = useState<Size | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await sizesApi.list(filter === "" ? null : filter));
    } catch (err: any) {
      setError(err.message || "Couldn't load sizes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    productsApi.list().then(setProducts).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const productName = (s: Size) =>
    s.product?.name ?? products.find((p) => p.id === s.productId)?.name ?? `#${s.productId}`;

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await sizesApi.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't delete that size.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mn-page">
      <div className="mn-head">
        <div>
          <h1>Sizes</h1>
          <p>Size options for a product, each with the price customers pay</p>
        </div>
        <div className="mn-head-actions">
          <button
            type="button"
            className="mn-btn primary"
            onClick={() => setEditing("new")}
            disabled={products.length === 0}
          >
            <PlusIcon /> Add size
          </button>
        </div>
      </div>

      <div className="mn-filter">
        <label htmlFor="productFilter">Product</label>
        <select
          id="productFilter"
          className="mn-input mn-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="mn-count">
          {rows.length} size{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {products.length === 0 && !loading && (
        <div className="mn-alert" style={{ marginBottom: 16 }}>
          Add a product first — every size belongs to one.
        </div>
      )}

      <ListState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyTitle={
          filter === ""
            ? "No sizes yet. Add options like Small, Medium and Large."
            : "This product has no sizes yet."
        }
        emptyAction={
          products.length > 0 ? (
            <button type="button" className="mn-btn primary" onClick={() => setEditing("new")}>
              <PlusIcon /> Add size
            </button>
          ) : undefined
        }
        onRetry={load}
      >
        <div className="mn-table">
          <div className="mn-tr mn-th mn-cols-opt">
            <span>ID</span>
            <span>Size</span>
            <span>Product</span>
            <span>Price</span>
            <span />
          </div>

          {rows.map((s) => (
            <div key={s.id} className="mn-tr mn-row mn-cols-opt">
              <span className="mn-id">#{s.id}</span>
              <span className="mn-name">{s.name}</span>
              <span className="mn-sub">{productName(s)}</span>
              <span className="mn-price">{money(s.price)}</span>
              <span className="mn-actions">
                <button
                  type="button"
                  className="mn-icon-btn"
                  aria-label={`Edit ${s.name}`}
                  onClick={() => setEditing(s)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="mn-icon-btn danger"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => setDeleting(s)}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
      </ListState>

      {editing && (
        <SizeForm
          size={editing === "new" ? null : editing}
          products={products}
          defaultProductId={filter === "" ? products[0]?.id : filter}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="Customers won't be able to pick this size any more. This can't be undone."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   Form
========================================================= */

function SizeForm({
  size,
  products,
  defaultProductId,
  onClose,
  onSaved,
}: {
  size: Size | null;
  products: Product[];
  defaultProductId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(size?.name ?? "");
  const [price, setPrice] = useState(size != null ? String(size.price) : "");
  const [productId, setProductId] = useState(String(size?.productId ?? defaultProductId ?? ""));

  const [errors, setErrors] = useState<{ name?: string; price?: string; productId?: string }>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: typeof errors = {};

    if (name.trim().length < 1) next.name = "Enter a size name.";

    const parsed = parsePrice(price);
    if (parsed === null) next.price = "Enter a price, for example 12.00.";

    if (!productId) next.productId = "Pick the product this belongs to.";

    setErrors(next);
    if (Object.keys(next).length) return;

    const body: SizeInput = {
      name: name.trim(),
      price: parsed!,
      productId: Number(productId),
    };

    setApiError("");
    setSaving(true);

    try {
      if (size) await sizesApi.update(size.id, body);
      else await sizesApi.create(body);
      onSaved();
    } catch (err: any) {
      setApiError(err.message || "Couldn't save the size.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title={size ? "Edit size" : "Add size"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="mn-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="mn-btn primary" onClick={save} disabled={saving}>
            {saving ? <span className="mn-spin" /> : size ? "Save changes" : "Add size"}
          </button>
        </>
      }
    >
      <div className="mn-grid">
        {apiError && <div className="mn-alert">{apiError}</div>}

        <TextField
          full
          label="Name"
          name="name"
          placeholder="Large"
          value={name}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((x) => ({ ...x, name: undefined }));
          }}
        />

        <TextField
          label="Price (€)"
          name="price"
          inputMode="decimal"
          placeholder="12.00"
          value={price}
          error={errors.price}
          hint="Replaces the base price"
          onChange={(e) => {
            setPrice(e.target.value);
            setErrors((x) => ({ ...x, price: undefined }));
          }}
        />

        <SelectField
          label="Product"
          name="productId"
          value={productId}
          error={errors.productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setErrors((x) => ({ ...x, productId: undefined }));
          }}
        >
          <option value="">Choose one…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
      </div>
    </Modal>
  );
}