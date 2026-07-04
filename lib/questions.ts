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

// Capitalized words that are NOT names (sentence starters, pronouns, common terms).
const NAME_STOP = new Set(["The","And","But","For","Then","Now","So","When","Who","What","Why","How","Where","Behold","Therefore","Thus","Yet","Truly","Amen","God","Lord","LORD","He","She","They","We","You","Do","Let","May","This","That","These","Those","Blessed","Woe","Selah","Then","There","Here","Come","Go","See","Hear","Take","Give"]);

function extractNames(text: string): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  for (let i = 1; i < words.length; i++) {
    if (/[.!?;:"”'’]$/.test(words[i - 1])) continue;            // skip sentence starts
    const name = words[i].replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
    if (name.length >= 3 && /^[A-Z][a-z]/.test(name) && !NAME_STOP.has(name)) out.push(name);
  }
  return out;
}
const NAMES = [...new Set(VERSES.flatMap((v) => extractNames(v.text)))];

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

function genFillName(): Question | null {
  for (let tries = 0; tries < 40; tries++) {
    const v = pick(VERSES);
    const words = v.text.split(/\s+/);
    const cands: { w: string; i: number; name: string }[] = [];
    for (let i = 1; i < words.length; i++) {
      if (/[.!?;:"”'’]$/.test(words[i - 1])) continue;
      const name = words[i].replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
      if (name.length >= 3 && /^[A-Z][a-z]/.test(name) && !NAME_STOP.has(name)) {
        cands.push({ w: words[i], i, name });
      }
    }
    if (!cands.length) continue;
    const c = pick(cands);
    const d = sampleExcept(NAMES, 3, c.name);
    if (d.length < 3) continue;
    const blanked = words.map((w, i) => (i === c.i ? c.w.replace(c.name, "_____") : w)).join(" ");
    const o = shuffle([c.name, ...d]);
    return {
      q: "Fill in the missing name:",
      verse: `\u201C${blanked}\u201D`,
      o, a: o.indexOf(c.name),
      c: "Scripture", n: `The name is "${c.name}".`,
      ref: `${v.book} ${v.chapter}:${v.verse}`, generated: true,
    };
  }
  return null;
}

/** Returns a fresh batch for a category. Med/Hard mix in generated questions. */
export function getBatch(category: string, count = 12): Question[] {
  const curatedPool = CURATED[category] ?? CURATED["med"];
  // "The Word" (med) is drawn almost entirely from the full-Bible generated pool
  // (three question formats) so a repeat player rarely sees the same question
  // twice. Edifying stays 100% curated by design.
  const genChance = category === "med" || category === "hard" ? 0.9 : 0;
  const gens = [genBookId, genComplete, genFillName];
  const out: Question[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 25) {
    let item: Question | null = null;
    if (Math.random() < genChance) {
      item = pick(gens)();
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
