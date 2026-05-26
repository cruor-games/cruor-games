import { DEFAULT_CONFIG, normalizeRoomCount } from "./map-generator.input.js";
import {
  ORTHOGONAL_DIRECTIONS,
  cellKey,
  parseCellKey,
  pointKey,
  computeBoundarySegments,
  getRegionSurfaceKind,
} from "./map-generator.mask.js";
import {
  getDoorBoundaryCells,
  getCorridorTopologyCells,
  isOrganicCorridor,
} from "./map-generator.corridors.js";
import { getContextKey } from "./map-generator.profile.js";

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

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function computeContentBounds(floorCells, gridSize, fallback) {
  if (!floorCells.length) return fallback;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  floorCells.forEach((cell) => {
    minX = Math.min(minX, cell.x * gridSize);
    minY = Math.min(minY, cell.y * gridSize);
    maxX = Math.max(maxX, (cell.x + 1) * gridSize);
    maxY = Math.max(maxY, (cell.y + 1) * gridSize);
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function cellRectToPath(cell, gridSize) {
  const x = cell.x * gridSize;
  const y = cell.y * gridSize;
  const g = gridSize;
  return `M${x} ${y}H${x + g}V${y + g}H${x}Z`;
}

export function buildFloorPath(floorCells, gridSize) {
  return floorCells.map((cell) => cellRectToPath(cell, gridSize)).join(" ");
}

export function buildBoundarySegmentPath(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return "";
  return segments
    .filter((segment) => [segment.x1, segment.y1, segment.x2, segment.y2].every(Number.isFinite))
    .map((segment) => `M ${roundTo(segment.x1, 2)} ${roundTo(segment.y1, 2)} L ${roundTo(segment.x2, 2)} ${roundTo(segment.y2, 2)}`)
    .join(" ");
}

export function isPureCaveMap(generatedMap) {
  if (getContextKey(generatedMap?.config?.context || generatedMap?.config?.biome) !== "cave") return false;
  const regions = Array.isArray(generatedMap?.regions) ? generatedMap.regions : [];
  if (regions.length === 0) return false;
  return regions.every((region) => getRegionSurfaceKind(region, generatedMap) === "cave");
}

export function isSingleRegionCaveMap(generatedMap) {
  const regions = Array.isArray(generatedMap?.regions) ? generatedMap.regions : [];
  return isPureCaveMap(generatedMap) && regions.length <= 1;
}

export const HEX_CAVE_DIRECTIONS = [
  { q: 1, r: 0, edge: [5, 0] },
  { q: 1, r: -1, edge: [0, 1] },
  { q: 0, r: -1, edge: [1, 2] },
  { q: -1, r: 0, edge: [2, 3] },
  { q: -1, r: 1, edge: [3, 4] },
  { q: 0, r: 1, edge: [4, 5] },
];

export function hexKey(q, r) {
  return `${q},${r}`;
}

export function parseHexKey(key) {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

export function getCaveHexSize(config) {
  return config.gridSize * 0.78;
}

export function getCaveHexOrigin(config) {
  return { x: config.gridSize * 0.35, y: config.gridSize * 0.25 };
}

export function axialHexToPixel(hex, size, origin) {
  return {
    x: origin.x + size * Math.sqrt(3) * (hex.q + hex.r / 2),
    y: origin.y + size * 1.5 * hex.r,
  };
}

export function roundAxialHex(q, r) {
  let x = q;
  let z = r;
  let y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);
  if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
  else if (yDiff > zDiff) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

export function pixelToAxialHex(point, size, origin) {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  return roundAxialHex((Math.sqrt(3) / 3 * x - y / 3) / size, (2 / 3 * y) / size);
}

export function getHexDistance(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function addHexDisc(hexes, center, radius) {
  const r = Math.max(0, Math.round(radius));
  for (let dq = -r; dq <= r; dq += 1) {
    for (let dr = Math.max(-r, -dq - r); dr <= Math.min(r, -dq + r); dr += 1) {
      hexes.set(hexKey(center.q + dq, center.r + dr), { q: center.q + dq, r: center.r + dr });
    }
  }
}

export function getHexCornerPoints(hex, size, origin) {
  const center = axialHexToPixel(hex, size, origin);
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (30 + index * 60);
    return {
      x: center.x + Math.cos(angle) * size,
      y: center.y + Math.sin(angle) * size,
    };
  });
}

export function getHexNeighbors(hex) {
  return HEX_CAVE_DIRECTIONS.map((direction) => ({ q: hex.q + direction.q, r: hex.r + direction.r }));
}

export function getLargestConnectedHexMap(hexMap) {
  const unvisited = new Set(hexMap.keys());
  let best = new Map();
  while (unvisited.size > 0) {
    const startKey = unvisited.values().next().value;
    const queue = [parseHexKey(startKey)];
    const component = new Map();
    unvisited.delete(startKey);
    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = hexKey(current.q, current.r);
      component.set(currentKey, current);
      getHexNeighbors(current).forEach((neighbor) => {
        const key = hexKey(neighbor.q, neighbor.r);
        if (!unvisited.has(key)) return;
        unvisited.delete(key);
        queue.push(neighbor);
      });
    }
    if (component.size > best.size) best = component;
  }
  return best;
}

export function addNoisyHexBlob(target, center, radius, config, seedParts = [], options = {}) {
  const reach = Math.max(1, Math.ceil(radius + (options.reachBonus || 1.5)));
  const thresholdBias = Number.isFinite(options.thresholdBias) ? options.thresholdBias : 0;
  for (let dq = -reach; dq <= reach; dq += 1) {
    for (let dr = -reach; dr <= reach; dr += 1) {
      const cell = { q: center.q + dq, r: center.r + dr };
      const distance = getHexDistance(center, cell);
      if (distance > reach) continue;
      const noise = ((hashStringToSeed(config.seed, ...seedParts, cell.q, cell.r, "blob-noise") % 1000) / 1000 - 0.5) * (options.noiseScale || 1.25);
      if (distance <= radius + noise + thresholdBias) target.set(hexKey(cell.q, cell.r), cell);
    }
  }
}

export function subtractNoisyHexBite(target, center, radius, config, seedParts = []) {
  Array.from(target.values()).forEach((cell) => {
    const distance = getHexDistance(center, cell);
    const noise = ((hashStringToSeed(config.seed, ...seedParts, cell.q, cell.r, "bite-noise") % 1000) / 1000 - 0.5) * 0.85;
    if (distance <= radius + noise) target.delete(hexKey(cell.q, cell.r));
  });
}

export function createHexCaveRoomCells(hexes, region, centerHex, config, rng) {
  const singleCaveRegion = normalizeRoomCount(config.roomCount, config.regions?.length || 1) <= 1;
  const maxRectSide = Math.max(region.cellRect.w, region.cellRect.h);
  const minRectSide = Math.min(region.cellRect.w, region.cellRect.h);
  const baseRadius = singleCaveRegion
    ? clamp(Math.round(maxRectSide * 0.42 + minRectSide * 0.16), 7, 14)
    : clamp(Math.round(maxRectSide * 0.38), 2, 6);
  const local = new Map();
  addNoisyHexBlob(local, centerHex, baseRadius, config, [region.id, "main"], {
    noiseScale: singleCaveRegion ? 1.15 : 1.2,
    thresholdBias: singleCaveRegion ? 0.2 : 0,
  });
  const lobeCount = singleCaveRegion ? randomInt(rng, 5, 9) : randomInt(rng, 3, 6);
  const dominantDirection = hashStringToSeed(config.seed, region.id, "dominant-cave-direction") % HEX_CAVE_DIRECTIONS.length;
  for (let index = 0; index < lobeCount; index += 1) {
    const dirIndex = singleCaveRegion
      ? (dominantDirection + randomInt(rng, -2, 3) + HEX_CAVE_DIRECTIONS.length) % HEX_CAVE_DIRECTIONS.length
      : hashStringToSeed(config.seed, region.id, index, "hex-cave-lobe-dir") % HEX_CAVE_DIRECTIONS.length;
    const sideIndex = (dirIndex + (rng() > 0.5 ? 1 : -1) + HEX_CAVE_DIRECTIONS.length) % HEX_CAVE_DIRECTIONS.length;
    const direction = HEX_CAVE_DIRECTIONS[dirIndex];
    const sideDirection = HEX_CAVE_DIRECTIONS[sideIndex];
    const distance = singleCaveRegion ? randomInt(rng, 2, baseRadius + 5) : randomInt(rng, 1, Math.max(2, baseRadius + 1));
    const sideShift = singleCaveRegion ? randomInt(rng, -2, 2) : randomInt(rng, -1, 1);
    const lobe = { q: centerHex.q + direction.q * distance + sideDirection.q * sideShift, r: centerHex.r + direction.r * distance + sideDirection.r * sideShift };
    const lobeRadius = singleCaveRegion
      ? randomInt(rng, Math.max(3, Math.round(baseRadius * 0.28)), Math.max(4, Math.round(baseRadius * 0.58)))
      : randomInt(rng, 1, Math.max(2, Math.round(baseRadius * 0.55)));
    addNoisyHexBlob(local, lobe, lobeRadius, config, [region.id, index, "lobe"], {
      noiseScale: singleCaveRegion ? 1.05 : 1.05,
      thresholdBias: singleCaveRegion ? 0.1 : 0,
    });
  }
  if (singleCaveRegion) {
    const spurCount = randomInt(rng, 1, 3);
    for (let index = 0; index < spurCount; index += 1) {
      const direction = HEX_CAVE_DIRECTIONS[(dominantDirection + index + randomInt(rng, 0, 2)) % HEX_CAVE_DIRECTIONS.length];
      const length = randomInt(rng, Math.max(4, Math.round(baseRadius * 0.42)), Math.max(6, Math.round(baseRadius * 0.9)));
      const spurCenter = { q: centerHex.q, r: centerHex.r };
      for (let step = 1; step <= length; step += 1) {
        spurCenter.q += direction.q;
        spurCenter.r += direction.r;
        if (rng() > 0.64) {
          const drift = HEX_CAVE_DIRECTIONS[(HEX_CAVE_DIRECTIONS.indexOf(direction) + (rng() > 0.5 ? 1 : 5)) % HEX_CAVE_DIRECTIONS.length];
          spurCenter.q += drift.q;
          spurCenter.r += drift.r;
        }
        addNoisyHexBlob(local, spurCenter, step < length * 0.72 ? 2 : 1, config, [region.id, index, step, "spur"], { noiseScale: 0.8 });
      }
    }
  }
  const biteCount = singleCaveRegion ? randomInt(rng, 3, 6) : randomInt(rng, 1, 3);
  for (let index = 0; index < biteCount; index += 1) {
    const direction = HEX_CAVE_DIRECTIONS[hashStringToSeed(config.seed, region.id, index, "hex-cave-bite-dir") % HEX_CAVE_DIRECTIONS.length];
    const distance = singleCaveRegion ? randomInt(rng, Math.max(4, baseRadius - 1), baseRadius + 5) : randomInt(rng, Math.max(2, baseRadius - 1), baseRadius + 2);
    const bite = { q: centerHex.q + direction.q * distance, r: centerHex.r + direction.r * distance };
    const radius = singleCaveRegion ? randomInt(rng, 2, 5) : randomInt(rng, 1, 2);
    subtractNoisyHexBite(local, bite, radius, config, [region.id, index, "bite"]);
  }
  const connected = getLargestConnectedHexMap(local);
  connected.forEach((cell, key) => hexes.set(key, cell));
}

export function createHexCaveTunnelCells(hexes, fromRegion, toRegion, config, rng, edgeId) {
  if (!fromRegion || !toRegion) return;
  const size = getCaveHexSize(config);
  const origin = getCaveHexOrigin(config);
  const start = fromRegion.labelPoint;
  const end = toRegion.labelPoint;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const bend = ((hashStringToSeed(config.seed, edgeId, "hex-cave-tunnel-bend") % 100) / 100 - 0.5) * config.gridSize * 5.2;
  const sampleCount = clamp(Math.ceil(length / (size * 0.62)), 8, 44);
  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount;
    const arch = Math.sin(Math.PI * t);
    const jitter = ((hashStringToSeed(config.seed, edgeId, index, "hex-cave-tunnel-jitter") % 100) / 100 - 0.5) * size * 0.82;
    const point = { x: start.x + dx * t + nx * (bend * arch + jitter * arch), y: start.y + dy * t + ny * (bend * arch + jitter * arch) };
    const hex = pixelToAxialHex(point, size, origin);
    const local = hashStringToSeed(config.seed, edgeId, index, "hex-cave-tunnel-width") % 100;
    const radius = index < 2 || index > sampleCount - 2 ? 2 : local > 78 ? 2 : 1;
    addHexDisc(hexes, hex, radius);
  }
}

export function smoothHexCaveCells(hexes, passes = 2) {
  let current = new Map(hexes);
  for (let pass = 0; pass < passes; pass += 1) {
    const neighborCounts = new Map();
    current.forEach((hex) => {
      HEX_CAVE_DIRECTIONS.forEach((direction) => {
        const key = hexKey(hex.q + direction.q, hex.r + direction.r);
        neighborCounts.set(key, (neighborCounts.get(key) || 0) + 1);
      });
    });
    const next = new Map(current);
    neighborCounts.forEach((count, key) => {
      if (current.has(key)) return;
      if (count >= 4) next.set(key, parseHexKey(key));
    });
    current = next;
  }
  return current;
}

export function createHexCaveCells(generatedMap) {
  const { config, regions, graph = [] } = generatedMap;
  const size = getCaveHexSize(config);
  const origin = getCaveHexOrigin(config);
  const hexes = new Map();
  const singleCaveRegion = normalizeRoomCount(config.roomCount, regions.length || 1) <= 1;
  regions.forEach((region) => {
    const rng = createSeededRng(hashStringToSeed(config.seed, region.id, "hex-cave-region"));
    const centerHex = pixelToAxialHex(region.labelPoint, size, origin);
    createHexCaveRoomCells(hexes, region, centerHex, config, rng);
  });
  if (!singleCaveRegion) {
    graph.forEach((edge) => {
      const fromRegion = regions.find((region) => region.id === edge.from);
      const toRegion = regions.find((region) => region.id === edge.to);
      const rng = createSeededRng(hashStringToSeed(config.seed, edge.id, "hex-cave-edge"));
      createHexCaveTunnelCells(hexes, fromRegion, toRegion, config, rng, edge.id);
    });
  }
  const smoothed = smoothHexCaveCells(hexes, singleCaveRegion ? 2 : 2);
  const connected = getLargestConnectedHexMap(smoothed);
  return Array.from(connected.size > 0 ? connected.values() : smoothed.values());
}

export function getCaveMapAccessesForGeometry(generatedMap) {
  if (!isPureCaveMap(generatedMap)) return [];
  const sources = [
    ...(Array.isArray(generatedMap?.dungeonMask?.mapAccesses) ? generatedMap.dungeonMask.mapAccesses : []),
    ...(Array.isArray(generatedMap?.mapAccesses) ? generatedMap.mapAccesses : []),
  ];
  const byId = new Map();
  sources.forEach((access, index) => {
    if (!access) return;
    const usable = access.caveAccessBoundary || access.finalGeometry || access.wallGap || access.floorExtension || access.normal;
    if (!usable) return;
    byId.set(access.id || `access-${index}`, access);
  });
  return Array.from(byId.values());
}

export function normalizeGeometryVector(vector, fallback = { x: 1, y: 0 }) {
  const length = Math.hypot(vector?.x || 0, vector?.y || 0);
  if (!Number.isFinite(length) || length <= 0.0001) return fallback;
  return { x: vector.x / length, y: vector.y / length };
}

export function getAccessNormalFromSide(side) {
  if (side === "north") return { x: 0, y: -1 };
  if (side === "south") return { x: 0, y: 1 };
  if (side === "west") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

export function getMapAccessGeometryCenter(access, config) {
  if (access?.wallGap) {
    return {
      x: (access.wallGap.x1 + access.wallGap.x2) / 2,
      y: (access.wallGap.y1 + access.wallGap.y2) / 2,
    };
  }
  if (access?.segment) {
    return {
      x: (access.segment.x1 + access.segment.x2) / 2,
      y: (access.segment.y1 + access.segment.y2) / 2,
    };
  }
  if (access?.floorExtension?.inner) return { ...access.floorExtension.inner };
  if (access?.end) return { ...access.end };
  const cell = access?.cell || access?.outsideCell || { x: 0, y: 0 };
  return { x: (cell.x + 0.5) * config.gridSize, y: (cell.y + 0.5) * config.gridSize };
}

export function getMapAccessGeometryBasis(access) {
  const segment = access?.segment || access?.wallGap || null;
  if (segment) {
    const tangent = normalizeGeometryVector(
      { x: segment.x2 - segment.x1, y: segment.y2 - segment.y1 },
      access?.tangent || { x: 0, y: 1 }
    );
    const normalA = { x: -tangent.y, y: tangent.x };
    const center = getMapAccessGeometryCenter(access, DEFAULT_CONFIG);
    const bounds = access?.caveBounds || null;
    if (bounds) {
      const caveCenter = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const radial = normalizeGeometryVector({ x: center.x - caveCenter.x, y: center.y - caveCenter.y }, access?.normal || normalA);
      const normal = normalA.x * radial.x + normalA.y * radial.y >= 0 ? normalA : { x: -normalA.x, y: -normalA.y };
      return { normal, tangent };
    }
    const fallbackNormal = normalizeGeometryVector(access?.normal || getAccessNormalFromSide(access?.side), normalA);
    const normal = normalA.x * fallbackNormal.x + normalA.y * fallbackNormal.y >= 0 ? normalA : { x: -normalA.x, y: -normalA.y };
    return { normal, tangent };
  }
  const normal = normalizeGeometryVector(access?.normal || getAccessNormalFromSide(access?.side));
  const tangent = normalizeGeometryVector(access?.tangent || { x: -normal.y, y: normal.x }, { x: -normal.y, y: normal.x });
  return { normal, tangent };
}

export function getMapAccessGeometrySamples(access, config) {
  const center = getMapAccessGeometryCenter(access, config);
  const { normal, tangent } = getMapAccessGeometryBasis(access);
  const g = config.gridSize;
  const sample = (outward, lateral = 0, radius = 0) => ({
    x: center.x + normal.x * outward * g + tangent.x * lateral * g,
    y: center.y + normal.y * outward * g + tangent.y * lateral * g,
    radius,
  });
  return [
    sample(-1.08, 0, 2),
    sample(-0.78, -0.34, 1),
    sample(-0.78, 0.34, 1),
    sample(-0.46, 0, 2),
    sample(-0.18, -0.44, 1),
    sample(-0.18, 0.44, 1),
    sample(0, 0, 2),
    sample(0.28, 0, 2),
    sample(0.58, -0.42, 1),
    sample(0.58, 0.42, 1),
    sample(0.86, 0, 1),
    sample(1.16, 0, 1),
    sample(1.42, 0, 0),
  ];
}

export function addMapAccessHexRegion(hexes, access, generatedMap) {
  return hexes;
  /*
  const { config } = generatedMap;
  const size = getCaveHexSize(config);
  const origin = getCaveHexOrigin(config);
  const center = getMapAccessGeometryCenter(access, config);
  const { normal, tangent } = getMapAccessGeometryBasis(access);
  const g = config.gridSize;
  const steps = 11;
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const outward = -1.08 + t * 2.48;
    const point = {
      x: center.x + normal.x * outward * g,
      y: center.y + normal.y * outward * g,
    };
    const radius = step <= 6 ? 2 : step <= 9 ? 1 : 0;
    addHexDisc(hexes, pixelToAxialHex(point, size, origin), radius);
  }
  [-0.52, 0.52].forEach((lateral) => {
    [-0.48, -0.08, 0.34, 0.74, 1.04].forEach((outward) => {
      const point = {
        x: center.x + normal.x * outward * g + tangent.x * lateral * g,
        y: center.y + normal.y * outward * g + tangent.y * lateral * g,
      };
      addHexDisc(hexes, pixelToAxialHex(point, size, origin), outward < 0.5 ? 1 : 0);
    });
  });
  */
}

export function mergeMapAccessRegionsIntoHexCells(hexCells, generatedMap) {
  return hexCells;
  /*
  const accesses = getCaveMapAccessesForGeometry(generatedMap);
  if (accesses.length === 0) return hexCells;
  const { config } = generatedMap;
  const size = getCaveHexSize(config);
  const origin = getCaveHexOrigin(config);
  const hexes = new Map(hexCells.map((hex) => [hexKey(hex.q, hex.r), { q: hex.q, r: hex.r }]));
  accesses.forEach((access) => {
    addMapAccessHexRegion(hexes, access, generatedMap);
  });
  const connected = getLargestConnectedHexMap(hexes);
  return Array.from(connected.size > 0 ? connected.values() : hexes.values());
  */
}

export function mergeMapAccessRegionsIntoCells(cells, generatedMap) {
  return cells;
  /*
  const accesses = getCaveMapAccessesForGeometry(generatedMap);
  if (accesses.length === 0) return cells;
  const { config } = generatedMap;
  const gridW = Math.max(1, Math.floor(config.mapWidth / config.gridSize));
  const gridH = Math.max(1, Math.floor(config.mapHeight / config.gridSize));
  const merged = new Map((cells || []).map((cell) => [cellKey(cell.x, cell.y), { x: cell.x, y: cell.y }]));
  const addCell = (cell) => {
    if (!cell) return;
    const x = clamp(Math.floor(cell.x), 0, gridW - 1);
    const y = clamp(Math.floor(cell.y), 0, gridH - 1);
    merged.set(cellKey(x, y), { x, y });
  };
  const addPoint = (point) => addCell({ x: Math.floor(point.x / config.gridSize), y: Math.floor(point.y / config.gridSize) });
  const addPointDisc = (point, radius = 1) => {
    const cx = Math.floor(point.x / config.gridSize);
    const cy = Math.floor(point.y / config.gridSize);
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        addCell({ x, y });
      }
    }
  };
  accesses.forEach((access) => {
    const center = getMapAccessGeometryCenter(access, config);
    const { normal, tangent } = getMapAccessGeometryBasis(access);
    addCell(access.outsideCell);
    (access.extensionCells || []).forEach(addCell);
    for (let step = 0; step <= 10; step += 1) {
      const t = step / 10;
      const outward = -1.04 + t * 2.36;
      const point = {
        x: center.x + normal.x * outward * config.gridSize,
        y: center.y + normal.y * outward * config.gridSize,
      };
      addPointDisc(point, step <= 6 ? 1 : 0);
    }
    [-0.54, 0.54].forEach((lateral) => {
      [-0.42, -0.06, 0.34, 0.74, 1.04].forEach((outward) => {
        addPointDisc({
          x: center.x + normal.x * outward * config.gridSize + tangent.x * lateral * config.gridSize,
          y: center.y + normal.y * outward * config.gridSize + tangent.y * lateral * config.gridSize,
        }, outward < 0.5 ? 1 : 0);
      });
    });
    getMapAccessGeometrySamples(access, config).forEach((sample) => addPointDisc(sample, sample.radius || 0));
  });
  return Array.from(merged.values());
  */
}

export function roundGeometryPoint(point) {
  return { x: Math.round(point.x * 100) / 100, y: Math.round(point.y * 100) / 100 };
}

export function createHexCaveBoundarySegments(hexCells, config) {
  const size = getCaveHexSize(config);
  const origin = getCaveHexOrigin(config);
  const hexSet = new Set(hexCells.map((hex) => hexKey(hex.q, hex.r)));
  const segments = [];
  hexCells.forEach((hex) => {
    const corners = getHexCornerPoints(hex, size, origin).map(roundGeometryPoint);
    HEX_CAVE_DIRECTIONS.forEach((direction) => {
      if (hexSet.has(hexKey(hex.q + direction.q, hex.r + direction.r))) return;
      const [aIndex, bIndex] = direction.edge;
      const a = corners[aIndex];
      const b = corners[bIndex];
      segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    });
  });
  return segments;
}

export function boundaryPointKey(point) {
  return `${point.x},${point.y}`;
}

export function boundaryEdgeKey(a, b) {
  const ka = boundaryPointKey(a);
  const kb = boundaryPointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

export function addBoundaryAdjacency(adjacency, from, to) {
  const key = boundaryPointKey(from);
  if (!adjacency.has(key)) adjacency.set(key, []);
  adjacency.get(key).push(to);
}

export function buildBoundaryLoops(segments) {
  const adjacency = new Map();
  const edges = [];
  segments.forEach((segment) => {
    const a = { x: segment.x1, y: segment.y1 };
    const b = { x: segment.x2, y: segment.y2 };
    if (a.x === b.x && a.y === b.y) return;
    edges.push({ a, b, key: boundaryEdgeKey(a, b) });
    addBoundaryAdjacency(adjacency, a, b);
    addBoundaryAdjacency(adjacency, b, a);
  });
  const unused = new Set(edges.map((edge) => edge.key));
  const loops = [];
  while (unused.size > 0) {
    const startEdgeKey = unused.values().next().value;
    const startEdge = edges.find((edge) => edge.key === startEdgeKey);
    if (!startEdge) break;
    const start = startEdge.a;
    let previous = startEdge.a;
    let current = startEdge.b;
    const loop = [start];
    unused.delete(startEdge.key);
    for (let guard = 0; guard < edges.length + 8; guard += 1) {
      loop.push(current);
      if (current.x === start.x && current.y === start.y) break;
      const candidates = (adjacency.get(boundaryPointKey(current)) || [])
        .filter((candidate) => !(candidate.x === previous.x && candidate.y === previous.y))
        .filter((candidate) => unused.has(boundaryEdgeKey(current, candidate)));
      if (candidates.length === 0) break;
      const next = candidates.sort((a, b) => {
        const da = Math.abs(a.x - current.x) + Math.abs(a.y - current.y);
        const db = Math.abs(b.x - current.x) + Math.abs(b.y - current.y);
        return da - db || boundaryPointKey(a).localeCompare(boundaryPointKey(b));
      })[0];
      unused.delete(boundaryEdgeKey(current, next));
      previous = current;
      current = next;
    }
    const closed = loop.length > 3 && loop[0].x === loop[loop.length - 1].x && loop[0].y === loop[loop.length - 1].y;
    if (closed) loops.push(loop.slice(0, -1));
  }
  return loops;
}

export function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

export function chaikinClosed(points, iterations = 2) {
  let current = [...points];
  for (let pass = 0; pass < iterations; pass += 1) {
    const next = [];
    current.forEach((point, index) => {
      const following = current[(index + 1) % current.length];
      next.push({ x: point.x * 0.75 + following.x * 0.25, y: point.y * 0.75 + following.y * 0.25 });
      next.push({ x: point.x * 0.25 + following.x * 0.75, y: point.y * 0.25 + following.y * 0.75 });
    });
    current = next;
  }
  return current;
}

export function smoothClosedContourPoints(points, iterations = 1, strength = 0.5) {
  if (!points || points.length < 4) return points || [];
  let current = [...points];
  for (let pass = 0; pass < iterations; pass += 1) {
    current = current.map((point, index) => {
      const previous = current[(index - 1 + current.length) % current.length];
      const next = current[(index + 1) % current.length];
      const average = { x: (previous.x + point.x + next.x) / 3, y: (previous.y + point.y + next.y) / 3 };
      return {
        x: point.x * (1 - strength) + average.x * strength,
        y: point.y * (1 - strength) + average.y * strength,
      };
    });
  }
  return current;
}

export function thinClosedContourPoints(points, minDistance) {
  if (!points || points.length < 4 || !Number.isFinite(minDistance) || minDistance <= 0) return points || [];
  const thinned = [];
  points.forEach((point) => {
    const previous = thinned[thinned.length - 1];
    if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= minDistance) thinned.push(point);
  });
  if (thinned.length > 3) {
    const first = thinned[0];
    const last = thinned[thinned.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < minDistance) thinned.pop();
  }
  return thinned.length >= 4 ? thinned : points;
}

export function jitterCaveContourPoints(points, seed, amount) {
  if (!points || points.length === 0) return [];
  const center = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  center.x /= points.length;
  center.y /= points.length;
  const sampleCount = Math.max(4, Math.ceil(points.length / 5));
  const radialSamples = Array.from({ length: sampleCount }, (_, index) => ((hashStringToSeed(seed, index, "cave-contour-radial") % 1000) / 1000 - 0.5) * amount);
  const tangentSamples = Array.from({ length: sampleCount }, (_, index) => ((hashStringToSeed(seed, index, "cave-contour-tangent") % 1000) / 1000 - 0.5) * amount * 0.12);
  const interpolateSample = (samples, position) => {
    const scaled = (position / points.length) * samples.length;
    const index = Math.floor(scaled) % samples.length;
    const nextIndex = (index + 1) % samples.length;
    const t = scaled - Math.floor(scaled);
    const smooth = t * t * (3 - 2 * t);
    return samples[index] + (samples[nextIndex] - samples[index]) * smooth;
  };
  return points.map((point, index) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    const outward = { x: dx / length, y: dy / length };
    const radial = interpolateSample(radialSamples, index);
    const tangent = interpolateSample(tangentSamples, index);
    return { x: point.x + outward.x * radial + -outward.y * tangent, y: point.y + outward.y * radial + outward.x * tangent };
  });
}

export function catmullRomClosedPath(points) {
  if (!points || points.length < 3) return "";
  const p = points;
  let d = `M ${roundTo(p[0].x, 2)} ${roundTo(p[0].y, 2)}`;
  for (let index = 0; index < p.length; index += 1) {
    const p0 = p[(index - 1 + p.length) % p.length];
    const p1 = p[index];
    const p2 = p[(index + 1) % p.length];
    const p3 = p[(index + 2) % p.length];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${roundTo(c1.x, 2)} ${roundTo(c1.y, 2)} ${roundTo(c2.x, 2)} ${roundTo(c2.y, 2)} ${roundTo(p2.x, 2)} ${roundTo(p2.y, 2)}`;
  }
  return `${d} Z`;
}

export function segmentLength(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function getClosedContourOrientation(points) {
  return polygonArea(points) >= 0 ? 1 : -1;
}

export function densifyAngularContourPoints(points, targetLength) {
  if (!points || points.length < 3 || !Number.isFinite(targetLength) || targetLength <= 0) return points || [];
  const result = [];
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    result.push(point);
    const length = segmentLength(point, next);
    const steps = Math.max(0, Math.floor(length / targetLength) - 1);
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      result.push({
        x: point.x + (next.x - point.x) * t,
        y: point.y + (next.y - point.y) * t,
      });
    }
  });
  return result;
}

export function angularizeCaveContourPoints(points, seed, amount, options = {}) {
  if (!points || points.length < 3) return points || [];
  const orientation = getClosedContourOrientation(points);
  const outwardSign = orientation >= 0 ? -1 : 1;
  const preserveEvery = Math.max(2, Math.round(options.preserveEvery || 3));
  const tangentAmount = Number.isFinite(options.tangentAmount) ? options.tangentAmount : amount * 0.48;
  return points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const tx = next.x - previous.x;
    const ty = next.y - previous.y;
    const length = Math.hypot(tx, ty) || 1;
    const tangent = { x: tx / length, y: ty / length };
    const normal = { x: -tangent.y * outwardSign, y: tangent.x * outwardSign };
    const coarse = ((hashStringToSeed(seed, Math.floor(index / 2), "angular-coarse") % 1000) / 1000 - 0.5) * amount;
    const local = ((hashStringToSeed(seed, index, "angular-local") % 1000) / 1000 - 0.5) * amount * 0.38;
    const tangentJitter = ((hashStringToSeed(seed, index, "angular-tangent") % 1000) / 1000 - 0.5) * tangentAmount;
    const alternating = index % preserveEvery === 0 ? 0 : (index % 2 === 0 ? -0.18 : 0.18) * amount;
    const normalOffset = coarse + local + alternating;
    return {
      x: point.x + normal.x * normalOffset + tangent.x * tangentJitter,
      y: point.y + normal.y * normalOffset + tangent.y * tangentJitter,
    };
  });
}

export function degridCaveContourPoints(points, seed, amount) {
  if (!points || points.length < 3) return points || [];
  return points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const tx = next.x - previous.x;
    const ty = next.y - previous.y;
    const length = Math.hypot(tx, ty) || 1;
    const tangent = { x: tx / length, y: ty / length };
    const normal = { x: -tangent.y, y: tangent.x };
    const wave = Math.sin(index * 1.73 + (hashStringToSeed(seed, "phase") % 628) / 100) * amount * 0.24;
    const normalOffset = (((hashStringToSeed(seed, index, "degrid-normal") % 1000) / 1000 - 0.5) * amount) + wave;
    const tangentOffset = ((hashStringToSeed(seed, index, "degrid-tangent") % 1000) / 1000 - 0.5) * amount * 0.56;
    return {
      x: point.x + normal.x * normalOffset + tangent.x * tangentOffset,
      y: point.y + normal.y * normalOffset + tangent.y * tangentOffset,
    };
  });
}

export function segmentedClosedPath(points) {
  if (!points || points.length < 3) return "";
  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${roundTo(point.x, 2)} ${roundTo(point.y, 2)}`).join(" ");
  return `M ${roundTo(first.x, 2)} ${roundTo(first.y, 2)} ${segments} Z`;
}

export function segmentedOpenPath(points) {
  if (!points || points.length < 2) return "";
  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${roundTo(point.x, 2)} ${roundTo(point.y, 2)}`).join(" ");
  return `M ${roundTo(first.x, 2)} ${roundTo(first.y, 2)} ${segments}`;
}

export function segmentedLoopPathWithSkippedEdges(points, skippedEdges = []) {
  if (!points || points.length < 3) return "";
  const skipped = new Set(skippedEdges.map((edge) => `${edge.from}:${edge.to}`));
  const paths = [];
  let current = [];
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    if (current.length === 0) current.push(points[index]);
    if (skipped.has(`${index}:${nextIndex}`)) {
      if (current.length > 1) paths.push(segmentedOpenPath(current));
      current = [];
      continue;
    }
    current.push(points[nextIndex]);
  }
  if (current.length > 1) paths.push(segmentedOpenPath(current));
  return paths.filter(Boolean).join(" ");
}

export function getLoopBounds(points, fallback) {
  if (!Array.isArray(points) || points.length === 0) return fallback;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  points.forEach((point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return fallback;
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

export function getAccessContourPoint(access, config) {
  if (access?.point) return { x: access.point.x, y: access.point.y };
  if (access?.displayPoint) return { x: access.displayPoint.x, y: access.displayPoint.y };
  if (access?.wallGap) {
    return {
      x: (access.wallGap.x1 + access.wallGap.x2) / 2,
      y: (access.wallGap.y1 + access.wallGap.y2) / 2,
    };
  }
  if (access?.segment) {
    return {
      x: (access.segment.x1 + access.segment.x2) / 2,
      y: (access.segment.y1 + access.segment.y2) / 2,
    };
  }
  if (access?.start) return { x: access.start.x, y: access.start.y };
  return getMapAccessGeometryCenter(access, config);
}

export function projectPointToLineSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return {
    x: a.x + dx * t,
    y: a.y + dy * t,
    t,
  };
}

export function findClosestLoopEdge(loop, point) {
  if (!Array.isArray(loop) || loop.length < 3 || !point) return null;
  let best = null;
  loop.forEach((a, index) => {
    const b = loop[(index + 1) % loop.length];
    const projected = projectPointToLineSegment(point, a, b);
    const dx = projected.x - point.x;
    const dy = projected.y - point.y;
    const score = dx * dx + dy * dy;
    if (!best || score < best.score) {
      best = { index, a, b, projected, score };
    }
  });
  return best;
}

export function distanceBetweenPoints(a, b) {
  return Math.hypot((b?.x || 0) - (a?.x || 0), (b?.y || 0) - (a?.y || 0));
}

export function createLoopArcMetrics(loop) {
  const points = Array.isArray(loop) ? loop : [];
  const edgeStarts = [];
  let total = 0;
  points.forEach((point, index) => {
    edgeStarts[index] = total;
    total += distanceBetweenPoints(point, points[(index + 1) % points.length]);
  });
  return { edgeStarts, totalLength: total };
}

export function getLoopArcPosition(loop, metrics, edgeIndex, point) {
  if (!Array.isArray(loop) || loop.length === 0 || !metrics || edgeIndex == null || !point) return 0;
  const index = ((edgeIndex % loop.length) + loop.length) % loop.length;
  return (metrics.edgeStarts[index] || 0) + distanceBetweenPoints(loop[index], point);
}

export function getLoopPointAtDistance(loop, edge, direction, distance) {
  if (!Array.isArray(loop) || loop.length < 3 || !edge) return null;
  const targetDistance = Math.max(0, distance);
  let remaining = targetDistance;
  let current = { x: edge.projected.x, y: edge.projected.y };
  let edgeIndex = edge.index;
  for (let guard = 0; guard < loop.length + 4; guard += 1) {
    const nextVertexIndex = direction < 0 ? edgeIndex : (edgeIndex + 1) % loop.length;
    const nextVertex = loop[nextVertexIndex];
    const segmentLength = distanceBetweenPoints(current, nextVertex);
    if (segmentLength >= remaining && segmentLength > 0.0001) {
      const t = remaining / segmentLength;
      return {
        x: current.x + (nextVertex.x - current.x) * t,
        y: current.y + (nextVertex.y - current.y) * t,
        edgeIndex,
        vertexIndex: nextVertexIndex,
      };
    }
    remaining -= segmentLength;
    current = nextVertex;
    edgeIndex = direction < 0 ? (edgeIndex - 1 + loop.length) % loop.length : (edgeIndex + 1) % loop.length;
  }
  return { ...current, edgeIndex, vertexIndex: edgeIndex };
}

export function collectLoopVertexRange(loop, startEdgeIndex, endEdgeIndex) {
  if (!Array.isArray(loop) || loop.length === 0) return [];
  const output = [];
  let index = (startEdgeIndex + 1) % loop.length;
  for (let guard = 0; guard < loop.length; guard += 1) {
    output.push(index);
    if (index === endEdgeIndex) break;
    index = (index + 1) % loop.length;
  }
  return output;
}

export function getCornerSharpness(loop, vertexIndex) {
  if (!Array.isArray(loop) || loop.length < 3 || vertexIndex == null) return 0;
  const previous = loop[(vertexIndex - 1 + loop.length) % loop.length];
  const current = loop[vertexIndex];
  const next = loop[(vertexIndex + 1) % loop.length];
  const a = normalizeGeometryVector({ x: previous.x - current.x, y: previous.y - current.y });
  const b = normalizeGeometryVector({ x: next.x - current.x, y: next.y - current.y });
  const dot = clamp(a.x * b.x + a.y * b.y, -1, 1);
  return Math.acos(dot);
}

export function scoreAccessBoundarySpan(loop, leftAttach, rightAttach, removedVertexIndices, normal, config) {
  const g = config.gridSize;
  const removed = removedVertexIndices || [];
  const sharpPenalty = removed.reduce((sum, vertexIndex) => {
    const angle = getCornerSharpness(loop, vertexIndex);
    if (!Number.isFinite(angle)) return sum;
    return sum + Math.max(0, (Math.PI * 0.66) - angle) * 18;
  }, 0);
  const span = distanceBetweenPoints(leftAttach, rightAttach);
  const mouthPenalty = span < g * 0.85 ? (g * 0.85 - span) * 1.5 : 0;
  const probeLeft = { x: leftAttach.x + normal.x * g * 0.4, y: leftAttach.y + normal.y * g * 0.4 };
  const probeRight = { x: rightAttach.x + normal.x * g * 0.4, y: rightAttach.y + normal.y * g * 0.4 };
  const insidePenalty = (pointInPolygon(probeLeft, loop) ? 40 : 0) + (pointInPolygon(probeRight, loop) ? 40 : 0);
  return sharpPenalty + mouthPenalty + insidePenalty;
}

export function pointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = ((current.y > point.y) !== (previous.y > point.y)) &&
      point.x < ((previous.x - current.x) * (point.y - current.y)) / ((previous.y - current.y) || 1) + current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function getOutwardNormalForPoint(point, tangent, bounds, loop, probeDistance) {
  const normalA = { x: -tangent.y, y: tangent.x };
  const normalB = { x: -normalA.x, y: -normalA.y };
  const probe = Math.max(6, probeDistance || 16);
  const probeA = { x: point.x + normalA.x * probe, y: point.y + normalA.y * probe };
  const probeB = { x: point.x + normalB.x * probe, y: point.y + normalB.y * probe };
  const aInside = pointInPolygon(probeA, loop);
  const bInside = pointInPolygon(probeB, loop);
  if (aInside !== bInside) return aInside ? normalB : normalA;
  const caveCenter = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const radial = normalizeGeometryVector({ x: point.x - caveCenter.x, y: point.y - caveCenter.y }, normalA);
  const radialNormal = normalA.x * radial.x + normalA.y * radial.y >= 0 ? normalA : normalB;
  const radialProbe = { x: point.x + radialNormal.x * probe, y: point.y + radialNormal.y * probe };
  return pointInPolygon(radialProbe, loop) ? { x: -radialNormal.x, y: -radialNormal.y } : radialNormal;
}

export function getSideFromNormal(normal) {
  if (Math.abs(normal.x) >= Math.abs(normal.y)) return normal.x < 0 ? "west" : "east";
  return normal.y < 0 ? "north" : "south";
}

export function createAccessMouthForLoop(access, edge, loop, config, bounds, order) {
  if (!access || !edge) return null;
  const g = config.gridSize;
  const dx = edge.b.x - edge.a.x;
  const dy = edge.b.y - edge.a.y;
  const edgeLength = Math.hypot(dx, dy);
  if (!Number.isFinite(edgeLength) || edgeLength < g * 0.18) return null;
  const tangent = normalizeGeometryVector({ x: dx, y: dy }, access.tangent || { x: 1, y: 0 });
  const normal = getOutwardNormalForPoint(edge.projected, tangent, bounds, loop, g * 0.72);
  const jitterSeed = hashStringToSeed(config.seed, access.id || order, "access-mouth");
  const jitter = (part, amount) => (((hashStringToSeed(jitterSeed, part) % 1000) / 1000) - 0.5) * amount;
  let mouthHalf = g * 0.55;
  let leftAttach = null;
  let rightAttach = null;
  let removedVertexIndices = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    mouthHalf = Math.min(g * 1.2, g * (0.55 + attempt * 0.14));
    const leftCandidate = getLoopPointAtDistance(loop, edge, -1, mouthHalf);
    const rightCandidate = getLoopPointAtDistance(loop, edge, 1, mouthHalf);
    if (!leftCandidate || !rightCandidate) continue;
    const removed = collectLoopVertexRange(loop, leftCandidate.edgeIndex, rightCandidate.edgeIndex);
    const spanScore = scoreAccessBoundarySpan(loop, leftCandidate, rightCandidate, removed, normal, config);
    leftAttach = leftCandidate;
    rightAttach = rightCandidate;
    removedVertexIndices = removed;
    if (spanScore < 18) break;
  }
  if (!leftAttach || !rightAttach) return null;
  const mouthVector = normalizeGeometryVector({ x: rightAttach.x - leftAttach.x, y: rightAttach.y - leftAttach.y }, tangent);
  const mouthSpan = Math.max(g * 0.85, distanceBetweenPoints(leftAttach, rightAttach));
  const mouthHalfActual = mouthSpan / 2;
  const tipHalf = mouthHalf * (0.48 + ((hashStringToSeed(jitterSeed, "tip") % 100) / 100) * 0.16);
  const shoulderHalf = Math.min(mouthHalfActual * 0.72, g * 0.86);
  const depth = g * (0.92 + ((hashStringToSeed(jitterSeed, "depth") % 100) / 100) * 0.3);
  const shoulderDepth = depth * 0.55;
  const projected = edge.projected;
  const leftMouth = { x: leftAttach.x, y: leftAttach.y };
  const rightMouth = { x: rightAttach.x, y: rightAttach.y };
  const metrics = createLoopArcMetrics(loop);
  const centerS = getLoopArcPosition(loop, metrics, edge.index, projected);
  let startS = getLoopArcPosition(loop, metrics, leftAttach.edgeIndex, leftMouth);
  let endS = getLoopArcPosition(loop, metrics, rightAttach.edgeIndex, rightMouth);
  if (endS < startS) endS += metrics.totalLength;
  const projectedCenter = { x: projected.x, y: projected.y };
  const centerProjection = projectPointToLineSegment(projectedCenter, leftMouth, rightMouth);
  const center = { x: centerProjection.x, y: centerProjection.y };
  const shoulderCenter = {
    x: center.x + normal.x * shoulderDepth,
    y: center.y + normal.y * shoulderDepth,
  };
  const tipCenter = {
    x: center.x + normal.x * depth,
    y: center.y + normal.y * depth,
  };
  const leftShoulderOuter = {
    x: shoulderCenter.x - mouthVector.x * shoulderHalf + normal.x * jitter("left-shoulder-n", g * 0.035) + mouthVector.x * jitter("left-shoulder-t", g * 0.04),
    y: shoulderCenter.y - mouthVector.y * shoulderHalf + normal.y * jitter("left-shoulder-n", g * 0.035) + mouthVector.y * jitter("left-shoulder-t", g * 0.04),
  };
  const leftTip = {
    x: tipCenter.x - mouthVector.x * tipHalf + normal.x * jitter("left-tip-n", g * 0.025) + mouthVector.x * jitter("left-tip-t", g * 0.03),
    y: tipCenter.y - mouthVector.y * tipHalf + normal.y * jitter("left-tip-n", g * 0.025) + mouthVector.y * jitter("left-tip-t", g * 0.03),
  };
  const rightTip = {
    x: tipCenter.x + mouthVector.x * tipHalf + normal.x * jitter("right-tip-n", g * 0.025) + mouthVector.x * jitter("right-tip-t", g * 0.03),
    y: tipCenter.y + mouthVector.y * tipHalf + normal.y * jitter("right-tip-n", g * 0.025) + mouthVector.y * jitter("right-tip-t", g * 0.03),
  };
  const rightShoulderOuter = {
    x: shoulderCenter.x + mouthVector.x * shoulderHalf + normal.x * jitter("right-shoulder-n", g * 0.035) + mouthVector.x * jitter("right-shoulder-t", g * 0.04),
    y: shoulderCenter.y + mouthVector.y * shoulderHalf + normal.y * jitter("right-shoulder-n", g * 0.035) + mouthVector.y * jitter("right-shoulder-t", g * 0.04),
  };
  return {
    id: access.id || `access-mouth-${order}`,
    accessId: access.id || `access-mouth-${order}`,
    accessType: access.type,
    edgeIndex: edge.index,
    boundaryLoopIndex: 0,
    centerS,
    startS,
    endS,
    projected: projectedCenter,
    projectedCenter,
    center,
    leftAttach: leftMouth,
    rightAttach: rightMouth,
    leftTip,
    rightTip,
    tangent: mouthVector,
    requestedTangent: tangent,
    normal,
    side: getSideFromNormal(normal),
    segment: { x1: leftMouth.x, y1: leftMouth.y, x2: rightMouth.x, y2: rightMouth.y },
    wallGap: { x1: leftMouth.x, y1: leftMouth.y, x2: rightMouth.x, y2: rightMouth.y },
    removedVertexIndices,
    leftAttachEdgeIndex: leftAttach.edgeIndex,
    rightAttachEdgeIndex: rightAttach.edgeIndex,
    displayPoint: center,
    handlePoint: { x: center.x + normal.x * g * 0.16, y: center.y + normal.y * g * 0.16 },
    start: { x: center.x + normal.x * (depth + g * 0.1), y: center.y + normal.y * (depth + g * 0.1) },
    end: { x: center.x - normal.x * g * 0.3, y: center.y - normal.y * g * 0.3 },
    caveBounds: bounds,
    debugRequestedPoint: access.point || access.displayPoint || access.start || null,
    debugFinalMouthCenter: center,
    debugLeftAttach: leftMouth,
    debugRightAttach: rightMouth,
    debugSnapDistance: distanceBetweenPoints(projectedCenter, center),
    points: [leftMouth, leftShoulderOuter, leftTip, rightTip, rightShoulderOuter, rightMouth],
    edgeRoles: [
      { role: "left-side-wall", fromOffset: 0, toOffset: 1, drawWall: true },
      { role: "left-side-wall", fromOffset: 1, toOffset: 2, drawWall: true },
      { role: "outer-open-edge", fromOffset: 2, toOffset: 3, drawWall: false },
      { role: "right-side-wall", fromOffset: 3, toOffset: 4, drawWall: true },
      { role: "right-side-wall", fromOffset: 4, toOffset: 5, drawWall: true },
      { role: "inner-open-edge", fromOffset: 5, toOffset: 0, drawWall: false, virtual: true },
    ],
  };
}

export function getSkippedWallEdgesForMouth(mouth, insertedStart) {
  if (!mouth || insertedStart < 0) return [];
  return (mouth.edgeRoles || [])
    .filter((edge) => edge.drawWall === false)
    .map((edge) => ({
      role: edge.role,
      virtual: Boolean(edge.virtual),
      from: insertedStart + edge.fromOffset,
      to: insertedStart + edge.toOffset,
    }));
}

export function loopToSegments(points, skippedEdges = []) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const skipped = new Set(skippedEdges.map((edge) => `${edge.from}:${edge.to}`));
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    if (skipped.has(`${index}:${(index + 1) % points.length}`)) return null;
    return { x1: point.x, y1: point.y, x2: next.x, y2: next.y };
  }).filter(Boolean);
}

export function applyCaveAccessMouthsToBoundaryLoop(loop, accesses, config) {
  if (!Array.isArray(loop) || loop.length < 3) return { points: loop || [], mouths: [] };
  const usableAccesses = (accesses || []).filter(Boolean);
  if (usableAccesses.length === 0) return { points: loop, mouths: [] };
  const bounds = getLoopBounds(loop, { x: 0, y: 0, width: config.mapWidth, height: config.mapHeight });
  const metrics = createLoopArcMetrics(loop);
  const minSpacing = config.gridSize * 0.28;
  const mouths = usableAccesses
    .map((access, order) => {
      const target = getAccessContourPoint(access, config);
      const edge = findClosestLoopEdge(loop, target);
      const mouth = createAccessMouthForLoop(access, edge, loop, config, bounds, order);
      return mouth ? { ...mouth, order } : null;
    })
    .filter(Boolean);
  const stableMouths = [];
  mouths.forEach((mouth) => {
    const overlapsExisting = stableMouths.some((existing) => (
      mouth.startS < existing.endS + minSpacing && mouth.endS + minSpacing > existing.startS
    ));
    if (overlapsExisting) return;
    stableMouths.push(mouth);
  });
  stableMouths.sort((a, b) => a.startS - b.startS || a.order - b.order);
  const points = [];
  const skippedEdges = [];
  let cursorIndex = 0;
  stableMouths.forEach((mouth) => {
    while (cursorIndex < loop.length && (metrics.edgeStarts[cursorIndex] || 0) < mouth.startS) {
      points.push({ x: loop[cursorIndex].x, y: loop[cursorIndex].y });
      cursorIndex += 1;
    }
    const insertedStart = points.length;
    points.push(...mouth.points.map((point) => ({ x: point.x, y: point.y })));
    while (cursorIndex < loop.length && (metrics.edgeStarts[cursorIndex] || 0) <= mouth.endS) {
      cursorIndex += 1;
    }
    const mouthSkippedEdges = getSkippedWallEdgesForMouth(mouth, insertedStart);
    mouth.skippedEdges = mouthSkippedEdges;
    mouth.drawEdges = (mouth.edgeRoles || []).filter((edge) => edge.drawWall !== false);
    mouth.removedStartIndex = mouth.removedVertexIndices?.[0] ?? null;
    mouth.removedEndIndex = mouth.removedVertexIndices?.[mouth.removedVertexIndices.length - 1] ?? null;
    skippedEdges.push(...mouthSkippedEdges);
  });
  while (cursorIndex < loop.length) {
    points.push({ x: loop[cursorIndex].x, y: loop[cursorIndex].y });
    cursorIndex += 1;
  }
  return {
    points: points.length >= 3 ? points : loop,
    mouths: stableMouths,
    skippedEdges,
    baseBoundaryLoop: loop,
  };
}

export function removeMouthCoveredBoundaryPoints(points, mouth, insertedStart) {
  if (!mouth || !Array.isArray(mouth.removedVertexIndices) || mouth.removedVertexIndices.length === 0) return points;
  const insertedEnd = insertedStart + mouth.points.length - 1;
  const removed = new Set(mouth.removedVertexIndices);
  return points.filter((point, index) => {
    if (index >= insertedStart && index <= insertedEnd) return true;
    const originalIndex = index > insertedEnd ? index - mouth.points.length : index;
    return !removed.has(originalIndex);
  });
}

export function createHexCaveContourPointsFromSegments(segments, config, layer = "floor") {
  const loops = buildBoundaryLoops(segments)
    .filter((loop) => loop.length > 3)
    .sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  const seed = hashStringToSeed(config.seed, layer, "hex-cave-contour");
  const loop = loops[0];
  if (!loop) return [];
  const softenedGrid = chaikinClosed(loop, 1);
  const thinned = thinClosedContourPoints(softenedGrid, config.gridSize * (layer === "wall" ? 0.58 : 0.52));
  const angularPoints = densifyAngularContourPoints(thinned, config.gridSize * (layer === "wall" ? 0.54 : 0.48));
  const degridded = degridCaveContourPoints(angularPoints, `${seed}:0:degrid`, config.gridSize * (layer === "floor" ? 0.18 : 0.13));
  const jittered = angularizeCaveContourPoints(degridded, `${seed}:0`, config.gridSize * (layer === "floor" ? 0.14 : 0.1), { preserveEvery: 3, tangentAmount: config.gridSize * 0.14 });
  return smoothClosedContourPoints(jittered, 1, 0.008);
}

export function createHexCavePathFromSegments(segments, config, layer = "floor") {
  return segmentedClosedPath(createHexCaveContourPointsFromSegments(segments, config, layer));
}

export function getApproximateSquareCellsForHexCave(hexCells, config) {
  const size = getCaveHexSize(config);
  const origin = getCaveHexOrigin(config);
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const cells = new Map();
  hexCells.forEach((hex) => {
    const center = axialHexToPixel(hex, size, origin);
    const cell = {
      x: clamp(Math.floor(center.x / config.gridSize), 0, gridW - 1),
      y: clamp(Math.floor(center.y / config.gridSize), 0, gridH - 1),
    };
    cells.set(cellKey(cell.x, cell.y), cell);
  });
  return Array.from(cells.values());
}

export function createHexCaveSurface(generatedMap) {
  const hexCells = createHexCaveCells(generatedMap);
  const boundarySegments = createHexCaveBoundarySegments(hexCells, generatedMap.config);
  const accesses = getCaveMapAccessesForGeometry(generatedMap);
  const baseFloorLoop = createHexCaveContourPointsFromSegments(boundarySegments, generatedMap.config, "floor");
  const baseWallLoop = createHexCaveContourPointsFromSegments(boundarySegments, generatedMap.config, "wall");
  const baseSketchLoop = createHexCaveContourPointsFromSegments(boundarySegments, generatedMap.config, "sketch");
  const floorResult = applyCaveAccessMouthsToBoundaryLoop(baseFloorLoop, accesses, generatedMap.config);
  const wallResult = applyCaveAccessMouthsToBoundaryLoop(baseWallLoop, accesses, generatedMap.config);
  const sketchResult = applyCaveAccessMouthsToBoundaryLoop(baseSketchLoop, accesses, generatedMap.config);
  const visualFloorPath = segmentedClosedPath(floorResult.points);
  const wallPath = segmentedLoopPathWithSkippedEdges(wallResult.points, wallResult.skippedEdges);
  const sketchPath = segmentedLoopPathWithSkippedEdges(sketchResult.points, sketchResult.skippedEdges);
  const accessBoundarySegments = wallResult.points.length > 0 ? loopToSegments(wallResult.points, wallResult.skippedEdges) : boundarySegments;
  const floorCells = getApproximateSquareCellsForHexCave(hexCells, generatedMap.config);
  return {
    kind: "hex-cave-map",
    geometryKind: "hex-cave-map",
    surfaceKind: "cave",
    hexCells,
    floorCells,
    visualFloorPath,
    clipPath: visualFloorPath,
    wallPath,
    sketchPath,
    boundarySegments: accessBoundarySegments,
    baseBoundaryLoop: baseWallLoop,
    baseBoundarySegments: boundarySegments,
    accessMouths: wallResult.mouths,
  };
}

export function countCellsAround(set, cell, diagonal = true) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      if (!diagonal && Math.abs(dx) + Math.abs(dy) !== 1) continue;
      if (set.has(cellKey(cell.x + dx, cell.y + dy))) count += 1;
    }
  }
  return count;
}

export function createNaturalCaveVisualCells(floorCells, config) {
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  let current = new Set((floorCells || []).map((cell) => cellKey(cell.x, cell.y)));
  for (let pass = 0; pass < 3; pass += 1) {
    const candidates = new Set(current);
    current.forEach((key) => {
      const cell = parseCellKey(key);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const next = { x: cell.x + dx, y: cell.y + dy };
          if (next.x < 1 || next.y < 1 || next.x >= gridW - 1 || next.y >= gridH - 1) continue;
          candidates.add(cellKey(next.x, next.y));
        }
      }
    });
    const next = new Set(current);
    candidates.forEach((key) => {
      const cell = parseCellKey(key);
      const neighbors8 = countCellsAround(current, cell, true);
      const neighbors4 = countCellsAround(current, cell, false);
      const noise = hashStringToSeed(config.seed, key, pass, "natural-cave-visual-cell") % 100;
      if (!current.has(key) && (neighbors8 >= 5 || neighbors4 >= 3 || (neighbors8 >= 4 && noise < 42))) next.add(key);
      if (current.has(key) && neighbors4 <= 1 && neighbors8 <= 2 && noise < 62) next.delete(key);
    });
    current = next;
  }
  return Array.from(current).map(parseCellKey);
}

export function addBoundaryEdge(edges, a, b) {
  edges.push({ a, b, used: false });
}

export function traceBoundaryLoops(edges) {
  const starts = new Map();
  edges.forEach((edge, index) => {
    const key = pointKey(edge.a);
    if (!starts.has(key)) starts.set(key, []);
    starts.get(key).push(index);
  });
  const loops = [];
  edges.forEach((edge) => {
    if (edge.used) return;
    edge.used = true;
    const loop = [{ ...edge.a }, { ...edge.b }];
    let current = edge.b;
    let guard = 0;
    while (guard < edges.length + 4) {
      guard += 1;
      if (current.x === loop[0].x && current.y === loop[0].y) break;
      const candidates = starts.get(pointKey(current)) || [];
      const nextIndex = candidates.find((candidateIndex) => !edges[candidateIndex].used);
      if (nextIndex == null) break;
      const nextEdge = edges[nextIndex];
      nextEdge.used = true;
      current = nextEdge.b;
      loop.push({ ...current });
    }
    if (loop.length >= 5) loops.push(loop);
  });
  return loops;
}

export function simplifyCollinearPoints(points) {
  if (!points || points.length <= 4) return points || [];
  return points.filter((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const sameX = previous.x === point.x && point.x === next.x;
    const sameY = previous.y === point.y && point.y === next.y;
    return !sameX && !sameY;
  });
}

export function buildOrganicCaveContourPoints(floorCells, gridSize, seed) {
  const cells = new Set((floorCells || []).map((cell) => cellKey(cell.x, cell.y)));
  if (cells.size === 0) return [];
  const edges = [];
  cells.forEach((key) => {
    const cell = parseCellKey(key);
    const x = cell.x;
    const y = cell.y;
    if (!cells.has(cellKey(x, y - 1))) addBoundaryEdge(edges, { x, y }, { x: x + 1, y });
    if (!cells.has(cellKey(x + 1, y))) addBoundaryEdge(edges, { x: x + 1, y }, { x: x + 1, y: y + 1 });
    if (!cells.has(cellKey(x, y + 1))) addBoundaryEdge(edges, { x: x + 1, y: y + 1 }, { x, y: y + 1 });
    if (!cells.has(cellKey(x - 1, y))) addBoundaryEdge(edges, { x, y: y + 1 }, { x, y });
  });
  const loops = traceBoundaryLoops(edges)
    .map(simplifyCollinearPoints)
    .filter((loop) => loop.length >= 4)
    .sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  const loop = loops[0];
  if (!loop) return [];
  const pixelLoop = loop.map((point) => ({ x: point.x * gridSize, y: point.y * gridSize }));
  const softenedGrid = chaikinClosed(pixelLoop, 1);
  const thinned = thinClosedContourPoints(softenedGrid, gridSize * 0.56);
  const angularPoints = densifyAngularContourPoints(thinned, gridSize * 0.46);
  const degridded = degridCaveContourPoints(angularPoints, `${seed}:loop:0:degrid`, gridSize * 0.17);
  const jittered = angularizeCaveContourPoints(degridded, `${seed}:loop:0`, gridSize * 0.13, { preserveEvery: 3, tangentAmount: gridSize * 0.13 });
  return smoothClosedContourPoints(jittered, 1, 0.008);
}

export function buildOrganicCaveContourPath(floorCells, gridSize, seed) {
  return segmentedClosedPath(buildOrganicCaveContourPoints(floorCells, gridSize, seed));
}

export function createSeededRandom(seed) {
  let state = 2166136261;
  const input = String(seed ?? "cruor-map-seed");
  for (let i = 0; i < input.length; i += 1) {
    state ^= input.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  state >>>= 0;
  return function seededRandom() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function valueNoise2D(x, y, scaleOrRandom = 1, maybeRandom) {
  let scale = 1;
  let random = maybeRandom;
  if (typeof scaleOrRandom === "function") random = scaleOrRandom;
  else if (Number.isFinite(scaleOrRandom) && scaleOrRandom !== 0) scale = scaleOrRandom;
  const sx = Number.isFinite(x) ? x / scale : 0;
  const sy = Number.isFinite(y) ? y / scale : 0;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const tx = sx - x0;
  const ty = sy - y0;
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const hash = (ix, iy) => {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const n00 = hash(x0, y0);
  const n10 = hash(x0 + 1, y0);
  const n01 = hash(x0, y0 + 1);
  const n11 = hash(x0 + 1, y0 + 1);
  const u = smooth(tx);
  const v = smooth(ty);
  const base = mix(mix(n00, n10, u), mix(n01, n11, u), v);
  if (typeof random !== "function") return base;
  return mix(base, random(), 0.08);
}

export function getCellBounds(cells) {
  if (!Array.isArray(cells) || cells.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  cells.forEach((cell) => {
    if (!cell) return;
    const x = Number(cell.x);
    const y = Number(cell.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

export function createNaturalizedSingleRegionCells(floorCells, config) {
  if (!Array.isArray(floorCells) || floorCells.length === 0) return [];
  const gridSize = config.gridSize || DEFAULT_CONFIG.gridSize;
  const baseSeed = hashStringToSeed(config.seed, "single-region-wild-cave-cells");
  const bounds = getCellBounds(floorCells);
  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxY - bounds.minY + 1);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const longAxisBias = createSeededRandom(baseSeed, "axis-bias")() < 0.5 ? "x" : "y";
  const stretch = 1.25 + createSeededRandom(baseSeed, "stretch")() * 0.85;
  const indentationStrength = 0.28 + createSeededRandom(baseSeed, "indentation")() * 0.22;
  const spikeStrength = 0.2 + createSeededRandom(baseSeed, "spikes")() * 0.22;
  const keep = new Set();
  const baseSet = new Set(floorCells.map((cell) => cellKey(cell.x, cell.y)));
  floorCells.forEach((cell) => {
    const nx = width <= 1 ? 0 : ((cell.x - centerX) / Math.max(1, width / 2));
    const ny = height <= 1 ? 0 : ((cell.y - centerY) / Math.max(1, height / 2));
    const sx = longAxisBias === "x" ? nx / stretch : nx * stretch;
    const sy = longAxisBias === "y" ? ny / stretch : ny * stretch;
    const angle = Math.atan2(sy, sx);
    const radius = Math.hypot(sx, sy);
    const radialNoise = Math.sin(angle * 3 + baseSeed * 0.00011) * indentationStrength + Math.sin(angle * 5.7 + baseSeed * 0.00017) * 0.18 + Math.sin(angle * 9.3 + baseSeed * 0.00023) * spikeStrength;
    const localNoise = valueNoise2D(cell.x * 0.43, cell.y * 0.43, baseSeed) * 0.24;
    const edgeNoise = valueNoise2D(cell.x * 0.91, cell.y * 0.91, baseSeed + 971) * 0.18;
    const threshold = 1.02 + radialNoise + localNoise + edgeNoise;
    const randomPocket = createSeededRandom(baseSeed, cell.x, cell.y, "single-cave-pocket")();
    if (radius <= threshold || (radius <= 1.22 && randomPocket > 0.78)) keep.add(cellKey(cell.x, cell.y));
  });
  const boundary = [...keep].map(parseCellKey).filter((cell) => {
    const neighbors = ORTHOGONAL_DIRECTIONS.map((dir) => cellKey(cell.x + dir.x, cell.y + dir.y));
    return neighbors.some((key) => !keep.has(key));
  });
  boundary.forEach((cell) => {
    const angle = Math.atan2(cell.y - centerY, cell.x - centerX);
    const spikeRoll = createSeededRandom(baseSeed, cell.x, cell.y, "single-cave-spike")();
    if (spikeRoll < 0.18) {
      const length = 1 + Math.floor(createSeededRandom(baseSeed, cell.x, cell.y, "single-cave-spike-length")() * 3);
      const dx = Math.round(Math.cos(angle));
      const dy = Math.round(Math.sin(angle));
      for (let step = 1; step <= length; step += 1) {
        const key = cellKey(cell.x + dx * step, cell.y + dy * step);
        if (baseSet.has(key)) keep.add(key);
      }
    }
  });
  const cells = [...keep].map(parseCellKey);
  const naturalized = createNaturalCaveVisualCells(cells, { ...config, gridSize });
  return naturalized.length > 0 ? naturalized : cells;
}

export function createCellBasedCaveSurface(generatedMap) {
  const { config, dungeonMask } = generatedMap;
  const floorCells = dungeonMask.floorCells || [];
  const visualFloorCells = isSingleRegionCaveMap(generatedMap)
    ? createNaturalizedSingleRegionCells(floorCells, config)
    : createNaturalCaveVisualCells(floorCells, config);
  const renderCells = visualFloorCells.length > 0 ? visualFloorCells : floorCells;
  const boundarySegments = computeBoundarySegments(renderCells, config.gridSize);
  const baseContour = buildOrganicCaveContourPoints(renderCells, config.gridSize, hashStringToSeed(config.seed, "cell-cave-unified-contour"));
  const accessResult = applyCaveAccessMouthsToBoundaryLoop(baseContour, getCaveMapAccessesForGeometry(generatedMap), config);
  const visualFloorPath = segmentedClosedPath(accessResult.points) || buildFloorPath(renderCells, config.gridSize);
  const wallPath = segmentedLoopPathWithSkippedEdges(accessResult.points, accessResult.skippedEdges) || visualFloorPath;
  const accessBoundarySegments = accessResult.points.length > 0 ? loopToSegments(accessResult.points, accessResult.skippedEdges) : boundarySegments;
  return {
    kind: "organic-cave-map",
    geometryKind: "organic-cave-map",
    surfaceKind: "cave",
    floorCells,
    visualFloorCells,
    visualFloorPath,
    clipPath: visualFloorPath,
    wallPath,
    sketchPath: wallPath,
    boundarySegments: accessBoundarySegments,
    baseBoundaryLoop: baseContour,
    baseBoundarySegments: boundarySegments,
    accessMouths: accessResult.mouths,
  };
}

export function isOrganicRegionSurface(region) {
  return region?.shape === "cave" || region?.surfaceKind === "cave" || region?.surfaceKind === "hybrid" || region?.placementProfile === "cave";
}

export function buildOrganicCellBoundaryPath(region, generatedMap = null, gridSize = DEFAULT_CONFIG.gridSize) {
  const sourceCells = Array.isArray(region.floorCells) ? region.floorCells : [];
  if (sourceCells.length === 0) return "";
  const seed = generatedMap?.config?.seed || DEFAULT_CONFIG.seed;
  const floorCells = isSingleRegionCaveMap(generatedMap)
    ? createNaturalizedSingleRegionCells(sourceCells, { ...(generatedMap?.config || DEFAULT_CONFIG), gridSize, seed: hashStringToSeed(seed, region.id, "single-region-path") })
    : sourceCells;
  const organicContourPath = buildOrganicCaveContourPath(floorCells, gridSize, hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-contour"));
  if (organicContourPath) return organicContourPath;
  return "";
}

export function buildOrganicCorridorBoundaryPath(corridor, generatedMap = null, gridSize = DEFAULT_CONFIG.gridSize, layer = "surface") {
  const floorCells = Array.isArray(corridor.floorCells) ? corridor.floorCells : [];
  if (!isOrganicCorridor(corridor) || floorCells.length === 0) return "";
  const seed = generatedMap?.config?.seed || DEFAULT_CONFIG.seed;
  const organicContourPath = buildOrganicCaveContourPath(floorCells, gridSize, hashStringToSeed(seed, corridor.id, layer, "organic-corridor-contour"));
  if (organicContourPath) return organicContourPath;
  return buildFloorPath(floorCells, gridSize);
}

export function createCorridorSurface(corridor, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
  const gridSize = generatedMap?.config?.gridSize || gridSizeFallback || DEFAULT_CONFIG.gridSize;
  const floorCells = Array.isArray(corridor.floorCells) ? corridor.floorCells : [];
  const organicPath = buildOrganicCorridorBoundaryPath(corridor, generatedMap, gridSize, "surface");
  const visualFloorPath = organicPath || buildFloorPath(floorCells, gridSize);
  const organicSurface = Boolean(organicPath);
  return {
    corridorId: corridor.id,
    surfaceKind: isOrganicCorridor(corridor) ? "cave" : "dungeon",
    kind: organicSurface ? "organic-corridor-mask" : "corridor-cell-mask",
    geometryKind: organicSurface ? "organic-corridor-mask" : "corridor-cell-mask",
    gridSize,
    floorCells,
    pathCells: getCorridorTopologyCells(corridor),
    visualFloorPath,
    clipPath: visualFloorPath,
    wallPath: organicSurface ? buildOrganicCorridorBoundaryPath(corridor, generatedMap, gridSize, "wall") : "",
    boundarySegments: computeBoundarySegments(floorCells, gridSize),
  };
}

export function createCellMaskRegionSurface(region, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
  const gridSize = generatedMap?.config?.gridSize || gridSizeFallback || DEFAULT_CONFIG.gridSize;
  const floorCells = Array.isArray(region.floorCells) ? region.floorCells : [];
  const boundarySegments = computeBoundarySegments(floorCells, gridSize);
  const organicPath = isOrganicRegionSurface(region) ? buildOrganicCellBoundaryPath(region, generatedMap, gridSize) : "";
  const visualFloorPath = organicPath || buildFloorPath(floorCells, gridSize);
  const organicSurface = Boolean(organicPath);
  const boundaryPath = buildBoundarySegmentPath(boundarySegments);
  const wallPath = organicSurface ? visualFloorPath : boundaryPath;
  return {
    regionId: region.id,
    surfaceKind: getRegionSurfaceKind(region, generatedMap),
    kind: organicSurface ? "organic-cell-mask" : "cell-mask",
    geometryKind: organicSurface ? "organic-cell-mask" : "cell-mask",
    gridSize,
    floorCells,
    extensionCells: [],
    visualFloorPath,
    clipPath: visualFloorPath,
    hoverPath: organicSurface ? visualFloorPath : "",
    hoverSegments: boundarySegments,
    wallArcPath: wallPath,
    wallPath,
    sketchPath: wallPath,
    wallSegments: boundarySegments,
    boundarySegments,
    connectionAnchors: getDoorBoundaryCells(region),
  };
}

export function isHybridLocalCaveRegion(region, generatedMap = null) {
  if (isPureCaveMap(generatedMap)) return false;
  if (getContextKey(generatedMap?.config?.context || generatedMap?.config?.biome) !== "mine") return false;
  return region?.surfaceKind === "cave" || region?.surfaceKind === "hybrid";
}

export function getCellCenter(cell, gridSize) {
  return {
    x: (cell.x + 0.5) * gridSize,
    y: (cell.y + 0.5) * gridSize,
  };
}

export function getMineCaveConnectorOpenSegment(cell, normal, gridSize) {
  const x = cell.x * gridSize;
  const y = cell.y * gridSize;
  const right = x + gridSize;
  const bottom = y + gridSize;
  if (Math.abs(normal.x) >= Math.abs(normal.y)) {
    return normal.x >= 0
      ? { x1: right, y1: y, x2: right, y2: bottom }
      : { x1: x, y1: y, x2: x, y2: bottom };
  }
  return normal.y >= 0
    ? { x1: x, y1: bottom, x2: right, y2: bottom }
    : { x1: x, y1: y, x2: right, y2: y };
}

export function segmentsMatchUndirected(a, b, tolerance = 0.01) {
  if (!a || !b) return false;
  const same = Math.abs(a.x1 - b.x1) <= tolerance
    && Math.abs(a.y1 - b.y1) <= tolerance
    && Math.abs(a.x2 - b.x2) <= tolerance
    && Math.abs(a.y2 - b.y2) <= tolerance;
  const reversed = Math.abs(a.x1 - b.x2) <= tolerance
    && Math.abs(a.y1 - b.y2) <= tolerance
    && Math.abs(a.x2 - b.x1) <= tolerance
    && Math.abs(a.y2 - b.y1) <= tolerance;
  return same || reversed;
}

export function createMineCaveConnectorPad(corridor, endpoint, region, gridSize) {
  const anchor = endpoint === "from" ? corridor.fromAnchor : corridor.toAnchor;
  if (!anchor?.outsideCell || !anchor?.cell) return null;
  const normal = anchor.normal
    ? { x: Math.sign(anchor.normal.x), y: Math.sign(anchor.normal.y) }
    : {
      x: Math.sign(anchor.outsideCell.x - anchor.cell.x),
      y: Math.sign(anchor.outsideCell.y - anchor.cell.y),
    };
  if (normal.x === 0 && normal.y === 0) return null;
  const tangent = { x: -normal.y, y: normal.x };
  const padCell = { x: anchor.outsideCell.x, y: anchor.outsideCell.y };
  const corridorTerminalCenter = {
    x: (padCell.x + 0.5 - normal.x * 0.5) * gridSize,
    y: (padCell.y + 0.5 - normal.y * 0.5) * gridSize,
  };
  const caveAttachCenter = corridorTerminalCenter;
  const half = gridSize * 0.5;
  const corridorTerminalLeft = { x: corridorTerminalCenter.x - tangent.x * half, y: corridorTerminalCenter.y - tangent.y * half };
  const corridorTerminalRight = { x: corridorTerminalCenter.x + tangent.x * half, y: corridorTerminalCenter.y + tangent.y * half };
  const caveAttachLeft = { x: caveAttachCenter.x - tangent.x * half, y: caveAttachCenter.y - tangent.y * half };
  const caveAttachRight = { x: caveAttachCenter.x + tangent.x * half, y: caveAttachCenter.y + tangent.y * half };
  return {
    type: "mine-cave-connector-pad",
    corridorId: corridor.id,
    endpoint,
    regionId: region.id,
    cell: padCell,
    cells: [padCell],
    corridorTerminalCenter,
    corridorTerminalLeft,
    corridorTerminalRight,
    caveAttachCenter,
    caveAttachLeft,
    caveAttachRight,
    direction: normal,
    tangent,
    normal,
    width: gridSize,
    depth: gridSize,
    openToCorridor: true,
    openToCave: true,
    corridorOpenSegment: { x1: corridorTerminalLeft.x, y1: corridorTerminalLeft.y, x2: corridorTerminalRight.x, y2: corridorTerminalRight.y },
  };
}

export function collectMineCaveConnectorPads(generatedMap, caveRegionIds) {
  const gridSize = generatedMap?.config?.gridSize || DEFAULT_CONFIG.gridSize;
  const regionById = new Map((generatedMap?.regions || []).map((region) => [region.id, region]));
  const padsByRegion = new Map();
  const addPad = (corridor, endpoint) => {
    const regionId = endpoint === "from" ? corridor.from : corridor.to;
    if (!caveRegionIds.has(regionId)) return;
    const region = regionById.get(regionId);
    if (!region) return;
    const pad = createMineCaveConnectorPad(corridor, endpoint, region, gridSize);
    if (!pad) return;
    if (!padsByRegion.has(regionId)) padsByRegion.set(regionId, []);
    const existing = padsByRegion.get(regionId);
    if (!existing.some((item) => item.corridorId === pad.corridorId && item.endpoint === pad.endpoint)) existing.push(pad);
  };
  (generatedMap?.corridors || []).forEach((corridor) => {
    if (corridor.surfaceKind !== "mine-tunnel") return;
    addPad(corridor, "from");
    addPad(corridor, "to");
  });
  return padsByRegion;
}

export function addMineCaveConnectorPadsToRegion(region, connectorPads) {
  if (!Array.isArray(connectorPads) || connectorPads.length === 0) return region;
  const cellsByKey = new Map((region.floorCells || []).map((cell) => [cellKey(cell.x, cell.y), { x: cell.x, y: cell.y }]));
  connectorPads.forEach((pad) => {
    (pad.cells || []).forEach((cell) => cellsByKey.set(cellKey(cell.x, cell.y), { x: cell.x, y: cell.y }));
  });
  return {
    ...region,
    floorCells: Array.from(cellsByKey.values()),
    mineCaveConnectorPads: connectorPads,
  };
}

export function createMineCavePassAccesses(connectorPads) {
  return (connectorPads || []).map((pad) => ({
    id: `${pad.corridorId}-${pad.endpoint}-mine-cave-pass-mouth`,
    type: "passage",
    point: pad.corridorTerminalCenter || pad.caveAttachCenter,
    displayPoint: pad.corridorTerminalCenter || pad.caveAttachCenter,
    tangent: pad.tangent,
    normal: pad.normal,
    connectorPad: pad,
  }));
}

export function getMinePassMouthInsertedStart(mouth) {
  const outerSkip = (mouth?.skippedEdges || []).find((edge) => edge.role === "outer-open-edge");
  return Number.isFinite(outerSkip?.from) ? outerSkip.from - 2 : -1;
}

export function alignMineCavePassMouthsToCorridorSeams(accessResult, passAccesses) {
  if (!accessResult?.points?.length || !accessResult?.mouths?.length) return accessResult;
  const accessById = new Map((passAccesses || []).map((access) => [access.id, access]));
  accessResult.mouths.forEach((mouth) => {
    const connectorPad = accessById.get(mouth.accessId)?.connectorPad;
    if (!connectorPad?.corridorTerminalLeft || !connectorPad?.corridorTerminalRight) return;
    const insertedStart = getMinePassMouthInsertedStart(mouth);
    if (insertedStart < 0 || insertedStart + 4 >= accessResult.points.length) return;
    const terminalLeft = { x: connectorPad.corridorTerminalLeft.x, y: connectorPad.corridorTerminalLeft.y };
    const terminalRight = { x: connectorPad.corridorTerminalRight.x, y: connectorPad.corridorTerminalRight.y };
    const terminalCenter = connectorPad.corridorTerminalCenter;
    const terminalVector = normalizeGeometryVector({
      x: terminalRight.x - terminalLeft.x,
      y: terminalRight.y - terminalLeft.y,
    }, mouth.tangent);
    const mouthTangent = terminalVector.x * mouth.tangent.x + terminalVector.y * mouth.tangent.y >= 0
      ? terminalVector
      : { x: -terminalVector.x, y: -terminalVector.y };
    const corridorWidth = Math.max(distanceBetweenPoints(terminalLeft, terminalRight), connectorPad.width || 0);
    const mouthHalf = Math.max(corridorWidth * 0.55, Math.min(corridorWidth * 0.675, connectorPad.width * 0.675 || corridorWidth * 0.625));
    const existingDepth = distanceBetweenPoints(mouth.center, terminalCenter);
    const desiredDepth = Math.max(connectorPad.depth * 0.65, Math.min(connectorPad.depth, existingDepth || connectorPad.depth * 0.78));
    const mouthCenter = {
      x: terminalCenter.x - mouth.normal.x * desiredDepth,
      y: terminalCenter.y - mouth.normal.y * desiredDepth,
    };
    const leftMouth = {
      x: mouthCenter.x - mouthTangent.x * mouthHalf,
      y: mouthCenter.y - mouthTangent.y * mouthHalf,
    };
    const rightMouth = {
      x: mouthCenter.x + mouthTangent.x * mouthHalf,
      y: mouthCenter.y + mouthTangent.y * mouthHalf,
    };
    const leftShoulder = {
      x: (leftMouth.x + terminalLeft.x) / 2,
      y: (leftMouth.y + terminalLeft.y) / 2,
    };
    const rightShoulder = {
      x: (rightMouth.x + terminalRight.x) / 2,
      y: (rightMouth.y + terminalRight.y) / 2,
    };
    accessResult.points[insertedStart + 1] = leftShoulder;
    accessResult.points[insertedStart + 2] = terminalLeft;
    accessResult.points[insertedStart + 3] = terminalRight;
    accessResult.points[insertedStart + 4] = rightShoulder;
    mouth.points = [leftMouth, leftShoulder, terminalLeft, terminalRight, rightShoulder, rightMouth];
    mouth.center = mouthCenter;
    mouth.tangent = mouthTangent;
    mouth.leftAttach = leftMouth;
    mouth.rightAttach = rightMouth;
    mouth.leftTip = terminalLeft;
    mouth.rightTip = terminalRight;
    mouth.corridorTerminalCenter = connectorPad.corridorTerminalCenter;
    mouth.corridorTerminalLeft = terminalLeft;
    mouth.corridorTerminalRight = terminalRight;
    mouth.outerCenter = connectorPad.corridorTerminalCenter;
    mouth.outerLeft = terminalLeft;
    mouth.outerRight = terminalRight;
    mouth.seam = {
      corridorId: connectorPad.corridorId,
      endpoint: connectorPad.endpoint,
      regionId: connectorPad.regionId,
      surfaceKind: "cave",
      corridorTerminalCenter: connectorPad.corridorTerminalCenter,
      corridorTerminalLeft: terminalLeft,
      corridorTerminalRight: terminalRight,
      mouthCenter,
      mouthLeft: leftMouth,
      mouthRight: rightMouth,
      outerCenter: connectorPad.corridorTerminalCenter,
      outerLeft: terminalLeft,
      outerRight: terminalRight,
      tangent: mouthTangent,
      normal: mouth.normal,
      width: distanceBetweenPoints(leftMouth, rightMouth),
      depth: distanceBetweenPoints(mouthCenter, connectorPad.corridorTerminalCenter),
    };
  });
  return accessResult;
}

export function expandCellsForMineCaveContour(floorCells) {
  const cells = new Map();
  (floorCells || []).forEach((cell) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const next = { x: cell.x + dx, y: cell.y + dy };
        cells.set(cellKey(next.x, next.y), next);
      }
    }
  });
  return Array.from(cells.values());
}

export function createFallbackMineCaveContourFromCells(floorCells, gridSize, seed) {
  if (!Array.isArray(floorCells) || floorCells.length === 0) return [];
  const bounds = getCellBounds(floorCells);
  const minX = bounds.minX * gridSize;
  const minY = bounds.minY * gridSize;
  const maxX = (bounds.maxX + 1) * gridSize;
  const maxY = (bounds.maxY + 1) * gridSize;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = Math.max(gridSize * 0.95, (maxX - minX) / 2);
  const ry = Math.max(gridSize * 0.95, (maxY - minY) / 2);
  const count = 14;
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    const noise = ((hashStringToSeed(seed, index, "mine-cave-fallback-contour") % 1000) / 1000 - 0.5) * gridSize * 0.18;
    const tangentNoise = ((hashStringToSeed(seed, index, "mine-cave-fallback-tangent") % 1000) / 1000 - 0.5) * gridSize * 0.1;
    return {
      x: cx + Math.cos(angle) * (rx + noise) + Math.cos(angle + Math.PI / 2) * tangentNoise,
      y: cy + Math.sin(angle) * (ry + noise) + Math.sin(angle + Math.PI / 2) * tangentNoise,
    };
  });
}

export function createMineHybridOrganicRegionSurface(region, generatedMap, connectorPads) {
  const gridSize = generatedMap.config.gridSize;
  const seed = generatedMap?.config?.seed || DEFAULT_CONFIG.seed;
  const floorCells = Array.isArray(region.floorCells) ? region.floorCells : [];
  const baseBoundarySegments = computeBoundarySegments(floorCells, gridSize);
  let contourCells = floorCells;
  let baseContour = buildOrganicCaveContourPoints(contourCells, gridSize, hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-contour"));
  if (!Array.isArray(baseContour) || baseContour.length < 3) {
    contourCells = createNaturalCaveVisualCells(floorCells, { ...generatedMap.config, gridSize });
    baseContour = buildOrganicCaveContourPoints(contourCells, gridSize, hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-contour-fallback"));
  }
  if (!Array.isArray(baseContour) || baseContour.length < 3) {
    contourCells = expandCellsForMineCaveContour(floorCells);
    baseContour = buildOrganicCaveContourPoints(contourCells, gridSize, hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-contour-expanded"));
  }
  if (!Array.isArray(baseContour) || baseContour.length < 3) {
    baseContour = createFallbackMineCaveContourFromCells(floorCells, gridSize, hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-contour-local-fallback"));
  }
  if (!Array.isArray(baseContour) || baseContour.length < 3) return null;
  const passAccesses = createMineCavePassAccesses(connectorPads);
  const accessResult = alignMineCavePassMouthsToCorridorSeams(
    applyCaveAccessMouthsToBoundaryLoop(baseContour, passAccesses, generatedMap.config),
    passAccesses
  );
  const visualFloorPath = segmentedClosedPath(accessResult.points);
  const wallPath = segmentedLoopPathWithSkippedEdges(accessResult.points, accessResult.skippedEdges);
  const boundarySegments = accessResult.points.length > 0 ? loopToSegments(accessResult.points, accessResult.skippedEdges) : baseBoundarySegments;
  const passMouths = (accessResult.mouths || []).map((mouth) => {
    const connectorPad = passAccesses.find((access) => access.id === mouth.accessId)?.connectorPad || null;
    return {
      type: "mine-cave-pass-mouth",
      corridorId: connectorPad?.corridorId || mouth.accessId,
      endpoint: connectorPad?.endpoint || null,
      regionId: region.id,
      center: mouth.center,
      tangent: mouth.tangent,
      normal: mouth.normal,
      mouthLeft: mouth.leftAttach,
      mouthRight: mouth.rightAttach,
      outerLeft: mouth.leftTip,
      outerRight: mouth.rightTip,
      innerLeft: mouth.leftAttach,
      innerRight: mouth.rightAttach,
      width: distanceBetweenPoints(mouth.leftAttach, mouth.rightAttach),
      depth: distanceBetweenPoints(mouth.center, {
        x: (mouth.leftTip.x + mouth.rightTip.x) / 2,
        y: (mouth.leftTip.y + mouth.rightTip.y) / 2,
      }),
      corridorTerminalCenter: connectorPad?.corridorTerminalCenter || null,
      corridorTerminalLeft: connectorPad?.corridorTerminalLeft || null,
      corridorTerminalRight: connectorPad?.corridorTerminalRight || null,
      seam: mouth.seam || null,
      openingType: "breach",
      skippedEdges: mouth.skippedEdges || [],
    };
  });
  return {
    regionId: region.id,
    surfaceKind: getRegionSurfaceKind(region, generatedMap),
    kind: "organic-cell-mask",
    geometryKind: "organic-cell-mask",
    gridSize,
    floorCells,
    visualFloorCells: contourCells,
    extensionCells: [],
    visualFloorPath,
    clipPath: visualFloorPath,
    hoverPath: visualFloorPath,
    hoverSegments: boundarySegments,
    wallArcPath: wallPath,
    wallPath,
    sketchPath: wallPath,
    wallSegments: boundarySegments,
    boundarySegments,
    baseBoundaryLoop: baseContour,
    baseBoundarySegments,
    accessMouths: accessResult.mouths,
    passMouths,
    connectionAnchors: getDoorBoundaryCells(region),
  };
}

export function finalizeHybridGeometry(generatedMap) {
  if (isPureCaveMap(generatedMap)) return null;
  const caveRegions = (generatedMap?.regions || []).filter((region) => isHybridLocalCaveRegion(region, generatedMap));
  if (caveRegions.length === 0) return null;
  const caveRegionIds = new Set(caveRegions.map((region) => region.id));
  const connectorPadsByRegion = collectMineCaveConnectorPads(generatedMap, caveRegionIds);
  const regions = Object.fromEntries(caveRegions.map((region) => {
    const connectorPads = connectorPadsByRegion.get(region.id) || [];
    const surface = createMineHybridOrganicRegionSurface(region, generatedMap, connectorPads)
      || createCellMaskRegionSurface(region, generatedMap, generatedMap.config.gridSize);
    const wallSegments = surface.wallSegments || surface.boundarySegments || [];
    const organicSurface = surface.geometryKind === "organic-cell-mask" && isUsableSvgPath(surface.wallPath || surface.wallArcPath || surface.visualFloorPath);
    const fallbackWallPath = buildBoundarySegmentPath(wallSegments) || buildBoundarySegmentPath(surface.boundarySegments);
    const wallPath = organicSurface
      ? surface.wallPath || surface.wallArcPath || surface.visualFloorPath
      : fallbackWallPath;
    const sketchPath = organicSurface
      ? surface.sketchPath || surface.wallPath || surface.wallArcPath || surface.visualFloorPath
      : fallbackWallPath;
    return [region.id, {
      ...surface,
      finalGeometry: true,
      surfaceKind: "cave",
      geometryQuality: organicSurface ? "organic" : "degraded-boundary-fallback",
      wallPath,
      sketchPath,
      wallSegments,
      boundarySegments: surface.boundarySegments,
      connectorPads,
      passMouths: surface.passMouths || [],
      bounds: {
        x: region.cellRect.x * generatedMap.config.gridSize,
        y: region.cellRect.y * generatedMap.config.gridSize,
        width: region.cellRect.w * generatedMap.config.gridSize,
        height: region.cellRect.h * generatedMap.config.gridSize,
      },
    }];
  }));
  return {
    kind: "final-hybrid-geometry",
    surfaceKind: "hybrid",
    regions,
    corridors: {},
  };
}

export function projectPointToSegment(point, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - segment.x1) * dx + (point.y - segment.y1) * dy) / lengthSq));
  return {
    x: segment.x1 + dx * t,
    y: segment.y1 + dy * t,
    t,
  };
}

export function getClosestHybridBoundaryProjection(point, surface) {
  const segments = surface?.boundarySegments || [];
  if (!point || segments.length === 0) return null;
  return segments
    .map((segment, index) => {
      const projected = projectPointToSegment(point, segment);
      const dx = projected.x - point.x;
      const dy = projected.y - point.y;
      const length = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) || 1;
      return {
        index,
        segment,
        point: projected,
        tangent: { x: (segment.x2 - segment.x1) / length, y: (segment.y2 - segment.y1) / length },
        score: dx * dx + dy * dy,
      };
    })
    .sort((a, b) => a.score - b.score)[0] || null;
}

export function getDoorCenter(door) {
  return { x: (door.x1 + door.x2) / 2, y: (door.y1 + door.y2) / 2 };
}

export function isHybridBreachEndpoint(region, surface) {
  return Boolean(surface && region && (region.surfaceKind === "cave" || region.surfaceKind === "hybrid"));
}

export function createHybridBreachMouth(door, surface, region, corridorId = door?.corridorId) {
  if (!door || !isHybridBreachEndpoint(region, surface)) return null;
  const projection = getClosestHybridBoundaryProjection(getDoorCenter(door), surface);
  if (!projection) return null;
  const gridSize = surface.gridSize || DEFAULT_CONFIG.gridSize;
  const width = gridSize * 1.08;
  const half = width / 2;
  const tangent = projection.tangent;
  const center = projection.point;
  const regionCenter = region.labelPoint || {
    x: (region.cellRect.x + region.cellRect.w / 2) * gridSize,
    y: (region.cellRect.y + region.cellRect.h / 2) * gridSize,
  };
  const normalA = { x: -tangent.y, y: tangent.x };
  const radial = { x: center.x - regionCenter.x, y: center.y - regionCenter.y };
  const outward = normalA.x * radial.x + normalA.y * radial.y >= 0 ? normalA : { x: -normalA.x, y: -normalA.y };
  const doorCenter = getDoorCenter(door);
  const towardCorridor = { x: doorCenter.x - center.x, y: doorCenter.y - center.y };
  const normal = outward.x * towardCorridor.x + outward.y * towardCorridor.y >= 0 ? outward : { x: -outward.x, y: -outward.y };
  const projectedDepth = normal.x * towardCorridor.x + normal.y * towardCorridor.y;
  const depth = Math.max(gridSize * 0.55, Math.min(gridSize * 1.35, projectedDepth || gridSize * 0.72));
  const leftAttach = { x: center.x - tangent.x * half, y: center.y - tangent.y * half };
  const rightAttach = { x: center.x + tangent.x * half, y: center.y + tangent.y * half };
  const innerCenter = { x: center.x - normal.x * gridSize * 0.16, y: center.y - normal.y * gridSize * 0.16 };
  const outerCenter = { x: center.x + normal.x * depth, y: center.y + normal.y * depth };
  const outerHalf = width * 0.38;
  const leftOuter = { x: outerCenter.x - tangent.x * outerHalf, y: outerCenter.y - tangent.y * outerHalf };
  const rightOuter = { x: outerCenter.x + tangent.x * outerHalf, y: outerCenter.y + tangent.y * outerHalf };
  const terminalCenter = doorCenter;
  const terminalHalf = gridSize * 0.5;
  const terminalLeft = { x: terminalCenter.x - tangent.x * terminalHalf, y: terminalCenter.y - tangent.y * terminalHalf };
  const terminalRight = { x: terminalCenter.x + tangent.x * terminalHalf, y: terminalCenter.y + tangent.y * terminalHalf };
  return {
    type: "cave-breach-mouth",
    corridorId,
    regionId: region.id,
    center,
    outerCenter,
    innerCenter,
    leftAttach,
    rightAttach,
    leftOuter,
    rightOuter,
    terminalCenter,
    terminalLeft,
    terminalRight,
    tangent,
    normal,
    width,
    depth,
    openingType: "breach",
    wallPoint: center,
    boundarySegment: projection.segment,
    finalBoundaryIndex: projection.index,
  };
}

export function createHybridBreachDoor(door, surface, region) {
  const mouth = createHybridBreachMouth(door, surface, region, door?.corridorId);
  if (!mouth) return door;
  const half = mouth.width / 2;
  const { center, tangent, normal } = mouth;
  return {
    ...door,
    breach: true,
    x1: center.x - tangent.x * half,
    y1: center.y - tangent.y * half,
    x2: center.x + tangent.x * half,
    y2: center.y + tangent.y * half,
    openingType: "breach",
    wallPoint: center,
    tangent,
    normal,
    boundarySegment: mouth.boundarySegment,
    finalBoundaryIndex: mouth.finalBoundaryIndex,
  };
}

export function createHybridConnectorDoor(door, connectorPad) {
  if (!door || !connectorPad) return door;
  return {
    ...door,
    breach: true,
    x1: connectorPad.caveAttachLeft.x,
    y1: connectorPad.caveAttachLeft.y,
    x2: connectorPad.caveAttachRight.x,
    y2: connectorPad.caveAttachRight.y,
    openingType: "breach",
    wallPoint: connectorPad.caveAttachCenter,
    tangent: connectorPad.tangent,
    normal: connectorPad.normal,
    caveConnectorPad: {
      corridorId: connectorPad.corridorId,
      endpoint: connectorPad.endpoint,
      regionId: connectorPad.regionId,
    },
  };
}

export function stripHybridBreachDoorFields(door) {
  if (!door) return door;
  const {
    breach,
    openingKind,
    openingType,
    wallPoint,
    tangent,
    normal,
    boundarySegment,
    finalBoundaryIndex,
    caveBreachMouth,
    caveConnectorPad,
    ...cleanDoor
  } = door;
  return cleanDoor;
}

export function createHybridEndpointOpening(corridor, endpoint, region, surface, door) {
  const surfaceKind = region?.surfaceKind || "structure";
  const base = {
    regionId: region?.id || null,
    surfaceKind,
    endpoint,
    anchor: endpoint === "from" ? corridor.fromAnchor : corridor.toAnchor,
    openingType: "none",
  };
  if (isHybridBreachEndpoint(region, surface)) {
    const caveConnectorPad = (surface.connectorPads || []).find((pad) => pad.corridorId === corridor.id && pad.endpoint === endpoint) || null;
    return {
      ...base,
      openingType: caveConnectorPad ? "breach" : "none",
      wallPoint: caveConnectorPad?.caveAttachCenter || null,
      tangent: caveConnectorPad?.tangent || null,
      normal: caveConnectorPad?.normal || null,
      caveConnectorPad,
    };
  }
  return {
    ...base,
    openingType: door ? "door" : "none",
  };
}

export function reconcileHybridCorridorAnchors(generatedMap, finalGeometry) {
  if (!finalGeometry?.regions || isPureCaveMap(generatedMap)) return generatedMap.corridors || [];
  const regionById = new Map((generatedMap.regions || []).map((region) => [region.id, region]));
  return (generatedMap.corridors || []).map((corridor) => {
    if (corridor.surfaceKind !== "mine-tunnel") return corridor;
    const fromRegion = regionById.get(corridor.from);
    const toRegion = regionById.get(corridor.to);
    const fromDoor = (corridor.doors || []).find((door) => door.endpoint === "from" || door.endpoint === "shared") || null;
    const toDoor = (corridor.doors || []).find((door) => door.endpoint === "to" || door.endpoint === "shared") || null;
    const fromOpening = createHybridEndpointOpening(corridor, "from", fromRegion, fromRegion ? finalGeometry.regions[fromRegion.id] : null, fromDoor);
    const toOpening = createHybridEndpointOpening(corridor, "to", toRegion, toRegion ? finalGeometry.regions[toRegion.id] : null, toDoor);
    const doors = (corridor.doors || []).map((door) => {
      if (door.endpoint === "from") return fromOpening.openingType === "breach" ? createHybridConnectorDoor(door, fromOpening.caveConnectorPad) : stripHybridBreachDoorFields(door);
      if (door.endpoint === "to") return toOpening.openingType === "breach" ? createHybridConnectorDoor(door, toOpening.caveConnectorPad) : stripHybridBreachDoorFields(door);
      if (door.endpoint === "shared") {
        if (fromOpening.openingType === "breach") return createHybridConnectorDoor(door, fromOpening.caveConnectorPad);
        if (toOpening.openingType === "breach") return createHybridConnectorDoor(door, toOpening.caveConnectorPad);
      }
      return stripHybridBreachDoorFields(door);
    });
    return { ...corridor, fromOpening, toOpening, doors };
  });
}

export function isUsableSvgPath(path) {
  return typeof path === "string" && path.trim().length > 0 && !/(NaN|undefined|null)/i.test(path);
}

export function createCaveMapSurfaceFromCaveSurface(generatedMap, caveSurface) {
  const { config, dungeonMask } = generatedMap;
  return {
    kind: "map-surface",
    geometryKind: caveSurface.geometryKind || caveSurface.kind || "hex-cave-map",
    surfaceKind: "cave",
    gridSize: config.gridSize,
    caveSurface,
    floorCells: caveSurface.floorCells || dungeonMask.floorCells || [],
    roomFloorCells: dungeonMask.roomFloorCells || [],
    corridorFloorCells: dungeonMask.corridorFloorCells || [],
    visualFloorPath: caveSurface.visualFloorPath,
    clipPath: caveSurface.clipPath || caveSurface.visualFloorPath,
    externalWallSegments: caveSurface.boundarySegments || [],
    internalWallSegments: [],
    wallSegments: caveSurface.boundarySegments || [],
    doorSegments: dungeonMask.doorSegments || [],
    mapAccesses: dungeonMask.mapAccesses || [],
  };
}

export function createFinalCaveRegionSurface(region, generatedMap, caveSurface) {
  const baseSurface = createCellMaskRegionSurface(region, generatedMap, generatedMap.config.gridSize);
  if (!isPureCaveMap(generatedMap) || generatedMap.regions.length !== 1) return baseSurface;
  const boundarySegments = caveSurface.boundarySegments || baseSurface.boundarySegments || [];
  return {
    ...baseSurface,
    finalGeometry: true,
    kind: caveSurface.kind || baseSurface.kind,
    geometryKind: caveSurface.geometryKind || baseSurface.geometryKind,
    surfaceKind: "cave",
    floorCells: caveSurface.floorCells || baseSurface.floorCells,
    visualFloorCells: caveSurface.visualFloorCells || caveSurface.floorCells || baseSurface.floorCells,
    visualFloorPath: caveSurface.visualFloorPath || baseSurface.visualFloorPath,
    clipPath: caveSurface.clipPath || caveSurface.visualFloorPath || baseSurface.clipPath,
    hoverPath: caveSurface.visualFloorPath || baseSurface.hoverPath,
    hoverSegments: boundarySegments,
    wallArcPath: caveSurface.wallPath || caveSurface.visualFloorPath || baseSurface.wallArcPath,
    wallPath: caveSurface.wallPath || baseSurface.wallPath,
    sketchPath: caveSurface.sketchPath || baseSurface.sketchPath,
    wallSegments: boundarySegments,
    boundarySegments,
    labelPoint: region.labelPoint,
  };
}

export function finalizeCaveGeometry(generatedMap) {
  if (!isPureCaveMap(generatedMap)) return null;
  const hexCaveSurface = createHexCaveSurface(generatedMap);
  const caveSurface = isUsableSvgPath(hexCaveSurface.visualFloorPath)
    ? hexCaveSurface
    : createCellBasedCaveSurface(generatedMap);
  const mapSurface = createCaveMapSurfaceFromCaveSurface(generatedMap, caveSurface);
  const regions = Object.fromEntries(generatedMap.regions.map((region) => [
    region.id,
    createFinalCaveRegionSurface(region, generatedMap, caveSurface),
  ]));
  const corridors = Object.fromEntries((generatedMap.corridors || []).map((corridor) => [
    corridor.id,
    createCorridorSurface(corridor, generatedMap, generatedMap.config.gridSize),
  ]));
  return {
    kind: "final-cave-geometry",
    surfaceKind: "cave",
    mapSurface,
    caveSurface,
    regions,
    corridors,
  };
}
