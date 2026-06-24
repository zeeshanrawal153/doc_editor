import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDocumentRecord,
  updateDocument,
  deleteDocument,
  validateTitle,
  toAccessDoc,
} from "@/lib/documents";
import { canView, canEdit, canDelete, getAccessLevel } from "@/lib/access";

// GET /api/documents/:id — fetch one document (owner or shared only).
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { id } = await params;
    const doc = await getDocumentRecord(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!canView(toAccessDoc(doc), user.id)) {
      return NextResponse.json({ error: "You do not have access to this document" }, { status: 403 });
    }
    return NextResponse.json({
      document: doc,
      accessLevel: getAccessLevel(toAccessDoc(doc), user.id),
    });
  } catch (err) {
    console.error("GET /api/documents/:id failed:", err);
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}

// PATCH /api/documents/:id — update title and/or content (owner or shared).
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { id } = await params;
    const doc = await getDocumentRecord(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!canEdit(toAccessDoc(doc), user.id)) {
      return NextResponse.json({ error: "You do not have edit access" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const update = {};

    if (body.title !== undefined) {
      const { value, error } = validateTitle(body.title);
      if (error) return NextResponse.json({ error }, { status: 400 });
      update.title = value;
    }
    if (body.content !== undefined) {
      if (typeof body.content !== "string") {
        return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
      }
      update.content = body.content;
    }
    if (update.title === undefined && update.content === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updatedAt = await updateDocument(id, update);
    return NextResponse.json({ ok: true, updated_at: updatedAt });
  } catch (err) {
    console.error("PATCH /api/documents/:id failed:", err);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE /api/documents/:id — owner only.
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { id } = await params;
    const doc = await getDocumentRecord(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!canDelete(toAccessDoc(doc), user.id)) {
      return NextResponse.json({ error: "Only the owner can delete this document" }, { status: 403 });
    }
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/documents/:id failed:", err);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
