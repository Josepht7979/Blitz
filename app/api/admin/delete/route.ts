import { NextRequest, NextResponse } from "next/server";
import { redis, lbKey } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VALID = new Set(["easy", "med", "hard", "edifying"]);

/**
 * POST /api/admin/delete  { name, category, group? }
 * Header:  x-admin-secret: <ADMIN_SECRET>
 *
 * This is the human moderation backstop. For production, upgrade the auth check
 * to Clerk (you already use it elsewhere): verify the signed-in user has an
 * "admin" role via auth()/sessionClaims instead of a shared secret.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const { name, category, group } = body ?? {};
  if (!VALID.has(category)) return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const removed = await redis.zrem(lbKey(category, group), name);
  return NextResponse.json({ ok: true, removed });
}
