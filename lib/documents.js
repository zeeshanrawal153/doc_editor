import { randomUUID } from "node:crypto";
import { getDb, ensureSchema } from "@/lib/db";

// Data-access layer for documents + shares. Access decisions are delegated to
// the pure helpers in lib/access.js wherever possible.

export const MAX_TITLE_LENGTH = 200;

// Validate + normalise a title. Returns { value } or { error }.
export function validateTitle(raw) {
  if (typeof raw !== "string") return { error: "Title must be a string" };
  const value = raw.trim();
  if (value.length === 0) return { error: "Title cannot be empty" };
  if (value.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` };
  }
  return { value };
}

// List documents the user owns and documents shared with them.
export async function listDocumentsForUser(userId) {
  await ensureSchema();
  const db = getDb();

  const owned = await db.execute({
    sql: `SELECT d.id, d.title, d.owner_id, u.name AS owner_name, d.updated_at
          FROM documents d
          JOIN users u ON u.id = d.owner_id
          WHERE d.owner_id = ?
          ORDER BY d.updated_at DESC`,
    args: [userId],
  });

  const shared = await db.execute({
    sql: `SELECT d.id, d.title, d.owner_id, u.name AS owner_name, d.updated_at
          FROM documents d
          JOIN users u ON u.id = d.owner_id
          JOIN shares s ON s.document_id = d.id
          WHERE s.user_id = ?
          ORDER BY d.updated_at DESC`,
    args: [userId],
  });

  return { owned: owned.rows, shared: shared.rows };
}

// Fetch a document plus the list of user ids it's shared with. Returns null if
// the document doesn't exist. Used for access checks.
export async function getDocumentRecord(id) {
  await ensureSchema();
  const db = getDb();

  const docRes = await db.execute({
    sql: `SELECT d.id, d.title, d.content, d.owner_id, u.name AS owner_name,
                 d.created_at, d.updated_at
          FROM documents d
          JOIN users u ON u.id = d.owner_id
          WHERE d.id = ?`,
    args: [id],
  });
  const doc = docRes.rows[0];
  if (!doc) return null;

  const shareRes = await db.execute({
    sql: "SELECT user_id FROM shares WHERE document_id = ?",
    args: [id],
  });
  const sharedUserIds = shareRes.rows.map((r) => r.user_id);

  return { ...doc, sharedUserIds };
}

export async function createDocument({ title, ownerId }) {
  await ensureSchema();
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
          VALUES (?, ?, '', ?, ?, ?)`,
    args: [id, title, ownerId, now, now],
  });
  return { id, title, content: "", owner_id: ownerId, created_at: now, updated_at: now };
}

// Update title and/or content. Caller is responsible for the access check.
export async function updateDocument(id, { title, content }) {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();

  const sets = [];
  const args = [];
  if (title !== undefined) {
    sets.push("title = ?");
    args.push(title);
  }
  if (content !== undefined) {
    sets.push("content = ?");
    args.push(content);
  }
  sets.push("updated_at = ?");
  args.push(now);
  args.push(id);

  await db.execute({
    sql: `UPDATE documents SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
  return now;
}

export async function deleteDocument(id) {
  await ensureSchema();
  const db = getDb();
  // Remove shares first to keep the data tidy, then the document.
  await db.execute({ sql: "DELETE FROM shares WHERE document_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM documents WHERE id = ?", args: [id] });
}

// --- Sharing ---

export async function userExists(userId) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id FROM users WHERE id = ?",
    args: [userId],
  });
  return res.rows.length > 0;
}

export async function listShares(documentId) {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT user_id FROM shares WHERE document_id = ?",
    args: [documentId],
  });
  return res.rows.map((r) => r.user_id);
}

export async function addShare(documentId, userId) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO shares (document_id, user_id) VALUES (?, ?)",
    args: [documentId, userId],
  });
}

export async function removeShare(documentId, userId) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM shares WHERE document_id = ? AND user_id = ?",
    args: [documentId, userId],
  });
}

// Helper: shape a DB doc record into the plain object lib/access.js expects.
export function toAccessDoc(record) {
  return {
    ownerId: record.owner_id,
    sharedUserIds: record.sharedUserIds || [],
  };
}
