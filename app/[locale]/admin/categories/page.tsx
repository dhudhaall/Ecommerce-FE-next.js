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

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="mn-page">
      <div className="mn-head">
        <div>
          <h1>Categories</h1>
          <p>Group products into the sections customers browse</p>
        </div>
        <div className="mn-head-actions">
          <button type="button" className="mn-btn primary" onClick={() => setEditing("new")}>
            <PlusIcon /> Add category
          </button>
        </div>
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
            <span>ID</span>
            <span>Name</span>
            <span>Products</span>
            <span />
          </div>

          {rows.map((c) => (
            <div key={c.id} className="mn-tr mn-row mn-cols-cat">
              <span className="mn-id">#{c.id}</span>
              <span className="mn-name">{c.name}</span>
              <span className="mn-sub">
                {c.productCount != null ? `${c.productCount} product${c.productCount === 1 ? "" : "s"}` : "—"}
              </span>
              <span className="mn-actions">
                <button
                  type="button"
                  className="mn-icon-btn"
                  aria-label={`Edit ${c.name}`}
                  onClick={() => setEditing(c)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="mn-icon-btn danger"
                  aria-label={`Delete ${c.name}`}
                  onClick={() => setDeleting(c)}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          ))}
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
  const [fieldError, setFieldError] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

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
      if (category) await categoriesApi.update(category.id, { name: value });
      else await categoriesApi.create({ name: value });
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
      <div className="mn-grid">
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
      </div>
    </Modal>
  );
}