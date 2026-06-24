"use client";

import Link from "next/link";
import { useUser } from "@/components/UserProvider";

export default function Header() {
  const { users, currentUserId, switchUser, loading } = useUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold text-gray-900">
          📄 Collab Docs
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Signed in as</span>
          {loading ? (
            <span className="text-gray-400">loading…</span>
          ) : (
            <select
              aria-label="Switch user"
              className="rounded border border-gray-300 bg-white px-2 py-1 font-medium text-gray-800 focus:border-blue-500 focus:outline-none"
              value={currentUserId || ""}
              onChange={(e) => switchUser(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </header>
  );
}
