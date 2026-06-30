import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/donate  { amount }  ->  { url }   (Stripe Checkout)
 *
 * Donations are the simplest revenue to ship for a faith audience and tend to
 * be well-received. Set STRIPE_SECRET_KEY to enable. For "group licensing"
 * (selling private leagues to churches) use a recurring Price + Checkout in
 * subscription mode instead, and gate the `group` leaderboard on a paid flag.
 */
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Donations not configured." }, { status: 503 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const dollars = Math.min(1000, Math.max(1, Math.floor(Number(body?.amount) || 5)));

  // Lazy import so the app builds without the dependency until you enable it.
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(key);

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: dollars * 100,
        product_data: { name: "Support Scripture Blitz" },
      },
    }],
    success_url: `${origin}/?donated=1`,
    cancel_url: `${origin}/`,
  });

  return NextResponse.json({ url: session.url });
}
