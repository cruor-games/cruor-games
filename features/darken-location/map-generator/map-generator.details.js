import { getContextKey, getFallbackMapAccessIntent, getMapAccessIntent, getPlacementRole, getRegionSemanticFlags } from "./map-generator.profile.js";
import { cellKey } from "./map-generator.mask.js";
import { getAnchorCenterOffset, getAnchorHandlePoint, getBoundaryCells } from "./map-generator.corridors.js";

function hashStringToSeed(...parts) {
  const text = parts.join("::");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seed) {
  let state = typeof seed === "number" ? seed >>> 0 : hashStringToSeed(String(seed));
  return function rng() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeMapAccessType(value, fallback = "passage") {
  return ["entrance", "exit", "passage"].includes(value) ? value : fallback;
}

export function getMapAccessLabelForType(type) {
  if (type === "entrance") return "IN";
  if (type === "exit") return "OUT";
  return "PASS";
}

export function serializeMapAccessAnchor(anchor) {
  if (!anchor) return null;
  return {
    side: anchor.side,
    cell: { x: anchor.cell.x, y: anchor.cell.y },
  };
}

export function anchorsShareSideAndCell(a, b) {
  return Boolean(a && b) && a.side === b.side && a.cell?.x === b.cell?.x && a.cell?.y === b.cell?.y;
}

export function getExternalBoundaryAnchors(region, generatedMap) {
  const floorSet = new Set(generatedMap.dungeonMask.floorCells.map((cell) => cellKey(cell.x, cell.y)));
  return getBoundaryCells(region).filter((anchor) => !floorSet.has(cellKey(anchor.outsideCell.x, anchor.outsideCell.y)));
}

export function resolveMapAccessAnchor(region, serializedAnchor, generatedMap) {
  const anchors = getExternalBoundaryAnchors(region, generatedMap);
  if (anchors.length === 0) return null;
  if (!serializedAnchor?.cell) return null;
  const exact = anchors.find((anchor) => anchorsShareSideAndCell(anchor, serializedAnchor));
  if (exact) return exact;
  return anchors
    .map((anchor) => {
      const dx = anchor.cell.x - serializedAnchor.cell.x;
      const dy = anchor.cell.y - serializedAnchor.cell.y;
      const sidePenalty = anchor.side === serializedAnchor.side ? 0 : 2;
      return { anchor, score: dx * dx + dy * dy + sidePenalty };
    })
    .sort((a, b) => a.score - b.score)[0]?.anchor || null;
}

export function scoreMapAccessAnchor(anchor, region, generatedMap, intent, index) {
  const point = getAnchorHandlePoint(anchor, generatedMap.config.gridSize);
  const bounds = generatedMap.contentBounds || { x: 0, y: 0, width: generatedMap.config.mapWidth, height: generatedMap.config.mapHeight };
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const vx = point.x - center.x;
  const vy = point.y - center.y;
  const length = Math.hypot(vx, vy) || 1;
  const outward = { x: vx / length, y: vy / length };
  const normalAlignment = 1 - (anchor.normal.x * outward.x + anchor.normal.y * outward.y);
  const centerOffset = getAnchorCenterOffset(anchor, region);
  const roleBias = intent.type === "entrance" && anchor.side === "west" ? -0.35 : intent.type === "exit" && anchor.side === "east" ? -0.25 : 0;
  const jitter = (hashStringToSeed(generatedMap.config.seed, region.id, intent.type, index, anchor.side, anchor.cell.x, anchor.cell.y, "map-access") % 100) / 100;
  return normalAlignment * 8 + centerOffset * 1.6 + roleBias + jitter * 0.5;
}

export function createMapAccessFromAnchor(region, anchor, intent, generatedMap, index) {
  const g = generatedMap.config.gridSize;
  const center = getAnchorHandlePoint(anchor, g);
  const horizontal = anchor.side === "north" || anchor.side === "south";
  const openingHalf = g * 0.43;
  const wallGap = horizontal
    ? { x1: center.x - openingHalf, y1: center.y, x2: center.x + openingHalf, y2: center.y }
    : { x1: center.x, y1: center.y - openingHalf, x2: center.x, y2: center.y + openingHalf };
  const inward = { x: -anchor.normal.x, y: -anchor.normal.y };
  const startOutside = { x: center.x + anchor.normal.x * g * 0.92, y: center.y + anchor.normal.y * g * 0.92 };
  const endInside = { x: center.x + inward.x * g * 0.56, y: center.y + inward.y * g * 0.56 };
  const startInside = { x: center.x + inward.x * g * 0.56, y: center.y + inward.y * g * 0.56 };
  const endOutside = { x: center.x + anchor.normal.x * g * 0.92, y: center.y + anchor.normal.y * g * 0.92 };
  const start = intent.type === "exit" ? startInside : startOutside;
  const end = intent.type === "exit" ? endOutside : endInside;

  return {
    id: `access-${region.id}-${intent.type}-${index}`,
    regionId: region.id,
    regionName: region.name,
    type: intent.type,
    label: intent.label || getMapAccessLabelForType(intent.type),
    side: anchor.side,
    cell: { x: anchor.cell.x, y: anchor.cell.y },
    outsideCell: { x: anchor.outsideCell.x, y: anchor.outsideCell.y },
    normal: anchor.normal,
    wallGap,
    start,
    end,
    doubleHeaded: intent.type === "passage",
    manual: Boolean(intent.manual),
  };
}

export function chooseMapAccessForRegion(region, generatedMap, intent, index) {
  const anchors = getExternalBoundaryAnchors(region, generatedMap);
  if (anchors.length === 0) return null;
  const ranked = anchors
    .map((anchor) => ({ anchor, score: scoreMapAccessAnchor(anchor, region, generatedMap, intent, index) }))
    .sort((a, b) => a.score - b.score);
  return createMapAccessFromAnchor(region, ranked[0].anchor, intent, generatedMap, index);
}

export function getClosestExternalBoundaryAnchorToPoint(region, point, generatedMap) {
  const anchors = getExternalBoundaryAnchors(region, generatedMap);
  if (anchors.length === 0) return null;
  return anchors
    .map((anchor) => {
      const handlePoint = getAnchorHandlePoint(anchor, generatedMap.config.gridSize);
      const dx = handlePoint.x - point.x;
      const dy = handlePoint.y - point.y;
      return { anchor, score: dx * dx + dy * dy };
    })
    .sort((a, b) => a.score - b.score)[0]?.anchor || null;
}

export function createManualMapAccessForRegion(region, override, generatedMap, index) {
  if (!override || override.disabled) return null;
  const fallbackIntent = getFallbackMapAccessIntent(region, generatedMap);
  const type = normalizeMapAccessType(override.type, fallbackIntent.type);
  const intent = {
    ...fallbackIntent,
    type,
    label: override.label || getMapAccessLabelForType(type),
    manual: true,
  };
  const anchor = resolveMapAccessAnchor(region, override.anchor, generatedMap);
  if (anchor) return createMapAccessFromAnchor(region, anchor, intent, generatedMap, `manual-${index}`);
  const fallbackAccess = chooseMapAccessForRegion(region, generatedMap, intent, index);
  return fallbackAccess ? { ...fallbackAccess, id: `access-${region.id}-${type}-manual-${index}`, manual: true } : null;
}

export function areMapAccessesTooClose(a, b, gridSize) {
  const dx = (a.wallGap.x1 + a.wallGap.x2) / 2 - (b.wallGap.x1 + b.wallGap.x2) / 2;
  const dy = (a.wallGap.y1 + a.wallGap.y2) / 2 - (b.wallGap.y1 + b.wallGap.y2) / 2;
  return Math.hypot(dx, dy) < gridSize * 2.25;
}

export function createMapAccesses(generatedMap) {
  const contextKey = getContextKey(generatedMap.config.context || generatedMap.config.biome);
  const manualAccesses = generatedMap.config.manualMapAccesses || {};
  const selected = [];
  const usedTypes = new Set();

  generatedMap.regions.forEach((region, index) => {
    const override = manualAccesses[region.id];
    if (!override || override.disabled) return;
    const access = createManualMapAccessForRegion(region, override, generatedMap, index);
    if (!access) return;
    selected.push(access);
    usedTypes.add(access.type);
  });

  const candidates = generatedMap.regions
    .filter((region) => !manualAccesses[region.id])
    .map((region) => ({ region, intent: getMapAccessIntent(region, contextKey) }))
    .filter((candidate) => candidate.intent)
    .sort((a, b) => a.intent.priority - b.intent.priority || a.region.number - b.region.number);

  candidates.forEach((candidate, index) => {
    if ((candidate.intent.type === "entrance" || candidate.intent.type === "exit") && usedTypes.has(candidate.intent.type)) return;
    if (candidate.intent.type === "passage" && selected.filter((item) => item.type === "passage").length >= 2) return;
    const access = chooseMapAccessForRegion(candidate.region, generatedMap, candidate.intent, index);
    if (!access) return;
    if (selected.some((item) => areMapAccessesTooClose(item, access, generatedMap.config.gridSize))) return;
    selected.push(access);
    usedTypes.add(candidate.intent.type);
  });

  return selected;
}

export function getPropBudget(region, flags, contextKey = "crypt") {
  const area = Math.max(1, region.floorCells?.length || region.cellRect.w * region.cellRect.h);
  const longSide = Math.max(region.cellRect.w, region.cellRect.h);
  let base = area <= 12 ? 1 : area <= 22 ? 2 : area <= 36 ? 4 : area <= 56 ? 6 : 8;
  const role = getPlacementRole(region);

  if (contextKey === "chapel" && role === "connector") base = Math.max(base, Math.min(12, Math.floor(longSide * 1.15)));
  if (contextKey === "chapel" && (role === "final" || flags.ritual || flags.outcome)) base = Math.max(base, 5);
  if (contextKey === "crypt" && (flags.crypt || role === "final" || role === "secret")) base = Math.max(base, area >= 30 ? 8 : 3);
  if (contextKey === "mine") base = Math.max(base, role === "connector" ? Math.min(10, Math.floor(longSide * 0.9)) : 4);
  if (contextKey === "cave") base = Math.max(base, area >= 32 ? 5 : 2);
  if (contextKey === "noble-house" && area >= 30) base = Math.max(base, 4);

  const semanticBonus = [flags.archive, flags.crypt, flags.hazard, flags.clue, flags.outcome, flags.fog, flags.water, flags.ritual].filter(Boolean).length;
  return clamp(base + Math.min(3, semanticBonus), 1, 14);
}

export function chooseContentAwarePropKind(region, flags, index, rng, contextKey = "crypt") {
  const role = getPlacementRole(region);

  if (contextKey === "chapel") {
    if ((role === "final" || flags.outcome || flags.ritual) && index === 0) return "altar";
    if (role === "connector" && index < 3) return "pew";
    if (role === "entrance" && index === 0) return "statue";
    if (flags.archive) return index % 2 === 0 ? "shelf" : "scroll-table";
    if (flags.crypt || role === "secret") return index % 2 === 0 ? "tomb" : "bones";
    return rng() > 0.55 ? "pillar" : "pew";
  }

  if (contextKey === "noble-house") {
    if (flags.archive || role === "secret") return index % 2 === 0 ? "shelf" : "desk";
    if (flags.clue && index === 0) return "desk";
    if (flags.kitchen) return index % 2 === 0 ? "table" : "shelf";
    if (role === "entrance") return index === 0 ? "fireplace" : "statue";
    if (role === "final") return index === 0 ? "table" : "chest";
    if (flags.hazard || flags.ruined) return index % 2 === 0 ? "rubble" : "crack";
    return index % 3 === 0 ? "bed" : index % 3 === 1 ? "table" : "chest";
  }

  if (contextKey === "mine") {
    if (flags.vertical && index === 0) return "pit";
    if (flags.hazard || flags.ruined) return index % 2 === 0 ? "rubble" : "mine-support";
    if (role === "connector" || index === 0) return "mine-rail";
    return rng() > 0.45 ? "mine-support" : "crack";
  }

  if (contextKey === "cave") {
    if (flags.water && index === 0) return "water";
    if (flags.vertical && index === 0) return "pit";
    if (flags.hazard || flags.ruined) return index % 2 === 0 ? "rubble" : "crack";
    return rng() > 0.42 ? "stalagmite" : "water";
  }

  if (contextKey === "ruins") {
    if (flags.hazard || flags.ruined) return index % 2 === 0 ? "rubble" : "broken-wall";
    if (flags.archive) return index % 2 === 0 ? "shelf" : "scroll-table";
    if (flags.ritual || flags.outcome) return index === 0 ? "altar" : "statue";
    return rng() > 0.55 ? "broken-wall" : "rubble";
  }

  if (flags.water && index === 0) return "water";
  if (flags.fog && index === 0) return "fog";
  if (flags.vertical && index === 0) return "pit";
  if (flags.outcome && index === 0) return flags.ritual ? "altar" : "statue";
  if (flags.ritual && index === 0) return "altar";
  if (flags.archive) return index % 3 === 0 ? "shelf" : index % 3 === 1 ? "scroll-table" : "crack";
  if (flags.crypt) return index % 3 === 0 ? "tomb" : index % 3 === 1 ? "bones" : "pillar";
  if (flags.hazard || flags.ruined) return index % 2 === 0 ? "rubble" : "crack";
  if (flags.clue) return index === 0 ? "clue-marker" : "table";
  if (flags.kitchen) return index % 2 === 0 ? "table" : "shelf";
  return rng() > 0.72 ? "pillar" : "crack";
}

export function getPropCandidateCells(region) {
  const boundary = new Set(getBoundaryCells(region).map((anchor) => cellKey(anchor.cell.x, anchor.cell.y)));
  const cells = region.floorCells.filter((cell) => !boundary.has(cellKey(cell.x, cell.y)));
  return cells.length > 0 ? cells : region.floorCells;
}

export function getRegionFloorBounds(region) {
  if (!region.floorCells.length) return { ...region.cellRect, maxX: region.cellRect.x + region.cellRect.w - 1, maxY: region.cellRect.y + region.cellRect.h - 1 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  region.floorCells.forEach((cell) => {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
  });
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, maxX, maxY };
}

export function getRoomAxis(region) {
  return region.cellRect.w >= region.cellRect.h ? "horizontal" : "vertical";
}

export function targetCellByRatio(region, rx, ry) {
  const bounds = getRegionFloorBounds(region);
  return {
    x: bounds.x + Math.round((bounds.w - 1) * clamp(rx, 0, 1)),
    y: bounds.y + Math.round((bounds.h - 1) * clamp(ry, 0, 1)),
  };
}

export function findClosestPropCell(region, target, reservedCells = new Set()) {
  const candidates = getPropCandidateCells(region);
  if (candidates.length === 0) return null;
  const ranked = candidates
    .map((cell) => {
      const key = cellKey(cell.x, cell.y);
      const dx = cell.x - target.x;
      const dy = cell.y - target.y;
      const reservedPenalty = reservedCells.has(key) ? 100000 : 0;
      return { cell, score: dx * dx + dy * dy + reservedPenalty };
    })
    .sort((a, b) => a.score - b.score);
  return ranked[0]?.cell || null;
}

export function reservePropCell(reservedCells, cell) {
  if (!cell) return;
  reservedCells.add(cellKey(cell.x, cell.y));
}

export function makeProp(region, kind, cell, config, index, options = {}) {
  return {
    id: `${region.id}-prop-${index}-${kind}`,
    regionId: region.id,
    kind,
    x: (cell.x + 0.5) * config.gridSize,
    y: (cell.y + 0.5) * config.gridSize,
    size: config.gridSize * (options.sizeScale || 1),
    rotation: Number.isFinite(options.rotation) ? options.rotation : 0,
    sourceAnchors: region.sourceAnchors || [],
  };
}

export function addPlannedProp(props, region, config, reservedCells, plan, index) {
  const target = plan.cell || targetCellByRatio(region, plan.rx ?? 0.5, plan.ry ?? 0.5);
  const cell = findClosestPropCell(region, target, reservedCells);
  if (!cell) return index;
  reservePropCell(reservedCells, cell);
  props.push(makeProp(region, plan.kind, cell, config, index, plan));
  return index + 1;
}

export function wallRotationForRatio(rx, ry, fallback = 0) {
  if (rx <= 0.22) return 90;
  if (rx >= 0.78) return 90;
  if (ry <= 0.22) return 0;
  if (ry >= 0.78) return 0;
  return fallback;
}

export function createChapelPropPlan(region, flags, budget) {
  const role = getPlacementRole(region);
  const axis = getRoomAxis(region);
  const alongRotation = axis === "horizontal" ? 0 : 90;
  const crossRotation = axis === "horizontal" ? 90 : 0;

  if (role === "connector") {
    const longCells = axis === "horizontal" ? region.cellRect.w : region.cellRect.h;
    const crossCells = axis === "horizontal" ? region.cellRect.h : region.cellRect.w;
    const rowCount = crossCells >= 5 ? 2 : 1;
    const columns = clamp(Math.floor((longCells - 2) / 2), 2, 6);
    const plan = [];
    for (let column = 0; column < columns; column += 1) {
      const t = columns === 1 ? 0.5 : 0.18 + column * (0.64 / Math.max(1, columns - 1));
      const lanes = rowCount === 2 ? [0.34, 0.66] : [0.5];
      lanes.forEach((lane) => {
        plan.push(axis === "horizontal"
          ? { kind: "pew", rx: t, ry: lane, rotation: alongRotation, sizeScale: 1.08 }
          : { kind: "pew", rx: lane, ry: t, rotation: alongRotation, sizeScale: 1.08 });
      });
    }
    return plan.slice(0, budget);
  }

  if (role === "final" || flags.outcome || flags.ritual) {
    const plan = [
      { kind: "altar", rx: axis === "horizontal" ? 0.76 : 0.5, ry: axis === "horizontal" ? 0.5 : 0.76, rotation: crossRotation, sizeScale: 1.12 },
      { kind: "pillar", rx: 0.26, ry: 0.24, rotation: 0 },
      { kind: "pillar", rx: 0.26, ry: 0.76, rotation: 0 },
      { kind: "statue", rx: 0.48, ry: 0.22, rotation: 0 },
      { kind: "statue", rx: 0.48, ry: 0.78, rotation: 0 },
      { kind: "pillar", rx: 0.68, ry: 0.24, rotation: 0 },
      { kind: "pillar", rx: 0.68, ry: 0.76, rotation: 0 },
    ];
    return plan.slice(0, budget);
  }

  if (flags.archive) {
    return [
      { kind: "shelf", rx: 0.14, ry: 0.3, rotation: 90 },
      { kind: "shelf", rx: 0.14, ry: 0.7, rotation: 90 },
      { kind: "shelf", rx: 0.86, ry: 0.3, rotation: 90 },
      { kind: "shelf", rx: 0.86, ry: 0.7, rotation: 90 },
      { kind: "scroll-table", rx: 0.5, ry: 0.5, rotation: 0 },
    ].slice(0, budget);
  }

  if (flags.crypt || role === "secret") {
    return createCryptPropPlan(region, { ...flags, crypt: true }, budget, createSeededRng(hashStringToSeed(region.id, "chapel-crypt-props")));
  }

  if (role === "entrance") {
    return [
      { kind: "statue", rx: 0.5, ry: 0.5, rotation: 0 },
      { kind: "pillar", rx: 0.25, ry: 0.5, rotation: 0 },
      { kind: "pillar", rx: 0.75, ry: 0.5, rotation: 0 },
    ].slice(0, budget);
  }

  return [
    { kind: "pillar", rx: 0.28, ry: 0.28, rotation: 0 },
    { kind: "pillar", rx: 0.72, ry: 0.28, rotation: 0 },
    { kind: "pillar", rx: 0.28, ry: 0.72, rotation: 0 },
    { kind: "pillar", rx: 0.72, ry: 0.72, rotation: 0 },
  ].slice(0, budget);
}

export function createNobleHousePropPlan(region, flags, budget) {
  const role = getPlacementRole(region);
  if (flags.archive || role === "secret") {
    return [
      { kind: "shelf", rx: 0.14, ry: 0.5, rotation: 90 },
      { kind: "shelf", rx: 0.86, ry: 0.5, rotation: 90 },
      { kind: "desk", rx: 0.5, ry: 0.72, rotation: 0 },
      { kind: "chest", rx: 0.82, ry: 0.18, rotation: 0 },
    ].slice(0, budget);
  }
  if (flags.kitchen) {
    return [
      { kind: "table", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.08 },
      { kind: "shelf", rx: 0.15, ry: 0.5, rotation: 90 },
      { kind: "shelf", rx: 0.85, ry: 0.5, rotation: 90 },
    ].slice(0, budget);
  }
  if (flags.clue) {
    return [
      { kind: "desk", rx: 0.5, ry: 0.2, rotation: 0 },
      { kind: "shelf", rx: 0.14, ry: 0.55, rotation: 90 },
      { kind: "chest", rx: 0.78, ry: 0.78, rotation: 0 },
    ].slice(0, budget);
  }
  if (role === "entrance") {
    return [
      { kind: "fireplace", rx: 0.5, ry: 0.16, rotation: 0 },
      { kind: "statue", rx: 0.18, ry: 0.72, rotation: 0 },
      { kind: "statue", rx: 0.82, ry: 0.72, rotation: 0 },
    ].slice(0, budget);
  }
  if (role === "final") {
    return [
      { kind: "table", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.16 },
      { kind: "fireplace", rx: 0.5, ry: 0.16, rotation: 0 },
      { kind: "chest", rx: 0.82, ry: 0.78, rotation: 0 },
    ].slice(0, budget);
  }
  if (flags.hazard || flags.ruined) {
    return [
      { kind: "rubble", rx: 0.35, ry: 0.42, rotation: 0 },
      { kind: "crack", rx: 0.68, ry: 0.62, rotation: 0 },
    ].slice(0, budget);
  }
  return [
    { kind: "bed", rx: 0.18, ry: 0.5, rotation: 0 },
    { kind: "chest", rx: 0.78, ry: 0.78, rotation: 0 },
    { kind: "table", rx: 0.58, ry: 0.42, rotation: 0 },
  ].slice(0, budget);
}

export function createMinePropPlan(region, flags, budget) {
  const axis = getRoomAxis(region);
  const alongRotation = axis === "horizontal" ? 0 : 90;
  const longCells = axis === "horizontal" ? region.cellRect.w : region.cellRect.h;
  const railCount = clamp(Math.floor(longCells / 2), 2, Math.min(7, budget));
  const plan = [];

  if (flags.vertical) {
    plan.push({ kind: "pit", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.15 });
  }

  if (!(flags.hazard || flags.ruined)) {
    for (let index = 0; index < railCount; index += 1) {
      const t = railCount === 1 ? 0.5 : 0.16 + index * (0.68 / Math.max(1, railCount - 1));
      plan.push(axis === "horizontal"
        ? { kind: "mine-rail", rx: t, ry: 0.5, rotation: alongRotation, sizeScale: 1.12 }
        : { kind: "mine-rail", rx: 0.5, ry: t, rotation: alongRotation, sizeScale: 1.12 });
    }
  }

  const supportCount = clamp(Math.floor(longCells / 3), 2, 5);
  for (let index = 0; index < supportCount; index += 1) {
    const t = supportCount === 1 ? 0.5 : 0.2 + index * (0.6 / Math.max(1, supportCount - 1));
    if (axis === "horizontal") {
      plan.push({ kind: "mine-support", rx: t, ry: 0.24, rotation: alongRotation });
      if (budget > 5) plan.push({ kind: "mine-support", rx: t, ry: 0.76, rotation: alongRotation });
    } else {
      plan.push({ kind: "mine-support", rx: 0.24, ry: t, rotation: alongRotation });
      if (budget > 5) plan.push({ kind: "mine-support", rx: 0.76, ry: t, rotation: alongRotation });
    }
  }

  if (flags.hazard || flags.ruined) {
    plan.unshift(
      { kind: "rubble", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.15 },
      { kind: "crack", rx: 0.68, ry: 0.62, rotation: 0 }
    );
  }

  return plan.slice(0, budget);
}

export function createCavePropPlan(region, flags, budget, rng) {
  const base = [];
  if (flags.water) base.push({ kind: "water", rx: 0.5, ry: 0.56, rotation: 0, sizeScale: 1.15 });
  if (flags.vertical) base.push({ kind: "pit", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.1 });
  if (flags.hazard || flags.ruined) base.push({ kind: "rubble", rx: 0.48, ry: 0.5, rotation: 0 });
  const organicTargets = [
    { rx: 0.32, ry: 0.34 },
    { rx: 0.68, ry: 0.36 },
    { rx: 0.42, ry: 0.72 },
    { rx: 0.72, ry: 0.68 },
    { rx: 0.24, ry: 0.62 },
  ];
  organicTargets.forEach((target, index) => {
    base.push({ kind: rng() > 0.34 ? "stalagmite" : "water", ...target, rotation: randomInt(rng, 0, 3) * 90 });
  });
  return base.slice(0, budget);
}

export function createRuinsPropPlan(region, flags, budget) {
  if (flags.archive) {
    return [
      { kind: "shelf", rx: 0.18, ry: 0.5, rotation: 90 },
      { kind: "broken-wall", rx: 0.74, ry: 0.24, rotation: 0 },
      { kind: "scroll-table", rx: 0.52, ry: 0.58, rotation: 0 },
    ].slice(0, budget);
  }
  if (flags.ritual || flags.outcome) {
    return [
      { kind: "altar", rx: 0.5, ry: 0.52, rotation: 0 },
      { kind: "broken-wall", rx: 0.22, ry: 0.28, rotation: 0 },
      { kind: "rubble", rx: 0.78, ry: 0.72, rotation: 0 },
    ].slice(0, budget);
  }
  return [
    { kind: "broken-wall", rx: 0.28, ry: 0.18, rotation: 0 },
    { kind: "rubble", rx: 0.72, ry: 0.68, rotation: 0 },
    { kind: "crack", rx: 0.46, ry: 0.52, rotation: 0 },
    { kind: "broken-wall", rx: 0.78, ry: 0.28, rotation: 90 },
  ].slice(0, budget);
}

export function createCryptPropPlan(region, flags, budget, rng) {
  const role = getPlacementRole(region);
  const area = Math.max(1, region.floorCells?.length || region.cellRect.w * region.cellRect.h);
  const axis = getRoomAxis(region);
  const largeCryptRoom = area >= 28 || region.cellRect.w >= 7 || region.cellRect.h >= 6;

  if (flags.archive) {
    const plan = [
      { kind: "shelf", rx: 0.14, ry: 0.24, rotation: 90 },
      { kind: "shelf", rx: 0.14, ry: 0.5, rotation: 90 },
      { kind: "shelf", rx: 0.14, ry: 0.76, rotation: 90 },
      { kind: "shelf", rx: 0.86, ry: 0.24, rotation: 90 },
      { kind: "shelf", rx: 0.86, ry: 0.5, rotation: 90 },
      { kind: "shelf", rx: 0.86, ry: 0.76, rotation: 90 },
      { kind: "scroll-table", rx: 0.5, ry: 0.5, rotation: 0 },
    ];
    return plan.slice(0, budget);
  }

  if (flags.crypt || role === "final" || role === "secret") {
    if (!largeCryptRoom) {
      return [
        { kind: "tomb", rx: 0.5, ry: 0.5, rotation: axis === "horizontal" ? 0 : 90, sizeScale: 1.04 },
        { kind: "bones", rx: 0.28, ry: 0.5, rotation: 0 },
        { kind: "pillar", rx: 0.78, ry: 0.5, rotation: 0 },
      ].slice(0, budget);
    }

    const plan = [];
    const longCells = axis === "horizontal" ? region.cellRect.w : region.cellRect.h;
    const tombPairs = clamp(Math.floor(longCells / 2), 2, Math.min(5, Math.floor(budget / 2) + 1));
    for (let index = 0; index < tombPairs; index += 1) {
      const t = tombPairs === 1 ? 0.5 : 0.18 + index * (0.64 / Math.max(1, tombPairs - 1));
      if (axis === "horizontal") {
        plan.push({ kind: "tomb", rx: t, ry: 0.22, rotation: 0, sizeScale: 0.96 });
        plan.push({ kind: "tomb", rx: t, ry: 0.78, rotation: 0, sizeScale: 0.96 });
      } else {
        plan.push({ kind: "tomb", rx: 0.22, ry: t, rotation: 90, sizeScale: 0.96 });
        plan.push({ kind: "tomb", rx: 0.78, ry: t, rotation: 90, sizeScale: 0.96 });
      }
    }
    plan.push({ kind: "bones", rx: 0.5, ry: 0.5, rotation: randomInt(rng, 0, 3) * 90 });
    if (budget > 8) {
      plan.push({ kind: "pillar", rx: 0.5, ry: 0.28, rotation: 0 });
      plan.push({ kind: "pillar", rx: 0.5, ry: 0.72, rotation: 0 });
    }
    return plan.slice(0, budget);
  }

  if (flags.vertical) return [{ kind: "pit", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.1 }].slice(0, budget);
  if (flags.fog) return [{ kind: "fog", rx: 0.5, ry: 0.5, rotation: 0, sizeScale: 1.2 }].slice(0, budget);
  if (flags.hazard || flags.ruined) {
    return [
      { kind: "rubble", rx: 0.44, ry: 0.52, rotation: 0 },
      { kind: "crack", rx: 0.68, ry: 0.62, rotation: 0 },
      { kind: "bones", rx: 0.25, ry: 0.42, rotation: 0 },
    ].slice(0, budget);
  }
  return Array.from({ length: budget }, (_, index) => ({
    kind: chooseContentAwarePropKind(region, flags, index, rng, "crypt"),
    rx: 0.24 + (index % 3) * 0.26,
    ry: 0.28 + Math.floor(index / 3) * 0.22,
    rotation: wallRotationForRatio(0.24 + (index % 3) * 0.26, 0.28 + Math.floor(index / 3) * 0.22, 0),
  }));
}

export function createPropLayoutPlan(region, flags, budget, rng, contextKey) {
  if (budget <= 0) return [];
  if (contextKey === "chapel") return createChapelPropPlan(region, flags, budget, rng);
  if (contextKey === "noble-house") return createNobleHousePropPlan(region, flags, budget, rng);
  if (contextKey === "mine") return createMinePropPlan(region, flags, budget, rng);
  if (contextKey === "cave") return createCavePropPlan(region, flags, budget, rng);
  if (contextKey === "ruins") return createRuinsPropPlan(region, flags, budget, rng);
  return createCryptPropPlan(region, flags, budget, rng);
}

export function createProps(generatedMap) {
  const { regions, config } = generatedMap;
  const contextKey = getContextKey(config.context || config.biome);
  const props = [];
  regions.forEach((region) => {
    const flags = getRegionSemanticFlags(region);
    const rng = createSeededRng(hashStringToSeed(config.seed, region.id, "content-props"));
    const budget = getPropBudget(region, flags, contextKey);
    const reservedCells = new Set();
    const plan = createPropLayoutPlan(region, flags, budget, rng, contextKey);
    let index = 0;
    plan.slice(0, budget).forEach((item) => {
      index = addPlannedProp(props, region, config, reservedCells, item, index);
    });
  });
  return props;
}
