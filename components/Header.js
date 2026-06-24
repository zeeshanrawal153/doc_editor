"use client";

import Link from "next/link";
import { useUser } from "@/components/UserProvider";
import { initials, avatarColor } from "@/lib/avatar";

export default function Header() {
  const { users, currentUser, currentUserId, switchUser, loading } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
            CD
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Collab Docs
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-400">loading…</span>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-sm">
              {currentUser && (
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(
                    currentUser.id
                  )}`}
                >
                  {initials(currentUser.name)}
                </span>
              )}
              <select
                aria-label="Switch user"
                className="cursor-pointer appearance-none bg-transparent pr-4 text-sm font-medium text-slate-700 focus:outline-none"
                value={currentUserId || ""}
                onChange={(e) => switchUser(e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none -ml-4 text-slate-400">▾</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
