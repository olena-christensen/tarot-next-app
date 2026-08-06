/**
 * Card meanings for the public /cards section.
 *
 * SOURCE: Papus (Gérard Encausse), "The Tarot of the Bohemians" (1889; English
 * translation by A. P. Morton, 1892). Public domain. Attributed visibly on the
 * pages that render this data.
 *
 * Papus treats the 22 Major Arcana individually — Hebrew letter, hieroglyph,
 * placement in his three septenaries, divinatory sense — so each major is
 * written from his own material. Note his numbering is NOT the Waite/Golden
 * Dawn one: Le Mat (The Fool) is the twenty-first arcanum, Shin, and Le Monde
 * the twenty-second, Tau.
 *
 * He does NOT give card-by-card prose for the 56 Minor Arcana. He derives them
 * systematically: each suit is one letter of the Tetragrammaton (יהוה) and one
 * of the four worlds; each number and each court rank repeats that same
 * four-term rhythm inside the suit. So every minor here carries its derivation
 * explicitly (`derivation`), composed from the tables below, and the pages say
 * so. Nothing Waite-shaped is attributed to Papus.
 *
 * Slugs are frozen literals, derived once from the English names. Never
 * generate a slug at request time — these are indexed URLs.
 */

/**
 * The source, rendered in full on every page in this section.
 *
 * Papus is out of copyright, so this is not a legal obligation — it is an
 * accuracy one. What these pages contain is HIS reading of the deck, numbering
 * and all, not a generic one, and a reader who wants to check a claim should be
 * able to go and check it against the book.
 */
export const PAPUS_SOURCE = {
  author: "Papus",
  authorFull: "Papus — Dr. Gérard Encausse (1865–1916)",
  title: "The Tarot of the Bohemians",
  translator: "A. P. Morton",
  originalTitle: "Le Tarot des Bohémiens",
  originalYear: "1889",
  translationYear: "1892",
  rights: "Public domain",
  /** Full bibliographic form. */
  citation:
    "Papus [Gérard Encausse]. The Tarot of the Bohemians. Translated from the French by A. P. Morton. London: George Redway, 1892. First published as Le Tarot des Bohémiens, Paris, 1889. Public domain.",
} as const;

export type SuitId = "wands" | "chalices" | "swords" | "pentacles";

export type Correspondence = {
  label: string;
  value: string;
};

export type CardMeaning = {
  /** Matches `tarots[].id` in src/data.ts. */
  id: string;
  /** Frozen, human-readable URL segment. */
  slug: string;
  /** English display name. */
  title: string;
  arcanum: "major" | "minor";
  suit?: SuitId;
  upright: string;
  reversed: string;
  correspondences: Correspondence[];
  /** How the card behaves in a spread, in Papus's positional method. */
  inSpread: string;
  /** Minors only: the explicit statement of how this card is derived. */
  derivation?: string;
};

/* ------------------------------------------------------------------ *
 * Papus's minor-arcana system
 * ------------------------------------------------------------------ */

/**
 * The four suits as the four letters of the Tetragrammaton and the four worlds.
 * The suit fixes WHICH world a card acts in.
 */
export const SUIT_WORLDS: Record<
  SuitId,
  { name: string; letter: string; world: string; principle: string; domain: string }
> = {
  wands: {
    name: "Wands",
    letter: "Yod (י)",
    world: "Atziluth, the archetypal world",
    principle: "the active, originating principle",
    domain: "enterprise, will, the impulse that starts a thing",
  },
  chalices: {
    name: "Chalices",
    letter: "He (ה)",
    world: "Briah, the creative world",
    principle: "the passive, receptive principle",
    domain: "feeling, reflection, what is received rather than made",
  },
  swords: {
    name: "Swords",
    letter: "Vau (ו)",
    world: "Yetzirah, the formative world",
    principle: "the equilibrating principle, the link between the two",
    domain: "conflict, relation, the friction where two forces meet",
  },
  pentacles: {
    name: "Pentacles",
    letter: "He final (ה)",
    world: "Assiah, the material world",
    principle: "the realizing principle, the term that makes fact",
    domain: "matter, money, the body, the finished result",
  },
};

/**
 * The decade. Papus runs the Tetragrammaton three times through the ten
 * numbers, each series handing its fourth term on as the first of the next:
 * 1·2·3·4 — 4·5·6·7 — 7·8·9·10. That is why 4 and 7 are pivots and why 10 both
 * completes the suit and seeds the one after it.
 */
export const NUMBER_TERMS: Record<number, { term: string; role: string }> = {
  1: { term: "Yod of the first series", role: "the pure active origin of the suit" },
  2: { term: "He of the first series", role: "the passive reflection of that origin" },
  3: { term: "Vau of the first series", role: "the equilibrium binding the two" },
  4: {
    term: "He final of the first series, and Yod of the second",
    role: "realization — and the pivot that begins the next movement",
  },
  5: { term: "He of the second series", role: "the passive reaction to what was realized" },
  6: { term: "Vau of the second series", role: "the equilibrium restored on new ground" },
  7: {
    term: "He final of the second series, and Yod of the third",
    role: "a second realization, which itself sets the last movement going",
  },
  8: { term: "He of the third series", role: "the passive answer to that realization" },
  9: { term: "Vau of the third series", role: "the final equilibrium before completion" },
  10: {
    term: "He final of the third series",
    role: "full realization — the suit spent, and the seed of the suit that follows",
  },
};

/** The court, the same four terms carried by persons rather than numbers. */
export const COURT_TERMS: Record<string, { name: string; term: string; role: string }> = {
  king: {
    name: "King",
    term: "Yod",
    role: "the suit's active principle embodied — it originates",
  },
  queen: {
    name: "Queen",
    term: "He",
    role: "the suit's passive principle embodied — it receives and reflects",
  },
  knight: {
    name: "Knight",
    term: "Vau",
    role: "the equilibrating term embodied — it carries, transmits, moves between",
  },
  page: {
    name: "Page",
    term: "He final",
    role: "the realizing term embodied — the suit brought down into fact",
  },
};

/** Builds the correspondence rows for a numbered minor. */
function pipCorrespondences(suit: SuitId, value: number): Correspondence[] {
  const s = SUIT_WORLDS[suit];
  const n = NUMBER_TERMS[value];
  return [
    { label: "Suit", value: `${s.name} — ${s.letter}, ${s.world}` },
    { label: "Suit principle", value: s.principle },
    { label: "Number", value: `${value} — ${n.term}` },
    { label: "Numeric role", value: n.role },
  ];
}

/** Builds the correspondence rows for a court card. */
function courtCorrespondences(
  suit: SuitId,
  rank: keyof typeof COURT_TERMS
): Correspondence[] {
  const s = SUIT_WORLDS[suit];
  const c = COURT_TERMS[rank];
  return [
    { label: "Suit", value: `${s.name} — ${s.letter}, ${s.world}` },
    { label: "Suit principle", value: s.principle },
    { label: "Rank", value: `${c.name} — ${c.term}` },
    { label: "Rank role", value: c.role },
  ];
}

const ORDINAL: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "5th",
  6: "6th",
  7: "7th",
  8: "8th",
  9: "9th",
  10: "10th",
};

/** The sentence that states, on the page, that this card is derived and not quoted. */
function pipDerivation(suit: SuitId, value: number): string {
  const s = SUIT_WORLDS[suit];
  const n = NUMBER_TERMS[value];
  return `Papus gives no separate description of this card. It is derived from his system: ${s.name} is ${s.letter}, ${s.principle}, acting in ${s.world}; the number ${value} is ${n.term}, ${n.role}. The meaning below is that combination read out — ${s.principle} taken at its ${ORDINAL[value]} term — not a quotation from him.`;
}

function courtDerivation(suit: SuitId, rank: keyof typeof COURT_TERMS): string {
  const s = SUIT_WORLDS[suit];
  const c = COURT_TERMS[rank];
  return `Papus gives no separate description of this card. It is derived from his system: ${s.name} is ${s.letter}, ${s.principle}, acting in ${s.world}; the ${c.name} is ${c.term}, ${c.role}. The meaning below is that combination read out, not a quotation from him.`;
}

/* ------------------------------------------------------------------ *
 * The cards — in the order they appear in src/data.ts
 * ------------------------------------------------------------------ */

export const CARD_MEANINGS: CardMeaning[] = [
  {
    id: "arcana-0",
    slug: "the-fool",
    title: "The Fool",
    arcanum: "major",
    upright:
      "Papus places Le Mat apart from every other card: it is the one arcanum that bears no number on its own face, and that absence is the teaching. It is spirit fallen wholly into the senses — the wanderer with his pack, carrying the consequences of his own acts and reading none of them. Upright it speaks of a life run on impulse and appetite: not stupidity, but the will unattached, moving without a term to move toward. Papus's own divinatory word for it is folly, and behind that, expiation.",
    reversed:
      "Reversed, Papus's privative pole: folly that has stopped being innocent. The wandering is now chosen, the pack deliberately empty, the lesson refused rather than merely missed. Where the upright card is a man who has not yet learned, the inverted one is a man who has declined to — abdication of will dressed as freedom. It can also mark the point where the consequences the wanderer has been outrunning finally arrive.",
    correspondences: [
      {
        label: "Papus's number",
        value: "21 — Papus numbers Le Mat twenty-first, before Le Monde, not zeroth",
      },
      { label: "Hebrew letter", value: "Shin (ש)" },
      {
        label: "Hieroglyph",
        value: "A tooth; by extension the arrow — that which pierces and scatters",
      },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — the seventh and transitional term, where the material series exhausts itself",
      },
      { label: "Divinatory sense", value: "Folly; the sensitive life; expiation" },
    ],
    inSpread:
      "Papus reads a card by the place it falls in — commencement, opposition, equilibrium, result — not in isolation. The Fool at the commencement says the matter began without a plan and will not be steered by one. In opposition it is the drift that keeps the thing from settling. As the result it is the bluntest card in the deck: the question is being asked of a situation that has no term, and will keep costing until one is accepted.",
  },
  {
    id: "arcana-1",
    slug: "the-magician",
    title: "The Magician",
    arcanum: "major",
    upright:
      "Papus's first card is not a stage conjuror but the unity from which the whole deck counts — Aleph, whose hieroglyph is man himself. It is will before it has chosen an object: the active principle, the point at which something becomes possible because someone has decided it should be. The four emblems on his table are the four suits, which in Papus's reading means all four worlds are available to him and none has yet been committed to. Divinatory sense: will.",
    reversed:
      "Will without an object, or will spent on effect rather than result — the man who has all four instruments and uses them to impress. Reversed it also marks the decision endlessly deferred: potential carefully preserved as potential, because to commit it to one world would end its being possible in the other three.",
    correspondences: [
      { label: "Papus's number", value: "1" },
      { label: "Hebrew letter", value: "Aleph (א)" },
      { label: "Hieroglyph", value: "Man — the being who wills" },
      {
        label: "Septenary",
        value: "First septenary (1–7), the Divine world — first term, the absolute active (Yod)",
      },
      { label: "Divinatory sense", value: "Will" },
    ],
    inSpread:
      "At the commencement, the matter exists because someone willed it into being — find that person, because the reading belongs to them. In opposition, a competing will, not a competing circumstance. At equilibrium the situation holds only for as long as the will is actively applied to it. As the result, Papus is unsentimental: the outcome sits in the querent's own hands and nowhere else.",
  },
  {
    id: "arcana-2",
    slug: "the-high-priestess",
    title: "The High Priestess",
    arcanum: "major",
    upright:
      "The passive pole answering the Magician's will. Beth is the mouth of man — and by extension the house, that which receives and contains. Papus reads La Papesse as knowledge held rather than exercised: the book on her knee is closed or half-veiled, and that is not concealment for its own sake but the condition of the passive term. She is what is known before it is spoken, the reflective principle that makes the active one intelligible. Divinatory sense: science, knowledge.",
    reversed:
      "Knowledge withheld past the point where withholding serves anything, or receptivity slackened into mere passivity — waiting mistaken for wisdom. Reversed it can equally mark learning that never went past the surface: the book carried everywhere and never opened, authority borrowed from a subject not actually studied.",
    correspondences: [
      { label: "Papus's number", value: "2" },
      { label: "Hebrew letter", value: "Beth (ב)" },
      { label: "Hieroglyph", value: "The mouth of man; the house, that which contains" },
      {
        label: "Septenary",
        value: "First septenary (1–7), the Divine world — second term, the absolute passive (He)",
      },
      { label: "Divinatory sense", value: "Science; knowledge; the hidden thing that is nonetheless present" },
    ],
    inSpread:
      "At the commencement the matter starts in something known but unspoken, usually by one party only. In opposition she is information the querent does not have and cannot get by pressing for it. At equilibrium the whole situation is being held in place by a silence. As the result, the answer Papus gives is knowledge rather than action: the thing to be gained here is understanding, and acting before it arrives will spoil it.",
  },
  {
    id: "arcana-3",
    slug: "the-empress",
    title: "The Empress",
    arcanum: "major",
    upright:
      "Papus's third term is always the one that binds the first two, and Gimel's hieroglyph says how it binds: the hand of man in the act of grasping. The Empress is will and knowledge made productive — not fertility as sentiment but generation as mechanism, the point at which an idea acquires a body and starts to have consequences of its own. Divinatory sense: action. She is the first card in the series where something outside the mind changes.",
    reversed:
      "Generation without form: activity that produces and produces and never resolves into a result. Or the grasping hand closed too hard — possession where there ought to have been production, a thing held so tightly it cannot grow. Reversed can also mark an idea that was never allowed a body at all.",
    correspondences: [
      { label: "Papus's number", value: "3" },
      { label: "Hebrew letter", value: "Gimel (ג)" },
      { label: "Hieroglyph", value: "The hand of man in the act of grasping" },
      {
        label: "Septenary",
        value:
          "First septenary (1–7), the Divine world — third term, the neutral principle that binds the active to the passive (Vau)",
      },
      { label: "Divinatory sense", value: "Action" },
    ],
    inSpread:
      "At the commencement, the matter begins with something actually done rather than intended. In opposition, an activity that keeps outrunning its own purpose. At equilibrium she is the productive middle holding two parties together by giving them something to make. As the result: the question resolves in action, and Papus's third term always resolves it outwardly — expect a change in the world, not in the mind.",
  },
  {
    id: "arcana-4",
    slug: "the-emperor",
    title: "The Emperor",
    arcanum: "major",
    upright:
      "The fourth term realizes what the first three set going, and Daleth's hieroglyph is the breast — that which contains and protects. Papus's Emperor is the active principle brought down into fixed form: authority, the frame, the rule that holds a thing in place. Where the Magician is will, the Emperor is will that has hardened into a structure and no longer depends on anyone continuing to will it. Divinatory sense: realization.",
    reversed:
      "Structure outliving the purpose that justified it — the frame maintained for its own sake, rigidity mistaken for order. Reversed also covers authority claimed without the work that would have earned it: the throne occupied by someone who did not build it and cannot maintain it.",
    correspondences: [
      { label: "Papus's number", value: "4" },
      { label: "Hebrew letter", value: "Daleth (ד)" },
      { label: "Hieroglyph", value: "The breast — that which contains and protects" },
      {
        label: "Septenary",
        value:
          "First septenary (1–7), the Divine world — fourth term, realization, reflecting the Magician at the lower level of the series",
      },
      { label: "Divinatory sense", value: "Realization" },
    ],
    inSpread:
      "At the commencement, the matter begins inside an existing structure — a contract, an institution, a rule already in force. In opposition, authority that will not be argued with. At equilibrium the Emperor is what is keeping the situation stable, and removing him is more expensive than it looks. As the result: the thing becomes fixed, and Papus's fourth term is also a pivot — what is fixed here starts the next sequence.",
  },
  {
    id: "arcana-5",
    slug: "the-hierophant",
    title: "The Hierophant",
    arcanum: "major",
    upright:
      "The fifth term reflects the second: knowledge, now transmitted. He is the letter of breath — of what passes out of one being and into another. Papus's Pope is the channel: doctrine, tradition, the means by which what is known reaches someone who does not yet know it. He is not the source and does not claim to be; his authority is entirely in the fidelity of the transmission. Divinatory sense: inspiration.",
    reversed:
      "Transmission with the content gone — form scrupulously kept, meaning long since lost. Or teaching that binds rather than frees, the channel taking itself for the source. Reversed can equally mark the opposite error: everything received refused on principle, so nothing is inherited and every lesson has to be paid for twice.",
    correspondences: [
      { label: "Papus's number", value: "5" },
      { label: "Hebrew letter", value: "He (ה)" },
      { label: "Hieroglyph", value: "Breath — the respiration of man" },
      {
        label: "Septenary",
        value:
          "First septenary (1–7), the Divine world — fifth term, reflecting the High Priestess: knowledge turned outward",
      },
      { label: "Divinatory sense", value: "Inspiration" },
    ],
    inSpread:
      "At the commencement the matter begins with something taught, advised or inherited. In opposition, orthodoxy — the received way of doing it, which is in the way. At equilibrium he is the mediator, and the situation holds because someone is translating between two parties. As the result: the answer comes from outside the querent, through a channel rather than a revelation.",
  },
  {
    id: "arcana-6",
    slug: "the-lovers",
    title: "The Lovers",
    arcanum: "major",
    upright:
      "Vau's hieroglyph is the eye and the ear — the organs that link what is inside a person to what is outside. Papus reads the sixth arcanum as the trial of choice: the man stands between two ways with the arrow already drawn above him. It is not romance, and reading it as romance loses the card. It is the moment where the binding term has to be exercised by an individual, and where the choice, once made, cannot be un-made.",
    reversed:
      "The choice avoided — both ways kept open until circumstance closes one, which is a choice made by default and usually the worse one. Or the choice made by appetite rather than by the eye and the ear: taken on the strength of wanting, without either looking or listening first.",
    correspondences: [
      { label: "Papus's number", value: "6" },
      { label: "Hebrew letter", value: "Vau (ו)" },
      { label: "Hieroglyph", value: "The eye and the ear — what links the inner to the outer" },
      {
        label: "Septenary",
        value:
          "First septenary (1–7), the Divine world — sixth term, reflecting the Empress: action narrowed to a single decision",
      },
      { label: "Divinatory sense", value: "Ordeal; trial; the choice that binds" },
    ],
    inSpread:
      "At the commencement the whole matter rests on a decision already taken, and the reading is about living inside it. In opposition, a second option that will not stop being attractive. At equilibrium the situation is genuinely poised and the querent is the one holding it there. As the result: a choice is required, it is theirs, and Papus's trial is not softened by good intentions.",
  },
  {
    id: "arcana-7",
    slug: "the-chariot",
    title: "The Chariot",
    arcanum: "major",
    upright:
      "The seventh term is always the transition, and Zain is the arrow — that which crosses from one place to another. Papus's Chariot is the first septenary completed and carried over: will, knowledge and action have produced a result that now moves under its own power. Victory, but victory as a passage rather than an arrival. The two sphinxes pull in different directions and are held to one road by the driver alone.",
    reversed:
      "Motion with no one driving — momentum carrying a thing well past the point at which it should have stopped. Reversed can also mark the victory that turns out to have been the easy half: the crossing made, and nothing prepared for the far side.",
    correspondences: [
      { label: "Papus's number", value: "7" },
      { label: "Hebrew letter", value: "Zain (ז)" },
      { label: "Hieroglyph", value: "An arrow; a weapon — that which crosses" },
      {
        label: "Septenary",
        value:
          "First septenary (1–7), the Divine world — seventh and transitional term, carrying the Divine series over into the world of Man",
      },
      { label: "Divinatory sense", value: "Victory" },
    ],
    inSpread:
      "At the commencement the matter starts already in motion, carried over from something the querent finished earlier. In opposition, a force with its own momentum that argument will not slow. At equilibrium the Chariot is unstable by nature — it holds only while it moves. As the result Papus means victory literally, but read the position after it: a transition always hands on to something.",
  },
  {
    id: "arcana-8",
    slug: "justice",
    title: "Justice",
    arcanum: "major",
    upright:
      "The second septenary opens the world of Man, and it opens with the balance. Cheth's hieroglyph is a field — an enclosure, ground measured and bounded. Papus's Justice is the active principle at the human level, and what it does actively is measure: not mercy, proportion. The sword belongs to the card as much as the scales do, because in his reading a judgement that cannot be enforced has not been made. Divinatory sense: justice, equilibrium.",
    reversed:
      "Measurement misapplied — the letter kept and the proportion lost, which is how a correct procedure produces a wrong result. Or the scales held by someone with an interest in where they settle. Reversed also covers judgement passed without the sword: perfectly sound, entirely unenforced, and therefore not yet real.",
    correspondences: [
      { label: "Papus's number", value: "8" },
      { label: "Hebrew letter", value: "Cheth (ח)" },
      { label: "Hieroglyph", value: "A field — enclosed and measured ground" },
      {
        label: "Septenary",
        value: "Second septenary (8–14), the world of Man — first term, the active principle (Yod)",
      },
      { label: "Divinatory sense", value: "Justice; equilibrium" },
    ],
    inSpread:
      "At the commencement, the matter begins in an account being settled. In opposition, a standard the querent is being measured against and may not have agreed to. At equilibrium Justice is exactly what the position says — the situation is balanced, and will stay balanced only while both pans are watched. As the result: proportion is restored, to whoever it favours.",
  },
  {
    id: "arcana-9",
    slug: "the-hermit",
    title: "The Hermit",
    arcanum: "major",
    upright:
      "The passive pole of the human world. Teth is a roof — shelter, that which encloses in order to preserve. Papus's Hermit carries his own light and his own protection: withdrawal that is deliberate and temporary, undertaken so that something can be seen which crowds make invisible. Prudence in his sense is not timidity but the deliberate slowing of a thing until its shape can be made out. Divinatory sense: prudence, wisdom.",
    reversed:
      "Shelter become hiding — a withdrawal that has outlived its reason and is now the situation rather than a method for examining it. Reversed also covers prudence used as a name for a decision the querent does not want to make: the lamp carried everywhere and never actually lifted.",
    correspondences: [
      { label: "Papus's number", value: "9" },
      { label: "Hebrew letter", value: "Teth (ט)" },
      { label: "Hieroglyph", value: "A roof; a shelter — that which encloses to preserve" },
      {
        label: "Septenary",
        value: "Second septenary (8–14), the world of Man — second term, the passive principle (He)",
      },
      { label: "Divinatory sense", value: "Prudence; wisdom" },
    ],
    inSpread:
      "At the commencement, the matter begins in a deliberate step back — and Papus would read the step back as the cause, not the delay. In opposition, someone's absence is doing more than their presence would. At equilibrium the situation is stable because it is being left alone. As the result: the answer is to go slower, and the card is unusually literal about it.",
  },
  {
    id: "arcana-10",
    slug: "wheel-of-fortune",
    title: "Wheel of Fortune",
    arcanum: "major",
    upright:
      "The binding term of the human septenary, and Papus gives it Yod — the pointing finger, the letter that opens the Tetragrammaton and starts every cycle in his system. The Wheel is circumstance: the movement no single person originates and everyone is carried by. Fortune here is neither reward nor punishment; it is the mechanism that gives will and prudence something to act on. Without it the human septenary would have no material to work.",
    reversed:
      "The wheel felt as a trap rather than a motion — circumstance taken personally, which in Papus's scheme is a category error. Reversed can also mark the turn already past: the opportunity read correctly but too late, so the reading is now about the descent rather than the rise.",
    correspondences: [
      { label: "Papus's number", value: "10" },
      { label: "Hebrew letter", value: "Yod (י)" },
      { label: "Hieroglyph", value: "The index finger extended — the letter that begins the Tetragrammaton" },
      {
        label: "Septenary",
        value:
          "Second septenary (8–14), the world of Man — third term, the neutral principle binding judgement to prudence (Vau)",
      },
      { label: "Divinatory sense", value: "Fortune" },
    ],
    inSpread:
      "At the commencement, the matter began by circumstance and not by anyone's choice — which changes who is responsible for it. In opposition, timing itself is the obstacle. At equilibrium the situation is turning whether or not it is watched. As the result Papus is neutral in a way most decks are not: fortune moves, and the reading does not say in whose favour.",
  },
  {
    id: "arcana-11",
    slug: "strength",
    title: "Strength",
    arcanum: "major",
    upright:
      "The eleventh reflects the eighth: what Justice measures, Strength applies. Kaph is the hand half closed in the act of grasping — a grip that has taken hold and has not clenched. Papus's Force is deliberately not violence; the woman opens the lion's jaws with her hands and no weapon, which is power exercised through mastery rather than against resistance. Force proportioned to its object, which is the only kind that lasts. Divinatory sense: force.",
    reversed:
      "The hand closed the rest of the way — force become compulsion, mastery abandoned in favour of pressure because pressure is quicker. Reversed also covers strength held back until the moment for it passed: the grip never taken, and the lion now loose.",
    correspondences: [
      { label: "Papus's number", value: "11" },
      { label: "Hebrew letter", value: "Kaph (כ)" },
      { label: "Hieroglyph", value: "The hand half closed, in the act of grasping" },
      {
        label: "Septenary",
        value:
          "Second septenary (8–14), the world of Man — fourth term, reflecting Justice: measure carried into application",
      },
      { label: "Divinatory sense", value: "Force" },
    ],
    inSpread:
      "At the commencement, the matter starts with someone applying pressure well. In opposition, a force that cannot be met head-on and must be handled the way the card handles the lion. At equilibrium Strength is the effort holding everything steady, and it is costing whoever is making it. As the result: mastery, and mastery specifically over something that was not going to yield to argument.",
  },
  {
    id: "arcana-12",
    slug: "the-hanged-man",
    title: "The Hanged Man",
    arcanum: "major",
    upright:
      "The reflection of the Hermit's withdrawal, now involuntary and total. Lamed is the arm extended — reach, and what reaching costs. Papus reads Le Pendu as the term of sacrifice: a suspension undertaken or accepted, in which the ordinary relation between a person and the world is deliberately inverted. Nothing moves, and that is not the failure of the card but its content. Divinatory sense: sacrifice.",
    reversed:
      "Suspension with no object — waiting rebranded as sacrifice so that it need not be justified. Or the price paid loudly and repeatedly for something the querent never actually intended to give up. Reversed can also mean the rope cut early, and the whole cost incurred for nothing.",
    correspondences: [
      { label: "Papus's number", value: "12" },
      { label: "Hebrew letter", value: "Lamed (ל)" },
      { label: "Hieroglyph", value: "The arm — the arm extended" },
      {
        label: "Septenary",
        value:
          "Second septenary (8–14), the world of Man — fifth term, reflecting the Hermit: withdrawal that is no longer chosen",
      },
      { label: "Divinatory sense", value: "Sacrifice" },
    ],
    inSpread:
      "At the commencement the matter begins with something given up. In opposition, a cost the querent has been refusing to pay, and which the situation will keep presenting. At equilibrium nothing will move until the sacrifice is made — reading this position as stability is the common mistake. As the result: the outcome is bought, and Papus does not pretend the price is symbolic.",
  },
  {
    id: "arcana-13",
    slug: "death",
    title: "Death",
    arcanum: "major",
    upright:
      "The reflection of the Wheel: circumstance again, but no longer reversible. Mem's hieroglyph is a woman, and in the tradition Papus draws on that is the letter of generation and of the maternal — so the thirteenth arcanum is transformation rather than annihilation. It is the card that closes a state so another can open, and he is blunt that the closing is not up for negotiation. Divinatory sense: death; transformation.",
    reversed:
      "The transformation resisted — a state kept alive past its term at a cost that rises every month it is maintained. Or the change proceeding on schedule while the querent insists nothing has happened, which does not slow it and does remove any say in its shape.",
    correspondences: [
      { label: "Papus's number", value: "13" },
      { label: "Hebrew letter", value: "Mem (מ)" },
      { label: "Hieroglyph", value: "A woman — the letter of generation" },
      {
        label: "Septenary",
        value:
          "Second septenary (8–14), the world of Man — sixth term, reflecting the Wheel: circumstance become irreversible",
      },
      { label: "Divinatory sense", value: "Death; transformation" },
    ],
    inSpread:
      "At the commencement, the matter begins because something else ended. In opposition, an ending the querent is arguing with. At equilibrium the situation is already dead and is being held upright by habit. As the result Papus means a state closed and another opened — the reading says which state ends, never what replaces it, and it is a mistake to infer that from this card alone.",
  },
  {
    id: "arcana-14",
    slug: "temperance",
    title: "Temperance",
    arcanum: "major",
    upright:
      "The transition out of the human septenary, and Nun's hieroglyph is fruit — that which is produced and carried forward. Papus's Temperance is combination: two vessels and the exchange between them, which is the entire operation of the card. Not moderation as restraint, but the correct proportioning of two things so that a third becomes possible. It is the last human term, and what it hands over is a mixture rather than a result.",
    reversed:
      "The proportion wrong — too much of one vessel, or the two kept apart so that nothing is produced at all. Reversed also covers the endless adjusting that never allows a thing to be finished: the pouring back and forth become the activity, with no third thing ever intended.",
    correspondences: [
      { label: "Papus's number", value: "14" },
      { label: "Hebrew letter", value: "Nun (נ)" },
      { label: "Hieroglyph", value: "A fruit — that which is produced and carried" },
      {
        label: "Septenary",
        value:
          "Second septenary (8–14), the world of Man — seventh and transitional term, carrying the human series over into the world of Nature",
      },
      { label: "Divinatory sense", value: "Temperance; combination" },
    ],
    inSpread:
      "At the commencement, the matter begins as a mixture of two things that were previously separate. In opposition, something that will not combine, and forcing it will spoil both. At equilibrium Temperance is the position it suits best: the situation works because two forces are being held in the right ratio. As the result: a synthesis, which is a transition and will hand on again.",
  },
  {
    id: "arcana-15",
    slug: "the-devil",
    title: "The Devil",
    arcanum: "major",
    upright:
      "The third septenary opens the material world, and Papus opens it with fatality. Samech is an arrow — that which is loosed and cannot be recalled. The figures at the foot of the card are chained, but the chains are loose, and that is his whole point: material necessity binds by consent at least as often as by force. Fate here means the mechanical consequence of what has already been chosen. Divinatory sense: fate, fatality.",
    reversed:
      "The chain noticed — the loose collar seen for what it is, which is the first condition of taking it off. Reversed can equally be worse than upright: consent so complete that the bond has stopped being felt as a bond and is now described as freedom.",
    correspondences: [
      { label: "Papus's number", value: "15" },
      { label: "Hebrew letter", value: "Samech (ס)" },
      { label: "Hieroglyph", value: "An arrow — that which is loosed and cannot be recalled" },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — first term, the active principle of the material world (Yod)",
      },
      { label: "Divinatory sense", value: "Fate; fatality" },
    ],
    inSpread:
      "At the commencement, the matter begins in a consequence of something the querent agreed to earlier. In opposition, a dependency — and Papus would look for what it provides, because nothing stays chained for nothing. At equilibrium the arrangement is stable and that stability is the problem. As the result: necessity, which means the outcome is already determined by decisions taken before the question was asked.",
  },
  {
    id: "arcana-16",
    slug: "the-tower",
    title: "The Tower",
    arcanum: "major",
    upright:
      "Ayin is material sense — the bond to what can be touched, weighed and owned. The sixteenth arcanum is the passive term of the material septenary: what matter does when it has been built past what it can carry. Papus's Maison-Dieu is not misfortune arriving from outside. It is a structure meeting its own limit, and the lightning is only the moment, not the cause. Divinatory sense: ruin, destruction.",
    reversed:
      "The collapse deferred — the crack known about, the repair costed and not made, the tower standing on borrowed time. Or a ruin already complete, in which case the reading is not about whether it falls but about what is done in the rubble, which is a different and more useful question.",
    correspondences: [
      { label: "Papus's number", value: "16" },
      { label: "Hebrew letter", value: "Ayin (ע)" },
      { label: "Hieroglyph", value: "The material bond; material sense" },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — second term, the passive principle of the material world (He)",
      },
      { label: "Divinatory sense", value: "Ruin; destruction" },
    ],
    inSpread:
      "At the commencement, the matter begins in the wreck of something that had been standing a long time. In opposition, a structure that is going to fail regardless of the querent's plans for it. At equilibrium the Tower is a warning rather than a state — nothing is balanced here, it is merely not fallen yet. As the result: the structure goes, and Papus's sense is that it goes because of how it was built.",
  },
  {
    id: "arcana-17",
    slug: "the-star",
    title: "The Star",
    arcanum: "major",
    upright:
      "The binding term of the material septenary. Pe is the mouth and the tongue — expression, that which is poured out. The Star follows the Tower in Papus's order and the sequence carries the meaning: after a structure has failed, what remains is the capacity to pour again. Hope in his reading is a mechanism rather than a mood — the resumption of flow, demonstrated by a figure emptying two vessels onto ground that has just been cleared.",
    reversed:
      "Pouring into ground that will not hold it — effort resumed too soon, before there is anything for it to fill. Or hope kept deliberately as a substitute for a plan, which in the material septenary is the most expensive possible error.",
    correspondences: [
      { label: "Papus's number", value: "17" },
      { label: "Hebrew letter", value: "Pe (פ)" },
      { label: "Hieroglyph", value: "The mouth; the tongue — that which pours out" },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — third term, the neutral principle binding necessity to ruin (Vau)",
      },
      { label: "Divinatory sense", value: "Hope" },
    ],
    inSpread:
      "At the commencement, the matter begins immediately after a loss — read the whole reading as recovery. In opposition, an optimism that is not doing any work. At equilibrium the Star holds the situation open, which is its proper use. As the result Papus is measured: what is promised is the capacity to begin again, not the thing that will be built.",
  },
  {
    id: "arcana-18",
    slug: "the-moon",
    title: "The Moon",
    arcanum: "major",
    upright:
      "The reflection of the Devil at the lower level of the material septenary. Tzaddi's hieroglyph is a shelter and, by extension, a term or an end. The Moon is the material world seen by insufficient light: the road between the towers is real, the dog and the wolf are real, and by this light none of it can be told apart. Papus's sense is deception — which includes self-deception, the half that is much harder to catch. Divinatory sense: hidden enemies, deception.",
    reversed:
      "The light returning, or the deception finally named — reversed is often the better of the two here. But it can also be worse: the querent perfectly certain they can see, under precisely the conditions in which certainty is the symptom rather than the cure.",
    correspondences: [
      { label: "Papus's number", value: "18" },
      { label: "Hebrew letter", value: "Tzaddi (צ)" },
      { label: "Hieroglyph", value: "A roof, a shelter; by extension the term, the end" },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — fourth term, reflecting the Devil: necessity no longer clearly seen",
      },
      { label: "Divinatory sense", value: "Deception; hidden enemies" },
    ],
    inSpread:
      "At the commencement, the matter begins from a false account — often given in good faith. In opposition, something concealed, and Papus's method says look for it rather than intuit it. At equilibrium the situation only holds while nobody looks closely. As the result: the answer is that the question cannot yet be answered honestly, which is itself a usable result.",
  },
  {
    id: "arcana-19",
    slug: "the-sun",
    title: "The Sun",
    arcanum: "major",
    upright:
      "The reflection of the Tower, and the reversal is deliberate: where sixteen is a structure destroyed, nineteen is one that holds. Qoph is an axe — an instrument, something made and used rather than merely undergone. Papus's sense is earthly happiness, and the qualifier is doing real work: this is the material world functioning, plainly, without mystery. The two children stand in the open with nothing hidden about them.",
    reversed:
      "The light without the warmth — success that is entirely visible and not at all felt. Reversed can also mark plain good fortune distrusted on principle, examined for the catch until the season for enjoying it has passed.",
    correspondences: [
      { label: "Papus's number", value: "19" },
      { label: "Hebrew letter", value: "Qoph (ק)" },
      { label: "Hieroglyph", value: "An axe — an instrument made and wielded" },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — fifth term, reflecting the Tower: the material structure that stands",
      },
      { label: "Divinatory sense", value: "Earthly happiness" },
    ],
    inSpread:
      "At the commencement, the matter begins in plain and favourable conditions, which is rarer in this deck than it sounds. In opposition, an ease that is making the querent careless. At equilibrium the Sun is straightforwardly good — the situation works and is visible to everyone in it. As the result: material good fortune, of the ordinary daylight kind Papus is careful not to inflate.",
  },
  {
    id: "arcana-20",
    slug: "judgement",
    title: "Judgement",
    arcanum: "major",
    upright:
      "The reflection of the Star: where seventeen pours out, twenty calls back. Resh is the head of a man — the seat of what recognises and answers. Papus's twentieth arcanum is renewal, and specifically renewal by summons: something considered finished is required to account for itself. The figures rise because they are called. They did not choose the hour, and the card gets its force from exactly that.",
    reversed:
      "The summons ignored, or answered for the wrong reason — appearance without accounting. Reversed can also mark a renewal that is only repetition: the same life resumed under a new name, which passes for change until the first test of it.",
    correspondences: [
      { label: "Papus's number", value: "20" },
      { label: "Hebrew letter", value: "Resh (ר)" },
      { label: "Hieroglyph", value: "The head of a man — that which recognises" },
      {
        label: "Septenary",
        value:
          "Third septenary (15–21), the world of Nature — sixth term, reflecting the Star: what was poured out is called back",
      },
      { label: "Divinatory sense", value: "Renewal; change" },
    ],
    inSpread:
      "At the commencement, the matter begins because something old was reopened. In opposition, a reckoning arriving on someone else's schedule. At equilibrium the situation is being held pending an answer that has not been given. As the result: renewal, and Papus's kind is not chosen — it is required, and the only question is how it is met.",
  },
  {
    id: "arcana-21",
    slug: "the-world",
    title: "The World",
    arcanum: "major",
    upright:
      "The twenty-second and final arcanum, Tau — the letter that ends the alphabet and, in Papus's reading, closes the circle back onto Aleph. The figure stands within a wreath with the four living creatures at the corners: the four worlds, the four suits, all four present at once and reconciled. Completion, and a reward that consists in the thing being finished rather than in anything added to it. Divinatory sense: reward, completion.",
    reversed:
      "Completion claimed early — the wreath drawn around something still visibly unfinished, so that it can be set down. Or a thing genuinely complete that the querent will not close, which in Papus's scheme holds the entire series open and prevents the next Aleph from starting.",
    correspondences: [
      { label: "Papus's number", value: "22" },
      { label: "Hebrew letter", value: "Tau (ת)" },
      { label: "Hieroglyph", value: "The breast, the thorax; a sign, a mark" },
      {
        label: "Septenary",
        value:
          "Outside the three septenaries — the twenty-second term, which closes the whole series and returns it to Aleph",
      },
      { label: "Divinatory sense", value: "Reward; completion" },
    ],
    inSpread:
      "At the commencement, the matter begins from something genuinely finished, which is the strongest possible footing. In opposition, a completion elsewhere that leaves no room for the querent's part. At equilibrium everything is in place and the reading is about not disturbing it. As the result: the thing closes, and in Papus's system a close is also a return — expect the next question to begin where this one ends.",
  },
  {
    id: "chalices-1",
    slug: "ace-of-cups",
    title: "Ace of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 1),
    upright:
      "The active origin of a passive suit, which is Papus's most interesting combination: something begins, and what begins is a capacity to receive. The Ace is the cup before anything has been poured into it — feeling at the moment it becomes possible, not yet attached to an object or a person. Openness with real force behind it. In Briah this is the first stirring of a sympathy that will shape everything the suit does afterwards.",
    reversed:
      "The opening closed before anything could enter — receptivity refused, usually because the last thing received went badly. Or feeling that begins and is spent in the same motion, the cup filled and emptied at once so that nothing accumulates.",
    correspondences: pipCorrespondences("chalices", 1),
    inSpread:
      "At the commencement, the matter begins in an openness rather than an act. In opposition, a susceptibility working against the querent's own intentions. At equilibrium the situation rests entirely on someone's willingness to receive. As the result: a capacity gained, not a thing gained — which Papus would say is the more durable of the two.",
  },
  {
    id: "chalices-2",
    slug: "two-of-cups",
    title: "Two of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 2),
    upright:
      "The passive principle doubled: reception meeting reception. Papus's second term reflects the first, and in the receptive world that reflection is mutuality — two capacities open to each other at the same moment. This is the structural card of union, and it is exact about the terms: neither party originates, both receive. That is what makes it stable, and also what makes it fragile, since nothing in it is generating anything new.",
    reversed:
      "Reflection that only travels one way — one cup held out and never answered. Or mutuality kept up as a form after the substance has gone, two people faithfully receiving each other's habits.",
    correspondences: pipCorrespondences("chalices", 2),
    inSpread:
      "At the commencement, the matter begins in an agreement between two parties. In opposition, a bond that will not let the querent act alone. At equilibrium the pair is what holds everything else up. As the result: union — on terms neither side sets, because a second term never sets terms.",
  },
  {
    id: "chalices-3",
    slug: "three-of-cups",
    title: "Three of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 3),
    upright:
      "The binding term inside the receptive world: what holds several feelings in balance is company. Three is the first number in Papus's decade where something exists that is not reducible to the two before it, and in Chalices that emergent thing is shared feeling — the group, the celebration, the sympathy that lives between people rather than in any one of them.",
    reversed:
      "The company become the point — a gathering that continues long after the reason for it has gone. Or the third party who unbalances rather than binds, turning something mutual into a performance with an audience.",
    correspondences: pipCorrespondences("chalices", 3),
    inSpread:
      "At the commencement, the matter begins among several people rather than two. In opposition, a group whose sympathy is not with the querent. At equilibrium the situation holds because it is shared. As the result: something held in common — which also means it cannot be taken privately.",
  },
  {
    id: "chalices-4",
    slug: "four-of-cups",
    title: "Four of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 4),
    upright:
      "The pivot. Feeling has been realized, and in Papus's logic a realized feeling becomes a state rather than a movement — satiety, the condition of having enough and therefore of no longer reaching for anything. This is why the offered cup goes unnoticed: not sulking, saturated. It is a genuine realization, and being a pivot it is also the point from which the next sequence starts.",
    reversed:
      "The saturation broken — the offered cup finally seen, which is exactly how the second series gets going. Or the opposite: dissatisfaction cultivated on purpose, because wanting is an easier condition to inhabit than having.",
    correspondences: pipCorrespondences("chalices", 4),
    inSpread:
      "At the commencement, the matter begins from a settled emotional state nobody is questioning. In opposition, the querent's own sufficiency, quietly refusing something. At equilibrium the situation is stable and inert. As the result: a state reached — and Papus's fourth term always hands on, so read what follows it.",
  },
  {
    id: "chalices-5",
    slug: "five-of-cups",
    title: "Five of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 5),
    upright:
      "The passive reaction to four's satiety, and Papus's ordering says the loss was implicit in the fixing. Three cups spilled, two standing: the proportion is the whole card. This is grief that is accurate rather than total — it does not claim everything is gone, and it is precise that the figure is not looking at what remains. Feeling reacting to a state it did not choose to have fixed.",
    reversed:
      "The two standing cups noticed — the same loss, correctly proportioned at last. Or grief kept deliberately, because turning round would mean deciding what to do with what is left.",
    correspondences: pipCorrespondences("chalices", 5),
    inSpread:
      "At the commencement, the matter begins in a loss the querent has not finished counting. In opposition, mourning that is preventing an accurate view of the situation. At equilibrium the whole thing is being held in place by an absence. As the result: loss — partial, specific, and with something still standing.",
  },
  {
    id: "chalices-6",
    slug: "six-of-cups",
    title: "Six of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 6),
    upright:
      "Equilibrium recovered after five, and in the receptive world what restores balance is the past — memory, the return of something formerly given. Papus's sixth term always repairs the disturbance of the fifth, and here it repairs by continuity: what was is still available. Sympathy with history behind it, which does not have to be established from nothing and is therefore cheap to resume.",
    reversed:
      "The past used as a shelter rather than a resource — return that is really a refusal to go on. Or the memory of a relation preferred to the relation itself, which is the quiet version of the same error.",
    correspondences: pipCorrespondences("chalices", 6),
    inSpread:
      "At the commencement, the matter begins in something resumed. In opposition, a history the querent cannot get out from under. At equilibrium the past is what is keeping this steady. As the result: restoration — the same ground, recovered rather than replaced.",
  },
  {
    id: "chalices-7",
    slug: "seven-of-cups",
    title: "Seven of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 7),
    upright:
      "The second pivot, and in the receptive world a realization takes the form of possibilities becoming visible all at once. Seven cups, seven contents, none of them chosen. Papus's seventh term realizes and destabilises in the same motion: this is imagination made concrete enough to choose among, which is a real achievement, and is not the same thing as choosing.",
    reversed:
      "The choice made, cutting six possibilities dead — which reversed renders as relief or as loss depending entirely on the cards around it. Or the display kept up indefinitely, because as long as nothing is chosen nothing can be wrong.",
    correspondences: pipCorrespondences("chalices", 7),
    inSpread:
      "At the commencement, the matter begins with several live options. In opposition, an abundance of choice functioning as paralysis. At equilibrium the situation holds because nothing has been committed to. As the result: options — and a seventh term hands on, so this is not where the reading stops.",
  },
  {
    id: "chalices-8",
    slug: "eight-of-cups",
    title: "Eight of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 8),
    upright:
      "The passive answer to seven's abundance: departure. Having seen everything on offer, the receptive principle withdraws from it. Papus's eighth term never initiates — this is less a decision than a recognition that arrives and is obeyed. What is left behind is explicitly not worthless; the cups are stacked and intact. That is what makes the card difficult, and what makes it honest.",
    reversed:
      "The departure refused — staying with something known to be finished, which this suit will keep raising until it is dealt with. Or leaving as a habit, so that nothing is ever given long enough to become worth staying for.",
    correspondences: pipCorrespondences("chalices", 8),
    inSpread:
      "At the commencement, the matter begins with someone walking away. In opposition, a withdrawal the querent did not expect and cannot argue with. At equilibrium the situation is stable only because someone has already mentally gone. As the result: departure, from something that was working well enough.",
  },
  {
    id: "chalices-9",
    slug: "nine-of-cups",
    title: "Nine of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 9),
    upright:
      "The last equilibrium of the suit: feeling at rest in itself. Nine cups ranged and full, one figure, no second party. Papus's ninth term is where a series settles before it completes, and in Briah that settling is contentment — genuine, sufficient and notably private. Everything the suit can produce is present; none of it is being shared, and none of it needs to be.",
    reversed:
      "Sufficiency turned complacent — the display maintained, the contents unexamined. Or contentment that has quietly become isolation, the ranged cups working as a wall rather than a provision.",
    correspondences: pipCorrespondences("chalices", 9),
    inSpread:
      "At the commencement, the matter begins from a position of emotional sufficiency. In opposition, someone's contentment blocking a change that would otherwise be easy. At equilibrium this is the steadiest card the suit has. As the result: satisfaction, held alone.",
  },
  {
    id: "chalices-10",
    slug: "ten-of-cups",
    title: "Ten of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: pipDerivation("chalices", 10),
    upright:
      "The suit spent. Everything the receptive principle can hold, held — and Papus's tenth term is always also a seed, so this is the kind of completion that hands on rather than the kind that stops. Feeling fully realized becomes a household: not an intensity but an arrangement, durable, containing more people than started it. The card is quiet on purpose.",
    reversed:
      "The arrangement kept up after the feeling has drained out of it — the form of a full life maintained by everyone in it out of consideration for everyone else. Or completion resisted, because to complete is to hand on and handing on means it is no longer yours.",
    correspondences: pipCorrespondences("chalices", 10),
    inSpread:
      "At the commencement, the matter begins inside something already fully formed. In opposition, an established emotional order the querent's plans would break. At equilibrium everything is in place. As the result: completion — and in Papus's decade, the start of the next suit's business.",
  },
  {
    id: "chalices-page",
    slug: "page-of-cups",
    title: "Page of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: courtDerivation("chalices", "page"),
    upright:
      "The realizing term as a person: feeling brought down into fact for the first time. The Page is the moment a sympathy stops being internal and does something — an offer made, a message sent, a susceptibility acted on before it has been fully thought through. Papus's fourth term is the one that makes things real, and a Page makes them real clumsily, which is a description of the card rather than a complaint about it.",
    reversed:
      "The offer withheld at the last moment, so nothing is made real. Or feeling acted on so quickly and so often that none of it lands — realization attempted before there is anything to realize.",
    correspondences: courtCorrespondences("chalices", "page"),
    inSpread:
      "At the commencement, the matter begins with a small emotional act: a message, an approach. In opposition, someone's untested sincerity, which is considerably harder to refuse than a demand. At equilibrium the Page is what keeps a feeling in circulation. As the result: something felt becomes something done.",
  },
  {
    id: "chalices-knight",
    slug: "knight-of-cups",
    title: "Knight of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: courtDerivation("chalices", "knight"),
    upright:
      "The equilibrating term as a person: the one who carries feeling from one place to another. The Knight of Chalices is approach itself — courtship, the errand undertaken on behalf of a sympathy, the movement between two parties not yet in contact. Papus's Vau binds, and a Knight binds by travelling. What he carries is genuine; whether he arrives is a separate question this card does not answer.",
    reversed:
      "Movement that never lands — the approach repeated until it is a manner rather than an intention. Or the cup carried so carefully that it is never handed over, transmission turned into an occupation.",
    correspondences: courtCorrespondences("chalices", "knight"),
    inSpread:
      "At the commencement, the matter begins with an approach from outside. In opposition, a suitor, a proposal or an intermediary complicating something that was clear. At equilibrium he is the link, and the link is in motion. As the result: something arrives — Papus's Vau delivers, it does not decide.",
  },
  {
    id: "chalices-queen",
    slug: "queen-of-cups",
    title: "Queen of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: courtDerivation("chalices", "queen"),
    upright:
      "The passive principle of a passive suit, embodied — Papus's most concentrated receptivity. The Queen of Chalices holds feeling without acting on it and reflects it back undistorted, which is a far more demanding operation than it sounds. She is the person others tell things to. Her authority is not over anyone; it consists entirely in the accuracy with which she receives.",
    reversed:
      "Reflection that has taken the colour of whatever it reflects — receptivity with no boundary, until the Queen has no position of her own left. Or a surface kept smooth by refusing to take anything in at all.",
    correspondences: courtCorrespondences("chalices", "queen"),
    inSpread:
      "At the commencement, the matter begins in someone's understanding of it. In opposition, a person who sees the querent clearly and has no intention of intervening. At equilibrium she is the still point everyone else's feeling is measured against. As the result: the matter is understood rather than settled — which in Chalices is the settlement.",
  },
  {
    id: "chalices-king",
    slug: "king-of-cups",
    title: "King of Chalices",
    arcanum: "minor",
    suit: "chalices",
    derivation: courtDerivation("chalices", "king"),
    upright:
      "The active term inside the receptive world: someone who originates in the medium of feeling. Papus's Yod always starts a thing, and a King of Chalices starts by setting the emotional terms on which everything afterwards proceeds — the tone of a household, the temper of an office. He is not demonstrative. The active principle here works by establishing a climate rather than by making demands.",
    reversed:
      "The climate set for one person's convenience — atmosphere as an instrument of control, all the more effective for never being stated out loud. Or a throne occupied by someone who feels a great deal and originates nothing, so the terms get set by whoever is loudest.",
    correspondences: courtCorrespondences("chalices", "king"),
    inSpread:
      "At the commencement, the matter begins because someone set the emotional terms. In opposition, an authority that cannot be argued with because it has never made an explicit claim. At equilibrium he is what keeps the temperature steady. As the result: the matter resolves on terms someone else established, and resolves calmly.",
  },
  {
    id: "swords-1",
    slug: "ace-of-swords",
    title: "Ace of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 1),
    upright:
      "The active origin of the suit of conflict, and what originates is a distinction. Papus's Vau links two things by standing between them, so the first term of that suit is the cut which establishes that there are two things at all: the point made, the truth stated, the line drawn where none existed. Clarity as an act rather than a mood — and every conflict later in the suit follows from a distinction someone insisted on here.",
    reversed:
      "The cut made for its own sake — distinction as an instrument, clarity used to divide rather than to see. Or the point never made at all, so the whole suit's business proceeds on a confusion nobody was willing to name.",
    correspondences: pipCorrespondences("swords", 1),
    inSpread:
      "At the commencement, the matter begins with something said plainly. In opposition, a distinction the querent would rather not make. At equilibrium the situation is held together by one clear statement. As the result: clarity, which will cost whatever clarity costs.",
  },
  {
    id: "swords-2",
    slug: "two-of-swords",
    title: "Two of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 2),
    upright:
      "The passive reception of conflict. Two forces are present and neither is being exercised; the blades are crossed and held. Papus's second term reflects rather than acts, so this is not a resolution but an accurate holding of something unresolved. The blindfold is not ignorance — it is the refusal to let sight tip a balance the querent has decided must stay level.",
    reversed:
      "The balance broken, by choice or by exhaustion — reversed usually means one blade came down. Or the stalemate maintained so long that it has stopped being a decision and become the situation itself.",
    correspondences: pipCorrespondences("swords", 2),
    inSpread:
      "At the commencement, the matter begins in deadlock. In opposition, a refusal to decide that is holding everything up. At equilibrium this is the position the card was made for. As the result: nothing is settled — and Papus would say the reading is telling the querent that plainly rather than failing to answer.",
  },
  {
    id: "swords-3",
    slug: "three-of-swords",
    title: "Three of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 3),
    upright:
      "The equilibrating term of the equilibrating suit — conflict doubled, and therefore conflict resolved in the only way this world can resolve it: by a wound. Three swords through one heart is a structure, not a mood. Papus's third term binds, and what binds two opposed forces is the damage done at the point where they meet. Sorrow that is accurate and impersonal.",
    reversed:
      "The wound tended, or the wound nursed — reversed splits sharply here and the surrounding cards decide which. It can also mark pain rerouted onto a safer target, which resolves nothing but stops the bleeding where it shows.",
    correspondences: pipCorrespondences("swords", 3),
    inSpread:
      "At the commencement, the matter begins in a hurt that has already happened. In opposition, an injury that is doing the arguing on someone's behalf. At equilibrium the situation is held together by something painful and functional. As the result: sorrow — and in Papus's scheme a resolution, which is why this card is so often right and so rarely welcome.",
  },
  {
    id: "swords-4",
    slug: "four-of-swords",
    title: "Four of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 4),
    upright:
      "The pivot: conflict realized, and a realized conflict in the formative world becomes a settled position — truce, arms laid down, the effigy at rest. Papus's fourth term fixes, and what is fixed here is a cessation rather than a peace. Three swords on the wall and one beneath: the arrangement is deliberate. This is recovery, and it is also the ground the next series will fight over.",
    reversed:
      "The rest broken early, before it did its work. Or a truce that has quietly become permanent, so the conflict is neither resolved nor any longer acknowledged by anyone involved.",
    correspondences: pipCorrespondences("swords", 4),
    inSpread:
      "At the commencement, the matter begins in a pause after a fight. In opposition, an inactivity that is protecting someone. At equilibrium the situation holds precisely because nobody is pressing. As the result: rest — and Papus's fourth term hands on, so read what the rest is preparing for.",
  },
  {
    id: "swords-5",
    slug: "five-of-swords",
    title: "Five of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 5),
    upright:
      "The passive reaction to four's cessation: what a settled conflict does to whoever settled it on the losing terms. One figure holds the swords and two walk away, and the card is careful not to show the winner satisfied. Papus's fifth term is always the cost of the fourth. Victory that has damaged the thing it was fought over — a defeat administered, and paid for by both sides.",
    reversed:
      "The cost admitted — the swords put down, the walk back begun. Or the same hollow win defended loudly, because examining it would mean pricing it.",
    correspondences: pipCorrespondences("swords", 5),
    inSpread:
      "At the commencement, the matter begins in the aftermath of a win somebody regrets. In opposition, a conflict the querent could take and should not. At equilibrium the situation is stable and someone is absorbing the humiliation that makes it so. As the result: a victory costing more than the object was worth.",
  },
  {
    id: "swords-6",
    slug: "six-of-swords",
    title: "Six of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 6),
    upright:
      "Equilibrium recovered after five, and in the formative world balance is restored by removal: the passage away. The ferry, the shallow water, the swords carried rather than used. Papus's sixth term always repairs the fifth, and here it repairs by changing the ground rather than the terms. Nothing has been resolved — the conflict has been taken somewhere it does not apply.",
    reversed:
      "The crossing refused, or made and then reversed — the return to the ground the conflict actually lives on. Or the swords brought along and planted identically on the far shore.",
    correspondences: pipCorrespondences("swords", 6),
    inSpread:
      "At the commencement, the matter begins in a move away from trouble. In opposition, a departure that solves nothing and looks like a solution. At equilibrium the situation is steady because it is in transit. As the result: passage — balance restored, on new ground and by nobody's concession.",
  },
  {
    id: "swords-7",
    slug: "seven-of-swords",
    title: "Seven of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 7),
    upright:
      "The second pivot: conflict realized again, and realized this time as indirection. Five swords taken, two left, nothing declared. Papus's seventh term is a genuine realization — the stratagem works — and it is also the unstable opening of the last series, which is why the suit gets worse after this. Conflict conducted without contact: the manoeuvre, the reservation, what is not said in the meeting.",
    reversed:
      "The stratagem exposed, which is frequently the best outcome available to everyone. Or indirection become the only register left, so that even simple things are now approached obliquely.",
    correspondences: pipCorrespondences("swords", 7),
    inSpread:
      "At the commencement, the matter begins in something withheld. In opposition, a manoeuvre rather than an opponent — Papus's method says look for the mechanism, not the villain. At equilibrium the situation holds because not everything has been said. As the result: the thing is achieved by indirection, and a seventh term hands on.",
  },
  {
    id: "swords-8",
    slug: "eight-of-swords",
    title: "Eight of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 8),
    upright:
      "The passive answer to seven's manoeuvring: restriction, and the conflict has come inside. Bound, blindfolded, swords planted around rather than through — Papus's eighth term never initiates, and the whole force of the card is that the constraint is real and is not what is holding the figure. Restriction the situation created and the querent is now maintaining, without being able to tell which is which.",
    reversed:
      "The bindings tested — reversed usually means one of them turns out to be loose. Or the restriction fully internalised, so that the swords could be removed with no change whatever in behaviour.",
    correspondences: pipCorrespondences("swords", 8),
    inSpread:
      "At the commencement, the matter begins already constrained. In opposition, a limit the querent believes in more than it deserves. At equilibrium the situation is stable and the stability is the cage. As the result: restriction — and Papus's system says look back to seven for how it was built.",
  },
  {
    id: "swords-9",
    slug: "nine-of-swords",
    title: "Nine of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 9),
    upright:
      "The last equilibrium of the suit, and in a suit of conflict the final balance is reached entirely inside one person. Nine swords on the wall, the figure upright in the dark. Papus's ninth term settles a series before it completes, and what settles here is anguish — conflict with no remaining external party, therefore perfectly balanced and unable to resolve itself. The night is the accurate setting: nothing is happening.",
    reversed:
      "The night ending, or the count of swords found to be wrong — reversed is where the disproportion becomes visible. It can also be worse: the anguish organised, given a routine, made survivable and therefore permanent.",
    correspondences: pipCorrespondences("swords", 9),
    inSpread:
      "At the commencement, the matter begins in a fear that predates the situation. In opposition, dread doing work the evidence would not support. At equilibrium the person is holding on and it is costing them everything. As the result: the conflict ends inside, unwitnessed, and Papus offers no comfort about it.",
  },
  {
    id: "swords-10",
    slug: "ten-of-swords",
    title: "Ten of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: pipDerivation("swords", 10),
    upright:
      "The suit spent. Ten swords, nothing left to contest, and Papus's tenth term is always also a seed — so this is a completion that is genuinely final for the conflict and genuinely the start of whatever follows. The card is not a warning; it is a statement that the worst of one specific thing has finished happening. In the formative world there is nothing left to argue.",
    reversed:
      "The end refused — a conflict revived after it was over, which in this suit is the most expensive move available. Or the beginning of what follows, since a spent suit hands on: the first light along the horizon of the card.",
    correspondences: pipCorrespondences("swords", 10),
    inSpread:
      "At the commencement, the matter begins from a total defeat, which is a firmer footing than a partial one. In opposition, an ending the querent is still contesting. At equilibrium nothing is balanced — this position is simply reporting that it is finished. As the result: the conflict is comprehensively over, and the next suit's business begins.",
  },
  {
    id: "swords-page",
    slug: "page-of-swords",
    title: "Page of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: courtDerivation("swords", "page"),
    upright:
      "The realizing term as a person: conflict brought down into fact by watching. The Page of Swords is vigilance — the one who notices, checks, asks the question nobody asked and then reports it. Papus's fourth term makes things real, and what this Page makes real is information: not yet judgement and not yet force, but the raw material both of those need, gathered by someone with no stake in the answer.",
    reversed:
      "Watching that has become suspicion — vigilance with its conclusion fitted in advance. Or information gathered endlessly and never handed on, so that nothing is realized after all.",
    correspondences: courtCorrespondences("swords", "page"),
    inSpread:
      "At the commencement, the matter begins because somebody noticed something. In opposition, a watcher — Papus's method says identify them rather than resent them. At equilibrium the situation holds because it is being monitored. As the result: something comes to light.",
  },
  {
    id: "swords-knight",
    slug: "knight-of-swords",
    title: "Knight of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: courtDerivation("swords", "knight"),
    upright:
      "The equilibrating term as a person, in the suit where equilibrium is conflict: force in transit. The Knight of Swords is the charge — the argument taken directly to its object at speed, with no provision made for what happens on arrival. Papus's Vau connects, and this Knight connects by collision. Nothing about the card is dishonest; it is simply the fastest and least reversible thing in the suit.",
    reversed:
      "The charge misdirected, or launched at the wrong target with undiminished commitment. Or force perpetually about to be applied — the horse held, which in this card is its own kind of damage.",
    correspondences: courtCorrespondences("swords", "knight"),
    inSpread:
      "At the commencement, the matter begins with someone acting fast and directly. In opposition, an opponent who will not slow down and cannot be flanked. At equilibrium nothing stays balanced for long — the Knight is a temporary state. As the result: the matter is settled by direct force, quickly; read the next card for the cost.",
  },
  {
    id: "swords-queen",
    slug: "queen-of-swords",
    title: "Queen of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: courtDerivation("swords", "queen"),
    upright:
      "He of Vau: the receptive pole of the equilibrating suit. Swords are the friction where two forces meet, and the Queen does not add force to that — she receives it and reflects it back accurately. This is judgement rather than attack: the person who has taken the measure of a conflict and can state it without softening. Papus's passive term is never weak, it is exact; the Queen of Swords is the card of someone who sees the structure of a quarrel and is not moved by either side's account of it.",
    reversed:
      "Reversed, reflection turns cold and then turns on the person doing it. The same accuracy, applied without any object but itself: a mind rehearsing an old injury, mistaking the memory of a conflict for the conflict. It can equally mark a judgement that has been made and will not be revisited — the accurate reading kept long after the situation changed, so that it is no longer accurate at all.",
    correspondences: courtCorrespondences("swords", "queen"),
    inSpread:
      "Court cards in Papus's method are as often a disposition as a person. At the commencement, the matter begins in someone's clear-eyed assessment of a conflict. In opposition, expect to be read correctly by someone who will not be flattered. At equilibrium she is what keeps the thing honest. As the result: the matter is settled by judgement rather than force, and the judgement will be exact rather than kind.",
  },
  {
    id: "swords-king",
    slug: "king-of-swords",
    title: "King of Swords",
    arcanum: "minor",
    suit: "swords",
    derivation: courtDerivation("swords", "king"),
    upright:
      "The active term inside the suit of conflict: judgement that commands. Where the Queen receives a conflict accurately, the King originates the terms on which it will be decided, and he is the only figure in the suit with the standing to enforce them. Papus's Yod begins things; a King of Swords begins by defining what will count as an answer. Authority exercised through language, and binding precisely because of it.",
    reversed:
      "The rule stated by someone who will not be bound by it — judgement as a position rather than a discipline. Or intellect used to prevail rather than to decide, which produces rulings that are unanswerable and wrong.",
    correspondences: courtCorrespondences("swords", "king"),
    inSpread:
      "At the commencement, the matter begins with a ruling. In opposition, an authority who has already framed the question so the querent cannot win it. At equilibrium he is what holds the terms in place. As the result: the matter is decided, by someone entitled to decide it, and the decision will hold.",
  },
  {
    id: "pentacles-1",
    slug: "ace-of-pentacles",
    title: "Ace of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 1),
    upright:
      "The active origin of the material world: the means given. Papus's Yod starts things, and in Assiah what starts is a resource — capital, a tool, an opening with a value attached to it. The Ace is the one card in the suit where matter is pure potential, and it is exact that potential in the material world takes the form of something you can hold. It has no direction of its own; it becomes whatever it is put into.",
    reversed:
      "The means given and not used — the resource held, admired, kept intact. Or an opening whose price was never read, which the rest of the suit will duly collect on.",
    correspondences: pipCorrespondences("pentacles", 1),
    inSpread:
      "At the commencement, the matter begins with something concrete arriving. In opposition, a resource with conditions attached to it. At equilibrium the situation rests on a single material fact. As the result: means, not outcome — the rest of the suit decides what is done with them.",
  },
  {
    id: "pentacles-2",
    slug: "two-of-pentacles",
    title: "Two of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 2),
    upright:
      "The passive reflection of the Ace: one resource seen as two demands. Papus's second term does not create, it doubles and reflects, and in the material world that reflection is the constant adjustment between two obligations, neither of which can be dropped. The figure juggles because both coins are real. This is competence rather than chaos — but competence with no slack anywhere in it.",
    reversed:
      "The balance dropped — one obligation abandoned, usually the quieter one. Or juggling maintained well past the point where it was necessary, because the motion has become the identity.",
    correspondences: pipCorrespondences("pentacles", 2),
    inSpread:
      "At the commencement, the matter begins with two commitments and one set of means. In opposition, a second obligation nobody is counting. At equilibrium this is precisely what is happening, and it is not free. As the result: both are kept up, and Papus's second term promises nothing beyond that.",
  },
  {
    id: "pentacles-3",
    slug: "three-of-pentacles",
    title: "Three of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 3),
    upright:
      "The binding term of the material world: work combined. Three is where something exists that neither of the first two terms contained, and in Assiah that emergent thing is the craft — the mason, the plan and the patron, none of whom can produce the building alone. Papus's third term always unites, and here it unites by division of labour. Skill recognised, and recognised specifically by people who need it.",
    reversed:
      "The collaboration nominal — three parties named, one doing the work. Or craft exercised without the other two terms, so that it is entirely competent and completely unusable.",
    correspondences: pipCorrespondences("pentacles", 3),
    inSpread:
      "At the commencement, the matter begins as a joint piece of work. In opposition, a collaboration the querent depends on and does not control. At equilibrium the arrangement is what is holding. As the result: something is built, by more than one person, and the credit will be divided.",
  },
  {
    id: "pentacles-4",
    slug: "four-of-pentacles",
    title: "Four of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 4),
    upright:
      "The pivot. Matter realized becomes matter held — possession, and Papus's fourth term is honest that this is an achievement before it is a fault. Four coins, all accounted for, none of them moving. This is the point at which resources stop circulating and become a position. It fixes what the first three terms produced, and being a pivot, everything the second series does begins from it.",
    reversed:
      "The grip loosened, deliberately or by force — reversed can be generosity or it can be loss, and the surrounding cards decide. Or holding taken so far that the holder is now held, which is the reading five will develop.",
    correspondences: pipCorrespondences("pentacles", 4),
    inSpread:
      "At the commencement, the matter begins from an established material position. In opposition, someone's unwillingness to let a resource move. At equilibrium the situation is secure and completely static. As the result: the thing is kept — and Papus's pivot means kept in a way that starts something else.",
  },
  {
    id: "pentacles-5",
    slug: "five-of-pentacles",
    title: "Five of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 5),
    upright:
      "He of He final: a passive term inside the world of matter, standing just after the pivot at four. Four fixed something material; five is what that fixed thing does back to the person holding it. So this is not loss by accident but loss by consequence — the estate that turns out to cost more than it returns, the body sending the bill for how it has been used, the settled arrangement that has quietly become want. Papus's material world is exact and unsentimental, and five is where it stops flattering.",
    reversed:
      "Inverted, the passive term stops being suffered and starts being answered. Reversed this reads as want acknowledged and therefore workable: the debt named, the help asked for, the arrangement broken off before it drains further. In a harder reading it is the same poverty refusing to be looked at — the pretence kept up, the accounts left unopened, want mistaken for bad luck rather than a term in a sequence that began at four.",
    correspondences: pipCorrespondences("pentacles", 5),
    inSpread:
      "At the commencement, the matter starts from a material shortfall — read every later card as answering it. In opposition, five of pentacles is the cost the querent has not budgeted for. At equilibrium it drags: the situation is being held together by someone absorbing a loss. As the result, Papus's system is unambiguous — the matter concludes in the material world, and concludes short.",
  },
  {
    id: "pentacles-6",
    slug: "six-of-pentacles",
    title: "Six of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 6),
    upright:
      "Equilibrium restored after five, and in the material world balance is restored by measurement: the scales in one hand, the coins in the other. Papus's sixth term repairs the fifth, and here it repairs by distribution — giving and receiving in a stated proportion. That the giver holds the scales is part of the card. This is generosity as a transaction, which is not a criticism; it is what makes it repeatable.",
    reversed:
      "The proportion set to flatter the giver — a distribution that carefully maintains the difference it appears to relieve. Or the scales refused: help offered and not taken, because the terms are visible.",
    correspondences: pipCorrespondences("pentacles", 6),
    inSpread:
      "At the commencement, the matter begins with help given on stated terms. In opposition, an obligation dressed as a gift. At equilibrium the situation is being balanced by someone's deliberate measure. As the result: means change hands, in a proportion somebody else set.",
  },
  {
    id: "pentacles-7",
    slug: "seven-of-pentacles",
    title: "Seven of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 7),
    upright:
      "The second pivot: a realization consisting in value accrued and not yet taken. The vine is grown, the fruit is on it, the worker leans on the tool and counts. Papus's seventh term genuinely realizes — the crop is real — and it is also the unstable opening of the last series, so the card sits exactly at the moment where a decision about timing has to be made and has not been.",
    reversed:
      "The crop taken too early, or left too long. Or the counting itself become the work, assessment substituted for harvest because assessment cannot fail.",
    correspondences: pipCorrespondences("pentacles", 7),
    inSpread:
      "At the commencement, the matter begins with an investment already made and not yet returned. In opposition, a delay costing more than it appears to. At equilibrium the situation is stable while the thing grows. As the result: value accrued — and a seventh term hands on, so the reading does not stop at the yield.",
  },
  {
    id: "pentacles-8",
    slug: "eight-of-pentacles",
    title: "Eight of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 8),
    upright:
      "The passive answer to seven's standing crop: application. Papus's eighth term never originates — it responds, and in the material world the response to accrued value is the repetition that maintains and improves it. Eight coins struck one after another. Skill here is not talent; it is the accumulation of identical days, and the card is unromantic about that being what actually produces the material world.",
    reversed:
      "Repetition with the attention gone — the eighth coin identical to the first because nothing was learned in between. Or craft pursued past the point of return, refinement used as a way of not delivering.",
    correspondences: pipCorrespondences("pentacles", 8),
    inSpread:
      "At the commencement, the matter begins in steady work. In opposition, a discipline the querent lacks and the situation requires. At equilibrium the thing holds because someone keeps doing it. As the result: skill, earned at the ordinary rate.",
  },
  {
    id: "pentacles-9",
    slug: "nine-of-pentacles",
    title: "Nine of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 9),
    upright:
      "The last equilibrium of the suit: sufficiency, held alone. The walled garden, the trained bird, one figure. Papus's ninth term settles a series before it completes, and in Assiah that settlement is material independence — enough, arranged, and answerable to nobody. The card is precise that the garden is cultivated and the solitude is chosen; neither is an accident of the reading.",
    reversed:
      "The wall doing more work than the garden — security narrowed into confinement. Or a sufficiency that depends on something unexamined, so the independence is nominal.",
    correspondences: pipCorrespondences("pentacles", 9),
    inSpread:
      "At the commencement, the matter begins from a secure and self-sufficient position. In opposition, someone's independence, which no offer will move. At equilibrium this is the steadiest card the suit has. As the result: enough, held on the querent's own terms.",
  },
  {
    id: "pentacles-10",
    slug: "ten-of-pentacles",
    title: "Ten of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: pipDerivation("pentacles", 10),
    upright:
      "The suit spent, and in the material world what a completed suit produces is an estate: wealth that has outlasted the person who made it and now organises a family. Papus's tenth term is a completion that is also a seed, and inheritance is exactly that — matter fully realized and handed on. Three generations in one courtyard. Nothing in the card is being achieved; everything in it is being continued.",
    reversed:
      "The inheritance disputed, or the arrangement maintaining people who would be better off without it. Or completion refused — the estate not handed on, so the suit cannot close and the next cannot start.",
    correspondences: pipCorrespondences("pentacles", 10),
    inSpread:
      "At the commencement, the matter begins inside an established material order the querent did not build. In opposition, a family or institutional arrangement outweighing any individual plan. At equilibrium everything is in place and durable. As the result: permanence, and the beginning of somebody else's series.",
  },
  {
    id: "pentacles-page",
    slug: "page-of-pentacles",
    title: "Page of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: courtDerivation("pentacles", "page"),
    upright:
      "The realizing term as a person, inside the realizing suit — Papus's most literal card. The Page of Pentacles makes something actual: the first practical step, the apprenticeship, the coin studied rather than spent. The doubled He final means he does nothing figuratively. Slow, unglamorous, and the only figure in the suit still learning what the material world costs.",
    reversed:
      "Study without application — the coin turned over indefinitely and never put to use. Or the practical step taken without the study, which the material world charges for immediately.",
    correspondences: courtCorrespondences("pentacles", "page"),
    inSpread:
      "At the commencement, the matter begins with a small concrete step. In opposition, inexperience — which is not the same thing as incapacity. At equilibrium the situation holds because someone is doing the groundwork. As the result: something real begins, modestly.",
  },
  {
    id: "pentacles-knight",
    slug: "knight-of-pentacles",
    title: "Knight of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: courtDerivation("pentacles", "knight"),
    upright:
      "The equilibrating term as a person, carrying the slowest suit — and so the slowest and most reliable figure in the deck. His horse is stationary. Papus's Vau transmits, and this Knight transmits by not deviating: the task carried through at a constant rate until it is finished. He is uninteresting on purpose. In the material world, uninteresting is what works.",
    reversed:
      "Constancy become inertia — the same rate maintained after the task changed. Or reliability used as an argument against every request to move faster, some of which are reasonable.",
    correspondences: courtCorrespondences("pentacles", "knight"),
    inSpread:
      "At the commencement, the matter begins with something being done steadily. In opposition, a pace that cannot be hurried. At equilibrium he is the reason nothing has slipped. As the result: the thing is completed, late, and correctly.",
  },
  {
    id: "pentacles-queen",
    slug: "queen-of-pentacles",
    title: "Queen of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: courtDerivation("pentacles", "queen"),
    upright:
      "The receptive principle inside the material world: stewardship. The Queen of Pentacles receives resources and makes them productive — the household, the ground, the business that grows because somebody attends to it daily. Papus's He does not originate, and that is the point: nothing here is invented, everything is husbanded. Practical care, exercised over things and people without drawing much distinction between them.",
    reversed:
      "Care become management — everything tended, nothing allowed its own direction. Or stewardship of everyone else's holdings and none of her own, which the suit eventually prices.",
    correspondences: courtCorrespondences("pentacles", "queen"),
    inSpread:
      "At the commencement, the matter begins in someone's practical care. In opposition, a person whose competence the querent is relying on and underestimating. At equilibrium she is what keeps the material side working. As the result: the thing is made to grow, by attention rather than by capital.",
  },
  {
    id: "pentacles-king",
    slug: "king-of-pentacles",
    title: "King of Pentacles",
    arcanum: "minor",
    suit: "pentacles",
    derivation: courtDerivation("pentacles", "king"),
    upright:
      "The active term inside the material world: the one who commands resources. Papus's Yod originates, and in Assiah origination means putting means into motion — founding, funding, deciding what gets built. The King of Pentacles is not a hoarder; four is the hoarding card. His authority consists in the fact that when he directs a resource it moves, and the material world rearranges itself around the direction.",
    reversed:
      "Command exercised for the accumulation itself — means moved only in circles that end where they started. Or authority over resources that were inherited rather than made, and are being spent as though they were infinite.",
    correspondences: courtCorrespondences("pentacles", "king"),
    inSpread:
      "At the commencement, the matter begins because someone with means decided it should. In opposition, an interest with more resources than the querent. At equilibrium he is what is funding the stability. As the result: the matter is settled materially, by whoever controls the means.",
  },
  {
    id: "wands-1",
    slug: "ace-of-wands",
    title: "Ace of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 1),
    upright:
      "The active principle of the active suit — Papus's purest origin, Yod within Yod. Nothing precedes it and nothing conditions it: the impulse itself, before it has an object, a plan or a cost. In Atziluth this is the archetypal beginning, which is why the card always feels larger than its circumstances. It has no content of its own. Everything the suit does afterwards is this force acquiring one.",
    reversed:
      "The impulse dissipated — force that arrives, finds no channel, and is spent on nothing. Or the beginning postponed until conditions are right, which for a Yod means postponed indefinitely.",
    correspondences: pipCorrespondences("wands", 1),
    inSpread:
      "At the commencement, the matter begins in a pure impulse, and Papus would read the rest of the spread as what that impulse ran into. In opposition, somebody else's initiative. At equilibrium the situation is held by a force that has not yet been directed. As the result: a beginning, not an outcome.",
  },
  {
    id: "wands-2",
    slug: "two-of-wands",
    title: "Two of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 2),
    upright:
      "The passive reflection of the impulse: the force turned back on itself and looked at. The figure holds a globe and stands between two staves, one fixed and one held. Papus's second term does not act, it surveys. This is the plan — the impulse examined for where it could go — and the card is exact that the world is being considered from a wall rather than from the road.",
    reversed:
      "Survey without departure — planning used as a substitute for the thing planned. Or the impulse acted on before it was ever looked at, which is this card refusing its own function.",
    correspondences: pipCorrespondences("wands", 2),
    inSpread:
      "At the commencement, the matter begins in a decision about scope. In opposition, deliberation that is costing the initiative. At equilibrium the situation is stable because nothing has been committed. As the result: a plan — and Papus's second term never delivers more than that.",
  },
  {
    id: "wands-3",
    slug: "three-of-wands",
    title: "Three of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 3),
    upright:
      "The binding term of the active suit: impulse and plan united in an enterprise now under way. The ships are out; the figure watches from the shore. Papus's third term produces something the first two did not contain, and here that is commitment — the venture launched, past the point where reconsidering is free. Balance in the active world means several things in motion at once and none of them controllable.",
    reversed:
      "The venture launched without the second term — impulse and commitment, no survey, which the suit collects on at five. Or the ships watched so long that the watching has become the enterprise.",
    correspondences: pipCorrespondences("wands", 3),
    inSpread:
      "At the commencement, the matter begins with something already sent out. In opposition, a commitment that cannot be recalled. At equilibrium several ventures are in flight and balancing each other. As the result: the enterprise is under way, and its returns are not this card's business.",
  },
  {
    id: "wands-4",
    slug: "four-of-wands",
    title: "Four of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 4),
    upright:
      "The pivot. The active principle realized becomes an established thing — four staves standing, the garland between them, the ground marked out. Papus's fourth term fixes, and what is fixed here is a frame: a household, a partnership, a founded institution. It is the suit's only stationary card, and being a pivot, everything the second series contends over begins from what got built here.",
    reversed:
      "The frame raised over nothing — the celebration without the substance, the fourth term claimed early. Or a foundation so satisfying in itself that nobody goes on to use it.",
    correspondences: pipCorrespondences("wands", 4),
    inSpread:
      "At the commencement, the matter begins inside something recently established. In opposition, an arrangement whose stability is in the way. At equilibrium this is the firmest footing the suit offers. As the result: something is founded — and Papus's pivot hands straight on to the contest at five.",
  },
  {
    id: "wands-5",
    slug: "five-of-wands",
    title: "Five of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 5),
    upright:
      "The passive reaction to what four established: competition. The moment something is founded, other wills arrive to test it. Five figures, five staves, no visible stakes — and Papus's fifth term is a reaction rather than an attack, so this is friction rather than war. Rivalry, the scramble, the meeting where everyone is talking. It is the natural consequence of the frame, not a misfortune befalling it.",
    reversed:
      "The contest avoided — the ground conceded rather than argued for. Or rivalry hardened into hostility, which is a different and worse card than the one drawn.",
    correspondences: pipCorrespondences("wands", 5),
    inSpread:
      "At the commencement, the matter begins in a crowded field. In opposition, competitors plural — Papus's fifth term is rarely one opponent. At equilibrium the situation is held in place by everyone pushing at once. As the result: contest, unresolved, and six is what resolves it.",
  },
  {
    id: "wands-6",
    slug: "six-of-wands",
    title: "Six of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 6),
    upright:
      "Equilibrium restored after the scramble: one figure raised above the rest, wreath on the staff. Papus's sixth term repairs the fifth, and in the active world it repairs by settling precedence — the contest decided, and decided publicly, because in Atziluth a victory nobody acknowledges has restored nothing. Recognition here is the mechanism, not the reward.",
    reversed:
      "The recognition withheld, or given to the wrong party — either way the fifth term is unsettled and will resume. Or acclaim taken as the object, so the enterprise stops the moment it is applauded.",
    correspondences: pipCorrespondences("wands", 6),
    inSpread:
      "At the commencement, the matter begins from an acknowledged win. In opposition, somebody else's standing. At equilibrium the situation holds because precedence is clear. As the result: recognition — public, and load-bearing.",
  },
  {
    id: "wands-7",
    slug: "seven-of-wands",
    title: "Seven of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 7),
    upright:
      "The second pivot: the position realized, and realized as something that has to be held. The figure stands above, six staves come up from below, the higher ground is genuine and so is the pressure. Papus's seventh term achieves and destabilises in one motion — what is realized here is a defence, which means the last series will be about what defending costs.",
    reversed:
      "The ground given up, or held long after it stopped being worth the effort. Or a defence mounted against opposition that is no longer there, which is how the eighth and ninth terms of this suit get their material.",
    correspondences: pipCorrespondences("wands", 7),
    inSpread:
      "At the commencement, the matter begins with a position already under pressure. In opposition, sustained resistance from several quarters. At equilibrium the situation holds only because someone is actively defending it. As the result: the position is kept — and Papus's seventh always hands on.",
  },
  {
    id: "wands-8",
    slug: "eight-of-wands",
    title: "Eight of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 8),
    upright:
      "The passive answer to seven's defence: eight staves in flight and no figure at all. Papus's eighth term never initiates, and this is the clearest instance of it in the deck — the card shows movement nobody in the reading launched and nobody can now redirect. Speed, message, the sudden arrival of consequences that were set going earlier. The suit at its least personal.",
    reversed:
      "The flight arrested — everything in the air landing at once, or nothing landing at all. Or speed applied to something that needed deliberation, which the active world will do given any opportunity.",
    correspondences: pipCorrespondences("wands", 8),
    inSpread:
      "At the commencement, the matter begins with news or a sudden acceleration. In opposition, events moving faster than the querent can respond to. At equilibrium nothing is balanced — this card is a transit, and the position is reporting velocity. As the result: things arrive quickly, and largely on their own terms.",
  },
  {
    id: "wands-9",
    slug: "nine-of-wands",
    title: "Nine of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 9),
    upright:
      "The last equilibrium of the suit: the guard kept. Eight staves behind, one held, the figure bandaged and standing. Papus's ninth term settles a series before it completes, and in the active world the final settlement is watchfulness bought with everything that came before. This is not fear. It is accurate readiness in someone who has already been hit and has therefore stopped assuming they will not be again.",
    reversed:
      "Vigilance that outlived its cause — a guard kept against nothing, which is exhausting and invisible from outside. Or the last stave put down exactly one moment too early.",
    correspondences: pipCorrespondences("wands", 9),
    inSpread:
      "At the commencement, the matter begins in a defensive posture the querent has earned. In opposition, someone's wariness, which no assurance is going to dissolve. At equilibrium the thing holds because one person is still standing over it. As the result: the position survives, at a cost that shows.",
  },
  {
    id: "wands-10",
    slug: "ten-of-wands",
    title: "Ten of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: pipDerivation("wands", 10),
    upright:
      "The suit spent. Ten staves carried at once, the town in sight, the bearer unable to see over the load. Papus's tenth term completes and seeds — and what the active principle completes with is the full weight of everything it started. The card is not about failure; the enterprise worked, and this is what a working enterprise weighs. Burden is the shape success takes in Atziluth.",
    reversed:
      "The load put down — reversed is relief or abandonment, and only the surrounding cards say which. Or more staves picked up at the door, because handing any of them on would mean admitting the enterprise is bigger than one person.",
    correspondences: pipCorrespondences("wands", 10),
    inSpread:
      "At the commencement, the matter begins already overloaded. In opposition, a weight of prior commitments blocking anything new. At equilibrium everything is being carried by one party. As the result: completion, carried — and in Papus's decade, the handing on to the next suit.",
  },
  {
    id: "wands-page",
    slug: "page-of-wands",
    title: "Page of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: courtDerivation("wands", "page"),
    upright:
      "The realizing term as a person: will brought down into fact. The Page of Wands is the errand — the message carried because somebody had to carry it, the first move made on an idea that has not been examined. Papus's fourth term makes things actual, and in the active suit it makes them actual immediately and without preparation. Enthusiasm doing a job, which is more useful than either half alone.",
    reversed:
      "The errand not run, so the impulse never touches the world. Or announcement mistaken for action — the message about the venture delivered with great energy, and nothing else done.",
    correspondences: courtCorrespondences("wands", "page"),
    inSpread:
      "At the commencement, the matter begins with a first move by someone junior to it. In opposition, unproven eagerness, which is harder to argue with than a case. At equilibrium the Page is what keeps the thing moving. As the result: a beginning is actually made.",
  },
  {
    id: "wands-knight",
    slug: "knight-of-wands",
    title: "Knight of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: courtDerivation("wands", "knight"),
    upright:
      "The equilibrating term as a person, in the suit of pure will: movement itself. The Knight of Wands is departure — the venture undertaken at once, the leaving, the force that connects one place to another by crossing the distance at speed. Papus's Vau binds, and this Knight binds by arriving. What he does not carry is any account of what happens after the arrival.",
    reversed:
      "Departure as a habit — every venture begun and none of them inhabited. Or the horse held at the gate, all the force present and none of it discharged, which in the active suit turns inward.",
    correspondences: courtCorrespondences("wands", "knight"),
    inSpread:
      "At the commencement, the matter begins with someone leaving or launching. In opposition, a force in motion that argument does not slow. At equilibrium nothing stays balanced — the Knight is a passage. As the result: the thing moves, decisively, and the reading should be checked for where it lands.",
  },
  {
    id: "wands-queen",
    slug: "queen-of-wands",
    title: "Queen of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: courtDerivation("wands", "queen"),
    upright:
      "The receptive principle inside the active suit: the person who sustains an enterprise rather than starting it. Papus's He does not originate, and the Queen of Wands is exact about that — her authority lies in holding a venture's warmth steady through the parts where nobody feels enthusiastic. Staff in one hand, sunflower in the other. She receives other people's initiative and hands it back to them usable.",
    reversed:
      "Warmth withdrawn selectively, which in the active world is a real instrument of power. Or sustaining everyone else's ventures so completely that her own is never begun.",
    correspondences: courtCorrespondences("wands", "queen"),
    inSpread:
      "At the commencement, the matter begins because someone kept a flagging thing alive. In opposition, a person whose confidence is carrying the room. At equilibrium she is why the enterprise still has energy in it. As the result: the thing endures, because somebody sustained it.",
  },
  {
    id: "wands-king",
    slug: "king-of-wands",
    title: "King of Wands",
    arcanum: "minor",
    suit: "wands",
    derivation: courtDerivation("wands", "king"),
    upright:
      "The active term of the active suit, embodied — Yod within Yod, made a person. The King of Wands originates: he founds, he commits, and he does it before the case is complete, which is what founding requires. Papus's Yod does not consult. His authority comes from having started things that then existed, and the deck offers no stronger claim to it than that.",
    reversed:
      "Initiative with nothing behind it — a founder who starts a fourth venture rather than finish the first. Or command by force of conviction alone, which works exactly until it is wrong.",
    correspondences: courtCorrespondences("wands", "king"),
    inSpread:
      "At the commencement, the matter begins because one person decided to begin it. In opposition, a will that will not be deflected and cannot be waited out. At equilibrium he is the source everything else is drawing on. As the result: the matter resolves in the direction somebody chose at the very start.",
  },
];

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

/**
 * Reading order for the section: the majors, then the suits in Tetragrammaton
 * order (Yod, He, Vau, He final). `CARD_MEANINGS` itself keeps src/data.ts's
 * order so the two files stay checkable against each other line by line; this
 * is what the index page and the previous/next links walk.
 */
export const SUIT_ORDER: SuitId[] = ["wands", "chalices", "swords", "pentacles"];

export const CARD_GROUPS: { key: "major" | SuitId; cards: CardMeaning[] }[] = [
  { key: "major", cards: CARD_MEANINGS.filter((c) => c.arcanum === "major") },
  ...SUIT_ORDER.map((suit) => ({
    key: suit,
    cards: CARD_MEANINGS.filter((c) => c.suit === suit),
  })),
];

export const CARDS_IN_READING_ORDER: CardMeaning[] = CARD_GROUPS.flatMap((g) => g.cards);

const BY_SLUG = new Map(CARD_MEANINGS.map((c) => [c.slug, c]));

export function getCardMeaning(slug: string): CardMeaning | undefined {
  return BY_SLUG.get(slug);
}

/** Previous/next in reading order. The ends do not wrap — the last card is the last card. */
export function getAdjacentCards(slug: string): {
  previous: CardMeaning | null;
  next: CardMeaning | null;
} {
  const i = CARDS_IN_READING_ORDER.findIndex((c) => c.slug === slug);
  if (i === -1) return { previous: null, next: null };
  return {
    previous: CARDS_IN_READING_ORDER[i - 1] ?? null,
    next: CARDS_IN_READING_ORDER[i + 1] ?? null,
  };
}
