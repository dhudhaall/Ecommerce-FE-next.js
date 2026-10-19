"use client";

// app/[locale]/admin/categories/page.tsx

import { useEffect, useState } from "react";
import { categoriesApi, type Category } from "../lib/menuApi";
import {
  Modal,
  TextField,
  ConfirmDialog,
  ListState,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from "../components/MenuUI";

const IMAGE_BASE = process.env.NEXT_PUBLIC_baseURL_images || "http://localhost:3000";

function getImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${IMAGE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  // Sorting and Drag & Drop state
  type SortField = "custom" | "id" | "name" | "productCount";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("custom");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"top" | "bottom" | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await categoriesApi.list());
    } catch (err: any) {
      setError(err.message || "Couldn't load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await categoriesApi.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't delete that category.");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "productCount" ? "desc" : "asc");
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (sortField === "custom") return 0; // Natural persisted order
    if (sortField === "id") {
      return sortDir === "asc" ? a.id - b.id : b.id - a.id;
    }
    if (sortField === "name") {
      return sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortField === "productCount") {
      const ca = a.productCount ?? 0;
      const cb = b.productCount ?? 0;
      return sortDir === "asc" ? ca - cb : cb - ca;
    }
    return 0;
  });

  /* Drag and Drop handlers */
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIdx === null || draggedIdx === index) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "top" : "bottom";

    setDragOverIdx(index);
    setDragOverPos(pos);
  };

  const onDragLeave = () => {
    // Only reset if leaving the row entirely
  };

  const onDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      setDragOverPos(null);
      return;
    }

    const currentList = [...sortedRows];
    const [movedItem] = currentList.splice(draggedIdx, 1);

    let insertAt = targetIndex;
    if (draggedIdx < targetIndex && dragOverPos === "top") {
      insertAt = targetIndex - 1;
    } else if (draggedIdx > targetIndex && dragOverPos === "bottom") {
      insertAt = targetIndex + 1;
    }
    insertAt = Math.max(0, Math.min(currentList.length, insertAt));
    currentList.splice(insertAt, 0, movedItem);

    // Apply immediate local state update & switch to custom sort mode
    setRows(currentList);
    setSortField("custom");
    setSortDir("asc");
    setDraggedIdx(null);
    setDragOverIdx(null);
    setDragOverPos(null);

    // Persist to database
    setSaveStatus("Saving order...");
    try {
      await categoriesApi.reorder(currentList.map((c) => c.id));
      setSaveStatus("Order saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save category order.");
      setSaveStatus("");
    }
  };

  const onDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    setDragOverPos(null);
  };

  return (
    <div className="mn-page">
      <div className="mn-head">
        <div>
          <h1>Categories</h1>
          <p>Group products into sections and order them for customer storefront</p>
        </div>
        <div className="mn-head-actions">
          <button type="button" className="mn-btn primary" onClick={() => setEditing("new")}>
            <PlusIcon /> Add category
          </button>
        </div>
      </div>

      {/* Sorting toolbar */}
      <div className="mn-sort-toolbar">
        <span className="mn-sort-toolbar-label">Sort by:</span>
        <button
          type="button"
          className={`mn-sort-pill ${sortField === "custom" ? "active" : ""}`}
          onClick={() => {
            setSortField("custom");
            setSortDir("asc");
          }}
          title="Drag and drop rows to customize storefront order"
        >
          Custom Order (Drag & Drop)
        </button>
        <button
          type="button"
          className={`mn-sort-pill ${sortField === "name" ? "active" : ""}`}
          onClick={() => handleHeaderSort("name")}
        >
          Name {sortField === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
        <button
          type="button"
          className={`mn-sort-pill ${sortField === "productCount" ? "active" : ""}`}
          onClick={() => handleHeaderSort("productCount")}
        >
          Products {sortField === "productCount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
        <button
          type="button"
          className={`mn-sort-pill ${sortField === "id" ? "active" : ""}`}
          onClick={() => handleHeaderSort("id")}
        >
          ID {sortField === "id" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>

        <span className="mn-reorder-hint">
          {saveStatus ? (
            <span style={{ color: "var(--ad-primary)", fontWeight: 600 }}>{saveStatus}</span>
          ) : (
            <span>⠿ Drag rows or handles to reorder</span>
          )}
        </span>
      </div>

      <ListState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyTitle="No categories yet. Add one to start building the menu."
        emptyAction={
          <button type="button" className="mn-btn primary" onClick={() => setEditing("new")}>
            <PlusIcon /> Add category
          </button>
        }
        onRetry={load}
      >
        <div className="mn-table">
          <div className="mn-tr mn-th mn-cols-cat">
            <span style={{ textAlign: "center", color: "var(--ad-muted)" }}>⠿</span>
            <button
              type="button"
              className={`mn-th-sortable ${sortField === "id" ? "active" : ""}`}
              onClick={() => handleHeaderSort("id")}
            >
              ID
              <span className="mn-sort-arrow">
                {sortField === "id" ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
              </span>
            </button>
            <button
              type="button"
              className={`mn-th-sortable ${sortField === "name" ? "active" : ""}`}
              onClick={() => handleHeaderSort("name")}
            >
              Name
              <span className="mn-sort-arrow">
                {sortField === "name" ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
              </span>
            </button>
            <button
              type="button"
              className={`mn-th-sortable ${sortField === "productCount" ? "active" : ""}`}
              onClick={() => handleHeaderSort("productCount")}
            >
              Products
              <span className="mn-sort-arrow">
                {sortField === "productCount" ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
              </span>
            </button>
            <span />
          </div>

          {sortedRows.map((c, index) => {
            const isDragging = draggedIdx === index;
            const isDragOver = dragOverIdx === index;
            const dropClass = isDragOver
              ? dragOverPos === "top"
                ? "is-drag-over-top"
                : "is-drag-over-bottom"
              : "";

            return (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                className={`mn-tr mn-row mn-cols-cat ${isDragging ? "is-dragging" : ""} ${dropClass}`}
                style={{ cursor: "grab" }}
              >
                <div className="mn-drag-handle" title="Drag to reorder">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="5" r="2" />
                    <circle cx="9" cy="12" r="2" />
                    <circle cx="9" cy="19" r="2" />
                    <circle cx="15" cy="5" r="2" />
                    <circle cx="15" cy="12" r="2" />
                    <circle cx="15" cy="19" r="2" />
                  </svg>
                </div>
                <span className="mn-id">#{c.id}</span>
                <span className="mn-name" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {c.image ? (
                    <img
                      src={getImageUrl(c.image)!}
                      alt={c.name}
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {c.name}
                </span>
                <span className="mn-sub">
                  {c.productCount != null ? `${c.productCount} product${c.productCount === 1 ? "" : "s"}` : "—"}
                </span>
                <span className="mn-actions">
                  <button
                    type="button"
                    className="mn-icon-btn"
                    aria-label={`Edit ${c.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                    }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="mn-icon-btn danger"
                    aria-label={`Delete ${c.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(c);
                    }}
                  >
                    <TrashIcon />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </ListState>

      {editing && (
        <CategoryForm
          category={editing === "new" ? null : editing}
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
          message="Products in this category will lose their grouping. This can't be undone."
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

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(getImageUrl(category?.image));
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const save = async () => {
    const value = name.trim();

    if (value.length < 2) {
      setFieldError("Enter a name of at least 2 characters.");
      return;
    }

    setFieldError("");
    setApiError("");
    setSaving(true);

    try {
      if (category) {
        await categoriesApi.update(category.id, { name: value, imageFile });
      } else {
        await categoriesApi.create({ name: value, imageFile });
      }
      onSaved();
    } catch (err: any) {
      setApiError(err.message || "Couldn't save the category.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title={category ? "Edit category" : "Add category"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="mn-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="mn-btn primary" onClick={save} disabled={saving}>
            {saving ? <span className="mn-spin" /> : category ? "Save changes" : "Add category"}
          </button>
        </>
      }
    >
      <div className="mn-grid" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {apiError && <div className="mn-alert">{apiError}</div>}

        <TextField
          full
          label="Name"
          name="name"
          placeholder="Pizza"
          value={name}
          error={fieldError}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />

        <div className="mn-field">
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
            Category Image
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontSize: 11,
                }}
              >
                No Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}