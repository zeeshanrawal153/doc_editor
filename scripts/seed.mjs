// Seed script: creates the sample users + one example document.
//
// Run with:  npm run seed
//
// - Locally (no Turso env vars): seeds the local SQLite file ./local.db
// - Against Turso: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN first (see README)
//
// Idempotent: uses INSERT OR REPLACE for users and only creates the example
// document once, so re-running won't pile up duplicates.

import { getDb, ensureSchema } from "../lib/db.js";

// Load a local .env file if one exists (Node 18.16+). The Next.js app loads
// env files automatically, but this standalone script does not, so we do it
// manually. Missing file is fine — we just fall back to local.db.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // no such file — ignore
  }
}

const NOW = new Date().toISOString();

const USERS = [
  { id: "user-alice", name: "Alice Johnson", email: "alice@example.com" },
  { id: "user-bob", name: "Bob Smith", email: "bob@example.com" },
  { id: "user-carol", name: "Carol Davis", email: "carol@example.com" },
];

const EXAMPLE_DOC = {
  id: "doc-welcome",
  title: "Welcome to Collab Docs",
  owner_id: "user-alice",
  content: `
    <h1>Welcome to Collab Docs 👋</h1>
    <p>This is an example document owned by <strong>Alice</strong>.</p>
    <p>Try the formatting toolbar above. You can make text
      <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>.</p>
    <h2>What you can do</h2>
    <ul>
      <li>Create, rename, and delete documents</li>
      <li>Upload a .txt or .md file as a new document</li>
      <li>Share a document with another user</li>
    </ul>
    <h2>A numbered list</h2>
    <ol>
      <li>Pick a user from the switcher</li>
      <li>Open or create a document</li>
      <li>Edit — your changes autosave</li>
    </ol>
  `.trim(),
};

async function main() {
  const db = getDb();
  await ensureSchema();

  // Users (idempotent).
  for (const u of USERS) {
    await db.execute({
      sql: "INSERT OR REPLACE INTO users (id, name, email) VALUES (?, ?, ?)",
      args: [u.id, u.name, u.email],
    });
  }
  console.log(`✓ Seeded ${USERS.length} users:`);
  for (const u of USERS) console.log(`    - ${u.name} <${u.email}>`);

  // Example document — only create if it doesn't already exist (so we don't
  // overwrite edits made during testing).
  const existing = await db.execute({
    sql: "SELECT id FROM documents WHERE id = ?",
    args: [EXAMPLE_DOC.id],
  });
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        EXAMPLE_DOC.id,
        EXAMPLE_DOC.title,
        EXAMPLE_DOC.content,
        EXAMPLE_DOC.owner_id,
        NOW,
        NOW,
      ],
    });
    // Share Alice's example doc with Bob to demonstrate "Shared with me".
    await db.execute({
      sql: "INSERT OR REPLACE INTO shares (document_id, user_id) VALUES (?, ?)",
      args: [EXAMPLE_DOC.id, "user-bob"],
    });
    console.log(`✓ Created example document "${EXAMPLE_DOC.title}" (owner: Alice, shared with: Bob)`);
  } else {
    console.log(`• Example document already exists — left untouched`);
  }

  console.log("\nDone. ✅");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
