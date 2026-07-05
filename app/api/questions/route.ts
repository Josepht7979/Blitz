import { NextRequest, NextResponse } from "next/server";
import { getBatch } from "@/lib/questions";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic"; // fresh batch every request

const VALID = new Set(["easy", "med", "hard", "edifying"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "med";
  const count = Math.min(30, Math.max(1, Number(searchParams.get("count")) || 12));
  const acct = (searchParams.get("acct") || "").replace(/[^a-z0-9]/gi, "").slice(0, 64);
  if (!VALID.has(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  // If signed in with a name+code, exclude everything this account has already seen.
  let exclude: Set<string> | undefined;
  if (acct) {
    try {
      const seen = (await redis.smembers(`seen:${acct}:${category}`)) as string[];
      exclude = new Set(seen);
    } catch { /* Redis hiccup -> just don't exclude */ }
  }

  return NextResponse.json(
    { questions: getBatch(category, count, exclude) },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
