# Scripture Blitz

A fast, addictive Bible quiz with global category leaderboards, name moderation,
and an effectively unlimited question pool generated from public-domain Scripture.

Stack: **Next.js 14 (App Router) · Upstash Redis · Vercel**. Optional: Clerk (admin),
Stripe (donations / group licensing).

---

## How it answers the hard problems

| Requirement | How it's solved |
|---|---|
| Don't run out of questions | `lib/questions.ts` generates "which book is this verse?" and "complete the verse" questions from the Bible text at request time. Curated questions are layered on top. |
| Per-category leaderboards | One Redis **sorted set** per category: `lb:global:hard`, etc. Top-N is `ZRANGE … REV`. |
| Players type a name | Captured on the start screen, re-validated server-side. |
| Block offensive names | `lib/moderation.ts` (blocklist + leetspeak normalisation). **Authoritative check is server-side.** |
| Delete names later | `POST /api/admin/delete` (one `ZREM`), protected by `ADMIN_SECRET`. |
| Private church leagues (revenue) | Pass `group` to the leaderboard APIs → `lb:{group}:{category}`. Gate behind a paid flag. |
| Make money | Donations route (Stripe) included; group licensing is the higher-value path. |

---

## Questions: going from hundreds to tens of thousands

The repo ships with **97 curated** questions (`data/questions.curated.json`) plus a
**generator**. Out of the box `data/bible.json` is only a 37-verse sample.

To unlock the large pool, replace `data/bible.json` with a **full public-domain
Bible** in this format:

```json
[{ "book": "John", "chapter": 3, "verse": 16, "text": "For God so loved..." }]
```

Public-domain sources (free to use commercially):
- **World English Bible (CC0)** — github.com/TehShrike/world-english-bible
- **KJV per-book JSON** — github.com/aruljohn/Bible-kjv
- Full WEB datasets — GitHub topic `world-english-bible`

> ⚠️ **Do NOT** use NIV, ESV, NLT, or NASB — they are copyrighted and cannot be
> redistributed. KJV, ASV, YLT, and WEB are public domain.

A full Bible (~31,000 verses) yields **~62,000** questions from the two generators
alone. The generators run **server-side per request**, so the browser never
downloads a huge file. To pre-generate/export a static set instead:

```bash
npm run generate        # writes data/questions.generated.json
```

---

## Deploy (your usual flow: GitHub → Vercel)

1. Push this folder to a new GitHub repo.
2. Create a free Upstash Redis DB → copy the **REST URL** and **REST TOKEN**.
3. Import the repo at vercel.com → **New Project**.
4. Add Environment Variables (see `.env.example`):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_SECRET` (any long random string)
5. Deploy. That's it — leaderboards persist immediately.

Local dev:
```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

---

## API

- `GET  /api/questions?category=hard&count=12` → fresh batch
- `GET  /api/leaderboard?category=hard&group=&limit=20` → top scores
- `POST /api/leaderboard` `{ name, score, category, group? }` → submit (validated, rate-limited, keeps each player's best)
- `POST /api/admin/delete` `{ name, category, group? }` + header `x-admin-secret` → remove a name
- `POST /api/donate` `{ amount }` → Stripe Checkout (needs `STRIPE_SECRET_KEY` and `npm i stripe`)

---

## Before you publish worldwide — checklist

- [ ] Swap `data/bible.json` for a full WEB/KJV file.
- [ ] Replace the moderation blocklist with a maintained library (`obscenity`) or API — it must catch slurs, multi-language, and evasion.
- [ ] Upgrade admin auth from `ADMIN_SECRET` to **Clerk** role-based auth.
- [ ] Add a **Privacy Policy** and **Terms** — you collect names (personal data); GDPR applies to EU players.
- [ ] Have the curated questions **reviewed theologically** before launch. Accuracy is the brand.
- [ ] Pick a revenue model (donations to start; group licensing for churches as the real earner).

---

## Revenue notes

- **Group licensing (B2B)** — sell churches a private league (`group` leaderboard) + custom packs. Highest value per customer; plays to a church network.
- **Donations** — simplest to ship; well-received by a faith audience (route included).
- **Premium** — free core; pay for extra edifying packs, no ads, private leagues.
- **Ads** — easy but low revenue until large scale; some find ads on Scripture off-putting.

The polished animations, sounds, and the "double-or-nothing" mechanic live in the
standalone `scripture-blitz.html` demo — port them onto `app/page.tsx` when you want the extra juice.
