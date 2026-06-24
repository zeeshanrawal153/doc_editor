"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/apiClient";
import { initials, avatarColor } from "@/lib/avatar";

// Owner-only dialog to grant/revoke access to a document.
export default function ShareDialog({ documentId, ownerId, onClose, onChanged }) {
  const { users } = useUser();
  const [sharedUserIds, setSharedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch(`/api/documents/${documentId}/shares`);
        if (active) setSharedUserIds(data.sharedUserIds);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [documentId]);

  async function toggle(userId, currentlyShared) {
    setBusyId(userId);
    setError(null);
    try {
      const data = await apiFetch(`/api/documents/${documentId}/shares`, {
        method: currentlyShared ? "DELETE" : "POST",
        body: JSON.stringify({ userId }),
      });
      setSharedUserIds(data.sharedUserIds);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const others = users.filter((u) => u.id !== ownerId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Share document</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Choose who can view and edit this document.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-5 text-sm text-slate-400">Loading…</p>
        ) : (
          <ul className="mt-4 space-y-1">
            {others.map((u) => {
              const isShared = sharedUserIds.includes(u.id);
              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(
                        u.id
                      )}`}
                    >
                      {initials(u.name)}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(u.id, isShared)}
                    disabled={busyId === u.id}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                      isShared
                        ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {isShared ? "Remove" : "Share"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
