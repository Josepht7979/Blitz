import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VALID = new Set(["easy", "med", "hard", "edifying"]);

/**
 * POST /api/seen  { acct, category, refs: string[] }
 * Records the question references an account has now seen so future batches
 * exclude them. Called once at the end of each round (fire-and-forget).
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const acct = String(body?.acct || "").replace(/[^a-z0-9]/gi, "").slice(0, 64);
  const category = body?.category;
  const refs: string[] = Array.isArray(body?.refs)
    ? body.refs.filter((x: any) => typeof x === "string" && x.length <= 120).slice(0, 200)
    : [];

  if (!acct || !VALID.has(category) || refs.length === 0) {
    return NextResponse.json({ ok: false });
  }

  try {
    await redis.sadd(`seen:${acct}:${category}`, refs[0], ...refs.slice(1));
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true, added: refs.length });
}
