/**
 * Dream meanings for the public /dreams section.
 *
 * SOURCE: Gustavus Hindman Miller, "10,000 Dreams Interpreted" (1901), public
 * domain. The meanings here are written fresh in plain words from the same
 * traditional readings of each symbol; they are not copied from the book.
 *
 * Only English text exists so far. Other languages show the English text and
 * stay out of search results until their own translations land (see
 * DREAM_CONTENT_LOCALES in seo.ts).
 *
 * Slugs are frozen literals. Never generate a slug at request time: these are
 * indexed URLs.
 */

export const DREAM_SOURCE = {
  author: "Gustavus Hindman Miller",
  title: "10,000 Dreams Interpreted",
  year: "1901",
} as const;

/** The most things one dream can be told with. */
export const MAX_SYMBOLS = 3;

export type DreamSymbol = {
  slug: string;
  /** English display name. */
  title: string;
  /** One or two sentences, shown in the "Tell me your dream" result. */
  short: string;
  /** The full meaning, one string per paragraph. */
  paragraphs: string[];
  /** Extra words that should find this dream when typed. */
  terms: string;
};

export const DREAMS: DreamSymbol[] = [
  {
    slug: "water",
    title: "Water",
    terms: "river lake rain swimming swim pool flood",
    short:
      "Water stands for feeling. Calm water is peace; rough or muddy water is worry you have not yet looked at squarely.",
    paragraphs: [
      "Water in a dream stands for feeling. Calm, clear water speaks of peace and a mind at rest. Muddy or rough water points to worry, or to something you have not yet looked at squarely.",
      "Pay attention to where you stood. Watching water from the shore means you are observing your own feelings. Swimming means you are inside them. Being pulled under asks what you have been carrying for too long.",
    ],
  },
  {
    slug: "falling",
    title: "Falling",
    terms: "fall fell drop dropping cliff",
    short:
      "Falling speaks of lost footing, or a fear of failing at something that matters. It often eases once you name what feels unsteady.",
    paragraphs: [
      "To fall in a dream is to feel the ground go from under you. It usually mirrors a waking worry: a job, a relationship or a plan that no longer feels secure.",
      "The moment you land, or wake before you do, is part of the message. Waking before the ground suggests the fear is bigger than the danger; landing safely suggests you will cope better than you think.",
    ],
  },
  {
    slug: "snake",
    title: "Snake",
    terms: "snakes serpent viper reptile",
    short:
      "A snake points to something hidden that is asking for your attention: a fear, a person you doubt, or a change that is coming.",
    paragraphs: [
      "Snakes are old symbols of both danger and renewal. In a dream, a snake often stands for something hidden that is asking for your attention, such as a fear, a doubt about someone close, or a change you sense but have not named.",
      "A snake that retreats or is calmly handled suggests you are mastering the worry. One that bites or follows you says the matter will not wait.",
    ],
  },
  {
    slug: "teeth",
    title: "Teeth",
    terms: "tooth losing teeth dentist mouth",
    short:
      "Losing teeth is among the most common dreams. It usually speaks of worry about how you look, what you say, or loss of control.",
    paragraphs: [
      "Dreams of teeth crumbling or falling out are among the most common of all. They tend to appear when you are anxious about how others see you, about something you said, or about a change you cannot control.",
      "Notice whether the loss hurt. A painless loss can mean you are letting go of something you have outgrown; a painful one points to a worry you are holding too tightly.",
    ],
  },
  {
    slug: "flying",
    title: "Flying",
    terms: "fly flight wings floating soar",
    short: "Flying is freedom. It shows a wish to rise above a problem, or confidence that is growing.",
    paragraphs: [
      "Flying with ease is one of the happiest dreams, and it speaks of freedom, confidence and a wish to rise above a problem that has weighed on you.",
      "If you struggled to stay up, or flew low and feared falling, the dream is asking where you feel held back, and what ambition you are not yet sure you can carry.",
    ],
  },
  {
    slug: "being-chased",
    title: "Being chased",
    terms: "chase chased chasing running run pursued escape hiding",
    short:
      "Being chased means something you are avoiding is catching up with you. Name it and the chase tends to end.",
    paragraphs: [
      "A chase dream usually means there is something in waking life you are running from: a decision, a conversation, a feeling. The pursuer is often not a stranger at all, but the thing you would rather not face.",
      "Look at who or what follows you. If you turn and face it, the dream often changes. That is a hint about what to do when you are awake.",
    ],
  },
  {
    slug: "house",
    title: "House",
    terms: "home rooms building door stairs",
    short:
      "A house stands for you. Its rooms are parts of your life, and what you find inside shows what you are carrying.",
    paragraphs: [
      "A house in a dream is usually you. The rooms are parts of your life and your mind: the cellar holds what is buried, the upper floors what you aspire to, and a locked door what you are not ready to open.",
      "A house you know well speaks of home and the past. A house you have never seen, with rooms you did not know about, suggests there are parts of yourself you have yet to discover.",
    ],
  },
  {
    slug: "fire",
    title: "Fire",
    terms: "flames burning burn candle smoke",
    short:
      "Fire is strong feeling: passion, anger or a push to change. It can warm you or burn, depending on whether it is under control.",
    paragraphs: [
      "Fire stands for strong feeling: passion, anger, desire, or a hard push towards change. A fire under control, like a hearth or a candle, is warmth and purpose.",
      "A fire that spreads or that you cannot put out warns of a feeling or a situation growing beyond your control. A fire that clears the ground can also mean an ending that makes room for something new.",
    ],
  },
  {
    slug: "death",
    title: "Death",
    terms: "dying dead die funeral grave corpse",
    short:
      "Dreaming of death rarely means actual death. It usually marks an ending and a change: something is finishing so something else can begin.",
    paragraphs: [
      "A dream of death almost never foretells a real one. In dream language it is the symbol of an ending: a chapter, a role, a habit or a relationship coming to its close.",
      "How you felt matters most. Calm or relief suggests you are ready to let go; fear suggests you are resisting a change that is already under way. Either way the dream points to transformation, not loss alone.",
    ],
  },
  {
    slug: "baby",
    title: "Baby",
    terms: "child infant newborn pregnant pregnancy birth",
    short:
      "A baby stands for a new beginning: an idea, a project, or a part of you that is just starting to grow.",
    paragraphs: [
      "A baby in a dream stands for something new and tender: an idea, a project, a hope, or a part of yourself that is only beginning to grow.",
      "A baby that is well cared for says the new thing is safe in your hands. A baby that cries, or is lost, asks what you have been neglecting that needs your attention.",
    ],
  },
  {
    slug: "dog",
    title: "Dog",
    terms: "dogs puppy hound pet",
    short:
      "A dog stands for loyalty and friendship. How it behaves shows how you feel about the people who stand by you.",
    paragraphs: [
      "Dogs in dreams stand for loyalty, friendship and protection. A friendly dog speaks of people you can trust, and of your own faithful nature.",
      "A dog that growls or runs away points to a friendship that feels uncertain, or to your own instinct warning you about someone. Your own dog, living or lost, often carries love and memory.",
    ],
  },
  {
    slug: "cat",
    title: "Cat",
    terms: "cats kitten kitty pet",
    short: "A cat stands for independence and intuition. It can also point to someone who is hard to read.",
    paragraphs: [
      "Cats in dreams stand for independence, intuition and quiet watchfulness. A calm cat suggests you are comfortable with your own company and trust your instincts.",
      "A cat that hisses or slips away may point to someone you cannot quite read, or to a part of your own nature you keep at a distance.",
    ],
  },
  {
    slug: "ocean",
    title: "Ocean",
    terms: "sea waves tide beach shore storm",
    short:
      "The ocean is the deep self and the unknown. Calm seas say you are at peace; a storm says strong feelings are rising.",
    paragraphs: [
      "The ocean is bigger than any single feeling. In a dream it stands for the deep mind, the unknown, and everything that lies below what you can see.",
      "Calm waters suggest peace and room to grow. A storm, or waves you cannot swim against, shows strong feelings rising and a need to find your footing before you set out.",
    ],
  },
  {
    slug: "money",
    title: "Money",
    terms: "cash coins gold rich poor wallet lost money",
    short:
      "Money in a dream is about worth, not coins. It shows how you value yourself, your time and your effort.",
    paragraphs: [
      "Money in dreams is seldom about money. It speaks of worth: how much you value yourself, your time and your effort, and whether you feel you are receiving your due.",
      "Finding money suggests a sense of untapped worth. Losing it points to a fear of being without something that matters, which may be security, respect or love.",
    ],
  },
  {
    slug: "wedding",
    title: "Wedding",
    terms: "marriage married bride groom ring husband wife",
    short:
      "A wedding is commitment and union. It can be about a real relationship, or about joining two parts of your own life.",
    paragraphs: [
      "A wedding stands for commitment and union. It can speak of a real relationship, but often it is about bringing two parts of your own life together: head and heart, work and rest, the old and the new.",
      "Joy at the wedding says you are ready for the commitment. Doubt, or a missing partner or guest, asks what you are not yet sure you can promise.",
    ],
  },
  {
    slug: "exam",
    title: "Exam",
    terms: "test school class student late unprepared",
    short:
      "An exam is a fear of being judged. It shows where you feel unprepared, or where you hold yourself to a strict standard.",
    paragraphs: [
      "Exam dreams show up long after school ends. They are about being judged: a moment in your waking life when you feel tested and unprepared.",
      "Notice what you could not answer. It often points to the area where you demand most of yourself. If you passed, the dream is quietly telling you that you are readier than you believe.",
    ],
  },
  {
    slug: "car",
    title: "Car",
    terms: "driving drive road crash vehicle brakes",
    short:
      "A car stands for the direction of your life. Who drives and how the road feels shows how much control you think you have.",
    paragraphs: [
      "A car stands for the direction of your life, and for how much control you feel you have over it. Who is at the wheel is the heart of the dream.",
      "Driving smoothly speaks of confidence. Brakes that fail, a runaway car, or a passenger seat you did not choose point to a part of your life that feels out of your hands.",
    ],
  },
  {
    slug: "mirror",
    title: "Mirror",
    terms: "reflection glass face looking",
    short:
      "A mirror shows how you see yourself. What you find there says how honest you are being with yourself.",
    paragraphs: [
      "A mirror in a dream is a question about identity: how you see yourself, and how you think others see you. A clear, kind reflection is self-acceptance.",
      "A cracked, clouded or missing reflection suggests you are avoiding a truth about yourself, or struggling with an image you feel you must keep up.",
    ],
  },
  {
    slug: "bridge",
    title: "Bridge",
    terms: "crossing cross river gap",
    short:
      "A bridge is a crossing from one stage of life to another. How the crossing feels shows how ready you are.",
    paragraphs: [
      "A bridge stands for a crossing from one stage of life to the next. It often appears when a big change is close: a move, a decision, a new chapter.",
      "A firm bridge says you are ready. A broken, swaying or endless one shows how uncertain the crossing feels. Stopping halfway asks what is holding you in the middle.",
    ],
  },
  {
    slug: "forest",
    title: "Forest",
    terms: "woods trees woodland path lost jungle",
    short:
      "A forest is the unknown and the unconscious. Being lost in it speaks of uncertainty; walking through it calmly says you are finding your way.",
    paragraphs: [
      "A forest stands for the unknown, and for the parts of yourself you have not yet explored. Being lost among the trees speaks of uncertainty about the road ahead.",
      "A path, a clearing or a light between the trees is a good sign: it says you are finding your way. Dark and thick woods ask you to slow down and trust the next step before the whole road is clear.",
    ],
  },
];

/** What the "Tell me your dream" page shows before anyone types. */
export const POPULAR_SLUGS = [
  "water",
  "falling",
  "snake",
  "teeth",
  "flying",
  "being-chased",
  "house",
  "fire",
  "death",
  "baby",
  "dog",
] as const;

const BY_SLUG = new Map(DREAMS.map((dream) => [dream.slug, dream]));

export function getDream(slug: string): DreamSymbol | undefined {
  return BY_SLUG.get(slug);
}

/** A to Z by English name. */
export const DREAMS_ALPHABETICAL: DreamSymbol[] = [...DREAMS].sort((a, b) =>
  a.title.localeCompare(b.title, "en")
);

export function getAdjacentDreams(slug: string): {
  previous: DreamSymbol | null;
  next: DreamSymbol | null;
} {
  const index = DREAMS_ALPHABETICAL.findIndex((dream) => dream.slug === slug);
  return {
    previous: index > 0 ? DREAMS_ALPHABETICAL[index - 1] : null,
    next:
      index >= 0 && index < DREAMS_ALPHABETICAL.length - 1
        ? DREAMS_ALPHABETICAL[index + 1]
        : null,
  };
}

export function groupDreamsByLetter(): { letter: string; dreams: DreamSymbol[] }[] {
  const groups = new Map<string, DreamSymbol[]>();
  for (const dream of DREAMS_ALPHABETICAL) {
    const letter = dream.title.charAt(0).toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), dream]);
  }
  return [...groups.entries()].map(([letter, dreams]) => ({ letter, dreams }));
}

/** Lower case, no accents, single spaces, so "Snake!" finds "snake". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Letters of any alphabet (Cyrillic, Turkish, Norwegian), not just a–z.
    // Built from a string so the older compile target never parses the flag.
    .replace(new RegExp("[^\\p{L}\\p{N}\\s]", "gu"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every typed word must start a word in the name or the extra terms.
 * Pass entries already in the visitor's language (see dreamTranslations.ts).
 */
export function matchDreams<T extends { title: string; terms?: string }>(
  items: T[],
  query: string
): T[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const haystack = normalize(`${item.title} ${item.terms ?? ""}`).split(" ");
    return words.every((word) => haystack.some((h) => h.startsWith(word)));
  });
}

/**
 * The dream part of a result link, e.g. "water_falling". Returns null for
 * anything that is not one to three different known dreams, so a made-up link
 * is a 404 rather than a page of nothing.
 */
export function parseSymbolCode(code: string): DreamSymbol[] | null {
  const slugs = code.split("_").filter(Boolean);
  if (slugs.length === 0 || slugs.length > MAX_SYMBOLS) return null;
  if (new Set(slugs).size !== slugs.length) return null;
  const found = slugs.map((slug) => getDream(slug));
  return found.every(Boolean) ? (found as DreamSymbol[]) : null;
}

export function buildSymbolCode(slugs: string[]): string {
  return slugs.join("_");
}
