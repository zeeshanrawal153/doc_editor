// Tiny helpers for user avatars (initials + a stable color per user).

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
];

// Deterministic color from a string id so a user always gets the same color.
export function avatarColor(id) {
  if (!id) return COLORS[0];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}
