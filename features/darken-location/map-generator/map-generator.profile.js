function hashStringToSeed(...parts) {
  const text = parts.join("::");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function regionDepthScore(region, seed) {
  const text = `${region.role} ${region.tags.join(" ")}`.toLowerCase();
  if (region.isEntrance || text.includes("entrance") || text.includes("threshold")) return 0;
  if (text.includes("connector") || text.includes("corridor")) return 20;
  if (text.includes("clue")) return 35;
  if (text.includes("hazard")) return 45;
  if (text.includes("main") || text.includes("setpiece")) return 60;
  if (text.includes("outcome") || text.includes("reward")) return 75;
  if (text.includes("secret") || text.includes("lore")) return 90;
  return 45 + (hashStringToSeed(seed, region.id, "depth") % 15);
}

export function roleDepth(region) {
  if (Number.isFinite(region.graphDepth)) return clamp(region.graphDepth, 0, 6);
  const text = `${region.role} ${region.tags.join(" ")}`.toLowerCase();
  if (region.isEntrance || text.includes("entrance") || text.includes("threshold")) return 0;
  if (text.includes("connector") || text.includes("corridor")) return 1;
  if (text.includes("clue")) return 2;
  if (text.includes("hazard")) return 3;
  if (text.includes("main") || text.includes("setpiece")) return 4;
  if (text.includes("reward") || text.includes("outcome")) return 5;
  if (text.includes("secret") || text.includes("lore")) return 6;
  return 3;
}

export function getRegionText(region) {
  return `${region.role || ""} ${(region.tags || []).join(" ")} ${(region.sourceAnchors || []).join(" ")}`.toLowerCase();
}

export function classifyRegion(region) {
  const text = getRegionText(region);
  return {
    entrance: Boolean(region.isEntrance || text.includes("entrance") || text.includes("threshold") || text.includes("start")),
    exit: Boolean(region.isExit || text.includes("exit") || text.includes("escape")),
    connector: Boolean(text.includes("connector") || text.includes("corridor") || text.includes("passage") || text.includes("tunnel")),
    clue: Boolean(text.includes("clue") || text.includes("investigation") || text.includes("evidence")),
    hazard: Boolean(text.includes("hazard") || text.includes("danger") || text.includes("trap") || text.includes("collapse")),
    climax: Boolean(text.includes("climax") || text.includes("main") || text.includes("setpiece") || text.includes("boss") || text.includes("final")),
    outcome: Boolean(text.includes("outcome") || text.includes("reward") || text.includes("revelation") || text.includes("escape")),
    secret: Boolean(region.secret || text.includes("secret") || text.includes("hidden") || text.includes("lore")),
    loop: Boolean(text.includes("loop") || text.includes("return") || text.includes("false return")),
  };
}

export function getContextKey(context) {
  const text = String(context || "").toLowerCase();
  if (text.includes("chapel") || text.includes("church") || text.includes("temple")) return "chapel";
  if (text.includes("cave") || text.includes("cavern")) return "cave";
  if (text.includes("mine") || text.includes("shaft")) return "mine";
  if (text.includes("noble") || text.includes("house") || text.includes("manor")) return "noble-house";
  if (text.includes("ruin")) return "ruins";
  return "crypt";
}

export function getPlacementProfile(config) {
  const key = getContextKey(config.context || config.biome);
  const profiles = {
    crypt: {
      key,
      directRoomLinks: false,
      mazeBias: 0.15,
      loopBudgetMultiplier: 0.2,
      sideLoopChance: 0.15,
      corridorOverlapPenalty: 5.8,
      adjacentCorridorPenalty: 1.15,
      turnCost: 2.1,
      wallPenalty: 1.7,
      doorCenterBias: 2.4,
      spread: 4.8,
      branchSpread: 6.2,
      depthJitter: 1.25,
      lateralJitter: 2.4,
      compactness: 0.74,
      roleLane: { entrance: 0, connector: 0, clue: -1, hazard: 1, final: 0, secret: 1.6, side: -1.25 },
      roleDepthBias: { entrance: 0, connector: 0.1, clue: 0.2, hazard: 0.35, final: 0.75, secret: 1.05, side: 0.25 },
    },
    chapel: {
      key,
      directRoomLinks: true,
      mazeBias: 0.04,
      loopBudgetMultiplier: 0,
      sideLoopChance: 0,
      corridorOverlapPenalty: 9.5,
      adjacentCorridorPenalty: 1.85,
      turnCost: 2.2,
      wallPenalty: 1.6,
      doorCenterBias: 4.8,
      spread: 5.2,
      branchSpread: 5.4,
      depthJitter: 0.8,
      lateralJitter: 1.8,
      compactness: 0.82,
      roleLane: { entrance: 0, connector: 0, clue: -1.35, hazard: 1.25, final: 0, secret: 1.75, side: -1.15 },
      roleDepthBias: { entrance: 0, connector: 0.05, clue: 0.22, hazard: 0.28, final: 0.95, secret: 0.7, side: 0.18 },
    },
    cave: {
      key,
      directRoomLinks: true,
      mazeBias: 0.12,
      loopBudgetMultiplier: 0.28,
      sideLoopChance: 0.22,
      corridorOverlapPenalty: 0.6,
      adjacentCorridorPenalty: 0.08,
      turnCost: 1.45,
      wallPenalty: 0.8,
      doorCenterBias: 0.45,
      spread: 3.4,
      branchSpread: 3.8,
      depthJitter: 0.9,
      lateralJitter: 1.4,
      compactness: 0.9,
      roleLane: { entrance: -0.15, connector: 0, clue: -0.55, hazard: 0.65, final: 0.2, secret: -0.9, side: 0.85 },
      roleDepthBias: { entrance: 0, connector: 0.04, clue: 0.12, hazard: 0.2, final: 0.32, secret: 0.4, side: 0.16 },
    },
    mine: {
      key,
      directRoomLinks: false,
      mazeBias: 0.42,
      loopBudgetMultiplier: 0.7,
      sideLoopChance: 0.55,
      corridorOverlapPenalty: 1.65,
      adjacentCorridorPenalty: 0.35,
      turnCost: 1.65,
      wallPenalty: 1.1,
      doorCenterBias: 1.15,
      spread: 7,
      branchSpread: 8,
      depthJitter: 1.7,
      lateralJitter: 3.8,
      compactness: 0.5,
      roleLane: { entrance: 0, connector: 0, clue: -1, hazard: 1.2, final: 0.35, secret: -1.7, side: 1.55 },
      roleDepthBias: { entrance: 0, connector: 0.18, clue: 0.22, hazard: 0.48, final: 0.75, secret: 0.82, side: 0.32 },
    },
    "noble-house": {
      key,
      directRoomLinks: true,
      mazeBias: 0.05,
      loopBudgetMultiplier: 0,
      sideLoopChance: 0,
      corridorOverlapPenalty: 9.0,
      adjacentCorridorPenalty: 1.6,
      turnCost: 2.15,
      wallPenalty: 1.55,
      doorCenterBias: 4.2,
      spread: 5.8,
      branchSpread: 5.2,
      depthJitter: 0.95,
      lateralJitter: 2.1,
      compactness: 0.78,
      roleLane: { entrance: 0, connector: 0, clue: -1.1, hazard: 1.1, final: 0, secret: 1.65, side: -1.5 },
      roleDepthBias: { entrance: 0, connector: 0.05, clue: 0.2, hazard: 0.4, final: 0.68, secret: 0.55, side: 0.24 },
    },
    ruins: {
      key,
      directRoomLinks: false,
      mazeBias: 0.34,
      loopBudgetMultiplier: 0.55,
      sideLoopChance: 0.45,
      corridorOverlapPenalty: 2.8,
      adjacentCorridorPenalty: 0.65,
      turnCost: 1.9,
      wallPenalty: 1.25,
      doorCenterBias: 1.6,
      spread: 6.8,
      branchSpread: 7.6,
      depthJitter: 1.8,
      lateralJitter: 3.8,
      compactness: 0.6,
      roleLane: { entrance: -0.2, connector: 0, clue: -1.3, hazard: 1.2, final: 0.55, secret: -1.65, side: 1.55 },
      roleDepthBias: { entrance: 0, connector: 0.1, clue: 0.18, hazard: 0.42, final: 0.72, secret: 0.75, side: 0.28 },
    },
  };
  return profiles[key] || profiles.crypt;
}

export function getPlacementRole(region) {
  if (region.graphRole) return region.graphRole;
  const flags = classifyRegion(region);
  if (flags.entrance) return "entrance";
  if (flags.secret) return "secret";
  if (flags.climax || flags.outcome || flags.exit) return "final";
  if (flags.hazard) return "hazard";
  if (flags.clue) return "clue";
  if (flags.connector) return "connector";
  return "side";
}

export function getMapAccessIntent(region, contextKey) {
  const flags = classifyRegion(region);
  const text = getRegionText(region);
  const role = getPlacementRole(region);

  if (flags.entrance) return { type: "entrance", priority: 0, label: "IN" };
  if (region.isExit || flags.exit || text.includes("escape") || text.includes("egress")) return { type: "exit", priority: 1, label: "OUT" };
  if (flags.outcome && !flags.secret) return { type: "exit", priority: 2, label: "OUT" };
  if ((contextKey === "mine" || contextKey === "cave" || contextKey === "ruins") && (flags.connector || role === "connector" || text.includes("tunnel") || text.includes("passage"))) {
    return { type: "passage", priority: 5, label: "PASS" };
  }
  return null;
}

export function getFallbackMapAccessIntent(region, generatedMap) {
  const contextKey = getContextKey(generatedMap.config.context || generatedMap.config.biome);
  return getMapAccessIntent(region, contextKey) || { type: "passage", priority: 9, label: "PASS" };
}

export function getRegionSemanticFlags(region) {
  const text = `${region.role || ""} ${(region.tags || []).join(" ")} ${(region.sourceAnchors || []).join(" ")} ${region.name || ""} ${region.roomType || ""} ${region.shape || ""}`.toLowerCase();
  return {
    archive: text.includes("archive") || text.includes("library") || text.includes("book") || text.includes("biblio"),
    crypt: text.includes("crypt") || text.includes("ossuary") || text.includes("tomb") || text.includes("bone") || text.includes("ribcage") || text.includes("death"),
    hazard: text.includes("hazard") || text.includes("collapse") || text.includes("trap") || text.includes("danger"),
    clue: text.includes("clue") || text.includes("evidence") || text.includes("investigation") || text.includes("mask"),
    outcome: text.includes("outcome") || text.includes("reward") || text.includes("revelation") || text.includes("final") || text.includes("main"),
    vertical: text.includes("shaft") || text.includes("well") || text.includes("vertical"),
    fog: text.includes("fog") || text.includes("mist"),
    water: text.includes("water") || text.includes("flood") || text.includes("pool"),
    ritual: text.includes("altar") || text.includes("ritual") || text.includes("chapel") || text.includes("religious"),
    ruined: text.includes("ruin") || text.includes("broken") || text.includes("collapsed") || text.includes("rubble"),
    kitchen: text.includes("kitchen"),
  };
}
