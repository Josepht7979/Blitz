import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

// Visit /api/health to check the leaderboard's database connection.
// Reports booleans + any error message only — never the actual secrets.
export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";

  const report: Record<string, unknown> = {
    envUrlPresent: !!url,
    envTokenPresent: !!token,
    urlLooksLikeRestUrl: url.startsWith("https://"),   // must be true (not redis://)
    redisOk: false,
    error: null as string | null,
  };

  if (!url || !token) {
    report.error = "Missing UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN in this deployment.";
    return NextResponse.json(report);
  }

  try {
    const redis = new Redis({ url, token });
    const stamp = Date.now().toString();
    await redis.set("health:ping", stamp);
    const back = await redis.get("health:ping");
    report.redisOk = String(back) === stamp;
  } catch (e: any) {
    report.error = String(e?.message || e).slice(0, 300);
  }

  return NextResponse.json(report);
}
