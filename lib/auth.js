import { getDb, ensureSchema } from "@/lib/db";

// --- MOCKED AUTH ---
// There are no passwords or sessions. The client picks a user from a dropdown
// and sends that user's id in the `x-user-id` header on every API request.
// This helper resolves that header to a real user row (or null if missing /
// unknown). It is the single server-side source of "who is the current user".

export const USER_HEADER = "x-user-id";

export async function getCurrentUser(request) {
  const userId = request.headers.get(USER_HEADER);
  if (!userId) return null;

  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT id, name, email FROM users WHERE id = ?",
    args: [userId],
  });
  return result.rows[0] || null;
}
