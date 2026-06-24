"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/apiClient";

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

  // Reload whenever the active user changes.
  useEffect(() => {
    load();
  }, [load]);

  async function createDocument() {
    const title = window.prompt("New document title:", "Untitled document");
    if (title === null) return; // cancelled
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
    e.target.value = ""; // allow re-uploading the same file later
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
    return <main className="mx-auto max-w-5xl p-6 text-gray-500">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {currentUser ? `${currentUser.name}'s workspace` : "Workspace"}
        </h1>
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
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            ⬆ Upload .txt / .md
          </button>
          <button
            onClick={createDocument}
            disabled={busy}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + New Document
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Upload supports plain-text (.txt) and Markdown (.md) files only.
      </p>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <Section title="My Documents" emptyText="You haven't created any documents yet.">
        {loading ? (
          <Loading />
        ) : (
          owned.map((doc) => (
            <DocRow key={doc.id} doc={doc}>
              <button onClick={() => renameDocument(doc)} className={btnLink}>
                Rename
              </button>
              <button
                onClick={() => deleteDocument(doc)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </DocRow>
          ))
        )}
        {!loading && owned.length === 0 && (
          <Empty text="You haven't created any documents yet." />
        )}
      </Section>

      <Section title="Shared with me">
        {loading ? (
          <Loading />
        ) : shared.length === 0 ? (
          <Empty text="Nothing has been shared with you yet." />
        ) : (
          shared.map((doc) => (
            <DocRow key={doc.id} doc={doc} showOwner />
          ))
        )}
      </Section>
    </main>
  );
}

const btnLink = "text-sm text-blue-600 hover:underline";

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function DocRow({ doc, showOwner, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <Link
          href={`/documents/${doc.id}`}
          className="font-medium text-gray-900 hover:text-blue-600"
        >
          {doc.title}
        </Link>
        {showOwner && (
          <span className="ml-2 text-xs text-gray-500">
            owned by {doc.owner_name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <p className="px-4 py-3 text-sm text-gray-400">{text}</p>;
}

function Loading() {
  return <p className="px-4 py-3 text-sm text-gray-400">Loading…</p>;
}
