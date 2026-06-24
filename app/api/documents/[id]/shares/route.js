import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDocumentRecord,
  listShares,
  addShare,
  removeShare,
  userExists,
  toAccessDoc,
} from "@/lib/documents";
import { canView, canManageSharing } from "@/lib/access";

// GET /api/documents/:id/shares — list user ids the doc is shared with.
// Anyone who can view the doc may read the share list.
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
      return NextResponse.json({ error: "No access to this document" }, { status: 403 });
    }
    return NextResponse.json({ sharedUserIds: await listShares(id) });
  } catch (err) {
    console.error("GET shares failed:", err);
    return NextResponse.json({ error: "Failed to load shares" }, { status: 500 });
  }
}

// POST /api/documents/:id/shares  body: { userId }  — owner only.
export async function POST(request, { params }) {
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
    if (!canManageSharing(toAccessDoc(doc), user.id)) {
      return NextResponse.json({ error: "Only the owner can share this document" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    if (typeof userId !== "string" || !userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (userId === doc.owner_id) {
      return NextResponse.json({ error: "The owner already has access" }, { status: 400 });
    }
    if (!(await userExists(userId))) {
      return NextResponse.json({ error: "That user does not exist" }, { status: 400 });
    }

    await addShare(id, userId);
    return NextResponse.json({ sharedUserIds: await listShares(id) }, { status: 201 });
  } catch (err) {
    console.error("POST shares failed:", err);
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 });
  }
}

// DELETE /api/documents/:id/shares  body: { userId }  — owner only.
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
    if (!canManageSharing(toAccessDoc(doc), user.id)) {
      return NextResponse.json({ error: "Only the owner can manage sharing" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    if (typeof userId !== "string" || !userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await removeShare(id, userId);
    return NextResponse.json({ sharedUserIds: await listShares(id) });
  } catch (err) {
    console.error("DELETE shares failed:", err);
    return NextResponse.json({ error: "Failed to remove share" }, { status: 500 });
  }
}
