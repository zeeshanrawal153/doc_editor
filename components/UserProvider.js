"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CURRENT_USER_KEY } from "@/lib/apiClient";

const UserContext = createContext(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the user list once, then restore (or default) the current user.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to load users");
        const { users } = await res.json();
        if (!active) return;
        setUsers(users);

        const stored = window.localStorage.getItem(CURRENT_USER_KEY);
        const valid = users.find((u) => u.id === stored);
        const initial = valid ? valid.id : users[0]?.id ?? null;
        setCurrentUserId(initial);
        if (initial) window.localStorage.setItem(CURRENT_USER_KEY, initial);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function switchUser(id) {
    setCurrentUserId(id);
    window.localStorage.setItem(CURRENT_USER_KEY, id);
  }

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  return (
    <UserContext.Provider
      value={{ users, currentUser, currentUserId, switchUser, loading, error }}
    >
      {children}
    </UserContext.Provider>
  );
}
