"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/apiClient";
import { initials, avatarColor } from "@/lib/avatar";

const ALLOWED_EXT = [".txt", ".md"];

export default function Home() {
  const { currentUser, currentUserId, loading: userLoading } = useUser();
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/documents");
      setOwned(data.owned);
      setShared(data.shared);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createDocument() {
    const title = window.prompt("New document title:", "Untitled document");
    if (title === null) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/documents", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      setError("Only .txt and .md files are supported.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      await apiFetch("/api/documents/upload", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, text }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function renameDocument(doc) {
    const title = window.prompt("Rename document:", doc.title);
    if (title === null) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(doc) {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (userLoading) {
    return (
      <main className="mx-auto max-w-5xl p-6 text-slate-400">Loading…</main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Page heading + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {currentUser ? `${currentUser.name.split(" ")[0]}'s workspace` : "Workspace"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, and share documents. Uploads support .txt and .md only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            ⬆ Upload
          </button>
          <button
            onClick={createDocument}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            + New Document
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* My Documents */}
      <Section title="My Documents" count={owned.length}>
        {loading ? (
          <GridSkeleton />
        ) : owned.length === 0 ? (
          <EmptyState
            icon="📝"
            text="You haven't created any documents yet."
            hint="Click “New Document” or upload a .txt / .md file to get started."
          />
        ) : (
          <CardGrid>
            {owned.map((doc) => (
              <DocCard key={doc.id} doc={doc}>
                <CardAction onClick={() => renameDocument(doc)}>Rename</CardAction>
                <CardAction onClick={() => deleteDocument(doc)} danger>
                  Delete
                </CardAction>
              </DocCard>
            ))}
          </CardGrid>
        )}
      </Section>

      {/* Shared with me */}
      <Section title="Shared with me" count={shared.length}>
        {loading ? (
          <GridSkeleton />
        ) : shared.length === 0 ? (
          <EmptyState icon="🤝" text="Nothing has been shared with you yet." />
        ) : (
          <CardGrid>
            {shared.map((doc) => (
              <DocCard key={doc.id} doc={doc} showOwner />
            ))}
          </CardGrid>
        )}
      </Section>
    </main>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function CardGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function DocCard({ doc, showOwner, children }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/documents/${doc.id}`} className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-lg">
          📄
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900 group-hover:text-indigo-600">
            {doc.title}
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">
            Edited {formatDate(doc.updated_at)}
          </span>
        </span>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        {showOwner ? (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarColor(
                doc.owner_id
              )}`}
            >
              {initials(doc.owner_name)}
            </span>
            {doc.owner_name}
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-600">Owner</span>
        )}
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </div>
  );
}

function CardAction({ onClick, danger, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium transition hover:underline ${
        danger ? "text-rose-600" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, text, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-12 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="mt-3 text-sm font-medium text-slate-600">{text}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "recently";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "recently";
  }
}
