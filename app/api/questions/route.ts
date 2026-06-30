import { NextRequest, NextResponse } from "next/server";
import { getBatch } from "@/lib/questions";

export const dynamic = "force-dynamic"; // fresh batch every request

const VALID = new Set(["easy", "med", "hard", "edifying"]);

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "med";
  const count = Math.min(30, Math.max(1, Number(searchParams.get("count")) || 12));
  if (!VALID.has(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }
  return NextResponse.json({ questions: getBatch(category, count) });
}
