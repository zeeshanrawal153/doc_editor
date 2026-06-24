"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/apiClient";

const AUTOSAVE_DELAY = 800; // ms

export default function DocumentPage() {
  const { id } = useParams();
  const { currentUserId, loading: userLoading } = useUser();

  const [doc, setDoc] = useState(null);
  const [accessLevel, setAccessLevel] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | unsaved | error
  const [showShare, setShowShare] = useState(false);

  // Latest content/title kept in refs so the debounced saver reads fresh values.
  const contentRef = useRef("");
  const titleRef = useRef("");
  const timerRef = useRef(null);

  // Load the document (re-runs if the active user changes).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const data = await apiFetch(`/api/documents/${id}`);
        if (!active) return;
        setDoc(data.document);
        setAccessLevel(data.accessLevel);
        setTitle(data.document.title);
        titleRef.current = data.document.title;
        contentRef.current = data.document.content;
      } catch (err) {
        if (active) setLoadError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, currentUserId]);

  const save = useCallback(async () => {
    setSaveStatus("saving");
    try {
      await apiFetch(`/api/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: titleRef.current,
          content: contentRef.current,
        }),
      });
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  }, [id]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DELAY);
  }, [save]);

  // Flush a pending save on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleContentChange(html) {
    contentRef.current = html;
    scheduleSave();
  }

  function handleTitleChange(e) {
    const value = e.target.value;
    setTitle(value);
    titleRef.current = value;
    scheduleSave();
  }

  function saveNow() {
    if (timerRef.current) clearTimeout(timerRef.current);
    save();
  }

  if (userLoading || loading) {
    return <main className="mx-auto max-w-4xl p-6 text-gray-500">Loading…</main>;
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          {accessLevel === "owner" && (
            <button
              onClick={() => setShowShare(true)}
              className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              🔗 Share
            </button>
          )}
          <SaveBadge status={saveStatus} onSave={saveNow} />
        </div>
      </div>

      {showShare && (
        <ShareDialog
          documentId={id}
          ownerId={doc.owner_id}
          onClose={() => setShowShare(false)}
        />
      )}

      <div className="mb-2 flex items-center gap-2">
        <input
          value={title}
          onChange={handleTitleChange}
          maxLength={200}
          className="w-full rounded border border-transparent px-2 py-1 text-2xl font-bold hover:border-gray-200 focus:border-blue-500 focus:outline-none"
          placeholder="Untitled document"
        />
        {accessLevel === "shared" && (
          <span className="shrink-0 rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
            Shared with you
          </span>
        )}
      </div>

      <Editor initialContent={doc.content} onChange={handleContentChange} />
    </main>
  );
}

function SaveBadge({ status, onSave }) {
  const map = {
    saved: { text: "All changes saved", cls: "text-green-700" },
    saving: { text: "Saving…", cls: "text-gray-500" },
    unsaved: { text: "Unsaved changes", cls: "text-amber-600" },
    error: { text: "Save failed — retry", cls: "text-red-600" },
  };
  const s = map[status] || map.saved;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={s.cls}>{s.text}</span>
      <button
        onClick={onSave}
        className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100"
      >
        Save
      </button>
    </div>
  );
}
