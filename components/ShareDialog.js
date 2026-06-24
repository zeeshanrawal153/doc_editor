"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/apiClient";

// Owner-only dialog to grant/revoke access to a document. Lists every other
// seeded user with a Share / Remove toggle.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {others.map((u) => {
              const isShared = sharedUserIds.includes(u.id);
              return (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <button
                    onClick={() => toggle(u.id, isShared)}
                    disabled={busyId === u.id}
                    className={`rounded px-3 py-1 text-sm font-medium disabled:opacity-50 ${
                      isShared
                        ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
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
