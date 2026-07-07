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
const NAME_STOP = new Set(["The","And","But","For","Then","Now","So","When","Who","What","Why","How","Where","Behold","Therefore","Thus","Yet","Truly","Amen","God","Lord","LORD","He","She","It","They","We","You","I","Do","Does","Did","Let","May","Shall","Will","Would","Should","Could","Can","This","That","These","Those","Blessed","Woe","Selah","There","Here","Come","Go","See","Hear","Take","Give","Know","Say","Said",
  "His","Him","Her","Hers","Its","Our","Ours","Us","Their","Theirs","Them","Your","Yours","My","Mine","Me","Whom","Whose","Himself","Herself","Itself","Myself","Ourselves","Yourself","Yourselves","Themselves",
  "Thou","Thee","Thy","Thine","Ye",
  "Father","Son","Spirit","Holy","Almighty","Most","High","King","Master","Savior","Saviour","Redeemer","Messiah","Shepherd","Hosts",
  "One","Two","Three","Yes","No","Send","Since","Also","Even","Only","Just","Again","Indeed","Surely","Yea","Nay","Lo","Oh","If","As","Because","While","Whether","Though","Although","Unless","However","Moreover","Nevertheless","Nor","Or","Every","Each","All","Any","Some","Many","None","Both","Either","Neither","Whoever","Whatever","Wherever","Whenever","Anyone","Everyone","Someone","Nothing","Everything","Something","Great","Good","New","Old","First","Last","Well","Away","Make","Went","Came","Saw","Way","Bring","Rise","Arise","Return","Remember","Consider","Look","Turn","Wait","Cry","Sing","Praise","Fear","Trust","Hope","Rejoice","Peace","Grace","Truth","Life","Death","Light","Love","Word","Faith","Glory","Mercy","Sin","Soul","Heart","Wisdom","Salvation","Righteousness","Hallelujah","Day","Night","Earth","Heaven","Cursed","Prophets","Priests"]);

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
const _nameFreq: Record<string, number> = {};
for (const v of VERSES) for (const n of extractNames(v.text)) _nameFreq[n] = (_nameFreq[n] || 0) + 1;
// only names that appear often enough to be recognizable (no one-off genealogy names)
const NAMES = Object.keys(_nameFreq).filter((n) => _nameFreq[n] >= 5);
const NAMES_SET = new Set(NAMES);

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function sampleExcept(arr: string[], n: number, exclude: string): string[] {
  return shuffle(arr.filter((x) => x !== exclude)).slice(0, n);
}

// --- Knowledge-based generators -----------------------------------------
// Every question requires knowing the Bible, not English. Generic-word
// "complete the verse" was removed because grammar alone could solve it.
const NUMBERS = ["one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","forty","fifty","seventy","hundred","thousand"];
const OT = BOOKS.slice(0, 39);
const NT = BOOKS.slice(39);

function genBookId(): Question | null {
  const v = pick(VERSES);
  // distractors from the SAME testament so you can't rule books out by style
  const sameTest = OT.includes(v.book) ? OT : NT;
  let pool = sameTest.filter((b) => b !== v.book);
  if (pool.length < 3) pool = BOOKS.filter((b) => b !== v.book);
  const o = shuffle([v.book, ...shuffle(pool).slice(0, 3)]);
  return {
    q: "In which book of the Bible is this verse found?",
    verse: `\u201C${v.text}\u201D`,
    o, a: o.indexOf(v.book),
    c: "Scripture", n: `From the book of ${v.book}.`,
    ref: `${v.book} ${v.chapter}:${v.verse}`, generated: true,
  };
}

function genNumber(): Question | null {
  for (let tries = 0; tries < 30; tries++) {
    const v = pick(VERSES);
    const words = v.text.split(/\s+/);
    const cands = words
      .map((w, i) => ({ w, i, clean: w.toLowerCase().replace(/[^a-z]/g, "") }))
      .filter((x) => NUMBERS.includes(x.clean));
    if (!cands.length) continue;
    const c = pick(cands);
    const answer = c.w.replace(/[^A-Za-z]/g, "");
    const cap = /^[A-Z]/.test(answer);
    const d = sampleExcept(NUMBERS, 3, c.clean).map((x) => (cap ? x[0].toUpperCase() + x.slice(1) : x));
    if (d.length < 3) continue;
    const blanked = words.map((w, i) => (i === c.i ? "_____" : w)).join(" ");
    const o = shuffle([answer, ...d]);
    return {
      q: "Fill in the missing number:",
      verse: `\u201C${blanked}\u201D`,
      o, a: o.indexOf(answer),
      c: "Scripture", n: `The number is "${answer}".`,
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
      if (name.length >= 3 && /^[A-Z][a-z]/.test(name) && NAMES_SET.has(name)) {
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
      q: "Who or where fills the blank?",
      verse: `\u201C${blanked}\u201D`,
      o, a: o.indexOf(c.name),
      c: "Scripture", n: `The answer is "${c.name}".`,
      ref: `${v.book} ${v.chapter}:${v.verse}`, generated: true,
    };
  }
  return null;
}

/** Canonical identity of a question (verse reference where possible). */
export function refOf(q: Question): string {
  return q.ref || q.r || q.verse || q.q;
}

/** Weighted pick — every format requires Bible knowledge, not grammar. */
function pickGenerated(): Question | null {
  const r = Math.random();
  if (r < 0.45) return genBookId();      // which book — recognition
  if (r < 0.82) return genFillName();    // which person / place
  return genNumber() || genFillName();   // which number (else a name)
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
