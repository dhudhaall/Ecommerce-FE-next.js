"use client";

// app/[locale]/admin/components/MenuUI.tsx
//
// Shared pieces for the four menu screens. Kept in one file because the
// parts are small and always used together — splitting them further would
// mean four imports per page for no benefit.

import { useEffect, useRef } from "react";

/* =========================================================
   Modal
========================================================= */

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    // Focus the first field so keyboard users land inside the dialog
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();

    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="mn-backdrop" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className={`mn-modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mn-modal-head">
          <h2>{title}</h2>
          <button type="button" className="mn-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="mn-modal-body">{children}</div>

        {footer && <div className="mn-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* =========================================================
   Form fields
========================================================= */

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  full?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  full,
  ...rest
}: BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`mn-field ${full ? "mn-full" : ""}`}>
      <label htmlFor={rest.name}>{label}</label>
      <input
        id={rest.name}
        className={`mn-input ${error ? "invalid" : ""}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <span className="mn-err" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mn-hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  error,
  hint,
  full,
  ...rest
}: BaseFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={`mn-field ${full ? "mn-full" : ""}`}>
      <label htmlFor={rest.name}>{label}</label>
      <textarea
        id={rest.name}
        className={`mn-input mn-textarea ${error ? "invalid" : ""}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <span className="mn-err" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mn-hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  full,
  children,
  ...rest
}: BaseFieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`mn-field ${full ? "mn-full" : ""}`}>
      <label htmlFor={rest.name}>{label}</label>
      <select
        id={rest.name}
        className={`mn-input mn-select ${error ? "invalid" : ""}`}
        aria-invalid={!!error}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <span className="mn-err" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mn-hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="mn-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="mn-switch-track" aria-hidden />
      <span className="mn-switch-text">
        <span>{label}</span>
        {description && <em>{description}</em>}
      </span>
    </label>
  );
}

/* =========================================================
   Confirm dialog
========================================================= */

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="mn-btn ghost" onClick={onCancel} disabled={busy}>
            Keep it
          </button>
          <button type="button" className="mn-btn danger" onClick={onConfirm} disabled={busy}>
            {busy ? <span className="mn-spin" /> : confirmLabel}
          </button>
        </>
      }
    >
      <p className="mn-confirm-text">{message}</p>
    </Modal>
  );
}

/* =========================================================
   List states
========================================================= */

export function ListState({
  loading,
  error,
  empty,
  emptyTitle,
  emptyAction,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  emptyTitle: string;
  emptyAction?: React.ReactNode;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="mn-state">
        <span className="mn-spin dark" /> Loading…
      </div>
    );

  if (error)
    return (
      <div className="mn-state">
        <p className="mn-state-err">{error}</p>
        <button type="button" className="mn-btn ghost" onClick={onRetry}>
          Try again
        </button>
      </div>
    );

  if (empty)
    return (
      <div className="mn-state mn-empty">
        <p>{emptyTitle}</p>
        {emptyAction}
      </div>
    );

  return <>{children}</>;
}

/* =========================================================
   Icons
========================================================= */

export function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}