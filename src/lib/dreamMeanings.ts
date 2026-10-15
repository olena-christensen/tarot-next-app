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
  {
    slug: "pregnancy",
    title: "Pregnancy",
    terms: "pregnant expecting birth giving birth womb",
    short:
      "Pregnancy in a dream is about something growing: a plan, a change, or a part of you getting ready to be born. It is not a prediction.",
    paragraphs: [
      "Dreaming of pregnancy is seldom a forecast. It speaks of something growing inside you: a plan, a hope, a project or a change that is not ready to show yet.",
      "How you felt matters most. Joy says you welcome what is coming. Fear or surprise asks what responsibility you are unsure you can carry, and whether you have been given enough time to prepare.",
    ],
  },
  {
    slug: "the-dead",
    title: "The dead",
    terms: "dead person deceased passed away late grandmother grandfather ghost",
    short:
      "Seeing someone who has died is usually about memory and unfinished feeling. It often brings comfort, or a wish to say what was left unsaid.",
    paragraphs: [
      "Dreams of people who have died are very common, and they are usually about memory rather than visits. The mind brings back someone you loved, or feared, because the feeling is still alive in you.",
      "A calm or warm meeting speaks of comfort and acceptance. A troubled one points to something left unsaid or unfinished. Either way, the dream is asking what you still carry of that person, and whether it is time to put some of it down.",
    ],
  },
  {
    slug: "child",
    title: "Child",
    terms: "children kid son daughter boy girl",
    short:
      "A child in a dream stands for innocence, play and your own younger self. How the child fares shows how you treat that side of you.",
    paragraphs: [
      "A child in a dream often stands for innocence, curiosity and play, or for the younger version of yourself. It can also point to a real child in your life that you worry about.",
      "A happy child suggests you are in touch with joy and hope. A frightened or lost child asks what part of you needs care, or what you have been too busy to protect.",
    ],
  },
  {
    slug: "fish",
    title: "Fish",
    terms: "fishing fishes sea river pond catch aquarium",
    short:
      "Fish stand for the hidden life under the surface: feelings, ideas and chances that are only now rising into view.",
    paragraphs: [
      "Fish live below the surface, so in dreams they stand for what is hidden in the deeper mind: feelings, ideas and chances that are only beginning to rise into view.",
      "Catching a fish suggests you are bringing something to light. A fish slipping away speaks of a chance you fear you will miss. Clear, lively fish are a good sign; dead or tangled ones point to something neglected.",
    ],
  },
  {
    slug: "sea",
    title: "Sea",
    terms: "seaside waves sailing ship boat shore beach horizon voyage",
    short:
      "The sea is a long crossing. Calm or rough, it shows how you feel about the journey you are on and what lies beyond the horizon.",
    paragraphs: [
      "The sea in a dream is about travel and distance: the long crossing from where you are to where you hope to be. Its mood shows how you feel about the journey.",
      "A calm sea and a steady ship say you trust the way. Rough water or a lost shore says the journey feels uncertain. A wide horizon is a hopeful sign: it means you still see somewhere to go.",
    ],
  },
  {
    slug: "ex-partner",
    title: "Ex-partner",
    terms: "ex boyfriend girlfriend husband wife former lover breakup",
    short:
      "Dreaming of an ex rarely means you want them back. It usually points to a feeling or a lesson from that time that is asking for attention.",
    paragraphs: [
      "Dreaming of an ex-partner rarely means you want them back. More often the person stands for a feeling, a habit or a lesson from that time, which something in your present has stirred.",
      "Notice how you felt. Peace suggests the chapter is settled. Hurt or longing asks what you still need from it: an answer, an apology, or simply to be heard by yourself.",
    ],
  },
  {
    slug: "cheating-partner",
    title: "Cheating partner",
    terms: "cheating infidelity unfaithful betrayal affair jealous partner husband wife boyfriend girlfriend",
    short:
      "A dream of a partner cheating is usually about fear of loss or distrust, not a fact. It asks where you feel unsure or unseen.",
    paragraphs: [
      "A dream of a cheating partner is usually about fear, not fact. It reflects worry about losing closeness, feeling less important, or a trust that has been shaken.",
      "Ask what you felt in the dream: anger, shame, relief? That feeling is the message. If something real is troubling you, the dream is a nudge to talk about it openly rather than carry it alone.",
    ],
  },
  {
    slug: "rats",
    title: "Rats",
    terms: "rat mouse mice rodent vermin",
    short:
      "Rats stand for worry that gnaws, or for people and habits that quietly drain you. They ask what you should clear out.",
    paragraphs: [
      "Rats in dreams stand for things that gnaw at you quietly: small worries, petty betrayals, or habits that drain you without notice. They also speak of resourcefulness.",
      "Rats you chase away show that you are ready to clear something out. Rats that swarm point to a worry that has grown while you looked elsewhere.",
    ],
  },
  {
    slug: "gold",
    title: "Gold",
    terms: "golden treasure jewellery jewelry coins ring wealth rich",
    short:
      "Gold stands for what you value most: worth, success, or something precious you are afraid to lose.",
    paragraphs: [
      "Gold in a dream stands for what you value most: your worth, your success, or something precious in your life. It can also speak of a wish for security.",
      "Finding gold says you are discovering your own value. Losing it, or gold that turns to dust, asks whether what you chase is as precious as it looks.",
    ],
  },
  {
    slug: "blood",
    title: "Blood",
    terms: "bleeding wound cut injury red",
    short:
      "Blood stands for life, energy and family. Bleeding points to a drain on your strength; strong, healthy blood to vitality.",
    paragraphs: [
      "Blood is the stuff of life, so in a dream it speaks of energy, vitality and family ties. How it appears shows whether your strength is flowing or being drained.",
      "Bleeding suggests something is costing you more than you can afford, such as effort, love or time. Blood that does not hurt can point to a change that is deeper than it looks. It rarely means harm to the body.",
    ],
  },
  {
    slug: "being-naked",
    title: "Being naked",
    terms: "naked nude undressed exposed public embarrassed",
    short:
      "Being naked in public is the fear of being seen as you really are. It usually appears when you feel exposed or unprepared.",
    paragraphs: [
      "Being naked in public is one of the most common dreams. It speaks of feeling exposed, unprepared, or afraid that people will see something you try to hide.",
      "If no one noticed, the fear is bigger than the danger. If you felt free, the dream may be a wish to stop pretending. Either way, it asks where you feel you must hide.",
    ],
  },
  {
    slug: "being-late",
    title: "Being late",
    terms: "late missed train bus flight deadline hurry",
    short:
      "Being late is the fear of missing a chance. It shows where you feel pressed for time or behind in life.",
    paragraphs: [
      "Dreams of being late or missing a train show up when you feel pressed for time, or fear that a chance in your life is slipping by.",
      "Look at what you were late for. It often points to the part of life where you feel behind. Arriving in time, even at the last moment, says you will manage better than you fear.",
    ],
  },
  {
    slug: "being-lost",
    title: "Being lost",
    terms: "lost lost way maze wandering directions confused",
    short:
      "Being lost shows uncertainty about the direction of your life. It often comes before a decision or a change.",
    paragraphs: [
      "Being lost in a dream shows that you are unsure of your direction, in work, in love or in who you are becoming. It often comes just before a decision.",
      "Notice whether you were afraid or only puzzled. Puzzled, and still walking, says you are searching and will find a way. Frightened and stuck asks what help or what information you have not yet asked for.",
    ],
  },
  {
    slug: "funeral",
    title: "Funeral",
    terms: "burial grave cemetery graveyard mourning coffin",
    short:
      "A funeral marks an ending you are ready, or not ready, to accept. It is rarely about a real death.",
    paragraphs: [
      "A funeral in a dream is the mind's way of marking an ending: a relationship, a role or a time of life that is closing. It is rarely a sign of real death.",
      "Calm at the funeral says you are ready to say goodbye. Grief or anger suggests you are not done mourning something. Attending the funeral of someone living usually means that a part of your bond with them has changed.",
    ],
  },
  {
    slug: "rain",
    title: "Rain",
    terms: "storm rainfall wet drizzle shower umbrella",
    short:
      "Rain stands for cleansing and release. Gentle rain is relief; a downpour speaks of feelings that have been held back too long.",
    paragraphs: [
      "Rain in a dream stands for cleansing and release. Gentle rain brings relief and renewal, like tears that finally come and wash something away.",
      "A heavy downpour or a storm points to feelings that have been held back too long. Staying dry under shelter says you feel protected; being soaked asks whether you have let yourself feel what you needed to.",
    ],
  },
  {
    slug: "snow",
    title: "Snow",
    terms: "snowing winter ice cold frost white",
    short:
      "Snow is stillness and a clean slate. It can mean peace, a pause, or a cold distance between you and others.",
    paragraphs: [
      "Snow in a dream is stillness: a world made quiet and clean. It can mean peace, a pause in your life, or a fresh start waiting to be written on.",
      "Cold, deep or blocking snow points to feeling shut in or distant from people. Walking through it and leaving footprints says you are making your own way, one step at a time.",
    ],
  },
  {
    slug: "mother",
    title: "Mother",
    terms: "mom mum mama motherhood mother in law",
    short:
      "A mother in a dream stands for care, origin and how you nurture yourself and others. Her mood shows how you feel about those things.",
    paragraphs: [
      "A mother in a dream stands for care, comfort and where you come from. It may be your own mother, or the part of you that nurtures and protects.",
      "A warm mother suggests you feel safe and cared for. A distant or angry one asks where you lack comfort, or what you still need to settle with the past. Becoming a mother in a dream speaks of taking on care for something new.",
    ],
  },
  {
    slug: "father",
    title: "Father",
    terms: "dad papa fatherhood parent",
    short:
      "A father in a dream stands for authority, protection and rules. His mood shows how you feel about your own strength and limits.",
    paragraphs: [
      "A father in a dream stands for authority, guidance and protection. It may be your own father, or the voice inside you that sets rules and limits.",
      "A kind, steady father suggests confidence and support. A stern or absent one asks where you feel judged, or where you lack guidance. Facing him calmly often means you are claiming your own authority.",
    ],
  },
  {
    slug: "spider",
    title: "Spider",
    terms: "spiders web cobweb insect",
    short:
      "A spider stands for patience, creativity and being caught in a tangle. It asks whether you are weaving or being trapped.",
    paragraphs: [
      "Spiders in dreams carry two meanings: patient creation and entanglement. The web can be your own careful work, or a situation you feel stuck in.",
      "A spider calmly weaving suggests a plan taking shape. A spider that frightens you, or a web you cannot leave, asks what has caught you and what you can cut free.",
    ],
  },
  {
    slug: "bird",
    title: "Bird",
    terms: "birds feathers wings sky nest owl dove crow",
    short:
      "Birds stand for freedom and messages. Their kind and mood show what news or wish is moving in you.",
    paragraphs: [
      "Birds in dreams stand for freedom, hope and messages. Their song, flight and kind add detail: a dove for peace, an owl for wisdom, a crow for a warning or a change.",
      "A bird in flight suggests a wish rising. A caged bird speaks of feeling confined; a bird that comes into your home is often a message you are being asked to notice.",
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
  return Array.from(groups.entries()).map(([letter, dreams]) => ({ letter, dreams }));
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
