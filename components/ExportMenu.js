"use client";

import { useEffect, useRef, useState } from "react";
import { exportAsMarkdown, exportAsPdf } from "@/lib/export";

// Dropdown with "Export as Markdown" and "Export as PDF".
// `getHtml` / `getTitle` return the document's *current* content/title so we
// always export the latest (including unsaved-but-typed) state.
export default function ExportMenu({ getHtml, getTitle }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // "md" | "pdf" | null
  const [error, setError] = useState(null);
  const ref = useRef(null);

  // Close the menu on an outside click.
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function run(kind) {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "md") {
        await exportAsMarkdown(getHtml(), getTitle());
      } else {
        await exportAsPdf(getHtml(), getTitle());
      }
      setOpen(false);
    } catch (err) {
      setError(err.message || "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⬇ Export ▾
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <MenuItem onClick={() => run("md")} disabled={!!busy}>
            {busy === "md" ? "Exporting…" : "Export as Markdown (.md)"}
          </MenuItem>
          <MenuItem onClick={() => run("pdf")} disabled={!!busy}>
            {busy === "pdf" ? "Generating…" : "Export as PDF"}
          </MenuItem>
          {error && (
            <p className="px-3 py-2 text-xs text-rose-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, disabled, children }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
