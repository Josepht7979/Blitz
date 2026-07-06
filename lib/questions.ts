import curated from "@/data/questions.curated.json";
import bible from "@/data/bible.json";
import { pointerForGenerated } from "@/lib/pointers";

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
  p?: string;          // pointer: a short fun-fact / learning / context line
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

// --- Distractor helpers ---------------------------------------------------
// The goal: make "complete the verse" options grammatically parallel so grammar
// alone can't eliminate them. Wrong options share the answer's word-ending
// (tense/part-of-speech signal) or are same-category (numbers), forcing recall.
const NUMBERS = ["one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","forty","fifty","seventy","hundred","thousand"];

function endSig(w: string): string {
  const s = w.toLowerCase();
  if (/eth$/.test(s)) return "eth";
  if (/ing$/.test(s)) return "ing";
  if (/est$/.test(s)) return "est";
  if (/ed$/.test(s)) return "ed";
  if (/ness$/.test(s)) return "ness";
  if (/ions?$/.test(s)) return "ion";
  if (/ly$/.test(s)) return "ly";
  if (/ful$/.test(s)) return "ful";
  if (/s$/.test(s)) return "s";
  return s.slice(-2);
}
const BY_END: Record<string, string[]> = {};
for (const w of VOCAB) { const k = endSig(w); (BY_END[k] ||= []).push(w); }

function distractorsFor(answer: string): string[] {
  const a = answer.toLowerCase();
  if (NUMBERS.includes(a)) return sampleExcept(NUMBERS, 3, a);
  const pool = (BY_END[endSig(a)] || []).filter((w) => w.toLowerCase() !== a);
  let d = shuffle(pool.slice()).slice(0, 3);
  if (d.length < 3) {
    const extra = sampleExcept(VOCAB.filter((w) => Math.abs(w.length - a.length) <= 2), 3 - d.length, a);
    d = [...new Set([...d, ...extra])].slice(0, 3);
  }
  return d;
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
  for (let tries = 0; tries < 8; tries++) {
    const v = pick(VERSES);
    const words = v.text.split(/\s+/);
    const cands = words
      .map((w, i) => ({ w, i, clean: w.toLowerCase().replace(/[^a-z']/g, "") }))
      .filter((x) => x.clean.length >= 5 && !STOP.has(x.clean));
    if (!cands.length) continue;
    const c = pick(cands);
    const answer = c.w.replace(/[^A-Za-z']/g, "");
    const d = distractorsFor(answer);              // grammatically-parallel wrong options
    if (d.length < 3) continue;
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
  return null;
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

/** Canonical identity of a question (verse reference where possible). */
export function refOf(q: Question): string {
  return q.ref || q.r || q.verse || q.q;
}

/** Weighted pick — favors knowledge-based formats over verse-completion. */
function pickGenerated(): Question | null {
  const r = Math.random();
  let item: Question | null;
  if (r < 0.42) item = genBookId();         // recognize the source book
  else if (r < 0.78) item = genFillName();  // name / place recall
  else item = genComplete();                // verse recall (parallel distractors)
  if (item && !item.p) item.p = pointerForGenerated(item);  // fun-fact / context line
  return item;
}

/** Returns a fresh batch, optionally excluding questions this account has already seen. */
export function getBatch(category: string, count = 12, exclude?: Set<string>): Question[] {
  const curatedPool = CURATED[category] ?? CURATED["med"];
  const genChance = category === "med" || category === "hard" ? 0.9 : 0;
  const out: Question[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const item: Question | null = Math.random() < genChance ? pickGenerated() : pick(curatedPool);
    if (!item) continue;
    const key = refOf(item);
    if (used.has(key)) continue;                 // no duplicate within a batch
    if (exclude && exclude.has(key)) continue;   // skip anything this account has seen
    used.add(key);
    out.push(item);
  }
  // If the unseen pool is exhausted (finite categories once an account has seen
  // most of it), top up with repeats so the batch is always full and flows.
  let g2 = 0;
  while (out.length < count && g2++ < count * 20) {
    const item: Question | null = Math.random() < genChance ? pickGenerated() : pick(curatedPool);
    if (!item) continue;
    const key = refOf(item);
    if (used.has(key)) continue;
    used.add(key);
    out.push(item);
  }
  return out;
}
