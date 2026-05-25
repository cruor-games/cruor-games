function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const DEFAULT_CONFIG = {
  seed: "ossuary-042",
  context: "Crypt",
  biome: "Ossuary",
  horror: ["Religious Horror", "Gothic"],
  sourceAnchors: ["Sedlec Ossuary", "Towers of Silence"],
  roomCount: 7,
  gridSize: 20,
  mapWidth: 1000,
  mapHeight: 640,
  showGrid: true,
  mode: "editor",
  visualStyle: "one-page-dungeon",
  gridStyle: "solid",
  regions: [
    {
      id: "region-1",
      name: "Bone-Lit Vestibule",
      role: "Entrance / Threshold",
      preferredShape: "small hall",
      size: "Small",
      connectors: 2,
      tags: ["entrance", "threshold"],
      sourceAnchors: ["Sedlec Ossuary"],
      isEntrance: true,
    },
    {
      id: "region-2",
      name: "Soft-Floored Tunnel",
      role: "Connector",
      preferredShape: "hall",
      size: "Small",
      connectors: 2,
      tags: ["connector", "passage"],
      sourceAnchors: ["Decomposition"],
    },
    {
      id: "region-3",
      name: "Skyless Ossuary Well",
      role: "Setpiece / Vertical Room",
      preferredShape: "shaft",
      size: "Large",
      connectors: 3,
      tags: ["vertical", "setpiece", "hazard"],
      sourceAnchors: ["Towers of Silence"],
    },
    {
      id: "region-4",
      name: "Fog-Return Corridor",
      role: "Loop / False Return",
      preferredShape: "connector corridor-room",
      size: "Small",
      connectors: 3,
      tags: ["loop", "mist", "connector"],
      sourceAnchors: ["The Mist"],
    },
    {
      id: "region-5",
      name: "Mourning Kitchen",
      role: "Clue Room",
      preferredShape: "rect",
      size: "Medium",
      connectors: 1,
      tags: ["clue", "social"],
      sourceAnchors: ["Wax Death Masks"],
    },
    {
      id: "region-6",
      name: "Ribcage Underhall",
      role: "Main Horror Hall",
      preferredShape: "irregular polygon",
      size: "Large",
      connectors: 3,
      tags: ["main", "body horror"],
      sourceAnchors: ["Gashadokuro"],
    },
    {
      id: "region-7",
      name: "Skin-Bound Archive",
      role: "Secret / Lore Room",
      preferredShape: "library/archive-like rectangle",
      size: "Medium",
      connectors: 1,
      tags: ["secret", "lore", "archive"],
      sourceAnchors: ["Anthropodermic Bibliopegy"],
      secret: true,
    },
  ],
};

export const GENERATED_REGION_TEMPLATES = [
  { role: "Hazard Room", preferredShape: "rect", size: "Medium", tags: ["hazard"], sourceAnchors: ["Decomposition"] },
  { role: "Connector", preferredShape: "hall", size: "Small", tags: ["connector"], sourceAnchors: ["The Mist"] },
  { role: "Ambush / Nest", preferredShape: "irregular polygon", size: "Medium", tags: ["ambush", "nest"], sourceAnchors: ["Wolf Spiders"] },
  { role: "Outcome / Reward", preferredShape: "ritual chamber", size: "Medium", tags: ["outcome", "reward"], sourceAnchors: ["Sedlec Ossuary"] },
  { role: "Clue Room", preferredShape: "rect", size: "Small", tags: ["clue"], sourceAnchors: ["Wax Death Masks"] },
];

export function normalizeRoomCount(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), 1, 16);
}

export function normalizeInput(config) {
  const roomCount = normalizeRoomCount(config.roomCount, config.regions?.length || 1);
  const baseRegions = Array.isArray(config.regions) ? config.regions : [];
  const regions = Array.from({ length: roomCount }, (_, index) => {
    const template = GENERATED_REGION_TEMPLATES[index % GENERATED_REGION_TEMPLATES.length];
    const source = baseRegions[index] || template || {};
    const tags = Array.isArray(source.tags) ? source.tags : [];
    return {
      id: source.id || `region-${index + 1}`,
      name: source.name || `Generated Region ${index + 1}`,
      role: source.role || (index === 0 ? "Entrance / Threshold" : "Location Region"),
      preferredShape: source.preferredShape || source.shape || "rect",
      size: source.size || "Medium",
      connectors: Number(source.connectors || (index === 0 ? 2 : 1)),
      tags,
      sourceAnchors: Array.isArray(source.sourceAnchors) ? source.sourceAnchors : [],
      links: Array.isArray(source.links) ? source.links : [],
      isEntrance: Boolean(source.isEntrance || index === 0),
      isExit: Boolean(source.isExit),
      secret: Boolean(source.secret || tags.includes("secret")),
    };
  });

  return {
    ...config,
    seed: config.seed || "cruor-map",
    roomCount,
    gridSize: Number(config.gridSize || 20),
    mapWidth: Number(config.mapWidth || 1000),
    mapHeight: Number(config.mapHeight || 640),
    regions,
    connections: Array.isArray(config.connections) ? config.connections : [],
  };
}
