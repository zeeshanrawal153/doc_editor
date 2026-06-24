import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listDocumentsForUser,
  createDocument,
  validateTitle,
} from "@/lib/documents";

// GET /api/documents — { owned: [...], shared: [...] } for the current user.
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const docs = await listDocumentsForUser(user.id);
    return NextResponse.json(docs);
  } catch (err) {
    console.error("GET /api/documents failed:", err);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// POST /api/documents — create a new (empty) document owned by current user.
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { value, error } = validateTitle(body.title);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const doc = await createDocument({ title: value, ownerId: user.id });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error("POST /api/documents failed:", err);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
