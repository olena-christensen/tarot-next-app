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
  {
    slug: "hair",
    title: "Hair",
    terms: "haircut hair loss bald braid long hair cutting",
    short:
      "Hair stands for strength, vanity and how you present yourself. Cutting or losing it speaks of change, or of fear of losing control.",
    paragraphs: [
      "Hair in a dream stands for vitality, pride and the image you show the world. Long, healthy hair suggests confidence; tangled or dull hair points to something that feels out of order.",
      "Cutting hair often marks a wish for a fresh start. Losing it speaks of worry about ageing, status or control. Brushing or braiding it says you are putting something in order.",
    ],
  },
  {
    slug: "bear",
    title: "Bear",
    terms: "bears grizzly cub wild animal",
    short:
      "A bear stands for raw strength, protection and anger held in. It asks whether you are facing a power or being faced by one.",
    paragraphs: [
      "A bear in a dream stands for great strength, fierce protection and sometimes anger that has not found a voice. It can be a threat or a guardian, depending on how it behaves.",
      "A bear that chases you points to a pressure you have not yet faced. A calm bear, or one you stand beside, says you are learning to hold your own power without fear.",
    ],
  },
  {
    slug: "horse",
    title: "Horse",
    terms: "horses riding stallion mare pony gallop",
    short:
      "A horse stands for freedom, drive and the energy that carries you forward. How you ride it shows how you handle your own power.",
    paragraphs: [
      "A horse in a dream stands for energy, freedom and the drive that carries you through life. It also speaks of pride and of passions you are learning to steer.",
      "Riding with ease says you are in command of your path. A horse that bolts or throws you asks where your drive has run ahead of your control. A white or gentle horse is a good sign.",
    ],
  },
  {
    slug: "lion",
    title: "Lion",
    terms: "lions lioness big cat pride king",
    short:
      "A lion stands for courage, pride and authority. Meeting one calmly says you are claiming your own strength.",
    paragraphs: [
      "A lion in a dream stands for courage, pride and natural authority. It can be your own strength, or a powerful person in your life.",
      "Facing a lion without fear says you are finding your courage. Running from one suggests a power you feel unready to meet. A lion at rest is a sign of strength that does not need to prove itself.",
    ],
  },
  {
    slug: "crocodile",
    title: "Crocodile",
    terms: "crocodiles alligator reptile river jaws",
    short:
      "A crocodile stands for a danger that hides below the surface, or for a person who seems calm but is not safe.",
    paragraphs: [
      "A crocodile in a dream stands for a danger you cannot quite see: something patient and hidden that may strike when you are least ready.",
      "It often points to a person or a situation that looks calm but feels unsafe. Escaping one says you are sensing the risk in time. Watching one from a distance asks what you have decided not to look at.",
    ],
  },
  {
    slug: "flood",
    title: "Flood",
    terms: "flooding flooded rising water tsunami wave drowning",
    short:
      "A flood stands for feelings or demands that have grown too big to hold back. It asks what has been rising while you looked away.",
    paragraphs: [
      "A flood in a dream stands for feelings, worries or demands that have grown beyond what you can hold back. It often comes in a time of overload.",
      "Watching the water from safety says you are aware of the pressure and still in control. Being swept along asks what you need to let go of. Water that drains away is a sign of relief.",
    ],
  },
  {
    slug: "storm",
    title: "Storm",
    terms: "thunder lightning wind hurricane tornado thunderstorm",
    short:
      "A storm stands for conflict and upheaval, inside you or around you. It often clears the air before something calmer.",
    paragraphs: [
      "A storm in a dream stands for conflict, upheaval and strong feeling, inside you or in your surroundings. It can mirror a hard time you are going through.",
      "Sheltering safely says you trust that you will come through. Being caught in the open asks where you feel unprotected. A storm that passes and leaves clear sky is a promise of calm after trouble.",
    ],
  },
  {
    slug: "door",
    title: "Door",
    terms: "doors doorway gate entrance locked open knock threshold",
    short:
      "A door stands for a chance or a choice. Open, closed or locked, it shows how ready you feel to step through.",
    paragraphs: [
      "A door in a dream stands for a chance, a choice or a new stage. What is behind it matters less than how you feel standing in front of it.",
      "An open door is an invitation. A locked one asks what is keeping you out, or keeping you in. Knocking says you are waiting for permission that you may be able to give yourself.",
    ],
  },
  {
    slug: "stairs",
    title: "Stairs",
    terms: "staircase steps climbing ladder escalator up down",
    short:
      "Stairs stand for progress. Going up speaks of effort and growth; going down of looking deeper into yourself.",
    paragraphs: [
      "Stairs in a dream stand for progress, one step at a time. Climbing shows effort and ambition; how tiring it feels shows how you view the work ahead.",
      "Going down is not a loss: it often means looking deeper into something, a feeling or a memory. Stairs that end suddenly or never finish ask whether the goal has been clear to you.",
    ],
  },
  {
    slug: "knife",
    title: "Knife",
    terms: "knives blade stab cut sharp dagger weapon",
    short:
      "A knife stands for a decision that cuts, or for anger and hurt words. It asks what needs to be separated or said.",
    paragraphs: [
      "A knife in a dream stands for a sharp decision: something you need to cut away, or words that cut. It can also carry anger that has not been spoken.",
      "Holding the knife suggests you are ready to act or to end something. Being threatened with one points to a sharp criticism or fear. It rarely means real violence.",
    ],
  },
  {
    slug: "hands",
    title: "Hands",
    terms: "hand fingers palm arm holding touch",
    short:
      "Hands stand for what you do and how you reach others. Their state shows how capable and connected you feel.",
    paragraphs: [
      "Hands in a dream stand for action, skill and the way you reach out to people. Strong, clean hands say you feel capable of what lies ahead.",
      "Hurt, bound or missing hands point to a feeling of being unable to act. Holding someone's hand speaks of trust and closeness. Washing your hands asks what you wish to be free of.",
    ],
  },
  {
    slug: "tree",
    title: "Tree",
    terms: "trees roots branches leaves oak growing orchard",
    short:
      "A tree stands for growth, roots and the long view. Its health shows how steady and nourished you feel.",
    paragraphs: [
      "A tree in a dream stands for growth, family roots and a life built over time. Its state reflects how steady and nourished you feel.",
      "A tall, green tree is a good sign of strength and progress. A bare or fallen tree asks what needs care or has run its course. Climbing a tree speaks of seeking a wider view.",
    ],
  },
  {
    slug: "flowers",
    title: "Flowers",
    terms: "flower blossom bouquet garden rose bloom petals",
    short:
      "Flowers stand for beauty, affection and things coming into bloom. Fresh ones are hopeful; wilted ones ask what needs tending.",
    paragraphs: [
      "Flowers in a dream stand for beauty, affection and something coming into bloom: a friendship, a plan, a gentler time.",
      "Fresh, bright flowers are a hopeful sign. Wilted ones ask what has been left without care. Receiving flowers speaks of being valued; giving them, of the warmth you wish to share.",
    ],
  },
  {
    slug: "moon",
    title: "Moon",
    terms: "moonlight full moon crescent night lunar",
    short:
      "The moon stands for intuition, cycles and what is hidden by day. A bright moon is a good sign for inner knowing.",
    paragraphs: [
      "The moon in a dream stands for intuition, feeling and the cycles of life. It lights what is hidden by day and invites you to trust what you sense.",
      "A full, bright moon says your inner voice is clear. A dim or hidden moon asks you to wait before deciding. A moon that changes shape speaks of a change that comes in its own time.",
    ],
  },
  {
    slug: "sun",
    title: "Sun",
    terms: "sunlight sunshine sunrise sunset daylight bright",
    short:
      "The sun stands for clarity, warmth and success. Seeing it clearly is a good sign; too much of it can mean pressure.",
    paragraphs: [
      "The sun in a dream stands for clarity, warmth and vitality. It is one of the most hopeful dream signs, a hint that things are coming into the light.",
      "Sunrise speaks of a new beginning; sunset, of a quiet ending. A scorching sun asks where you feel too exposed or pressed. Clouds clearing from the sun promise relief.",
    ],
  },
  {
    slug: "train",
    title: "Train",
    terms: "trains railway station railroad track platform subway",
    short:
      "A train stands for the path of your life. Whether you are on it, late for it or watching it go shows how you feel about your direction.",
    paragraphs: [
      "A train in a dream stands for the path your life is taking, along rails you may not have chosen. The journey shows how you feel about your direction.",
      "Riding smoothly says you are on course. Missing the train speaks of a feared lost chance. Being on the wrong train asks whether your path still suits you.",
    ],
  },
  {
    slug: "hospital",
    title: "Hospital",
    terms: "doctor nurse patient sick ill surgery clinic medicine",
    short:
      "A hospital stands for healing and a need for care. It often appears when you are worn down or need rest.",
    paragraphs: [
      "A hospital in a dream stands for healing, care and the need to recover. It often appears when you are worn down, or a part of life needs mending.",
      "Being the patient asks where you need rest or help. Visiting someone speaks of concern for them. Leaving the hospital well is a sign that recovery is coming. It is not a medical warning.",
    ],
  },
  {
    slug: "school",
    title: "School",
    terms: "classroom teacher lesson student class homework university",
    short:
      "School stands for lessons, being judged and old habits of self-doubt. It asks what you are still learning.",
    paragraphs: [
      "School in a dream stands for learning, being judged and the habits of self-doubt that start in childhood. It often returns when life sets you a new test.",
      "Feeling lost in class or unready speaks of fear of falling short. Enjoying the lesson says you are open to learning. It asks what lesson life is putting before you now.",
    ],
  },
  {
    slug: "key",
    title: "Key",
    terms: "keys lock locked unlock keyhole found lost",
    short:
      "A key stands for access and answers. Finding one is a good sign; losing one speaks of feeling shut out.",
    paragraphs: [
      "A key in a dream stands for access, solutions and trust. It suggests the answer you need may already be within reach.",
      "Finding a key says an opening is coming. Losing one, or a key that does not fit, speaks of feeling shut out or unsure which choice to make. Giving a key shows trust.",
    ],
  },
  {
    slug: "bed",
    title: "Bed",
    terms: "bedroom sleeping pillow blanket mattress rest",
    short:
      "A bed stands for rest, privacy and closeness. Its state shows how safe and rested you feel.",
    paragraphs: [
      "A bed in a dream stands for rest, privacy and closeness. Its state reflects how safe and rested you feel in your own life.",
      "A made, comfortable bed says you feel at ease. A messy, strange or occupied bed asks where your rest or privacy is disturbed. Being unable to sleep speaks of a mind that will not settle.",
    ],
  },
  {
    slug: "graveyard",
    title: "Graveyard",
    terms: "cemetery grave graves tomb tombstone gravestone burial",
    short:
      "A graveyard stands for endings you are still carrying and for memory. It asks what you are ready to lay to rest.",
    paragraphs: [
      "A graveyard in a dream stands for memory, endings and things you have not yet laid to rest. It rarely speaks of real death; more often of a past chapter, a loss or a habit you still visit.",
      "Walking through one calmly says you are making peace with something. Feeling afraid there asks what you avoid remembering. A well-kept graveyard is a gentle sign of respect for where you came from.",
    ],
  },
  {
    slug: "mouse",
    title: "Mouse",
    terms: "mice small pest",
    short:
      "A mouse stands for small worries that nibble at you. Seeing it clearly is the first step to dealing with it.",
    paragraphs: [
      "A mouse in a dream stands for small troubles: petty worries, minor annoyances and details that quietly eat away at your peace.",
      "A mouse running off says a nuisance will pass. Catching one speaks of dealing with a problem at last. Many mice ask whether small things have piled up into something you can no longer ignore.",
    ],
  },
  {
    slug: "wolf",
    title: "Wolf",
    terms: "wolves pack howl",
    short:
      "A wolf stands for instinct, loyalty and a wary kind of danger. Whether it hunts you or walks beside you changes the message.",
    paragraphs: [
      "A wolf in a dream stands for instinct, independence and the pull of the pack. It can be a threat, or a wild part of yourself you are learning to trust.",
      "A wolf that stalks you points to someone or something you do not trust. A wolf that stays calm, or walks with you, says your instincts are sound. A howling wolf speaks of a longing to belong.",
    ],
  },
  {
    slug: "elephant",
    title: "Elephant",
    terms: "elephants trunk",
    short:
      "An elephant stands for strength, memory and steady wisdom. It also points to something large in the room that nobody names.",
    paragraphs: [
      "An elephant in a dream stands for strength, a long memory and calm wisdom. It is a protective sign, often tied to someone dependable in your life.",
      "A gentle elephant is a good omen of support and good fortune. An angry or charging one asks what heavy matter you have been avoiding. An elephant in a small room speaks of a problem everyone sees and no one mentions.",
    ],
  },
  {
    slug: "monkey",
    title: "Monkey",
    terms: "monkeys ape apes chimpanzee",
    short:
      "A monkey stands for play, mischief and restless thoughts. It can point to someone who is not as honest as they seem.",
    paragraphs: [
      "A monkey in a dream stands for play, curiosity and mischief. It can also stand for a busy, jumping mind that will not settle on one thing.",
      "A playful monkey is a light, happy sign. A thieving or teasing one points to someone who is not quite honest with you, or to your own habit of avoiding serious things. Being chased by monkeys asks what small matters are wearing you down.",
    ],
  },
  {
    slug: "frog",
    title: "Frog",
    terms: "frogs toad toads pond",
    short:
      "A frog stands for change and renewal. It often appears when something in your life is about to transform.",
    paragraphs: [
      "A frog in a dream stands for change, cleansing and renewal. It moves between water and land, and so it often appears when you are between one phase of life and the next.",
      "A frog leaping forward says a change is coming and will go well. A frog that is hidden or croaking loudly asks what you have been unwilling to say. Many frogs are a sign of growth and good luck.",
    ],
  },
  {
    slug: "ring",
    title: "Ring",
    terms: "rings jewelry jewellery engagement finger lost found",
    short:
      "A ring stands for commitment, promises and bonds. Its state shows how you feel about the tie it stands for.",
    paragraphs: [
      "A ring in a dream stands for commitment, a promise or a bond with another person. It is a circle, and so it also speaks of things that continue.",
      "Wearing a ring with pride says you value a tie in your life. Losing one speaks of fear of losing a connection. A broken or tight ring asks whether a promise still fits you.",
    ],
  },
  {
    slug: "shoes",
    title: "Shoes",
    terms: "shoe boots sandals barefoot feet footwear",
    short:
      "Shoes stand for the path you are on and how ready you feel for it. Missing or ill-fitting ones speak of unease.",
    paragraphs: [
      "Shoes in a dream stand for the path you are walking and your readiness for it. They speak of direction, status and how steady your steps feel.",
      "New, comfortable shoes say you are ready for what is ahead. Lost, worn-out or ill-fitting shoes ask where your path feels wrong. Going barefoot can mean freedom, or feeling unprepared.",
    ],
  },
  {
    slug: "clothes",
    title: "Clothes",
    terms: "clothing dress dressed coat shirt wardrobe outfit",
    short:
      "Clothes stand for the face you show the world. Their state shows how comfortable you are in your own role.",
    paragraphs: [
      "Clothes in a dream stand for the role you play and the image you show others. They speak of how comfortable you are being seen the way you are.",
      "Fine, well-fitting clothes say you feel confident. Torn, dirty or wrong clothes ask where you feel exposed or out of place. Changing clothes speaks of a change in how you see yourself.",
    ],
  },
  {
    slug: "kitchen",
    title: "Kitchen",
    terms: "cooking cook food meal stove oven dinner",
    short:
      "A kitchen stands for nourishment and the care you give or need. A warm one is a good sign for home and health.",
    paragraphs: [
      "A kitchen in a dream stands for nourishment, care and the heart of home. It speaks of what feeds you, in body, feeling and company.",
      "A warm, busy kitchen is a good sign of comfort and closeness. An empty or untidy one asks where you feel under-nourished. Cooking for others speaks of your wish to give care.",
    ],
  },
  {
    slug: "window",
    title: "Window",
    terms: "windows glass broken open view",
    short:
      "A window stands for outlook and opportunity. What you see through it shows how you view what lies ahead.",
    paragraphs: [
      "A window in a dream stands for your outlook: how you see the world, and how the world is able to see you. It is a way of looking without yet stepping through.",
      "An open window says new chances are near. A closed or cracked one speaks of a view that feels blocked. Looking in from outside asks where you feel left out.",
    ],
  },
  {
    slug: "road",
    title: "Road",
    terms: "path street highway journey way crossroads",
    short:
      "A road stands for the course of your life. Its state shows how smooth or unsure the way ahead feels.",
    paragraphs: [
      "A road in a dream stands for the course of your life and the choices that shape it. How it looks mirrors how you feel about where you are going.",
      "A clear, straight road says you are on course. A rough, dark or forking one asks which way you should choose. A road that ends abruptly speaks of a plan that needs rethinking.",
    ],
  },
  {
    slug: "mountain",
    title: "Mountain",
    terms: "mountains hill hills climb climbing peak summit",
    short:
      "A mountain stands for a goal and the effort to reach it. How the climb feels shows how you see your own challenge.",
    paragraphs: [
      "A mountain in a dream stands for a goal, a challenge or a long effort. It asks how much you want to arrive, and what you are willing to carry on the way.",
      "Climbing steadily says you will get there. Struggling or slipping asks whether the goal is too heavy for now. Standing at the summit is a sign of achievement and a wider view.",
    ],
  },
  {
    slug: "river",
    title: "River",
    terms: "rivers stream creek current bank",
    short:
      "A river stands for the flow of your life. A calm current is ease; a rough one speaks of change you cannot slow.",
    paragraphs: [
      "A river in a dream stands for the flow of your life and the changes that carry you along. It moves in one direction, and so it speaks of time.",
      "A clear, steady river says life is flowing well. A muddy or fast one points to trouble or change you cannot control. Crossing a river speaks of passing from one stage of life to another.",
    ],
  },
  {
    slug: "island",
    title: "Island",
    terms: "islands beach shore alone isolated desert",
    short:
      "An island stands for solitude and a place apart. It can be refuge or loneliness, depending on how it feels.",
    paragraphs: [
      "An island in a dream stands for solitude and a place set apart from everyday life. It speaks of the need to be by yourself, or of feeling cut off from others.",
      "A peaceful island says you need rest and quiet. Being stranded on one asks where you feel alone or out of reach. Leaving an island speaks of rejoining the world.",
    ],
  },
  {
    slug: "earthquake",
    title: "Earthquake",
    terms: "quake tremor shaking collapse ruins",
    short:
      "An earthquake stands for a sudden shake to what you thought was solid. It asks what is built on weak ground.",
    paragraphs: [
      "An earthquake in a dream stands for a sudden shock to the things you thought were solid: a job, a home, a belief or a relationship.",
      "Surviving it says you will weather the change. Watching things fall asks what was built on weak ground. A quake that passes and leaves you steady speaks of strength you did not know you had.",
    ],
  },
  {
    slug: "war",
    title: "War",
    terms: "battle fight fighting soldier soldiers weapon gun",
    short:
      "War stands for inner or outer conflict. It asks where you are fighting, and whether the fight is yours.",
    paragraphs: [
      "War in a dream stands for conflict, inside you or around you. It often appears when you feel pulled in two directions, or under pressure from others.",
      "Fighting in it speaks of a struggle you are engaged in. Watching from afar asks what conflict you are avoiding. Peace after war is a hopeful sign that a long struggle is nearing its end.",
    ],
  },
  {
    slug: "police",
    title: "Police",
    terms: "officer cop cops arrest arrested prison jail law",
    short:
      "Police stand for rules, guilt and authority. They ask whether you are being protected or judged, by others or yourself.",
    paragraphs: [
      "Police in a dream stand for rules, authority and your own inner judge. They often appear when you feel guilty, watched or in need of protection.",
      "Being arrested without cause speaks of feeling unfairly blamed. Being helped by police says you feel supported. Running from them asks what you are trying to avoid facing.",
    ],
  },
  {
    slug: "airplane",
    title: "Airplane",
    terms: "aeroplane plane flight airport jet crash landing",
    short:
      "An airplane stands for ambition and a big change of direction. A smooth flight is a good sign; turbulence speaks of doubt.",
    paragraphs: [
      "An airplane in a dream stands for ambition, travel and a big step toward a goal. It carries you far, but you are not the one at the controls.",
      "A smooth flight says you trust where you are headed. Turbulence or a crash asks where you fear losing control. Missing a flight speaks of a chance you feel you let slip.",
    ],
  },
  {
    slug: "phone",
    title: "Phone",
    terms: "telephone call calling mobile cell message text",
    short:
      "A phone stands for contact and messages you want to send or receive. A call that fails speaks of a gap in communication.",
    paragraphs: [
      "A phone in a dream stands for contact, messages and the wish to be heard. It often appears when something needs to be said or answered.",
      "Receiving a call can bring news or a message from your own mind. A phone that will not work, or numbers you cannot dial, speak of a struggle to reach someone. A ringing phone you ignore asks what you avoid hearing.",
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
