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
  const [saveStatus, setSaveStatus] = useState("saved");
  const [showShare, setShowShare] = useState(false);

  const contentRef = useRef("");
  const titleRef = useRef("");
  const timerRef = useRef(null);

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
    } catch {
      setSaveStatus("error");
    }
  }, [id]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DELAY);
  }, [save]);

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
    return <main className="mx-auto max-w-4xl px-6 py-10 text-slate-400">Loading…</main>;
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to dashboard
        </Link>
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-8 text-center">
          <p className="text-2xl">🔒</p>
          <p className="mt-2 text-sm font-medium text-rose-700">{loadError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-3">
          {accessLevel === "shared" && (
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
              Shared with you
            </span>
          )}
          {accessLevel === "owner" && (
            <button
              onClick={() => setShowShare(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
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

      <input
        value={title}
        onChange={handleTitleChange}
        maxLength={200}
        className="mb-4 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-3xl font-bold tracking-tight text-slate-900 transition placeholder:text-slate-300 hover:border-slate-200 focus:border-indigo-400 focus:bg-white focus:outline-none"
        placeholder="Untitled document"
      />

      <Editor initialContent={doc.content} onChange={handleContentChange} />
    </main>
  );
}

function SaveBadge({ status, onSave }) {
  const map = {
    saved: { text: "Saved", dot: "bg-emerald-500", cls: "text-emerald-700" },
    saving: { text: "Saving…", dot: "bg-amber-400", cls: "text-amber-600" },
    unsaved: { text: "Unsaved", dot: "bg-amber-400", cls: "text-amber-600" },
    error: { text: "Save failed", dot: "bg-rose-500", cls: "text-rose-600" },
  };
  const s = map[status] || map.saved;
  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1.5 text-xs font-medium ${s.cls}`}>
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        {s.text}
      </span>
      <button
        onClick={onSave}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Save
      </button>
    </div>
  );
}
