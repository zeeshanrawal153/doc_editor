import { createClient } from "@libsql/client";

// Single shared libSQL client.
//
// - In production (Vercel) we connect to Turso using the env vars.
// - Locally, if those env vars are absent, we fall back to a local SQLite
//   file (./local.db) so the app runs with zero external setup.
//
// NOTE: the local-file fallback writes to disk and is for DEV ONLY. On Vercel
// the filesystem is read-only/ephemeral, so TURSO_DATABASE_URL must be set in
// production — otherwise we throw a clear error below.

let client;

function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  // No Turso URL configured.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TURSO_DATABASE_URL is not set. In production you must configure a Turso database — the local SQLite fallback only works in development."
    );
  }

  // Dev fallback: local SQLite file.
  return createClient({ url: "file:local.db" });
}

export function getDb() {
  if (!client) {
    client = createDbClient();
  }
  return client;
}

// Idempotent schema creation. Called by the seed script and lazily by the app
// so the database is always ready without a separate migration tool.
export async function ensureSchema() {
  const db = getDb();
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        owner_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS shares (
        document_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (document_id, user_id),
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
    ],
    "write"
  );
}
