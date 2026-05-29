export const SOURCE_ANCHORS = [
  "Any Source",
  "Towers of Silence",
  "Sedlec Ossuary",
  "Mortuary Totems",
  "Mustard Gas",
  "The Mist",
  "Endocannibalism",
  "Genetic Mutations",
  "Crucifixion",
  "Impalement",
  "Wax Death Masks",
  "Anthropodermic Bibliopegy",
  "Decomposition",
  "Wolf Spiders",
  "Jikininki",
  "Gashadokuro",
];
export const SOURCE_TYPES = [
  "Any Type",
  ...[
    "Animal Behavior",
    "Biological Process",
    "Funerary Practice",
    "Historical Object",
    "Historical Site",
    "Literary Inspiration",
    "Medical / Genetic Concept",
    "Punitive Practice",
    "Weapon",
    "Yokai / Japanese Folklore",
  ].sort((a, b) => a.localeCompare(b)),
];
export const THEMES = [
  "ancestral memory",
  "collective resentment",
  "corpse hunger",
  "corpse transformation",
  "devotional bonework",
  "forbidden preservation",
  "funerary taboo",
  "heritable corruption",
  "maternal swarm",
  "post-mortem likeness",
  "predatory enclosure",
  "public martyrdom",
  "ritual exposure",
  "vertical execution",
  "weaponized air",
].sort((a, b) => a.localeCompare(b));

export const SOURCE_DETAILS = {
  "Towers of Silence": {
    sourceType: "Funerary Practice",
    themes: [
      "ritual exposure",
      "funerary taboo",
      "purification failure",
      "vertical death",
    ],
    motifs: [
      "exposure",
      "sun",
      "vultures",
      "ritual purity",
      "refused burial",
      "bone dust",
    ],
    logic:
      "Funerary exposure becomes a vertical dungeon language of sun, carrion, judgment, ritual purity, and bodies that refuse completion.",
  },
  "Sedlec Ossuary": {
    sourceType: "Historical Site",
    themes: [
      "devotional bonework",
      "anonymous dead",
      "sacred ornament",
      "mass mortality",
    ],
    motifs: [
      "bone chandeliers",
      "skull garlands",
      "bone architecture",
      "saintly geometry",
      "anonymous remains",
    ],
    logic:
      "The arrangement of human remains as sacred ornament becomes hostile architecture, devotional pressure, and evidence that the dead have been made decorative.",
  },
  "Mortuary Totems": {
    sourceType: "Funerary Practice",
    themes: [
      "ancestral memory",
      "taboo boundary",
      "carved guardianship",
      "lineage pressure",
    ],
    motifs: [
      "carved faces",
      "ancestor poles",
      "watchful wood",
      "boundary markers",
      "borrowed eyes",
    ],
    logic:
      "Memorial carving and ancestral guardianship become boundaries that watch, remember blood, and punish trespass without becoming a generic fantasy stereotype.",
  },
  "Mustard Gas": {
    sourceType: "Weapon",
    themes: [
      "weaponized air",
      "delayed harm",
      "war contamination",
      "invisible injury",
    ],
    motifs: [
      "yellow vapor",
      "blistered skin",
      "burning lungs",
      "delayed agony",
      "contaminated cloth",
    ],
    logic:
      "A historical chemical weapon becomes delayed environmental horror: the air wounds first, and the body understands later.",
  },
  "The Mist": {
    sourceType: "Literary Inspiration",
    themes: [
      "predatory enclosure",
      "lost distance",
      "unseen ecosystem",
      "panic in isolation",
    ],
    motifs: [
      "whiteout",
      "muffled voices",
      "returning footsteps",
      "false silhouettes",
      "weather as predator",
    ],
    logic:
      "Mist becomes an enclosure that collapses distance, hides impossible life, and turns survival into a visibility problem.",
  },
  Endocannibalism: {
    sourceType: "Funerary Practice",
    themes: [
      "corpse hunger",
      "funerary taboo",
      "ancestral incorporation",
      "grief made physical",
    ],
    motifs: [
      "ancestor meal",
      "taboo communion",
      "inherited memory",
      "family hunger",
      "ash on the tongue",
    ],
    logic:
      "Ritual incorporation becomes dark fantasy inheritance: the dead are remembered because they are physically carried inside the living.",
  },
  "Genetic Mutations": {
    sourceType: "Medical / Genetic Concept",
    themes: [
      "heritable corruption",
      "recessive horror",
      "bloodline instability",
      "beautiful defect",
    ],
    motifs: [
      "repeated traits",
      "family portraits",
      "extra fingers",
      "stress mutation",
      "corrected genealogy",
    ],
    logic:
      "Mutation and inheritance become family horror, visible lineage, unstable bodies, and the terror of what blood remembers.",
  },
  Crucifixion: {
    sourceType: "Punitive Practice",
    themes: [
      "public martyrdom",
      "ritualized suffering",
      "witnessed punishment",
      "sacred shame",
    ],
    motifs: [
      "nails",
      "raised bodies",
      "witnesses",
      "splintered wood",
      "warm iron",
    ],
    logic:
      "Public execution becomes religious pressure, transferred pain, witness guilt, and terrain that remembers displayed suffering.",
  },
  Impalement: {
    sourceType: "Punitive Practice",
    themes: [
      "vertical execution",
      "tyrant justice",
      "border terror",
      "warning display",
    ],
    motifs: ["stakes", "raised bodies", "crows", "empty poles", "slow descent"],
    logic:
      "Impalement becomes a landscape of warnings: authority, cruelty, borders, and bodies turned into signs.",
  },
  "Wax Death Masks": {
    sourceType: "Historical Object",
    themes: [
      "post-mortem likeness",
      "copied identity",
      "family memory",
      "false ancestor",
    ],
    motifs: [
      "wax face",
      "preserved expression",
      "melting likeness",
      "candle heat",
      "borrowed features",
    ],
    logic:
      "A preserved face becomes a portable identity, a false witness, and a relic that remembers expressions better than the living do.",
  },
  "Anthropodermic Bibliopegy": {
    sourceType: "Historical Object",
    themes: [
      "forbidden preservation",
      "body as text",
      "confession binding",
      "archival violation",
    ],
    motifs: [
      "skin binding",
      "warm pages",
      "birthmarks on leather",
      "marginal scars",
      "named covers",
    ],
    logic:
      "Human-bound books turn knowledge into bodily trespass: the archive reads the reader back.",
  },
  Decomposition: {
    sourceType: "Biological Process",
    themes: [
      "corpse transformation",
      "failed time",
      "organic architecture",
      "post-mortem ecology",
    ],
    motifs: [
      "gas",
      "bloating",
      "skin slippage",
      "grave wax",
      "insect succession",
      "impossible decay",
    ],
    logic:
      "Biological decay becomes pressure, evidence, transformation, contamination, and time out of joint.",
  },
  "Wolf Spiders": {
    sourceType: "Animal Behavior",
    themes: [
      "maternal swarm",
      "burdened body",
      "brood survival",
      "ground predation",
    ],
    motifs: [
      "eye shine",
      "carried young",
      "sudden scatter",
      "ground hunter",
      "vibration",
    ],
    logic:
      "Wolf spider behavior becomes horror about carried young, sudden dispersal, protective violence, and bodies that are also nurseries.",
  },
  Jikininki: {
    sourceType: "Yokai / Japanese Folklore",
    themes: ["corpse hunger", "funerary taboo", "shame", "cursed appetite"],
    motifs: [
      "opened graves",
      "night feeding",
      "chewed remains",
      "monk hunger",
      "grave shame",
    ],
    logic:
      "A corpse-eating spirit becomes a toolkit for shame, failed funerary duty, hunger after death, and graveyard mysteries.",
  },
  Gashadokuro: {
    sourceType: "Yokai / Japanese Folklore",
    themes: [
      "collective resentment",
      "famine dead",
      "unburied bones",
      "giant hunger",
    ],
    motifs: [
      "giant skeleton",
      "rattling teeth",
      "battlefield bones",
      "midnight hunger",
      "assembled dead",
    ],
    logic:
      "The starving skeleton becomes collective death given one body: famine, war, unburied corpses, and hunger large enough to walk.",
  },
};

export const INSPIRATION_ASSET_PROVIDER = "local";

const CRUOR_PUBLIC_BASE_PATH = import.meta.env?.BASE_URL || "/";

/**
 * Base path for public inspiration-card images.
 *
 * The files are stored in:
 *   public/assets/inspiration-cards
 *
 * In local dev they resolve as:
 *   /assets/inspiration-cards
 *
 * On GitHub Pages, with Vite base set to /cruor-games/, they resolve as:
 *   /cruor-games/assets/inspiration-cards
 */
export const INSPIRATION_ASSET_BASE_PATH = `${CRUOR_PUBLIC_BASE_PATH.replace(/\/+$/, "")}/assets/inspiration-cards`;

export function buildInspirationAssetUrl(
  imageKey,
  basePath = INSPIRATION_ASSET_BASE_PATH,
) {
  if (!imageKey) return "";

  const cleanBasePath = String(basePath || "").replace(/\/+$/, "");
  const cleanImageKey = String(imageKey || "").replace(/^\/+/, "");

  return `${cleanBasePath}/${cleanImageKey}`;
}

export function resolveInspirationCardAsset(
  card,
  basePath = INSPIRATION_ASSET_BASE_PATH,
) {
  return {
    ...card,
    imageProvider: card.imageProvider || INSPIRATION_ASSET_PROVIDER,
    imageUrl: buildInspirationAssetUrl(card.imageKey, basePath),
  };
}

export const INSPIRATION_CARD_DEFINITIONS = [
  {
    anchor: "Towers of Silence",
    icon: "fa-tower-observation",
    caption:
      "Funerary exposure, sun, carrion birds, ritual purity, and bodies that refuse completion.",
    imageNote: "Towers of Silence inspiration image.",
    imageKey: "card-tower-of-silence.webp",
  },
  {
    anchor: "Sedlec Ossuary",
    icon: "fa-church",
    caption:
      "Bone chandeliers, skull garlands, sacred ornament, anonymous dead, and devotional architecture made from remains.",
    imageNote: "Sedlec Ossuary inspiration image.",
    imageKey: "card-sedlec-ossuary.webp",
  },
  {
    anchor: "Mortuary Totems",
    icon: "fa-monument",
    caption:
      "Carved memorial guardians, ancestral faces, taboo boundaries, and wood that remembers names and blood.",
    imageNote: "Funerary pole / carved ancestor placeholder.",
    imageKey: "card-mortuary-totem-pole.webp",
  },
  {
    anchor: "Mustard Gas",
    icon: "fa-skull-crossbones",
    caption:
      "Yellow vapor, burning lungs, blistered skin, delayed agony, contaminated cloth, and weaponized air.",
    imageNote: "Mustard Gas inspiration image.",
    imageKey: "card-mustard-gas.webp",
  },
  {
    anchor: "The Mist",
    icon: "fa-smog",
    caption:
      "Fog as predatory enclosure: collapsed distance, muffled voices, false silhouettes, and things hidden by whiteout.",
    imageNote: "The Mist inspiration image.",
    imageKey: "card-the-mist.webp",
  },
  {
    anchor: "Endocannibalism",
    icon: "fa-bowl-food",
    caption:
      "Ancestral incorporation, grief made physical, taboo communion, inherited memory, and hunger inside the family line.",
    imageNote: "Endocannibalism inspiration image.",
    imageKey: "card-endocannibalism.webp",
  },
  {
    anchor: "Genetic Mutations",
    icon: "fa-dna",
    caption:
      "Heritable corruption, recessive horror, repeated traits, unstable inheritance, and bodies that remember bloodlines.",
    imageNote: "Mutation inspiration image.",
    imageKey: "card-mutations.webp",
  },
  {
    anchor: "Crucifixion",
    icon: "fa-cross",
    caption:
      "Raised bodies, nails, witnesses, public suffering, sacred shame, and pain turned into spectacle.",
    imageNote: "Crucifixion inspiration image.",
    imageKey: "card-crucifixion.webp",
  },
  {
    anchor: "Impalement",
    icon: "fa-thumbtack",
    caption:
      "Stakes, warning displays, border terror, tyrant justice, crows, and bodies made into signs.",
    imageNote: "Impalement inspiration image.",
    imageKey: "card-impalement.webp",
  },
  {
    anchor: "Wax Death Masks",
    icon: "fa-masks-theater",
    caption:
      "Preserved expressions, melting likenesses, false ancestors, copied identity, and faces that remember the dead.",
    imageNote: "Wax Death Masks inspiration image.",
    imageKey: "card-wax-death-mask.webp",
  },
  {
    anchor: "Anthropodermic Bibliopegy",
    icon: "fa-book-open",
    caption:
      "Skin-bound books, warm pages, birthmarks on leather, marginal scars, and archives that violate the body.",
    imageNote: "Anthropodermic Bibliopegy inspiration image.",
    imageKey: "card-anthropodermic-bibliopegy.webp",
  },
  {
    anchor: "Decomposition",
    icon: "fa-biohazard",
    caption:
      "Forensic decay, gases, bloating, grave wax, insects, skin slippage, and the strange timeline after death.",
    imageNote: "Decomposition inspiration image.",
    imageKey: "card-decomposition.webp",
  },
  {
    anchor: "Wolf Spiders",
    icon: "fa-spider",
    caption:
      "Eye shine, carried young, sudden scatter, ground hunting, maternal aggression, and bodies that are also nurseries.",
    imageNote: "Wolf Spiders inspiration image.",
    imageKey: "card-wolf-spider.webp",
  },
  {
    anchor: "Jikininki",
    icon: "fa-skull",
    caption:
      "Corpse hunger, funerary taboo, shame, night feeding, opened graves, and cursed appetite after death.",
    imageNote: "Jikininki inspiration image.",
    imageKey: "card-jikininki.webp",
  },
  {
    anchor: "Gashadokuro",
    icon: "fa-bone",
    caption:
      "Giant skeletons, famine dead, battlefield bones, rattling teeth, collective resentment, and unburied hunger.",
    imageNote: "Assembled giant skeleton / battlefield bones placeholder.",
    imageKey: "card-gashadokuro.webp",
  },
];

export const INSPIRATION_CARDS = INSPIRATION_CARD_DEFINITIONS.map((card) =>
  resolveInspirationCardAsset(card),
);
