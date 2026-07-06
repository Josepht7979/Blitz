// Pointers for *generated* questions (The Word). The curated pool carries
// hand-written pointers in the JSON; these fill in the ~62k generated ones.
// A pointer is a short one-liner — a fun fact, a bit of context, or a takeaway —
// shown under the answer in the reveal card. Keep each ~6–16 words.

// One concise fact/context line per book — guarantees every generated question
// (they all carry a book reference) can always be given a pointer.
export const BOOK_FACTS: Record<string, string> = {
  "Genesis": "Genesis means 'origin' — the Bible's book of beginnings.",
  "Exodus": "'Exodus' means 'the way out' — Israel's escape from Egypt.",
  "Leviticus": "Leviticus lays out worship and holiness for the Levites.",
  "Numbers": "Named for the two censuses Israel took in the wilderness.",
  "Deuteronomy": "'Deuteronomy' means 'second law' — Moses' farewell speeches.",
  "Joshua": "Joshua records Israel entering the Promised Land.",
  "Judges": "A cycle of rescue and relapse before Israel had kings.",
  "Ruth": "One of only two Bible books named for a woman.",
  "1 Samuel": "Israel's move from judges to kings — Saul, then David.",
  "2 Samuel": "The rise, and the failings, of King David's reign.",
  "1 Kings": "Solomon's temple, then the kingdom splitting in two.",
  "2 Kings": "The decline of Israel and Judah into exile.",
  "1 Chronicles": "A priestly retelling of Israel's history through David.",
  "2 Chronicles": "Judah's kings and the temple, up to the exile.",
  "Ezra": "The return from exile and rebuilding of the temple.",
  "Nehemiah": "Nehemiah rebuilt Jerusalem's walls in just 52 days.",
  "Esther": "The only Bible book that never mentions God by name.",
  "Job": "Often called the oldest story in the Bible — on suffering.",
  "Psalms": "The Bible's longest book — 150 songs and prayers.",
  "Proverbs": "Short sayings on living wisely, largely from Solomon.",
  "Ecclesiastes": "'Everything is meaningless' — a search for life's point.",
  "Song of Solomon": "A poem of married love — also read as God and His people.",
  "Isaiah": "Called the 'fifth Gospel' for its many Messiah prophecies.",
  "Jeremiah": "The 'weeping prophet,' warning of Jerusalem's fall.",
  "Lamentations": "Five poems grieving the destruction of Jerusalem.",
  "Ezekiel": "Famous for the vision of a valley of dry bones.",
  "Daniel": "The lions' den and the fiery furnace both live here.",
  "Hosea": "Hosea's own marriage pictured God's love for Israel.",
  "Joel": "A locust plague becomes a call to return to God.",
  "Amos": "A shepherd-prophet thundering for justice for the poor.",
  "Obadiah": "The Bible's shortest Old Testament book — one chapter.",
  "Jonah": "The prophet who fled God and was swallowed by a fish.",
  "Micah": "Foretold the Messiah's birthplace: Bethlehem.",
  "Nahum": "A prophecy of judgment on the city of Nineveh.",
  "Habakkuk": "A prophet who argues honestly with God — and trusts.",
  "Zephaniah": "Warns of 'the day of the Lord,' then promises joy.",
  "Haggai": "Urged the returned exiles to rebuild God's temple.",
  "Zechariah": "Rich with visions pointing toward the coming Messiah.",
  "Malachi": "The Old Testament's last word before 400 silent years.",
  "Matthew": "Written to show Jesus as the promised Jewish Messiah.",
  "Mark": "The shortest, fastest-paced Gospel — likely the first written.",
  "Luke": "Written by Luke, a physician, more than anyone by volume.",
  "John": "The most distinct Gospel — 'the Word became flesh.'",
  "Acts": "The story of the early church exploding across the world.",
  "Romans": "Paul's fullest explanation of the gospel of grace.",
  "1 Corinthians": "Home to the famous 'love chapter,' 1 Corinthians 13.",
  "2 Corinthians": "Paul's most personal letter — strength in weakness.",
  "Galatians": "Freedom in Christ — and the fruit of the Spirit.",
  "Ephesians": "One of Paul's letters written from prison.",
  "Philippians": "The 'letter of joy' — written from a prison cell.",
  "Colossians": "Christ above all — the image of the invisible God.",
  "1 Thessalonians": "Likely Paul's earliest surviving letter.",
  "2 Thessalonians": "Encourages a young church awaiting Christ's return.",
  "1 Timothy": "Paul's guidance to a young pastor, Timothy.",
  "2 Timothy": "Paul's last letter, written facing his own death.",
  "Titus": "Instructions for ordering a healthy church on Crete.",
  "Philemon": "Paul's brief, personal appeal to free a slave, Onesimus.",
  "Hebrews": "Shows Christ as greater than everything before Him.",
  "James": "The New Testament's most practical, proverb-like letter.",
  "1 Peter": "Written to encourage Christians facing suffering.",
  "2 Peter": "A warning against false teachers, from Peter.",
  "1 John": "'God is love' — a letter on assurance and love.",
  "2 John": "A short note urging truth and love — thirteen verses.",
  "3 John": "The Bible's shortest book by word count.",
  "Jude": "A one-chapter call to contend for the faith.",
  "Revelation": "'Revelation' means 'unveiling' — the Bible's grand finale.",
};

// Facts for well-known people. Used when a name-based question's answer matches.
// Not exhaustive — anything missing falls back to the book fact.
export const NAME_FACTS: Record<string, string> = {
  "Abraham": "Called God's friend — father of Israel through Isaac.",
  "Abram": "'Abram' means 'exalted father'; God renamed him Abraham.",
  "Isaac": "'Isaac' means 'he laughs' — Sarah laughed at the promise.",
  "Jacob": "Renamed 'Israel'; his twelve sons became the twelve tribes.",
  "Israel": "The name God gave Jacob — 'he struggles with God.'",
  "Joseph": "Sold by his brothers, he rose to rule Egypt.",
  "Moses": "Led the Exodus and received the Ten Commandments.",
  "Aaron": "Moses' brother and Israel's first high priest.",
  "Joshua": "'Joshua' is the Hebrew form of the name 'Jesus.'",
  "Samson": "His strength was tied to a Nazirite vow, not his hair alone.",
  "Samuel": "The last judge, who anointed Israel's first two kings.",
  "Saul": "Israel's first king — a head taller than everyone.",
  "David": "The shepherd-king, most-named human after Jesus.",
  "Solomon": "Asked God for wisdom over riches — and got both.",
  "Elijah": "Never died — taken up in a chariot of fire.",
  "Elisha": "Elijah's successor, who received a double portion.",
  "Daniel": "Served kings of both Babylon and Persia.",
  "Job": "His name became a byword for patient endurance.",
  "Ruth": "A Moabite great-grandmother of King David.",
  "Naomi": "In grief she renamed herself 'Mara' — 'bitter.'",
  "Esther": "A queen who risked her life to save her people.",
  "Nehemiah": "Rebuilt Jerusalem's walls in just 52 days.",
  "Ezra": "A scribe who led Israel back to God's law.",
  "Isaiah": "The prophet who foretold much about the Messiah.",
  "Jeremiah": "The 'weeping prophet' of Jerusalem's fall.",
  "Jonah": "Fled God's call and was swallowed by a great fish.",
  "Noah": "Built the ark; his family of eight survived the flood.",
  "Adam": "'Adam' is Hebrew for 'man,' from the ground he was formed of.",
  "Eve": "'Eve' means 'living' — mother of all the living.",
  "Cain": "Adam's firstborn, and the first murderer in Scripture.",
  "Abel": "Adam's son, whose offering pleased God.",
  "Enoch": "'Walked with God,' then was taken without dying.",
  "Methuselah": "Lived 969 years — the longest life in the Bible.",
  "Pharaoh": "Egypt's ruler, hardened against freeing Israel.",
  "Goliath": "The Philistine giant felled by David's sling.",
  "Mary": "The mother of Jesus, likely a teenager at his birth.",
  "Joseph ": "The carpenter who raised Jesus as his own.",
  "Jesus": "'Jesus' means 'the Lord saves' — the heart of the story.",
  "John": "Cousin of Jesus who baptised Him — or the beloved apostle.",
  "Peter": "'Peter' means 'rock'; Jesus renamed him from Simon.",
  "Simon": "Simon was renamed Peter, 'the rock,' by Jesus.",
  "Andrew": "Peter's brother — the first disciple Jesus called.",
  "James": "One of Jesus' inner three, with Peter and John.",
  "Matthew": "A tax collector before Jesus called him to follow.",
  "Thomas": "'Doubting Thomas' after he doubted the resurrection.",
  "Philip": "One of the twelve, from Bethsaida in Galilee.",
  "Judas": "Betrayed Jesus for thirty pieces of silver.",
  "Paul": "Once persecuted the church; wrote much of the New Testament.",
  "Saul ": "Saul of Tarsus was renamed Paul after his conversion.",
  "Barnabas": "'Son of encouragement' — Paul's early missionary partner.",
  "Timothy": "The young pastor Paul mentored and wrote to.",
  "Silas": "Paul's companion, who sang in prison at Philippi.",
  "Stephen": "The first Christian martyr, stoned in Acts 7.",
  "Luke": "A physician who wrote a Gospel and the book of Acts.",
  "Mark": "Wrote the shortest, fastest-paced Gospel.",
  "Lazarus": "Raised by Jesus after four days in the tomb.",
  "Martha": "Lazarus' sister, remembered for her busy serving.",
  "Zacchaeus": "A short tax collector who climbed a tree to see Jesus.",
  "Nicodemus": "A Pharisee told he must be 'born again.'",
  "Pilate": "The Roman governor who condemned Jesus to the cross.",
  "Herod": "The dynasty of rulers over Judea in Jesus' day.",
  "Gabriel": "The angel who announced the births of John and Jesus.",
  "Michael": "The archangel described as a warrior for God's people.",
  "Melchizedek": "A mysterious priest-king who blessed Abraham.",
  "Rahab": "A Jericho woman of faith, named in Jesus' family line.",
  "Deborah": "A prophet and the only female judge of Israel.",
  "Gideon": "A judge who routed an army with just 300 men.",
  "Caleb": "One of two faithful spies who trusted God's promise.",
};

type Q = { ref?: string; c?: string; n?: string; verse?: string; q?: string };

function bookFromRef(ref?: string): string | null {
  if (!ref) return null;
  // ref looks like "1 Samuel 3:10" — strip the trailing chapter:verse
  const m = ref.match(/^(.*)\s+\d+:\d+$/);
  return m ? m[1] : null;
}

// Pull a candidate name from the note ("The name is \"Paul\".") if present.
function nameFromNote(n?: string): string | null {
  if (!n) return null;
  const m = n.match(/name is "([^"]+)"/i);
  return m ? m[1] : null;
}

/** Build a short pointer for a generated question. Always returns something. */
export function pointerForGenerated(q: Q): string | undefined {
  const name = nameFromNote(q.n);
  if (name && NAME_FACTS[name]) return NAME_FACTS[name];
  const book = bookFromRef(q.ref);
  if (book && BOOK_FACTS[book]) return BOOK_FACTS[book];
  if (book) return `From the book of ${book}.`;
  return undefined;
}
