/**
 * Server-side name moderation. This is the AUTHORITATIVE check — the client
 * filter is only a courtesy; never trust it.
 *
 * IMPORTANT for worldwide launch: this blocklist is intentionally small. Before
 * you go live, swap in a maintained moderation library or API so you catch
 * slurs, multi-language profanity, and evasion (leetspeak, spacing, unicode
 * look-alikes). Options: `obscenity` (npm), `bad-words`, or a hosted service
 * like OpenAI/Perspective moderation. Keep the admin delete endpoint as the
 * human backstop regardless.
 */
const BLOCKLIST = [
  "fuck","shit","bitch","cunt","asshole","dick","piss","bastard","slut",
  "whore","nigg","fag","retard","rape","nazi","kkk","sex","porn","penis","vagina"
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")        // strip accents
    .replace(/[4@]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i")
    .replace(/0/g, "o").replace(/[5$]/g, "s").replace(/7/g, "t")
    .replace(/[^a-z]/g, "");                  // collapse to letters only
}

export type NameResult = { ok: true; name: string } | { ok: false; reason: string };

export function validateName(raw: unknown): NameResult {
  const t = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (t.length < 2) return { ok: false, reason: "Name must be at least 2 characters." };
  if (t.length > 16) return { ok: false, reason: "Keep it under 16 characters." };
  if (!/[a-zA-Z]/.test(t)) return { ok: false, reason: "Use at least one letter." };
  if (/[\u0000-\u001f]/.test(t)) return { ok: false, reason: "Invalid characters." };
  const norm = normalize(t);
  for (const bad of BLOCKLIST) {
    if (norm.includes(bad)) return { ok: false, reason: "That name isn't allowed — pick another." };
  }
  return { ok: true, name: t };
}
