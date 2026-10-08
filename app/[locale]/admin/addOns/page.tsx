"use client";

// app/[locale]/admin/addons/page.tsx
//
// Addons belong to one product (Prisma: Addon.productId is required), so
// "attaching" an addon means choosing its product here.

import { useEffect, useState } from "react";
import {
  addonsApi,
  productsApi,
  money,
  parsePrice,
  type Addon,
  type Product,
  type AddonInput,
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


export default function AddonsPage() {
  const [rows, setRows] = useState<Addon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Addon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Addon | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await addonsApi.list(filter === "" ? null : filter));
    } catch (err: any) {
      setError(err.message || "Couldn't load addons.");
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

  const productName = (a: Addon) =>
    a.product?.name ?? products.find((p) => p.id === a.productId)?.name ?? `#${a.productId}`;

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await addonsApi.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't delete that addon.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mn-page">
      <div className="mn-head">
        <div>
          <h1>Addons</h1>
          <p>Extras customers can add to a product, each with its own price</p>
        </div>
        <div className="mn-head-actions">
          <button
            type="button"
            className="mn-btn primary"
            onClick={() => setEditing("new")}
            disabled={products.length === 0}
          >
            <PlusIcon /> Add addon
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
          {rows.length} addon{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {products.length === 0 && !loading && (
        <div className="mn-alert" style={{ marginBottom: 16 }}>
          Add a product first — every addon belongs to one.
        </div>
      )}

      <ListState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyTitle={
          filter === ""
            ? "No addons yet. Add extras like cheese or chicken."
            : "This product has no addons yet."
        }
        emptyAction={
          products.length > 0 ? (
            <button type="button" className="mn-btn primary" onClick={() => setEditing("new")}>
              <PlusIcon /> Add addon
            </button>
          ) : undefined
        }
        onRetry={load}
      >
        <div className="mn-table">
          <div className="mn-tr mn-th mn-cols-opt">
            <span>ID</span>
            <span>Addon</span>
            <span>Product</span>
            <span>Price</span>
            <span />
          </div>

          {rows.map((a) => (
            <div key={a.id} className="mn-tr mn-row mn-cols-opt">
              <span className="mn-id">#{a.id}</span>
              <span className="mn-name">{a.name}</span>
              <span className="mn-sub">{productName(a)}</span>
              <span className="mn-price">+{money(a.price)}</span>
              <span className="mn-actions">
                <button
                  type="button"
                  className="mn-icon-btn"
                  aria-label={`Edit ${a.name}`}
                  onClick={() => setEditing(a)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="mn-icon-btn danger"
                  aria-label={`Delete ${a.name}`}
                  onClick={() => setDeleting(a)}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
      </ListState>

      {editing && (
        <AddonForm
          addon={editing === "new" ? null : editing}
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
          message="Customers won't be able to add this extra any more. This can't be undone."
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

function AddonForm({
  addon,
  products,
  defaultProductId,
  onClose,
  onSaved,
}: {
  addon: Addon | null;
  products: Product[];
  defaultProductId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(addon?.name ?? "");
  const [price, setPrice] = useState(addon != null ? String(addon.price) : "");
  const [productId, setProductId] = useState(String(addon?.productId ?? defaultProductId ?? ""));

  const [errors, setErrors] = useState<{ name?: string; price?: string; productId?: string }>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: typeof errors = {};

    if (name.trim().length < 2) next.name = "Enter a name of at least 2 characters.";

    const parsed = parsePrice(price);
    if (parsed === null) next.price = "Enter a price, for example 1.50.";

    if (!productId) next.productId = "Pick the product this belongs to.";

    setErrors(next);
    if (Object.keys(next).length) return;

    const body: AddonInput = {
      name: name.trim(),
      price: parsed!,
      productId: Number(productId),
    };

    setApiError("");
    setSaving(true);

    try {
      if (addon) await addonsApi.update(addon.id, body);
      else await addonsApi.create(body);
      onSaved();
    } catch (err: any) {
      setApiError(err.message || "Couldn't save the addon.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title={addon ? "Edit addon" : "Add addon"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="mn-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="mn-btn primary" onClick={save} disabled={saving}>
            {saving ? <span className="mn-spin" /> : addon ? "Save changes" : "Add addon"}
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
          placeholder="Extra cheese"
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
          placeholder="1.50"
          value={price}
          error={errors.price}
          hint="Added on top of the product price"
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