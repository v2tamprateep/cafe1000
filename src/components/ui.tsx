"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function ErrorNotice({ message, retry, busy = false }: {
  message: string | null;
  retry?: () => void;
  busy?: boolean;
}) {
  if (!message) return null;
  return <div className="error-notice" role="alert">
    <Icon name="alert" size={18}/><span>{message}</span>
    {retry && <button type="button" className="text-button" disabled={busy} onClick={retry}>
      {busy ? "Retrying..." : "Try again"}
    </button>}
  </div>;
}

export function Dialog({ title, eyebrow, children, onClose, busy = false, wide = false }: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    const focusTarget = dialog?.querySelector<HTMLElement>("[data-autofocus]");
    focusTarget?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = oldOverflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else document.getElementById("page-title")?.focus();
    };
  }, []);
  return <dialog ref={ref} className={`dialog ${wide ? "dialog-wide" : ""}`}
    aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="dialog-header">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>
      <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><Icon name="close"/></button>
    </div>
    {children}
  </dialog>;
}

export function CopyButton({ value, label = "Copy", className = "button button-secondary" }: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [result, setResult] = useState<{ value: string; message: string; failed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const feedback = result?.value === value ? result : null;
  async function copy() {
    setBusy(true);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable. Select and copy the text manually.");
      await navigator.clipboard.writeText(value);
      setResult({ value, failed: false, message: "Copied to clipboard." });
    } catch {
      setResult({ value, failed: true, message: "Could not copy. Select and copy the text manually." });
    } finally {
      setBusy(false);
    }
  }
  return <div className="copy-control">
    <button type="button" className={className} onClick={() => void copy()} disabled={busy}>
      <Icon name={feedback && !feedback.failed ? "check" : "copy"} size={16}/>{busy ? "Copying..." : label}
    </button>
    {feedback && <span className={`copy-message ${feedback.failed ? "text-error" : ""}`} role={feedback.failed ? "alert" : "status"}>{feedback.message}</span>}
  </div>;
}

export function shortDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
