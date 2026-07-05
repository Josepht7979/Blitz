import { NextRequest, NextResponse } from "next/server";
import { redis, lbKey } from "@/lib/redis";
import { validateName } from "@/lib/moderation";
import { submitLimiter } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const VALID = new Set(["easy", "med", "hard", "edifying"]);

// GET /api/leaderboard?category=hard&group=&limit=20  -> top scores
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "med";
  const group = searchParams.get("group") ?? undefined;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  if (!VALID.has(category)) return NextResponse.json({ error: "Unknown category" }, { status: 400 });

  try {
    // sorted set, highest first, with scores -> [member, score, member, score, ...]
    const flat = (await redis.zrange(lbKey(category, group), 0, limit - 1, {
      rev: true,
      withScores: true,
    })) as (string | number)[];

    const entries: { name: string; score: number }[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      entries.push({ name: String(flat[i]), score: Number(flat[i + 1]) });
    }
    return NextResponse.json({ category, group: group ?? "global", entries });
  } catch (e) {
    // Redis unreachable (e.g. missing/invalid Upstash env vars) — don't 500.
    return NextResponse.json({ category, entries: [], error: "store_unavailable" });
  }
}

// POST /api/leaderboard  { name, score, category, group? } -> submit
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const { category, group } = body ?? {};
  if (!VALID.has(category)) return NextResponse.json({ error: "Unknown category" }, { status: 400 });

  const score = Math.floor(Number(body?.score));
  if (!Number.isFinite(score) || score < 0 || score > 5_000_000) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const v = validateName(body?.name);
  if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 400 });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const { success } = await submitLimiter.limit(ip);
    if (!success) return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });
  } catch { /* limiter offline -> allow */ }

  try {
    const key = lbKey(category, group);
    // keep each player's BEST score only (member = name, update only if greater)
    await redis.zadd(key, { gt: true }, { score, member: v.name });
    const rank = await redis.zrevrank(key, v.name);
    return NextResponse.json({ ok: true, name: v.name, score, rank: rank === null ? null : rank + 1 });
  } catch (e) {
    // Redis unreachable — report cleanly instead of 500 so the client can react.
    return NextResponse.json({ ok: false, error: "store_unavailable" }, { status: 200 });
  }
}
