# Collab Docs

A lightweight, Google-Docs-inspired collaborative document editor. Create and
edit rich-text documents, upload `.txt`/`.md` files, and share documents with
other users — with a clear split between **My Documents** and **Shared with me**.

Built with **Next.js (App Router, JavaScript)**, **Tailwind CSS**, **TipTap**,
and **Turso / libSQL**. Deploys to **Vercel**.

---

## Features

- **Rich-text editing** (TipTap): bold, italic, underline, headings (H1–H3),
  and bulleted / numbered lists.
- **Document CRUD**: create, rename, edit, autosave, reopen, delete.
- **File upload**: turn a `.txt` or `.md` file into a new editable document.
- **Sharing**: an owner can grant other users access; shared docs show up under
  "Shared with me".
- **Mocked auth**: a seeded set of users and a user-switcher dropdown (no real
  login / passwords).
- **Persistence**: documents and shares survive refresh; formatting is preserved
  (stored as HTML).
- **Validation + error handling** on every API route, and an automated test
  suite for the access-control logic.

---

## Supported file uploads

| Type | Extension | Notes |
|------|-----------|-------|
| Plain text | `.txt` | Blank lines become paragraphs |
| Markdown | `.md` | Converted to rich text (headings, bold, lists, etc.) |

**Only `.txt` and `.md` are accepted.** Anything else (e.g. `.docx`) is rejected
with a clear message, both in the browser and on the server. `.docx` was
intentionally skipped — see [ARCHITECTURE.md](ARCHITECTURE.md).

Max upload size: **1 MB**.

---

## Seeded users (mocked auth)

There are no passwords. Pick a user from the **dropdown in the top-right** to
"sign in" as them. Your selection is remembered across refreshes.

| Name | Email | Seed data |
|------|-------|-----------|
| Alice Johnson | alice@example.com | Owns the example document |
| Bob Smith | bob@example.com | Has the example document shared with them |
| Carol Davis | carol@example.com | Starts with nothing |

The seed also creates one example document, **"Welcome to Collab Docs"**, owned
by Alice and shared with Bob.

---

## Local setup

### Prerequisites
- **Node.js 18+** (developed on Node 24) and **npm**.

### Steps

```powershell
# 1. Install dependencies
npm install

# 2. Seed the database (creates ./local.db with the sample users + example doc)
npm run seed

# 3. Start the dev server
npm run dev
```

Then open **http://localhost:3000**.

> **Database in local dev:** if no Turso environment variables are set, the app
> automatically falls back to a local SQLite file at `./local.db`. No external
> setup is required to run locally.

### Run the tests

```powershell
npm test
```

---

## Environment variables

Copy `.env.example` to `.env.local` if you want to point at a Turso database
locally (optional — local dev works without it):

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

- **Local dev:** leave them blank → uses `./local.db`.
- **Production (Vercel):** both are **required** (the local file fallback is
  disabled in production because serverless filesystems are read-only).

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full Turso + Vercel walkthrough.

---

## Project structure

```
app/
  layout.js                       Root layout (user provider + header)
  page.js                         Dashboard: My Documents / Shared with me
  documents/[id]/page.js          Editor page (autosave, share)
  api/
    users/route.js                List users (for the switcher)
    documents/route.js            List + create documents
    documents/[id]/route.js       Get / update / delete a document
    documents/[id]/shares/route.js  Manage sharing
    documents/upload/route.js     Upload .txt / .md
components/
  Header.js, UserProvider.js      Mocked auth + user switcher
  Editor.js                       TipTap editor + toolbar
  ShareDialog.js                  Sharing modal
lib/
  db.js                           libSQL client + schema (Turso / local)
  auth.js                         Resolves current user from x-user-id header
  access.js                       Pure access-control logic (unit tested)
  documents.js                    Document + share data access
  convert.js                      .txt / .md -> HTML
  apiClient.js                    Client fetch wrapper (adds auth header)
scripts/seed.mjs                  Seed users + example document
tests/                            Vitest tests
```

---

## Notes / known limitations

- **Mocked auth only** — identity is a header sent by the client; there is no
  real authentication. This is intentional per the assessment brief.
- **Uploaded Markdown HTML is not sanitized.** Acceptable for a single-tenant,
  mocked-auth demo; a real app would sanitize against XSS.
- `npm install` may report advisories from transitive build dependencies; they
  do not affect the running app.

See [ARCHITECTURE.md](ARCHITECTURE.md) for priorities and tradeoffs, and
[SUBMISSION.md](SUBMISSION.md) for exactly what's included.
