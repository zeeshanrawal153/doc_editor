import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDocument, updateDocument, validateTitle } from "@/lib/documents";
import {
  isAllowedFilename,
  titleFromFilename,
  fileToHtml,
  MAX_UPLOAD_BYTES,
  ALLOWED_EXTENSIONS,
} from "@/lib/convert";

// POST /api/documents/upload
// Body: { filename: string, text: string }
// Reads a .txt/.md file's text (already read client-side), converts it to HTML,
// and creates a new document owned by the current user.
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { filename, text } = body;

    if (typeof filename !== "string" || typeof text !== "string") {
      return NextResponse.json(
        { error: "filename and text are required" },
        { status: 400 }
      );
    }
    if (!isAllowedFilename(filename)) {
      return NextResponse.json(
        { error: `Only ${ALLOWED_EXTENSIONS.join(" and ")} files are supported` },
        { status: 400 }
      );
    }
    if (Buffer.byteLength(text, "utf8") > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 1 MB)" },
        { status: 400 }
      );
    }

    // Title comes from the filename; validate/normalise it.
    const { value: title } = validateTitle(titleFromFilename(filename));
    const safeTitle = title || "Untitled document";

    const html = fileToHtml(filename, text);

    const doc = await createDocument({ title: safeTitle, ownerId: user.id });
    await updateDocument(doc.id, { content: html });

    return NextResponse.json(
      { document: { ...doc, content: html } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/documents/upload failed:", err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
