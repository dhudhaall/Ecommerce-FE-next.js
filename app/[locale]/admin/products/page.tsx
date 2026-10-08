"use client";

// app/[locale]/admin/products/page.tsx

import { useEffect, useState } from "react";
import {
  productsApi,
  categoriesApi,
  uploadImageApi,
  money,
  parsePrice,
  type Product,
  type Category,
  type ProductInput,
} from "../lib/menuApi";
import {
  Modal,
  TextField,
  TextArea,
  SelectField,
  Switch,
  ConfirmDialog,
  ListState,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "../components/MenuUI";

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await productsApi.list(filter === "" ? null : filter));
    } catch (err: any) {
      setError(err.message || "Couldn't load products.");
    } finally {
      setLoading(false);
    }
  };

  // Categories are needed for the filter and the form's select
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const categoryName = (p: Product) =>
    p.category?.name ?? categories.find((c) => c.id === p.categoryId)?.name ?? "—";

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await productsApi.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't delete that product.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mn-page">
      <div className="mn-head">
        <div>
          <h1>Products</h1>
          <p>Manage items, sizes, add-ons, and pricing across your menu</p>
        </div>
        <div className="mn-head-actions">
          <button
            type="button"
            className="mn-btn primary"
            onClick={() => setEditing("new")}
            disabled={categories.length === 0}
          >
            <PlusIcon /> Add product
          </button>
        </div>
      </div>

      <div className="mn-filter">
        <label htmlFor="categoryFilter">Category</label>
        <select
          id="categoryFilter"
          className="mn-input mn-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">All categories ({rows.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <ListState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyTitle={
          filter === ""
            ? "No products yet. Add your first item to start building the menu."
            : "No products in this category yet."
        }
        emptyAction={
          <button
            type="button"
            className="mn-btn primary"
            onClick={() => setEditing("new")}
            disabled={categories.length === 0}
          >
            <PlusIcon /> Add product
          </button>
        }
        onRetry={load}
      >
        <div className="mn-table">
          <div className="mn-tr mn-th mn-cols-prod">
            <span>ID</span>
            <span>Product</span>
            <span>Category</span>
            <span>Base price</span>
            <span>Status</span>
            <span />
          </div>

          {rows.map((p) => (
            <div key={p.id} className="mn-tr mn-row mn-cols-prod">
              <span className="mn-id">#{p.id}</span>
              <div>
                <span className="mn-name">{p.name}</span>
                <em className="mn-sub">{p.description}</em>

                {/* Sizes and Addons badges */}
                <div className="mn-sub-tags">
                  {p.sizes && p.sizes.length > 0 ? (
                    <span className="mn-tag-pill sizes" title={p.sizes.map((s) => `${s.name}: ${money(s.price)}`).join(", ")}>
                      📏 {p.sizes.length} size{p.sizes.length > 1 ? "s" : ""} ({p.sizes.map((s) => s.name).join(", ")})
                    </span>
                  ) : (
                    <span className="mn-tag-pill none">📏 Single size</span>
                  )}

                  {p.addons && p.addons.length > 0 ? (
                    <span className="mn-tag-pill addons" title={p.addons.map((a) => `${a.name}: +${money(a.price)}`).join(", ")}>
                      ➕ {p.addons.length} extra{p.addons.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="mn-tag-pill none">➕ No extras</span>
                  )}
                </div>
              </div>
              <span className="mn-sub">{categoryName(p)}</span>
              <span className="mn-price">{money(p.price)}</span>
              <span>
                <span className={`mn-badge ${p.isActive ? "on" : "off"}`}>
                  {p.isActive ? "On menu" : "Hidden"}
                </span>
              </span>
              <span className="mn-actions">
                <button
                  type="button"
                  className="mn-icon-btn"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => setEditing(p)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="mn-icon-btn danger"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => setDeleting(p)}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
      </ListState>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          defaultCategoryId={filter === "" ? categories[0]?.id : filter}
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
          message="Its sizes and addons will also be deleted. Past orders keep their historical record. This can't be undone."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   Product Form Modal with Sizes & Addons Configuration
========================================================= */

interface FormState {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isActive: boolean;
}

interface ItemRow {
  id?: number;
  name: string;
  price: string;
}

type FormErrors = Partial<Record<keyof FormState | "sizes" | "addons", string>>;

function ProductForm({
  product,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  defaultCategoryId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product != null ? String(product.price) : "",
    categoryId: String(product?.categoryId ?? defaultCategoryId ?? ""),
    isActive: product?.isActive ?? true,
  });

  // Image state
  const [imageUrl, setImageUrl] = useState<string>(product?.images?.[0]?.url ?? "");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sizes state (some products have sizes, some do not)
  const [hasSizes, setHasSizes] = useState<boolean>(
    Boolean(product?.sizes && product.sizes.length > 0)
  );
  const [sizesList, setSizesList] = useState<ItemRow[]>(
    product?.sizes && product.sizes.length > 0
      ? product.sizes.map((s) => ({ id: s.id, name: s.name, price: String(s.price) }))
      : [
          { name: "Small", price: "" },
          { name: "Medium", price: "" },
          { name: "Large", price: "" },
        ]
  );

  // Addons state (some products have addons, some do not)
  const [hasAddons, setHasAddons] = useState<boolean>(
    Boolean(product?.addons && product.addons.length > 0)
  );
  const [addonsList, setAddonsList] = useState<ItemRow[]>(
    product?.addons && product.addons.length > 0
      ? product.addons.map((a) => ({ id: a.id, name: a.name, price: String(a.price) }))
      : [{ name: "Extra Cheese", price: "1.50" }]
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* ----- Sizes helper functions ----- */
  const addSizeRow = () => {
    setSizesList((prev) => [...prev, { name: "", price: "" }]);
  };

  const updateSizeRow = (index: number, field: "name" | "price", val: string) => {
    setSizesList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeSizeRow = (index: number) => {
    setSizesList((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPizzaSizesPreset = () => {
    const base = parsePrice(form.price) ?? 10;
    setSizesList([
      { name: "Small", price: (Math.max(1, base - 2)).toFixed(2) },
      { name: "Medium", price: base.toFixed(2) },
      { name: "Large", price: (base + 3).toFixed(2) },
    ]);
  };

  /* ----- Addons helper functions ----- */
  const addAddonRow = () => {
    setAddonsList((prev) => [...prev, { name: "", price: "1.00" }]);
  };

  const updateAddonRow = (index: number, field: "name" | "price", val: string) => {
    setAddonsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeAddonRow = (index: number) => {
    setAddonsList((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPizzaToppingsPreset = () => {
    setAddonsList([
      { name: "Extra Mozzarella", price: "1.80" },
      { name: "Black Olives", price: "1.00" },
      { name: "Mushrooms", price: "1.20" },
      { name: "Jalapeños", price: "1.00" },
      { name: "Garlic Dip", price: "0.80" },
    ]);
  };

  /* ----- Image upload helper ----- */
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setApiError("");
    try {
      const result = await uploadImageApi(file);
      setImageUrl(result.url);
    } catch (err: any) {
      setApiError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  /* ----- Save Product ----- */
  const save = async () => {
    const next: FormErrors = {};

    if (form.name.trim().length < 2) next.name = "Enter a name of at least 2 characters.";
    if (form.description.trim().length < 3) next.description = "Add a short description.";

    const price = parsePrice(form.price);
    if (price === null) next.price = "Enter a valid base price (e.g. 8.50).";

    if (!form.categoryId) next.categoryId = "Pick a category.";

    // Validate sizes if enabled
    if (hasSizes) {
      if (sizesList.length === 0) {
        next.sizes = "Add at least one size, or disable multiple sizes.";
      } else {
        const invalid = sizesList.some((s) => !s.name.trim() || parsePrice(s.price) === null);
        if (invalid) {
          next.sizes = "Each size must have a name and a valid price.";
        }
      }
    }

    // Validate addons if enabled
    if (hasAddons) {
      if (addonsList.length === 0) {
        next.addons = "Add at least one add-on, or disable add-ons.";
      } else {
        const invalid = addonsList.some((a) => !a.name.trim() || parsePrice(a.price) === null);
        if (invalid) {
          next.addons = "Each add-on must have a name and a valid price.";
        }
      }
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    const body: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: price!,
      categoryId: Number(form.categoryId),
      isActive: form.isActive,
      sizes: hasSizes
        ? sizesList.map((s) => ({
            id: s.id,
            name: s.name.trim(),
            price: parsePrice(s.price)!,
          }))
        : [],
      addons: hasAddons
        ? addonsList.map((a) => ({
            id: a.id,
            name: a.name.trim(),
            price: parsePrice(a.price)!,
          }))
        : [],
      images: imageUrl.trim() ? [{ url: imageUrl.trim(), alt: form.name.trim() }] : [],
    };

    setApiError("");
    setSaving(true);

    try {
      if (product) await productsApi.update(product.id, body);
      else await productsApi.create(body);
      onSaved();
    } catch (err: any) {
      setApiError(err.message || "Couldn't save the product.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title={product ? `Edit ${product.name}` : "Add new product"}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="mn-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="mn-btn primary" onClick={save} disabled={saving}>
            {saving ? <span className="mn-spin" /> : product ? "Save changes" : "Add product"}
          </button>
        </>
      }
    >
      <div className="mn-grid">
        {apiError && <div className="mn-alert">{apiError}</div>}

        {/* Basic Info */}
        <TextField
          full
          label="Product Name"
          name="name"
          placeholder="e.g. Margherita Pizza, BBQ Chicken, Tiramisu"
          value={form.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
        />

        <TextArea
          full
          label="Description"
          name="description"
          placeholder="e.g. Fresh tomato sauce, creamy mozzarella, basil leaves, extra virgin olive oil"
          value={form.description}
          error={errors.description}
          onChange={(e) => set("description", e.target.value)}
        />

        <SelectField
          label="Category"
          name="categoryId"
          value={form.categoryId}
          error={errors.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
        >
          <option value="">Choose category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Base Price (€)"
          name="price"
          inputMode="decimal"
          placeholder="8.50"
          value={form.price}
          error={errors.price}
          hint={hasSizes ? "Fallback price if no size is chosen" : "Regular customer price"}
          onChange={(e) => set("price", e.target.value)}
        />

        {/* Image Upload */}
        <div className="mn-field mn-full">
          <label>Product Image</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="file"
              accept="image/*"
              style={{ fontSize: "13px" }}
              onChange={handleImageFileChange}
              disabled={uploadingImage}
            />
            {uploadingImage && <span className="mn-spin" />}
            {imageUrl && (
              <span style={{ fontSize: "12px", color: "var(--ad-pine)" }}>
                ✓ Image selected ({imageUrl.slice(0, 30)}…)
              </span>
            )}
          </div>
          <TextField
            label=""
            name="imageUrl"
            placeholder="Or paste image URL (e.g. https://... or /uploads/...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <Switch
          label="Show on the menu"
          description="Visible to customers in the menu and ordering screens"
          checked={form.isActive}
          onChange={(v) => set("isActive", v)}
        />

        {/* =========================================================
            SIZES SECTION
        ========================================================= */}
        <div className={`mn-section-box ${hasSizes ? "active" : ""}`}>
          <div className="mn-section-head">
            <div>
              <div className="mn-section-title">Product Sizes</div>
              <div className="mn-section-desc">
                Enable for products with size options (e.g. Small, Medium, Large for Pizzas).
              </div>
            </div>
            <label className="mn-switch" style={{ width: "auto" }}>
              <input
                type="checkbox"
                checked={hasSizes}
                onChange={(e) => setHasSizes(e.target.checked)}
              />
              <span className="mn-switch-track" aria-hidden />
            </label>
          </div>

          {hasSizes && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="mn-preset-bar">
                <span style={{ fontSize: "12px", color: "var(--ad-muted)" }}>Quick presets:</span>
                <button
                  type="button"
                  className="mn-preset-btn"
                  onClick={applyPizzaSizesPreset}
                >
                  🍕 Standard Pizza Sizes (Small, Med, Large)
                </button>
              </div>

              {errors.sizes && <div className="mn-err">{errors.sizes}</div>}

              <div className="mn-item-list">
                {sizesList.map((size, idx) => (
                  <div key={idx} className="mn-item-row">
                    <input
                      type="text"
                      className="mn-input"
                      placeholder="Size name (e.g. Medium 30cm)"
                      value={size.name}
                      onChange={(e) => updateSizeRow(idx, "name", e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      className="mn-input"
                      placeholder="Price (€)"
                      value={size.price}
                      onChange={(e) => updateSizeRow(idx, "price", e.target.value)}
                    />
                    <button
                      type="button"
                      className="mn-icon-btn danger"
                      title="Remove size"
                      onClick={() => removeSizeRow(idx)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mn-btn ghost"
                style={{ alignSelf: "flex-start", padding: "6px 14px", fontSize: "13px" }}
                onClick={addSizeRow}
              >
                <PlusIcon /> Add another size
              </button>
            </div>
          )}
        </div>

        {/* =========================================================
            ADDONS SECTION
        ========================================================= */}
        <div className={`mn-section-box ${hasAddons ? "active" : ""}`}>
          <div className="mn-section-head">
            <div>
              <div className="mn-section-title">Add-ons & Toppings</div>
              <div className="mn-section-desc">
                Enable for customizable products with extras (e.g. Extra Cheese, Olives, Sauces).
              </div>
            </div>
            <label className="mn-switch" style={{ width: "auto" }}>
              <input
                type="checkbox"
                checked={hasAddons}
                onChange={(e) => setHasAddons(e.target.checked)}
              />
              <span className="mn-switch-track" aria-hidden />
            </label>
          </div>

          {hasAddons && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="mn-preset-bar">
                <span style={{ fontSize: "12px", color: "var(--ad-muted)" }}>Quick presets:</span>
                <button
                  type="button"
                  className="mn-preset-btn"
                  onClick={applyPizzaToppingsPreset}
                >
                  🧀 Popular Pizza Toppings
                </button>
              </div>

              {errors.addons && <div className="mn-err">{errors.addons}</div>}

              <div className="mn-item-list">
                {addonsList.map((addon, idx) => (
                  <div key={idx} className="mn-item-row">
                    <input
                      type="text"
                      className="mn-input"
                      placeholder="Add-on name (e.g. Extra Cheese)"
                      value={addon.name}
                      onChange={(e) => updateAddonRow(idx, "name", e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      className="mn-input"
                      placeholder="+ Price (€)"
                      value={addon.price}
                      onChange={(e) => updateAddonRow(idx, "price", e.target.value)}
                    />
                    <button
                      type="button"
                      className="mn-icon-btn danger"
                      title="Remove add-on"
                      onClick={() => removeAddonRow(idx)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mn-btn ghost"
                style={{ alignSelf: "flex-start", padding: "6px 14px", fontSize: "13px" }}
                onClick={addAddonRow}
              >
                <PlusIcon /> Add another add-on
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}