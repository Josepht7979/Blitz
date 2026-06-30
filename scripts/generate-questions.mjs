#!/usr/bin/env node
/**
 * generate-questions.mjs
 * Turns a public-domain Bible (KJV / WEB) JSON file into Bible-trivia questions.
 *
 * This is what makes the pool effectively unlimited: instead of hand-writing
 * 100,000 questions, we derive guaranteed-accurate ones from the actual text.
 *
 * Input format (flat array):
 *   [{ "book":"John", "chapter":3, "verse":16, "text":"For God so loved..." }, ...]
 *
 * Get a public-domain Bible JSON from one of:
 *   - World English Bible (CC0):  https://github.com/TehShrike/world-english-bible
 *   - KJV per-book JSON:          https://github.com/aruljohn/Bible-kjv
 *   - WEB full dataset (CC0):     search GitHub topic "world-english-bible"
 *   DO NOT use NIV/ESV/NLT/NASB — those are copyrighted and cannot be redistributed.
 *
 * Usage:
 *   node scripts/generate-questions.mjs [inputPath] [outputPath]
 *   node scripts/generate-questions.mjs data/bible.sample.json data/questions.generated.json
 */
import { readFileSync, writeFileSync } from "node:fs";

const IN  = process.argv[2] || "data/bible.sample.json";
const OUT = process.argv[3] || "data/questions.generated.json";

const STOPWORDS = new Set(["which","there","their","shall","thine","unto","upon","that","this","with","have","from","into","they","them","were","when","what","your","ours","whom","whose","hath","said","saying","therefore","because","before","after","every","might","being","these","those","other","under","again"]);

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function sample(arr,n,exclude=new Set()){
  const pool=arr.filter(x=>!exclude.has(x)); shuffle(pool); return pool.slice(0,n);
}

const verses = JSON.parse(readFileSync(IN,"utf8"));
const books  = [...new Set(verses.map(v=>v.book))];

// build a vocabulary of "content words" for fill-in-the-blank distractors
const vocab = new Set();
for(const v of verses){
  for(const w of v.text.toLowerCase().replace(/[^a-z' ]/g," ").split(/\s+/)){
    if(w.length>=5 && !STOPWORDS.has(w)) vocab.add(w);
  }
}
const vocabArr=[...vocab];

const questions=[];

// 1) "Which book is this verse from?"  — always accurate
for(const v of verses){
  const distract=sample(books,3,new Set([v.book]));
  if(distract.length<3) continue;
  const opts=shuffle([v.book,...distract]);
  questions.push({
    q:"In which book of the Bible is this verse found?",
    verse:`\u201C${v.text}\u201D`,
    o:opts, a:opts.indexOf(v.book),
    c:"Scripture", n:`From the book of ${v.book}.`,
    ref:`${v.book} ${v.chapter}:${v.verse}`,
    difficulty:"med", generated:true
  });
}

// 2) "Complete the verse" — blank a distinctive word
for(const v of verses){
  const words=v.text.split(/\s+/);
  const candidates=words.map((w,i)=>({w,i,clean:w.toLowerCase().replace(/[^a-z']/g,"")}))
    .filter(x=>x.clean.length>=5 && !STOPWORDS.has(x.clean));
  if(!candidates.length) continue;
  const pick=candidates[Math.floor(Math.random()*candidates.length)];
  const answer=pick.w.replace(/[^A-Za-z']/g,"");
  const distract=sample(vocabArr,3,new Set([pick.clean]));
  if(distract.length<3) continue;
  const blanked=words.map((w,i)=>i===pick.i?"_____":w).join(" ");
  const opts=shuffle([answer,...distract.map(d=>d)]);
  questions.push({
    q:"Complete the verse:",
    verse:`\u201C${blanked}\u201D`,
    o:opts, a:opts.indexOf(answer),
    c:"Scripture", n:`The word is "${answer}".`,
    ref:`${v.book} ${v.chapter}:${v.verse}`,
    difficulty:"hard", generated:true
  });
}

writeFileSync(OUT, JSON.stringify(questions));
const byType = questions.reduce((m,q)=>{ m[q.q]=(m[q.q]||0)+1; return m; },{});
console.log(`Read ${verses.length} verses across ${books.length} books.`);
console.log(`Generated ${questions.length} questions:`);
for(const [t,n] of Object.entries(byType)) console.log(`  ${n}\t${t}`);
console.log(`Wrote ${OUT}`);
console.log(`\nScale check: a full public-domain Bible (~31,000 verses) yields ~${(31000*2).toLocaleString()} questions from just these two generators.`);
