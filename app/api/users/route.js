import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/db";

// GET /api/users — list all seeded users (for the user-switcher dropdown).
export async function GET() {
  try {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute(
      "SELECT id, name, email FROM users ORDER BY name"
    );
    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error("GET /api/users failed:", err);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}
