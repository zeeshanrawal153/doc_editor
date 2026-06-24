"use client";

// Client-side fetch wrapper that attaches the mocked-auth header
// (x-user-id) to every request, read from localStorage.

export const CURRENT_USER_KEY = "collabdocs:currentUserId";

export function getStoredUserId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export async function apiFetch(url, options = {}) {
  const userId = getStoredUserId();
  const headers = { ...(options.headers || {}) };
  if (userId) headers["x-user-id"] = userId;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response (e.g. empty body) — leave data null
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
