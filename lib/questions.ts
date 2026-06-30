import curated from "@/data/questions.curated.json";
import bible from "@/data/bible.json";

// To go from ~hundreds to tens of thousands of questions, replace
// data/bible.json with a full public-domain Bible (WEB or KJV). The generators
// below run server-side per request, so the client never downloads a huge file.

export type Question = {
  q: string;
  verse?: string;
  o: string[];
  a: number;
  c: string;
  n: string;
  ref?: string;
  r?: string;          // reflection line (edifying)
  generated?: boolean;
};

type Verse = { book: string; chapter: number; verse: number; text: string };

const CURATED = curated as Record<string, Question[]>;
const VERSES = bible as Verse[];
const BOOKS = [...new Set(VERSES.map((v) => v.book))];

const STOP = new Set(["which","there","their","shall","thine","unto","upon","that","this","with","have","from","into","they","them","were","when","what","your","whom","whose","hath","said","saying","therefore","because","before","after","every","might","being","these","those","other","under","again"]);
const VOCAB = [...new Set(
  VERSES.flatMap((v) =>
    v.text.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter((w) => w.length >= 5 && !STOP.has(w))
  )
)];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function sampleExcept(arr: string[], n: number, exclude: string): string[] {
  return shuffle(arr.filter((x) => x !== exclude)).slice(0, n);
}

function genBookId(): Question | null {
  const v = pick(VERSES);
  const d = sampleExcept(BOOKS, 3, v.book);
  if (d.length < 3) return null;
  const o = shuffle([v.book, ...d]);
  return {
    q: "In which book of the Bible is this verse found?",
    verse: `\u201C${v.text}\u201D`,
    o, a: o.indexOf(v.book),
    c: "Scripture", n: `From the book of ${v.book}.`,
    ref: `${v.book} ${v.chapter}:${v.verse}`, generated: true,
  };
}

function genComplete(): Question | null {
  const v = pick(VERSES);
  const words = v.text.split(/\s+/);
  const cands = words
    .map((w, i) => ({ w, i, clean: w.toLowerCase().replace(/[^a-z']/g, "") }))
    .filter((x) => x.clean.length >= 5 && !STOP.has(x.clean));
  if (!cands.length) return null;
  const c = pick(cands);
  const answer = c.w.replace(/[^A-Za-z']/g, "");
  const d = sampleExcept(VOCAB, 3, c.clean);
  if (d.length < 3) return null;
  const blanked = words.map((w, i) => (i === c.i ? "_____" : w)).join(" ");
  const o = shuffle([answer, ...d]);
  return {
    q: "Complete the verse:",
    verse: `\u201C${blanked}\u201D`,
    o, a: o.indexOf(answer),
    c: "Scripture", n: `The word is "${answer}".`,
    ref: `${v.book} ${v.chapter}:${v.verse}`, generated: true,
  };
}

/** Returns a fresh batch for a category. Med/Hard mix in generated questions. */
export function getBatch(category: string, count = 12): Question[] {
  const curatedPool = CURATED[category] ?? CURATED["med"];
  const genChance = category === "hard" ? 0.45 : category === "med" ? 0.35 : 0;
  const out: Question[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    let item: Question | null = null;
    if (Math.random() < genChance) {
      item = Math.random() < 0.5 ? genBookId() : genComplete();
    } else {
      item = pick(curatedPool);
      if (used.has(item.q)) item = null; // avoid dup curated within a batch
    }
    if (!item) continue;
    if (!item.generated) used.add(item.q);
    out.push(item);
  }
  return out;
}
