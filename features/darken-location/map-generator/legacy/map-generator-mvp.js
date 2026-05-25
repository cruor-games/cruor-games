const ORTHOGONAL_DIRECTIONS = Object.freeze([
  Object.freeze({ dx: 1, dy: 0 }),
  Object.freeze({ dx: -1, dy: 0 }),
  Object.freeze({ dx: 0, dy: 1 }),
  Object.freeze({ dx: 0, dy: -1 }),
]);

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, EyeOff, Grid3X3, Maximize2, Minus, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CONFIG, normalizeInput, normalizeRoomCount } from "../map-generator.input.js";
import {
  LEVEL_VIEW_ALL,
  MANUAL_OVERRIDE_SCHEMA_VERSION,
  GRID_STYLE_OPTIONS,
  DOOR_TYPE_OPTIONS,
  STAIR_TRANSITION_OPTIONS,
  JUNCTION_TYPE_OPTIONS,
  applyManualOverridesToConfig,
  cloneManualOverrides,
  areManualOverridesEqual,
  createEmptyManualOverrides,
  createEmptyLevelOverrides,
  normalizeManualOverrides,
  resetManualOverrides,
  normalizeGridStyle,
  doorTypeKey,
  normalizeDoorType,
  stairTransitionKey,
  normalizeStairTransition,
  resolveStairTransition,
  getManualJunctionOverride,
  normalizeJunctionType,
  getManualJunctionType,
  getManualJunctionSideIndex,
  getManualDoorType,
  resolveDoorType,
} from "../map-generator.state.js";
import {
  regionDepthScore,
  roleDepth,
  getRegionText,
  classifyRegion,
  getContextKey,
  getPlacementProfile,
  getPlacementRole,
  getRegionSemanticFlags,
  getMapAccessIntent,
  getFallbackMapAccessIntent,
} from "../map-generator.profile.js";

const SIZE_PRESETS = {
  Tiny: { minW: 3, maxW: 4, minH: 3, maxH: 4 },
  Small: { minW: 4, maxW: 6, minH: 3, maxH: 5 },
  Medium: { minW: 5, maxW: 8, minH: 4, maxH: 6 },
  Large: { minW: 7, maxW: 11, minH: 5, maxH: 8 },
  Huge: { minW: 10, maxW: 14, minH: 7, maxH: 10 },
};

const ROOM_SIZE_MENU_PRESETS = {
  Tiny: { w: 3, h: 3 },
  Small: { w: 5, h: 4 },
  Medium: { w: 7, h: 5 },
  Large: { w: 9, h: 7 },
  Huge: { w: 12, h: 9 },
};

const SVG_STYLE = `
.paper{fill:#dccaa6}.paper-texture{opacity:.75}.map-grid line{stroke:rgba(58,46,32,.17);stroke-width:1;vector-effect:non-scaling-stroke}.map-grid circle{fill:rgba(58,46,32,.22)}.floor-grid line{stroke:rgba(29,25,21,.16);stroke-width:1.05;vector-effect:non-scaling-stroke}.floor-grid circle{fill:rgba(29,25,21,.18)}.grid-style-dotted line{display:none}.grid-style-dashed line{stroke-linecap:round}.floor-fill{fill:#efe4ca;stroke:none}.floor-speckle circle{fill:rgba(29,25,21,.12)}.floor-grain path{fill:none;stroke:rgba(29,25,21,.11);stroke-width:.7;stroke-linecap:round;vector-effect:non-scaling-stroke}.room-floor-accent{fill:rgba(255,248,226,.26);stroke:none}.corridor-floor-accent{fill:rgba(116,91,57,.075);stroke:none}.organic-floor-accent{fill:rgba(29,25,21,.06);stroke:rgba(29,25,21,.18);stroke-width:1.15;vector-effect:non-scaling-stroke}.shape-detail{fill:none;stroke:rgba(29,25,21,.2);stroke-width:1.05;stroke-linecap:round;vector-effect:non-scaling-stroke}.ritual-floor-ring{fill:none;stroke:rgba(29,25,21,.18);stroke-width:1.25;vector-effect:non-scaling-stroke}.corridor-centerline{fill:none;stroke:rgba(29,25,21,.18);stroke-width:1.1;stroke-dasharray:2 8;stroke-linecap:round;vector-effect:non-scaling-stroke}.external-hatching-underlay .halo-buffer{fill:none;stroke:#dccaa6;stroke-linecap:square;stroke-linejoin:bevel;stroke-miterlimit:1}.external-hatching path{fill:none;stroke:rgba(42,33,24,.28);stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.wall-shadow path{stroke:rgba(42,33,24,.32);stroke-width:7.2;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.wall-main path{stroke:#1d1915;stroke-width:4.05;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.wall-sketch path{stroke:rgba(29,25,21,.32);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.wall-breaks path{fill:none;stroke:#1d1915;stroke-width:1.45;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.wall-breaks .crack{stroke:rgba(29,25,21,.58);stroke-width:1.1}.door-cuts .door-opening{stroke:#efe4ca;stroke-width:7;stroke-linecap:square;vector-effect:non-scaling-stroke}.door-cuts .secret-door-opening{stroke:#efe4ca;stroke-width:5;stroke-linecap:square;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}.door-symbols .door-wall-line{stroke:#1d1915;stroke-width:4.1;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.door-symbols .door-wall-sketch{stroke:rgba(29,25,21,.3);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.door-symbols .door-panel{fill:#efe4ca;stroke:#1d1915;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.door-symbols .secret-door-panel{stroke-dasharray:3 3}.door-symbols .locked-door-panel{stroke-width:2.35}.door-symbols .locked-door-mark line{stroke:#1d1915;stroke-width:2.05;stroke-linecap:round;vector-effect:non-scaling-stroke}.door-symbols .stair-mark__main path{fill:none;stroke:#1d1915;stroke-width:3.05;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.door-symbols .stair-mark__sketch path{fill:none;stroke:rgba(29,25,21,.3);stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.corridor-overpass-patches .overpass-corridor-floor{fill:#efe4ca;stroke:none;pointer-events:none}.corridor-overpass-patches .overpass-corridor-walls path{stroke:#1d1915;stroke-width:4.05;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.corridor-overpass-patches .overpass-corridor-wall-sketch path{stroke:rgba(29,25,21,.32);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.map-accesses .map-access-line,.map-accesses .map-access-head-line{fill:none;stroke:#1d1915;stroke-width:3.05;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.map-accesses .map-access-stem-sketch,.map-accesses .map-access-head-sketch{fill:none;stroke:rgba(29,25,21,.3);stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.map-accesses .map-access-label{fill:#1d1915;font-size:8px;font-weight:900;font-family:Inter,ui-sans-serif,system-ui;letter-spacing:.08em;paint-order:stroke;stroke:#efe4ca;stroke-width:2.5px;stroke-linejoin:round}.corridor-junctions .junction-wall-line{stroke:#1d1915;stroke-width:4.0;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.corridor-junctions .junction-wall-sketch{stroke:rgba(29,25,21,.3);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round;fill:none;vector-effect:non-scaling-stroke}.corridor-junctions .junction-door-panel{fill:#efe4ca;stroke:#1d1915;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.props rect,.props circle,.props path,.props line,.props polygon,.props ellipse{fill:none;stroke:rgba(29,25,21,.62);stroke-width:1.35;vector-effect:non-scaling-stroke}.props .prop-fill{fill:rgba(29,25,21,.045)}.props .prop-light-fill{fill:rgba(255,248,226,.16)}.props .prop-fog{fill:rgba(255,248,226,.22);stroke:rgba(29,25,21,.18);stroke-width:1.05}.props .prop-water{fill:rgba(143,161,150,.24);stroke:rgba(29,25,21,.28);stroke-width:1.1}.props .prop-pit{fill:rgba(29,25,21,.12);stroke:rgba(29,25,21,.62);stroke-width:1.4}.props .prop-rubble{fill:rgba(29,25,21,.06)}.props .prop-bones{stroke:rgba(29,25,21,.7);stroke-width:1.15}.props .prop-crack{stroke:rgba(29,25,21,.5);stroke-width:1.05}.props .prop-stairs line{stroke-width:1.05}.props .prop-altar,.props .prop-tomb,.props .prop-shelf{fill:rgba(29,25,21,.045)}.labels circle{fill:#efe4ca;stroke:#1d1915;stroke-width:2}.labels text{fill:#1d1915;font-size:13px;font-weight:800;font-family:ui-serif,Georgia,serif}.labels .room-name{font-size:12px;font-family:Inter,ui-sans-serif,system-ui;font-weight:700;paint-order:stroke;stroke:#efe4ca;stroke-width:4px;stroke-linejoin:round}.editor-overlays path{fill:rgba(122,67,36,0);stroke:rgba(122,67,36,0);stroke-width:0;vector-effect:non-scaling-stroke}.room-hover-highlight{pointer-events:none}.editor-overlays .room-hover-highlight__halo path,.editor-overlays .room-hover-highlight__halo line{fill:none;stroke:rgba(214,184,98,.32);stroke-width:8;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.editor-overlays .room-hover-highlight__edge path,.editor-overlays .room-hover-highlight__edge line{fill:none;stroke:rgba(255,231,143,.92);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.corridor-hover-highlight{pointer-events:none}.editor-overlays .corridor-hover-highlight__halo{fill:none;stroke:rgba(214,184,98,.34);stroke-width:9;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.editor-overlays .corridor-hover-highlight__line{fill:none;stroke:rgba(255,231,143,.95);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.editor-overlays .room-drag-handle{cursor:move;pointer-events:all}.editor-overlays .room-drag-handle:hover{fill:rgba(122,67,36,0)}.editor-overlays .room-drag-handle.is-dragging{fill:rgba(122,67,36,0);stroke:rgba(29,25,21,0);stroke-width:0}.wall-hover-zone{stroke:rgba(122,67,36,0);stroke-width:14;stroke-linecap:square;fill:none;cursor:crosshair;pointer-events:stroke}.wall-hover-zone:hover{stroke:rgba(122,67,36,0)}.endpoint-handle{fill:#1d1915;stroke:#efe4ca;stroke-width:2;cursor:grab;pointer-events:all}.endpoint-handle.is-dragging{fill:#7a4324;cursor:grabbing}.waypoint-handle{fill:#efe4ca;stroke:#1d1915;stroke-width:1.5;cursor:grab;pointer-events:all}.waypoint-handle.is-junction{fill:#d6b862;stroke:#1d1915;stroke-width:2.2}.waypoint-handle.is-dragging{fill:#7a4324;stroke:#efe4ca;cursor:grabbing}.corridor-hover-zone{fill:rgba(122,67,36,0);stroke:none;cursor:crosshair;pointer-events:all}.corridor-hover-zone:hover{fill:rgba(122,67,36,.12)}.corridor-hover-zone.is-junction:hover{fill:rgba(214,184,98,.22);stroke:rgba(214,184,98,.54);stroke-width:1.2;vector-effect:non-scaling-stroke}.corridor-add-handle{fill:#efe4ca;stroke:#7a4324;stroke-width:2;cursor:crosshair;pointer-events:all}.corridor-add-handle:hover{fill:#7a4324;stroke:#efe4ca}.corridor-add-handle.is-junction{fill:#d6b862;stroke:#1d1915;stroke-width:2.4}.corridor-add-handle.is-junction:hover{fill:#1d1915;stroke:#d6b862}.wall-connect-handle{fill:#7a4324;stroke:#efe4ca;stroke-width:2;cursor:crosshair;pointer-events:all}.wall-connect-handle:hover{fill:#1d1915}.map-access-handle{fill:#efe4ca;stroke:#1d1915;stroke-width:2.1;cursor:grab;pointer-events:all}.map-access-handle:hover{fill:#d6b862}.map-access-handle.is-dragging{fill:#7a4324;stroke:#efe4ca;cursor:grabbing}.map-access-handle__icon{fill:none;stroke:#1d1915;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}.connection-preview{stroke:#7a4324;stroke-width:2.4;stroke-dasharray:7 5;stroke-linecap:round;fill:none;vector-effect:non-scaling-stroke;pointer-events:none}.connection-preview__endpoint{fill:#efe4ca;stroke:#7a4324;stroke-width:2;pointer-events:none}.circular-room-surface-cover{pointer-events:none}.level-layer--faded{opacity:.26}.level-layer--active{opacity:1}
`;

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

function pickOne(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function parseCellKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function rectsOverlapWithMargin(a, b, margin = 2) {
  return !(a.x + a.w + margin <= b.x || b.x + b.w + margin <= a.x || a.y + a.h + margin <= b.y || b.y + b.h + margin <= a.y);
}

function getRegionGraphScore(region, seed) {
  const flags = classifyRegion(region);
  if (flags.entrance) return 0;
  if (flags.connector) return 16 + (hashStringToSeed(seed, region.id, "connector-order") % 8);
  if (flags.clue) return 28 + (hashStringToSeed(seed, region.id, "clue-order") % 8);
  if (flags.hazard) return 42 + (hashStringToSeed(seed, region.id, "hazard-order") % 10);
  if (flags.climax) return 70 + (hashStringToSeed(seed, region.id, "climax-order") % 8);
  if (flags.outcome || flags.exit) return 88;
  if (flags.secret) return 96;
  return 48 + (hashStringToSeed(seed, region.id, "neutral-order") % 12);
}

function createGraphEdge(config, from, to, options = {}) {
  const baseId = options.id || `edge-${from}-${to}${options.suffix ? `-${options.suffix}` : ""}`;
  return {
    id: baseId,
    from,
    to,
    kind: options.kind || "main",
    secret: Boolean(options.secret),
    locked: Boolean(options.locked),
    reason: options.reason || "generated",
    manualWaypoints: Array.isArray(config.manualCorridorWaypoints?.[baseId]) ? config.manualCorridorWaypoints[baseId] : [],
  };
}

function addGraphEdge(edges, config, from, to, options = {}) {
  if (!from || !to || from === to) return null;
  const duplicate = options.allowDuplicate ? null : edges.find((edge) => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from));
  if (duplicate) return duplicate;
  const edge = createGraphEdge(config, from, to, options);
  edges.push(edge);
  return edge;
}

function selectRegionByFlags(regions, predicate, fallback, seed) {
  const candidates = regions.filter(predicate).sort((a, b) => getRegionGraphScore(a, seed) - getRegionGraphScore(b, seed));
  return candidates[0] || fallback || regions[0];
}

function getFinalRegionPriority(region, seed) {
  const flags = classifyRegion(region);
  const text = getRegionText(region);
  let score = getRegionGraphScore(region, seed);
  if (flags.outcome) score += 80;
  if (flags.exit) score += 70;
  if (text.includes("final") || text.includes("boss") || text.includes("climax")) score += 60;
  if (text.includes("main")) score += 50;
  if (text.includes("setpiece")) score += 30;
  if (flags.hazard) score -= 8;
  return score;
}

function selectFinalRegion(regions, seed) {
  const candidates = regions.filter((region) => {
    const flags = classifyRegion(region);
    return flags.outcome || flags.exit || flags.climax;
  });
  const pool = candidates.length > 0 ? candidates : regions;
  return [...pool].sort((a, b) => getFinalRegionPriority(b, seed) - getFinalRegionPriority(a, seed))[0] || null;
}

function buildCriticalPathRegions(config, rng) {
  const regions = [...config.regions];
  if (regions.length === 0) return [];
  const flagsById = new Map(regions.map((region) => [region.id, classifyRegion(region)]));
  const entrance = selectRegionByFlags(regions, (region) => flagsById.get(region.id).entrance, regions[0], config.seed);
  const nonEntrance = regions.filter((region) => region.id !== entrance.id);
  const nonSecret = nonEntrance.filter((region) => !flagsById.get(region.id).secret);
  const finalRoom = selectFinalRegion(nonSecret, config.seed) || [...nonSecret].sort((a, b) => getRegionGraphScore(b, config.seed) - getRegionGraphScore(a, config.seed))[0];
  const middlePool = nonSecret.filter((region) => region.id !== finalRoom?.id);
  const required = [];
  const firstConnector = selectRegionByFlags(middlePool, (region) => flagsById.get(region.id).connector, null, config.seed);
  const firstClue = selectRegionByFlags(middlePool, (region) => flagsById.get(region.id).clue, null, config.seed);
  const firstHazard = selectRegionByFlags(middlePool, (region) => flagsById.get(region.id).hazard, null, config.seed);
  [firstConnector, firstClue, firstHazard].forEach((region) => {
    if (region && !required.some((item) => item.id === region.id)) required.push(region);
  });

  const remaining = middlePool
    .filter((region) => !required.some((item) => item.id === region.id))
    .sort((a, b) => getRegionGraphScore(a, config.seed) - getRegionGraphScore(b, config.seed));
  const mainBudget = Math.max(0, Math.ceil(nonSecret.length * 0.68) - required.length - (finalRoom ? 1 : 0));
  const mainExtras = remaining.slice(0, mainBudget);
  const orderedMiddle = [...required, ...mainExtras].sort((a, b) => getRegionGraphScore(a, config.seed) - getRegionGraphScore(b, config.seed));
  return [entrance, ...orderedMiddle, finalRoom].filter(Boolean);
}

function chooseSideAnchor(mainPath, sideRegion, seed) {
  const flags = classifyRegion(sideRegion);
  const usable = mainPath.slice(0, -1).length > 0 ? mainPath.slice(0, -1) : mainPath;
  if (flags.clue) return usable[Math.min(1, usable.length - 1)] || usable[0];
  if (flags.hazard) return usable[Math.min(2, usable.length - 1)] || usable[0];
  if (flags.connector || flags.loop) return usable[Math.max(0, Math.floor(usable.length / 2))] || usable[0];
  const index = hashStringToSeed(seed, sideRegion.id, "side-anchor") % Math.max(1, usable.length);
  return usable[index];
}

function chooseSecretAnchor(mainPath, secretRegion, seed) {
  const clueAnchor = mainPath.find((region) => classifyRegion(region).clue);
  const hazardAnchor = mainPath.find((region) => classifyRegion(region).hazard);
  const deepAnchor = mainPath[Math.max(0, mainPath.length - 2)];
  return clueAnchor || hazardAnchor || deepAnchor || mainPath[0];
}

function parseRegionLink(link) {
  if (typeof link === "string") return { to: link, kind: "link" };
  if (!link || typeof link !== "object") return null;
  return {
    to: link.to || link.id || link.regionId,
    kind: link.kind || link.type || "link",
    secret: Boolean(link.secret),
    locked: Boolean(link.locked),
    id: link.id,
  };
}

function buildRegionGraph(config, rng) {
  const profile = getPlacementProfile(config);
  const regionIds = new Set(config.regions.map((region) => region.id));
  const edges = [];

  if (config.connections.length > 0) {
    config.connections
      .filter((edge) => regionIds.has(edge.from) && regionIds.has(edge.to) && edge.from !== edge.to)
      .forEach((edge, index) => {
        const id = edge.id || `edge-${edge.from}-${edge.to}-${index}`;
        edges.push({
          id,
          from: edge.from,
          to: edge.to,
          kind: edge.kind || "main",
          secret: Boolean(edge.secret),
          locked: Boolean(edge.locked),
          reason: edge.reason || "explicit-connection",
          manualWaypoints: Array.isArray(config.manualCorridorWaypoints?.[id])
            ? config.manualCorridorWaypoints[id]
            : Array.isArray(edge.manualWaypoints) ? edge.manualWaypoints : [],
        });
      });
  }

  const mainPath = buildCriticalPathRegions(config, rng);
  for (let index = 0; index < mainPath.length - 1; index += 1) {
    addGraphEdge(edges, config, mainPath[index].id, mainPath[index + 1].id, {
      kind: "critical",
      reason: "critical-path",
    });
  }

  const mainPathIds = new Set(mainPath.map((region) => region.id));
  const unassigned = config.regions.filter((region) => !mainPathIds.has(region.id));
  const secretRegions = unassigned.filter((region) => classifyRegion(region).secret);
  const sideRegions = unassigned.filter((region) => !classifyRegion(region).secret);

  sideRegions.forEach((region) => {
    const anchor = chooseSideAnchor(mainPath, region, config.seed);
    if (!anchor) return;
    const flags = classifyRegion(region);
    addGraphEdge(edges, config, anchor.id, region.id, {
      kind: flags.loop || flags.connector ? "side" : "dead-end",
      suffix: flags.loop ? "side-loop-entry" : "side",
      reason: flags.loop ? "side-loop-entry" : "controlled-side-path",
    });
    if (flags.loop && mainPath.length > 2 && rng() < profile.sideLoopChance) {
      const anchorIndex = mainPath.findIndex((item) => item.id === anchor.id);
      const exitAnchor = mainPath[clamp(anchorIndex + 1 + (hashStringToSeed(config.seed, region.id, "loop-exit") % 2), 1, mainPath.length - 1)];
      if (exitAnchor) {
        addGraphEdge(edges, config, region.id, exitAnchor.id, {
          kind: "loop",
          suffix: "loop-exit",
          reason: "intentional-loop",
        });
      }
    }
  });

  secretRegions.forEach((region) => {
    const anchor = chooseSecretAnchor(mainPath, region, config.seed);
    if (!anchor) return;
    addGraphEdge(edges, config, anchor.id, region.id, {
      kind: "secret",
      secret: true,
      suffix: "secret",
      reason: "secret-branch",
    });
  });

  config.regions.forEach((region) => {
    region.links.forEach((rawLink, index) => {
      const link = parseRegionLink(rawLink);
      if (!link || !regionIds.has(link.to) || link.to === region.id) return;
      addGraphEdge(edges, config, region.id, link.to, {
        id: link.id || `edge-${region.id}-${link.to}-link-${index}`,
        kind: link.kind,
        secret: link.secret,
        locked: link.locked,
        reason: "region-link",
      });
    });
  });

  const loopBudget = Math.max(0, Math.floor((config.regions.length / 6) * profile.loopBudgetMultiplier));
  for (let i = 0; i < loopBudget && mainPath.length > 4; i += 1) {
    const fromIndex = 1 + (hashStringToSeed(config.seed, i, "loop-a") % Math.max(1, mainPath.length - 3));
    const toIndex = clamp(fromIndex + 2 + (hashStringToSeed(config.seed, i, "loop-b") % 2), fromIndex + 1, mainPath.length - 1);
    addGraphEdge(edges, config, mainPath[fromIndex].id, mainPath[toIndex].id, {
      kind: "loop",
      suffix: `main-loop-${i}`,
      reason: "intentional-main-loop",
    });
  }

  return edges;
}

function buildCorridorGraph(config, rng) {
  return buildRegionGraph(config, rng);
}

function buildChapelPhysicalGraph(config) {
  const edges = [];
  const regions = [...config.regions];
  if (regions.length <= 1) return edges;
  const roleWeight = { entrance: 0, connector: 1, clue: 2, hazard: 3, side: 4, final: 5, secret: 6 };
  const ordered = [...regions].sort((a, b) => (roleWeight[getPlacementRole(a)] ?? 4) - (roleWeight[getPlacementRole(b)] ?? 4) || roleDepth(a) - roleDepth(b) || a.id.localeCompare(b.id));
  const entrance = ordered.find((region) => getPlacementRole(region) === "entrance") || ordered[0];
  const finalRoom = [...ordered].reverse().find((region) => getPlacementRole(region) === "final") || ordered[ordered.length - 1];
  const naveRegion = ordered.find((region) => getPlacementRole(region) === "connector" && region.id !== entrance?.id && region.id !== finalRoom?.id)
    || ordered.find((region) => region.id !== entrance?.id && region.id !== finalRoom?.id)
    || entrance;

  if (entrance && naveRegion && entrance.id !== naveRegion.id) {
    addGraphEdge(edges, config, entrance.id, naveRegion.id, { kind: "critical", reason: "chapel-narthex-to-nave" });
  }
  if (naveRegion && finalRoom && naveRegion.id !== finalRoom.id) {
    addGraphEdge(edges, config, naveRegion.id, finalRoom.id, { kind: "critical", reason: "chapel-nave-to-sanctuary" });
  }

  regions
    .filter((region) => ![entrance?.id, naveRegion?.id, finalRoom?.id].includes(region.id))
    .forEach((region) => {
      const role = getPlacementRole(region);
      const anchor = role === "secret" ? finalRoom : naveRegion;
      if (!anchor || anchor.id === region.id) return;
      addGraphEdge(edges, config, anchor.id, region.id, {
        kind: role === "secret" ? "secret" : "side",
        secret: role === "secret",
        suffix: role === "secret" ? "chapel-secret" : "chapel-side",
        reason: role === "secret" ? "chapel-hidden-sacristy" : "chapel-side-chamber",
      });
    });

  config.regions.forEach((region) => {
    region.links.forEach((rawLink, index) => {
      const link = parseRegionLink(rawLink);
      if (!link || !regions.some((item) => item.id === link.to) || link.to === region.id) return;
      addGraphEdge(edges, config, region.id, link.to, {
        id: link.id || `edge-${region.id}-${link.to}-link-${index}`,
        kind: link.kind,
        secret: link.secret,
        locked: link.locked,
        reason: "region-link",
      });
    });
  });

  return edges;
}

function applyManualConnectionsToGraph(config, graph) {
  const deletedConnections = new Set(Array.isArray(config.manualDeletedConnections) ? config.manualDeletedConnections : []);
  const edges = graph.filter((edge) => !deletedConnections.has(edge.id));
  const manualConnections = Array.isArray(config.manualCustomConnections) ? config.manualCustomConnections : [];
  manualConnections.forEach((connection, index) => {
    if (!connection?.from || !connection?.to || connection.from === connection.to || deletedConnections.has(connection.id)) return;
    addGraphEdge(edges, config, connection.from, connection.to, {
      id: connection.id || `manual-edge-${connection.from}-${connection.to}-${index}`,
      kind: "manual",
      reason: "manual-editor-connection",
      secret: Boolean(connection.secret),
      locked: true,
      allowDuplicate: true,
    });
  });
  return edges;
}

function adaptGeneratedGraphForContext(config, graph) {
  const profile = getPlacementProfile(config);
  return profile.key === "chapel" ? buildChapelPhysicalGraph(config) : graph;
}

function adaptGraphForContext(config, graph) {
  return applyManualConnectionsToGraph(config, adaptGeneratedGraphForContext(config, graph));
}

function computeGraphDepths(regions, graph) {
  if (regions.length === 0) return new Map();
  const entrance = regions.find((region) => classifyRegion(region).entrance) || regions[0];
  const adjacency = new Map(regions.map((region) => [region.id, []]));
  graph.forEach((edge) => {
    adjacency.get(edge.from)?.push(edge.to);
    adjacency.get(edge.to)?.push(edge.from);
  });
  const depth = new Map([[entrance.id, 0]]);
  const queue = [entrance.id];
  while (queue.length > 0) {
    const current = queue.shift();
    const nextDepth = (depth.get(current) || 0) + 1;
    (adjacency.get(current) || []).forEach((neighbor) => {
      if (depth.has(neighbor)) return;
      depth.set(neighbor, nextDepth);
      queue.push(neighbor);
    });
  }
  regions.forEach((region) => {
    if (!depth.has(region.id)) depth.set(region.id, roleDepth(region));
  });
  return depth;
}

function annotateRegionsWithGraphMetadata(regions, graph) {
  const depthMap = computeGraphDepths(regions, graph);
  const maxDepth = Math.max(1, ...Array.from(depthMap.values()));
  return regions.map((region) => {
    const rawDepth = depthMap.get(region.id) || 0;
    const flags = classifyRegion(region);
    const normalizedDepth = flags.secret
      ? 6
      : clamp(Math.round((rawDepth / maxDepth) * 5), 0, 5);
    return {
      ...region,
      graphDepth: normalizedDepth,
      graphRole: flags.secret ? "secret" : flags.climax || flags.outcome || flags.exit ? "final" : flags.hazard ? "hazard" : flags.clue ? "clue" : flags.connector ? "connector" : flags.entrance ? "entrance" : "side",
    };
  });
}

function resolveRoomSize(region, rng) {
  const preset = SIZE_PRESETS[region.size] || SIZE_PRESETS.Medium;
  let w = randomInt(rng, preset.minW, preset.maxW);
  let h = randomInt(rng, preset.minH, preset.maxH);
  const shape = region.preferredShape.toLowerCase();

  if (shape.includes("hall") || shape.includes("corridor")) {
    w = Math.max(w + 2, h + 3);
    h = Math.max(3, Math.min(h, 4));
  }

  if (shape.includes("shaft") || shape.includes("oval") || shape.includes("circular") || shape.includes("circle") || shape.includes("round")) {
    const d = Math.max(w, h);
    w = d;
    h = d;
  }

  if (shape.includes("library") || shape.includes("archive")) {
    w = Math.max(w, 7);
    h = Math.max(h, 5);
  }

  return { w, h };
}

function chooseRoomShape(region, contextKey = "") {
  const shape = region.preferredShape.toLowerCase();
  const role = getPlacementRole(region);
  const text = getRegionText(region);

  if (contextKey === "chapel") {
    if (role === "final") return "apse";
    if (role === "connector") return "hall";
    if (role === "secret" || text.includes("archive") || text.includes("library")) return "archive";
    return "rect";
  }

  if (contextKey === "noble-house") {
    if (role === "secret" || text.includes("archive") || text.includes("library")) return "archive";
    if (role === "connector" || role === "entrance") return "rect";
    if (shape.includes("l-shape") || shape.includes("l shape")) return "l-shape";
    return "rect";
  }

  if (contextKey === "cave") {
    if (shape.includes("shaft") || text.includes("well") || text.includes("vertical")) return "shaft";
    return "cave";
  }

  if (contextKey === "mine") {
    if (role === "connector" || shape.includes("hall") || shape.includes("corridor")) return "hall";
    if (shape.includes("shaft") || text.includes("well") || text.includes("vertical")) return "shaft";
    if (role === "hazard" || text.includes("collapse")) return "broken";
    return "notched";
  }

  if (contextKey === "ruins") {
    if (role === "connector") return "hall";
    if (role === "secret" || text.includes("archive") || text.includes("library")) return "archive";
    return role === "final" ? "broken" : "ruined-rect";
  }

  if (contextKey === "crypt") {
    if (role === "secret" || text.includes("archive") || text.includes("library")) return "archive";
    if (shape.includes("shaft") || shape.includes("oval") || shape.includes("circular") || text.includes("well") || text.includes("vertical")) return "shaft";
    if (role === "final" || text.includes("ossuary") || text.includes("crypt")) return "alcove";
    if (role === "connector" || shape.includes("hall") || shape.includes("corridor")) return "hall";
    if (role === "hazard") return "notched";
  }

  if (shape.includes("l-shape") || shape.includes("l shape")) return "l-shape";
  if (shape.includes("notch") || shape.includes("cutout")) return "notched";
  if (shape.includes("circular") || shape.includes("circle") || shape.includes("round")) return "circle";
  if (shape.includes("shaft") || shape.includes("oval")) return "shaft";
  if (shape.includes("irregular") || shape.includes("cave")) return "cave";
  if (shape.includes("hall") || shape.includes("corridor")) return "hall";
  if (shape.includes("ritual")) return "ritual";
  if (shape.includes("archive") || shape.includes("library")) return "archive";
  return "rect";
}

function getGraphAdjacency(graph) {
  const adjacency = new Map();
  graph.forEach((edge) => {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from).push({ id: edge.to, edge });
    adjacency.get(edge.to).push({ id: edge.from, edge });
  });
  return adjacency;
}

function getPlacementLane(region, profile, seed) {
  const role = getPlacementRole(region);
  const base = profile.roleLane[role] ?? 0;
  const variant = (hashStringToSeed(seed, region.id, "lane") % 3) - 1;
  if (role === "connector" || role === "entrance" || role === "final") return base + variant * 0.18;
  return base + variant * 0.42;
}

function getPlacementDepth(region, profile, maxDepth, seed) {
  const role = getPlacementRole(region);
  const depth = Number.isFinite(region.graphDepth) ? region.graphDepth : roleDepth(region);
  const normalized = maxDepth <= 0 ? 0 : depth / maxDepth;
  const bias = profile.roleDepthBias[role] ?? 0;
  const jitter = ((hashStringToSeed(seed, region.id, "depth-jitter") % 100) / 100 - 0.5) * profile.depthJitter * 0.05;
  return clamp(normalized * 0.88 + bias * 0.12 + jitter, 0, 1);
}

function getPlacedNeighborCentroid(region, placed, adjacency) {
  const neighbors = adjacency.get(region.id) || [];
  const points = neighbors
    .map((neighbor) => placed.find((placedRegion) => placedRegion.id === neighbor.id))
    .filter(Boolean)
    .map((placedRegion) => ({
      x: placedRegion.cellRect.x + placedRegion.cellRect.w / 2,
      y: placedRegion.cellRect.y + placedRegion.cellRect.h / 2,
    }));
  if (points.length === 0) return null;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function getContextualTarget(region, size, config, graph, placed, rng, profile, adjacency, maxDepth) {
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const role = getPlacementRole(region);
  const depth = getPlacementDepth(region, profile, maxDepth, config.seed);
  const lane = getPlacementLane(region, profile, config.seed);
  const centerX = gridW / 2;
  const centerY = gridH / 2;
  const usableW = Math.max(8, gridW - size.w - 8);
  const usableH = Math.max(8, gridH - size.h - 8);
  const depthX = 4 + depth * usableW;
  const depthY = 4 + depth * usableH;
  const lateral = lane * profile.spread;
  const branch = (((hashStringToSeed(config.seed, region.id, "branch") % 100) / 100) - 0.5) * profile.branchSpread;
  const jitterX = randomInt(rng, -Math.round(profile.lateralJitter), Math.round(profile.lateralJitter));
  const jitterY = randomInt(rng, -Math.round(profile.lateralJitter), Math.round(profile.lateralJitter));
  let target = { x: depthX, y: centerY + lateral + branch * 0.32 };

  if (profile.key === "chapel") {
    target = { x: depthX, y: centerY + lateral };
    if (role === "final") target = { x: gridW - size.w - 5, y: centerY - size.h / 2 };
    if (role === "entrance") target = { x: 4, y: centerY - size.h / 2 };
    if (role === "secret") target = { x: centerX + depth * usableW * 0.35, y: centerY + profile.spread * 1.65 };
  }

  if (profile.key === "crypt") {
    target = { x: depthX, y: centerY + lateral * profile.compactness + branch * 0.18 };
    if (role === "secret") target = { x: gridW - size.w - 6, y: centerY + profile.spread * 1.35 };
  }

  if (profile.key === "mine") {
    target = { x: depthX, y: centerY + lateral + branch };
    if (role === "connector") target.y = centerY + lane * 2.2 + branch * 0.25;
    if (role === "hazard") target.y += profile.spread * 0.45;
  }

  if (profile.key === "cave") {
    const angleSeed = hashStringToSeed(config.seed, region.id, "cave-angle") / 4294967296;
    const angle = angleSeed * Math.PI * 2 + depth * Math.PI * 0.85;
    const radius = 3 + depth * Math.min(gridW, gridH) * 0.36;
    target = {
      x: centerX + Math.cos(angle) * radius - size.w / 2 + lane * 0.8,
      y: centerY + Math.sin(angle) * radius * 0.72 - size.h / 2 + branch * 0.45,
    };
    if (role === "entrance") target = { x: 5, y: centerY - size.h / 2 + branch * 0.2 };
  }

  if (profile.key === "noble-house") {
    const floorLane = Math.round(lane);
    const column = Math.round(depth * 4);
    target = {
      x: 5 + column * Math.max(6, usableW / 4),
      y: centerY - size.h / 2 + floorLane * Math.max(4, profile.spread * 0.82),
    };
    if (role === "connector") target.y = centerY - size.h / 2;
    if (role === "secret") target = { x: centerX + usableW * 0.22, y: centerY + profile.spread * 1.5 };
  }

  if (profile.key === "ruins") {
    const cluster = hashStringToSeed(config.seed, region.id, "ruin-cluster") % 4;
    const clusterOffset = [
      { x: -profile.spread, y: -profile.spread * 0.6 },
      { x: profile.spread * 0.8, y: -profile.spread * 0.8 },
      { x: -profile.spread * 0.4, y: profile.spread },
      { x: profile.spread, y: profile.spread * 0.65 },
    ][cluster];
    target = { x: depthX + clusterOffset.x, y: centerY + lateral + clusterOffset.y + branch * 0.28 };
  }

  const centroid = getPlacedNeighborCentroid(region, placed, adjacency);
  if (centroid) {
    const pull = profile.key === "cave" || profile.key === "mine" ? 0.22 : 0.14;
    target = {
      x: target.x * (1 - pull) + centroid.x * pull - size.w / 2,
      y: target.y * (1 - pull) + centroid.y * pull - size.h / 2,
    };
  }

  return {
    x: target.x + jitterX,
    y: target.y + jitterY,
  };
}

function scorePlacementCandidate(candidate, target, placed, graph, region, profile) {
  const dx = candidate.x - target.x;
  const dy = candidate.y - target.y;
  const overlapCount = placed.filter((room) => rectsOverlapWithMargin(candidate, room.cellRect, 2)).length;
  const nearCount = placed.filter((room) => rectsOverlapWithMargin(candidate, room.cellRect, 5)).length;
  const role = getPlacementRole(region);
  const graphBias = graph.some((edge) => edge.from === region.id || edge.to === region.id) ? -8 : 0;
  const spacingPenalty = profile.key === "cave" || profile.key === "ruins" ? nearCount * 5 : nearCount * 2;
  const axisPenalty = (profile.key === "chapel" || profile.key === "crypt") && ["entrance", "connector", "final"].includes(role) ? Math.abs(dy) * 0.35 : 0;
  return dx * dx + dy * dy + overlapCount * 10000 + spacingPenalty + axisPenalty + graphBias;
}

function createPlacedRegion(region, shape, cellRect, config, profileKey, number) {
  return {
    ...region,
    shape,
    cellRect,
    placementProfile: profileKey,
    surfaceKind: profileKey === "cave" ? "cave" : "dungeon",
    floorCells: [],
    wallSegments: [],
    doorAnchors: [],
    labelPoint: {
      x: (cellRect.x + cellRect.w / 2) * config.gridSize,
      y: (cellRect.y + cellRect.h / 2) * config.gridSize,
    },
    number,
  };
}

function resolveStructuredRoomSize(region, contextKey, options = {}) {
  const role = getPlacementRole(region);
  if (contextKey === "chapel") {
    if (role === "entrance") return { w: 5, h: 5 };
    if (role === "connector") return options.primary ? { w: 12 + options.variant, h: 6 + (options.variant % 2) } : { w: 5, h: 4 };
    if (role === "final") return { w: 7 + (options.variant % 2), h: 7 };
    if (role === "secret") return { w: 5, h: 4 };
    if (role === "hazard") return { w: 6, h: 5 };
    return { w: 5, h: 4 };
  }
  if (contextKey === "noble-house") {
    if (role === "entrance") return { w: 7, h: 5 };
    if (role === "connector") return { w: 7, h: 4 };
    if (role === "final") return { w: 8, h: 6 };
    if (role === "secret") return { w: 5, h: 4 };
    return { w: 6, h: 5 };
  }
  return null;
}

function rectsOverlapAny(rect, placed, margin = 0) {
  return placed.some((region) => rectsOverlapWithMargin(rect, region.cellRect, margin));
}

function createChapelSideSlots(naveRect, finalRect, gridW, gridH, variant) {
  const upperFirst = variant % 2 === 0;
  const transeptX = Math.max(naveRect.x + 2, finalRect.x - 4);
  const slots = [
    { id: "north-chapel-a", x: naveRect.x + 2, y: naveRect.y - 4, w: 5, h: 4, kind: "side" },
    { id: "south-chapel-a", x: naveRect.x + 2, y: naveRect.y + naveRect.h, w: 5, h: 4, kind: "side" },
    { id: "north-chapel-b", x: naveRect.x + Math.max(6, Math.floor(naveRect.w / 2)), y: naveRect.y - 4, w: 5, h: 4, kind: "side" },
    { id: "south-chapel-b", x: naveRect.x + Math.max(6, Math.floor(naveRect.w / 2)), y: naveRect.y + naveRect.h, w: 5, h: 4, kind: "side" },
    { id: "north-transept", x: transeptX, y: finalRect.y - 5, w: 6, h: 5, kind: "transept" },
    { id: "south-transept", x: transeptX, y: finalRect.y + finalRect.h, w: 6, h: 5, kind: "transept" },
    { id: "sacristy", x: finalRect.x + Math.max(0, finalRect.w - 5), y: finalRect.y + finalRect.h, w: 5, h: 4, kind: "sacristy" },
    { id: "vestry", x: finalRect.x, y: finalRect.y - 4, w: 5, h: 4, kind: "vestry" },
    { id: "rear-crypt", x: finalRect.x + finalRect.w, y: finalRect.y + Math.floor((finalRect.h - 4) / 2), w: 5, h: 4, kind: "secret" },
  ].map((slot) => ({
    ...slot,
    x: clamp(slot.x, 3, gridW - slot.w - 3),
    y: clamp(slot.y, 3, gridH - slot.h - 3),
  }));

  return slots.sort((a, b) => {
    const aNorth = a.id.includes("north") || a.id.includes("vestry");
    const bNorth = b.id.includes("north") || b.id.includes("vestry");
    if (aNorth !== bNorth) return upperFirst ? (aNorth ? -1 : 1) : (aNorth ? 1 : -1);
    return hashStringToSeed(a.id, variant, "chapel-slot") - hashStringToSeed(b.id, variant, "chapel-slot");
  });
}

function placeRegionInFirstAvailableSlot(region, slots, placed, config, profileKey, shape = "rect") {
  const role = getPlacementRole(region);
  const preferred = role === "secret" ? slots.filter((slot) => slot.kind === "secret" || slot.kind === "sacristy") : slots;
  const candidates = preferred.length > 0 ? preferred : slots;
  for (const slot of candidates) {
    const size = resolveStructuredRoomSize(region, "chapel", { primary: false, variant: 0 }) || { w: slot.w, h: slot.h };
    const cellRect = {
      x: slot.x,
      y: slot.y,
      w: Math.min(size.w, slot.w),
      h: Math.min(size.h, slot.h),
    };
    if (rectsOverlapAny(cellRect, placed, 0)) continue;
    placed.push(createPlacedRegion(region, shape, cellRect, config, profileKey, placed.length + 1));
    slots.splice(slots.indexOf(slot), 1);
    return true;
  }
  return false;
}

function placeChapelRegions(config, graph, rng, profile) {
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const placed = [];
  const variant = hashStringToSeed(config.seed, config.roomCount, "chapel-blueprint") % 4;
  const axisShift = (hashStringToSeed(config.seed, "chapel-axis") % 5) - 2;
  const centerY = clamp(Math.floor(gridH / 2) + axisShift, 10, gridH - 10);
  const roleWeight = { entrance: 0, connector: 1, clue: 2, hazard: 3, side: 4, final: 5, secret: 6 };
  const ordered = [...config.regions].sort((a, b) => (roleWeight[getPlacementRole(a)] ?? 4) - (roleWeight[getPlacementRole(b)] ?? 4) || roleDepth(a) - roleDepth(b) || a.id.localeCompare(b.id));
  const entrance = ordered.find((region) => getPlacementRole(region) === "entrance") || ordered[0];
  const finalRoom = [...ordered].reverse().find((region) => getPlacementRole(region) === "final") || ordered[ordered.length - 1];
  const connector = ordered.find((region) => getPlacementRole(region) === "connector" && region.id !== entrance?.id && region.id !== finalRoom?.id);
  const naveRegion = connector || ordered.find((region) => region.id !== entrance?.id && region.id !== finalRoom?.id) || entrance;
  const sideRegions = ordered.filter((region) => ![entrance?.id, finalRoom?.id, naveRegion?.id].includes(region.id));
  const entranceSize = resolveStructuredRoomSize(entrance, "chapel", { variant, primary: false });
  const naveSize = resolveStructuredRoomSize(naveRegion, "chapel", { variant, primary: true });
  const finalSize = resolveStructuredRoomSize(finalRoom, "chapel", { variant, primary: false });
  const startX = 4 + (variant === 3 ? 2 : 0);
  const entranceRect = {
    x: startX,
    y: centerY - Math.floor(entranceSize.h / 2),
    ...entranceSize,
  };
  const naveRect = {
    x: entranceRect.x + entranceRect.w,
    y: centerY - Math.floor(naveSize.h / 2),
    ...naveSize,
  };
  const finalYOffset = variant === 1 ? -1 : variant === 2 ? 1 : 0;
  const finalRect = {
    x: naveRect.x + naveRect.w,
    y: clamp(centerY - Math.floor(finalSize.h / 2) + finalYOffset, 3, gridH - finalSize.h - 3),
    ...finalSize,
  };

  if (entrance) placed.push(createPlacedRegion(entrance, "rect", entranceRect, config, profile.key, placed.length + 1));
  if (naveRegion && naveRegion.id !== entrance?.id && naveRegion.id !== finalRoom?.id) placed.push(createPlacedRegion(naveRegion, "hall", naveRect, config, profile.key, placed.length + 1));
  if (finalRoom && finalRoom.id !== entrance?.id && finalRoom.id !== naveRegion?.id) placed.push(createPlacedRegion(finalRoom, "apse", finalRect, config, profile.key, placed.length + 1));

  const slots = createChapelSideSlots(naveRect, finalRect, gridW, gridH, variant);
  sideRegions.forEach((region) => {
    const role = getPlacementRole(region);
    const shape = role === "secret" ? "archive" : "rect";
    const placedInSlot = placeRegionInFirstAvailableSlot(region, slots, placed, config, profile.key, shape);
    if (placedInSlot) return;
    const fallbackSize = resolveStructuredRoomSize(region, "chapel", { primary: false, variant }) || { w: 5, h: 4 };
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const x = clamp(finalRect.x + finalRect.w + 1 + Math.floor(attempt / 10), 3, gridW - fallbackSize.w - 3);
      const y = clamp(centerY - 6 + ((attempt % 10) - 5), 3, gridH - fallbackSize.h - 3);
      const cellRect = { x, y, ...fallbackSize };
      if (rectsOverlapAny(cellRect, placed, 0)) continue;
      placed.push(createPlacedRegion(region, shape, cellRect, config, profile.key, placed.length + 1));
      break;
    }
  });

  return config.regions.map((region) => placed.find((placedRegion) => placedRegion.id === region.id)).filter(Boolean);
}

function placeNobleHouseRegions(config, graph, rng, profile) {
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const placed = [];
  const centerX = Math.floor(gridW / 2);
  const centerY = Math.floor(gridH / 2);
  const courtyard = { x: centerX - 5, y: centerY - 4, w: 10, h: 8 };
  const ordered = [...config.regions].sort((a, b) => roleDepth(a) - roleDepth(b) || a.id.localeCompare(b.id));
  const slots = [
    { side: "west", x: courtyard.x - 7, y: courtyard.y + 1, w: 7, h: 5 },
    { side: "north", x: courtyard.x, y: courtyard.y - 5, w: 6, h: 5 },
    { side: "north", x: courtyard.x + 6, y: courtyard.y - 5, w: 6, h: 5 },
    { side: "east", x: courtyard.x + courtyard.w, y: courtyard.y, w: 7, h: 5 },
    { side: "east", x: courtyard.x + courtyard.w, y: courtyard.y + 5, w: 7, h: 5 },
    { side: "south", x: courtyard.x + 4, y: courtyard.y + courtyard.h, w: 7, h: 5 },
    { side: "south", x: courtyard.x - 3, y: courtyard.y + courtyard.h, w: 7, h: 5 },
    { side: "west", x: courtyard.x - 7, y: courtyard.y + 6, w: 7, h: 5 },
  ];
  const rolePriority = { entrance: 0, connector: 1, clue: 2, side: 3, hazard: 4, final: 5, secret: 6 };
  const arranged = [...ordered].sort((a, b) => (rolePriority[getPlacementRole(a)] ?? 3) - (rolePriority[getPlacementRole(b)] ?? 3) || a.id.localeCompare(b.id));

  arranged.forEach((region, index) => {
    const role = getPlacementRole(region);
    const slot = slots[index % slots.length];
    const size = resolveStructuredRoomSize(region, "noble-house") || { w: slot.w, h: slot.h };
    const cellRect = {
      x: clamp(slot.x, 3, gridW - size.w - 3),
      y: clamp(slot.y, 3, gridH - size.h - 3),
      w: slot.w,
      h: slot.h,
    };
    if (role === "final") {
      cellRect.x = courtyard.x + courtyard.w;
      cellRect.y = courtyard.y;
      cellRect.w = 8;
      cellRect.h = 6;
    }
    if (role === "secret") {
      cellRect.x = courtyard.x + courtyard.w - 2;
      cellRect.y = courtyard.y + courtyard.h;
      cellRect.w = 5;
      cellRect.h = 4;
    }
    placed.push(createPlacedRegion(region, "rect", cellRect, config, profile.key, placed.length + 1));
  });

  return config.regions.map((region) => placed.find((placedRegion) => placedRegion.id === region.id)).filter(Boolean);
}

function resolveCaveRoomSize(region, rng, config = null) {
  const role = getPlacementRole(region);
  const preset = SIZE_PRESETS[region.size] || SIZE_PRESETS.Medium;
  const singleCaveRegion = getContextKey(config?.context || config?.biome) === "cave" && normalizeRoomCount(config?.roomCount, config?.regions?.length || 1) <= 1;

  if (singleCaveRegion) {
    const gridW = Math.floor((config?.mapWidth || DEFAULT_CONFIG.mapWidth) / (config?.gridSize || DEFAULT_CONFIG.gridSize));
    const gridH = Math.floor((config?.mapHeight || DEFAULT_CONFIG.mapHeight) / (config?.gridSize || DEFAULT_CONFIG.gridSize));
    return {
      w: clamp(randomInt(rng, 21, 29), 14, Math.max(14, gridW - 8)),
      h: clamp(randomInt(rng, 14, 21), 10, Math.max(10, gridH - 8)),
    };
  }

  let w = randomInt(rng, preset.minW + 1, preset.maxW + 2);
  let h = randomInt(rng, preset.minH + 1, preset.maxH + 2);

  if (role === "connector") {
    w = randomInt(rng, 4, 6);
    h = randomInt(rng, 4, 6);
  }

  if (role === "final" || role === "hazard") {
    w += randomInt(rng, 1, 3);
    h += randomInt(rng, 1, 3);
  }

  if (role === "secret") {
    w = Math.max(4, w - 1);
    h = Math.max(4, h - 1);
  }

  const shapeText = String(region.preferredShape || "").toLowerCase();
  if (shapeText.includes("shaft") || getRegionText(region).includes("vertical") || getRegionText(region).includes("well")) {
    const d = clamp(Math.max(w, h), 5, 9);
    return { w: d, h: d };
  }

  const average = Math.round((w + h) / 2);
  w = clamp(Math.round(w * 0.66 + average * 0.34), 4, 12);
  h = clamp(Math.round(h * 0.66 + average * 0.34), 4, 10);
  return { w, h };
}

function getRectGap(a, b) {
  const dx = Math.max(0, Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)));
  const dy = Math.max(0, Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h)));
  return dx + dy;
}

function getRectIntersectionArea(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

function createAdjacentCaveCandidate(anchorRect, size, direction, offset) {
  const overlapX = Math.max(1, Math.round(Math.min(anchorRect.w, size.w) * 0.28));
  const overlapY = Math.max(1, Math.round(Math.min(anchorRect.h, size.h) * 0.28));
  const alignX = anchorRect.x + Math.round((anchorRect.w - size.w) / 2) + offset;
  const alignY = anchorRect.y + Math.round((anchorRect.h - size.h) / 2) + offset;

  if (direction === "east") return { x: anchorRect.x + anchorRect.w - overlapX, y: alignY, ...size };
  if (direction === "west") return { x: anchorRect.x - size.w + overlapX, y: alignY, ...size };
  if (direction === "south") return { x: alignX, y: anchorRect.y + anchorRect.h - overlapY, ...size };
  if (direction === "north") return { x: alignX, y: anchorRect.y - size.h + overlapY, ...size };
  if (direction === "south-east") return { x: anchorRect.x + anchorRect.w - overlapX, y: anchorRect.y + anchorRect.h - overlapY, ...size };
  if (direction === "north-east") return { x: anchorRect.x + anchorRect.w - overlapX, y: anchorRect.y - size.h + overlapY, ...size };
  if (direction === "south-west") return { x: anchorRect.x - size.w + overlapX, y: anchorRect.y + anchorRect.h - overlapY, ...size };
  return { x: anchorRect.x - size.w + overlapX, y: anchorRect.y - size.h + overlapY, ...size };
}

function isAcceptableCavePlacement(candidate, anchorRect, placed) {
  const area = Math.max(1, candidate.w * candidate.h);
  let anchorOverlap = 0;
  let foreignOverlap = 0;

  placed.forEach((room) => {
    const overlap = getRectIntersectionArea(candidate, room.cellRect);
    if (overlap <= 0) return;
    if (room.cellRect === anchorRect) anchorOverlap += overlap;
    else foreignOverlap += overlap;
  });

  return anchorOverlap <= area * 0.46 && foreignOverlap <= area * 0.2;
}

function scoreCavePlacementCandidate(candidate, anchorRect, placed, center, gridW, gridH, rng) {
  const area = Math.max(1, candidate.w * candidate.h);
  let anchorOverlap = 0;
  let foreignOverlap = 0;

  placed.forEach((room) => {
    const overlap = getRectIntersectionArea(candidate, room.cellRect);
    if (overlap <= 0) return;
    if (room.cellRect === anchorRect) anchorOverlap += overlap;
    else foreignOverlap += overlap;
  });

  const near = placed.filter((room) => getRectGap(candidate, room.cellRect) <= 1).length;
  const anchorGap = getRectGap(candidate, anchorRect);
  const candidateCenter = { x: candidate.x + candidate.w / 2, y: candidate.y + candidate.h / 2 };
  const centerDx = candidateCenter.x - center.x;
  const centerDy = candidateCenter.y - center.y;
  const edgePenalty = candidate.x < 2 || candidate.y < 2 || candidate.x + candidate.w > gridW - 2 || candidate.y + candidate.h > gridH - 2 ? 900 : 0;
  const desiredAnchorOverlap = area * 0.18;
  const overlapPenalty = Math.abs(anchorOverlap - desiredAnchorOverlap) * 38;
  return foreignOverlap * 1800 + anchorGap * 2600 + overlapPenalty - near * 220 + centerDx * centerDx + centerDy * centerDy + edgePenalty + rng() * 4;
}

function chooseCaveAnchorRegion(region, placed, graph, seed) {
  const connectedIds = graph
    .filter((edge) => edge.from === region.id || edge.to === region.id)
    .map((edge) => edge.from === region.id ? edge.to : edge.from);
  const connectedPlaced = placed.filter((candidate) => connectedIds.includes(candidate.id));
  if (connectedPlaced.length > 0) {
    return connectedPlaced.sort((a, b) => getRectGap(a.cellRect, { x: 0, y: 0, w: 0, h: 0 }) - getRectGap(b.cellRect, { x: 0, y: 0, w: 0, h: 0 }))[hashStringToSeed(seed, region.id, "cave-anchor") % connectedPlaced.length];
  }
  return placed[hashStringToSeed(seed, region.id, "fallback-cave-anchor") % placed.length] || null;
}

function chooseCavePlacement(region, size, anchor, placed, config, rng, index) {
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const center = { x: gridW * 0.48, y: gridH * 0.5 };
  const margin = 2;
  const directionSeed = hashStringToSeed(config.seed, region.id, "cave-direction");
  const baseDirections = ["east", "south", "north", "west", "south-east", "north-east", "south-west", "north-west"];
  const directions = [...baseDirections].sort((a, b) => hashStringToSeed(directionSeed, a) - hashStringToSeed(directionSeed, b));
  const offsets = [0, -1, 1, -2, 2, -3, 3];
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  directions.forEach((direction) => {
    offsets.forEach((offset) => {
      const raw = createAdjacentCaveCandidate(anchor.cellRect, size, direction, offset);
      const candidate = {
        ...raw,
        x: clamp(raw.x, margin, gridW - size.w - margin),
        y: clamp(raw.y, margin, gridH - size.h - margin),
      };
      const score = scoreCavePlacementCandidate(candidate, anchor.cellRect, placed, center, gridW, gridH, rng);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    });
  });

  if (best && isAcceptableCavePlacement(best, anchor.cellRect, placed)) return best;

  const spiralRadius = 2 + Math.floor(index / 2);
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const angle = (attempt / 18) * Math.PI * 2 + (directionSeed % 100) / 100;
    const radius = spiralRadius + Math.floor(attempt / 18);
    const candidate = {
      x: clamp(Math.round(center.x + Math.cos(angle) * radius - size.w / 2), margin, gridW - size.w - margin),
      y: clamp(Math.round(center.y + Math.sin(angle) * radius * 0.78 - size.h / 2), margin, gridH - size.h - margin),
      ...size,
    };
    if (isAcceptableCavePlacement(candidate, anchor.cellRect, placed)) return candidate;
  }

  return best || { x: margin, y: margin, ...size };
}

function placeCaveRegions(config, graph, rng, profile) {
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const placed = [];
  const rolePriority = { entrance: 0, connector: 1, clue: 2, hazard: 3, side: 4, final: 5, secret: 6 };
  const ordered = [...config.regions].sort((a, b) => {
    return (rolePriority[getPlacementRole(a)] ?? 4) - (rolePriority[getPlacementRole(b)] ?? 4) || roleDepth(a) - roleDepth(b) || a.id.localeCompare(b.id);
  });
  const singleCaveRegion = ordered.length <= 1;

  if (singleCaveRegion) {
    const region = ordered[0];
    if (!region) return [];
    const size = resolveCaveRoomSize(region, rng, config);
    const xBias = randomInt(rng, -3, 3);
    const yBias = randomInt(rng, -2, 2);
    const cellRect = {
      x: clamp(Math.round(gridW / 2 - size.w / 2 + xBias), 3, gridW - size.w - 3),
      y: clamp(Math.round(gridH / 2 - size.h / 2 + yBias), 3, gridH - size.h - 3),
      ...size,
    };
    return [createPlacedRegion(region, "cave", cellRect, config, profile.key, 1)];
  }

  const adjacency = getGraphAdjacency(graph);
  const maxDepth = Math.max(1, ...config.regions.map((region) => Number.isFinite(region.graphDepth) ? region.graphDepth : roleDepth(region)));
  const margin = 3;

  ordered.forEach((region, index) => {
    const size = resolveCaveRoomSize(region, rng, config);
    const shape = chooseRoomShape(region, profile.key);
    const target = getContextualTarget(region, size, config, graph, placed, rng, profile, adjacency, maxDepth);
    const maxX = Math.max(margin, gridW - size.w - margin);
    const maxY = Math.max(margin, gridH - size.h - margin);
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < 520; attempt += 1) {
      const radius = Math.floor(attempt / 18);
      const candidate = {
        x: clamp(Math.round(target.x) + randomInt(rng, -radius - 1, radius + 1), margin, maxX),
        y: clamp(Math.round(target.y) + randomInt(rng, -radius - 1, radius + 1), margin, maxY),
        ...size,
      };
      const overlap = placed.some((room) => rectsOverlapWithMargin(candidate, room.cellRect, 2));
      const nearCount = placed.filter((room) => rectsOverlapWithMargin(candidate, room.cellRect, 5)).length;
      const dx = candidate.x - target.x;
      const dy = candidate.y - target.y;
      const score = dx * dx + dy * dy + (overlap ? 100000 : 0) + nearCount * 72 + rng() * 3;
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
      if (!overlap && nearCount <= 1 && attempt > 18) break;
    }

    const cellRect = best || {
      x: clamp(margin + index * 3, margin, maxX),
      y: clamp(Math.round(gridH / 2 - size.h / 2), margin, maxY),
      ...size,
    };
    placed.push(createPlacedRegion(region, shape, cellRect, config, profile.key, placed.length + 1));
  });

  return config.regions.map((region) => placed.find((placedRegion) => placedRegion.id === region.id)).filter(Boolean);
}

function placeRegions(config, graph, rng) {
  const profile = getPlacementProfile(config);
  if (profile.key === "chapel") return placeChapelRegions(config, graph, rng, profile);
  if (profile.key === "noble-house") return placeNobleHouseRegions(config, graph, rng, profile);
  if (profile.key === "cave") return placeCaveRegions(config, graph, rng, profile);
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const margin = 3;
  const placed = [];
  const adjacency = getGraphAdjacency(graph);
  const maxDepth = Math.max(1, ...config.regions.map((region) => Number.isFinite(region.graphDepth) ? region.graphDepth : roleDepth(region)));
  const orderedRegions = [...config.regions].sort((a, b) => {
    const roleWeight = { entrance: 0, connector: 1, clue: 2, hazard: 3, side: 4, final: 5, secret: 6 };
    return (roleWeight[getPlacementRole(a)] ?? 4) - (roleWeight[getPlacementRole(b)] ?? 4) || roleDepth(a) - roleDepth(b) || a.id.localeCompare(b.id);
  });

  orderedRegions.forEach((region, index) => {
    const size = resolveRoomSize(region, rng);
    const shape = chooseRoomShape(region, profile.key);
    const maxX = Math.max(margin, gridW - size.w - margin);
    const maxY = Math.max(margin, gridH - size.h - margin);
    const target = getContextualTarget(region, size, config, graph, placed, rng, profile, adjacency, maxDepth);
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < 420; attempt += 1) {
      const radius = Math.floor(attempt / 14);
      const candidate = {
        id: region.id,
        x: clamp(Math.round(target.x) + randomInt(rng, -radius - 1, radius + 1), margin, maxX),
        y: clamp(Math.round(target.y) + randomInt(rng, -radius - 1, radius + 1), margin, maxY),
        w: size.w,
        h: size.h,
      };
      const score = scorePlacementCandidate(candidate, target, placed, graph, region, profile);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
      if (!placed.some((room) => rectsOverlapWithMargin(candidate, room.cellRect, 2))) break;
    }

    const cellRect = best;
    placed.push({
      ...region,
      shape,
      cellRect,
      placementProfile: profile.key,
      surfaceKind: profile.key === "cave" ? "cave" : "dungeon",
      floorCells: [],
      wallSegments: [],
      doorAnchors: [],
      labelPoint: {
        x: (cellRect.x + cellRect.w / 2) * config.gridSize,
        y: (cellRect.y + cellRect.h / 2) * config.gridSize,
      },
      number: index + 1,
    });
  });

  return config.regions.map((region) => placed.find((placedRegion) => placedRegion.id === region.id)).filter(Boolean);
}

function applyManualRoomPositions(regions, config) {
  const manualPositions = config.manualRoomPositions || {};
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);

  return regions.map((region) => {
    const position = manualPositions[region.id];
    if (!position) return region;
    const cellRect = {
      ...region.cellRect,
      x: clamp(Math.round(position.x), 1, Math.max(1, gridW - region.cellRect.w - 1)),
      y: clamp(Math.round(position.y), 1, Math.max(1, gridH - region.cellRect.h - 1)),
    };
    return {
      ...region,
      cellRect,
      labelPoint: {
        x: (cellRect.x + cellRect.w / 2) * config.gridSize,
        y: (cellRect.y + cellRect.h / 2) * config.gridSize,
      },
    };
  });
}

function addRectCells(cells, x, y, w, h) {
  for (let cy = y; cy < y + h; cy += 1) {
    for (let cx = x; cx < x + w; cx += 1) {
      cells.add(cellKey(cx, cy));
    }
  }
}

function removeRectCells(cells, x, y, w, h) {
  for (let cy = y; cy < y + h; cy += 1) {
    for (let cx = x; cx < x + w; cx += 1) {
      cells.delete(cellKey(cx, cy));
    }
  }
}

function getLargestConnectedCellSet(cells) {
  const unvisited = new Set(cells);
  let best = new Set();

  while (unvisited.size > 0) {
    const start = unvisited.values().next().value;
    const component = new Set([start]);
    const queue = [start];
    unvisited.delete(start);

    while (queue.length > 0) {
      const current = parseCellKey(queue.shift());
      getCellNeighbors(current).forEach((neighbor) => {
        const key = cellKey(neighbor.x, neighbor.y);
        if (!unvisited.has(key)) return;
        unvisited.delete(key);
        component.add(key);
        queue.push(key);
      });
    }

    if (component.size > best.size) best = component;
  }

  return best;
}

function ensureRoomMaskViable(cells, room) {
  const { x, y, w, h } = room.cellRect;
  if (cells.size === 0) {
    cells.add(cellKey(x + Math.floor(w / 2), y + Math.floor(h / 2)));
  }
  const connected = getLargestConnectedCellSet(cells);
  const minCells = Math.max(4, Math.floor(w * h * 0.38));
  if (connected.size < minCells) {
    const fallback = new Set();
    addRectCells(fallback, x, y, w, h);
    return fallback;
  }
  return connected;
}

function carveCorner(cells, x, y, w, h, corner, notchW, notchH) {
  if (corner === "nw") removeRectCells(cells, x, y, notchW, notchH);
  if (corner === "ne") removeRectCells(cells, x + w - notchW, y, notchW, notchH);
  if (corner === "sw") removeRectCells(cells, x, y + h - notchH, notchW, notchH);
  if (corner === "se") removeRectCells(cells, x + w - notchW, y + h - notchH, notchW, notchH);
}

function buildRectMask(room) {
  const cells = new Set();
  const { x, y, w, h } = room.cellRect;
  addRectCells(cells, x, y, w, h);
  return cells;
}

function buildLShapeMask(room, rng) {
  const cells = buildRectMask(room);
  const { x, y, w, h } = room.cellRect;
  if (w < 3 || h < 3) return cells;
  const notchW = clamp(Math.floor(w * 0.38), 1, Math.max(1, w - 2));
  const notchH = clamp(Math.floor(h * 0.42), 1, Math.max(1, h - 2));
  carveCorner(cells, x, y, w, h, pickOne(rng, ["nw", "ne", "sw", "se"]), notchW, notchH);
  return cells;
}

function buildNotchedMask(room, rng) {
  const cells = buildRectMask(room);
  const { x, y, w, h } = room.cellRect;
  if (w < 3 || h < 3) return cells;
  const side = pickOne(rng, ["north", "south", "east", "west"]);
  const notchLength = side === "north" || side === "south" ? clamp(Math.floor(w * 0.32), 1, Math.max(1, w - 2)) : clamp(Math.floor(h * 0.32), 1, Math.max(1, h - 2));
  const offsetMax = side === "north" || side === "south" ? Math.max(1, w - notchLength - 1) : Math.max(1, h - notchLength - 1);
  const offset = randomInt(rng, 1, offsetMax);
  if (side === "north") removeRectCells(cells, x + offset, y, notchLength, 1);
  if (side === "south") removeRectCells(cells, x + offset, y + h - 1, notchLength, 1);
  if (side === "west") removeRectCells(cells, x, y + offset, 1, notchLength);
  if (side === "east") removeRectCells(cells, x + w - 1, y + offset, 1, notchLength);
  if (w >= 7 && h >= 5 && rng() > 0.45) {
    carveCorner(cells, x, y, w, h, pickOne(rng, ["nw", "ne", "sw", "se"]), 1, 1);
  }
  return cells;
}

function buildRuinedMask(room, rng) {
  const cells = buildRectMask(room);
  const { x, y, w, h } = room.cellRect;
  if (w < 5 || h < 5) return buildNotchedMask(room, rng);
  const corners = ["nw", "ne", "sw", "se"].sort(() => rng() - 0.5).slice(0, randomInt(rng, 1, 2));
  corners.forEach((corner) => carveCorner(cells, x, y, w, h, corner, randomInt(rng, 1, 2), randomInt(rng, 1, 2)));
  const breaks = randomInt(rng, 1, 3);
  for (let i = 0; i < breaks; i += 1) {
    const side = pickOne(rng, ["north", "south", "east", "west"]);
    if (side === "north") cells.delete(cellKey(randomInt(rng, x + 1, x + w - 2), y));
    if (side === "south") cells.delete(cellKey(randomInt(rng, x + 1, x + w - 2), y + h - 1));
    if (side === "west") cells.delete(cellKey(x, randomInt(rng, y + 1, y + h - 2)));
    if (side === "east") cells.delete(cellKey(x + w - 1, randomInt(rng, y + 1, y + h - 2)));
  }
  return cells;
}

function buildAlcoveMask(room, rng) {
  const cells = buildRectMask(room);
  const { x, y, w, h } = room.cellRect;
  if (w < 3 || h < 3) return cells;
  const northFirst = rng() > 0.5;
  const step = w >= 7 ? 3 : 2;
  for (let cx = x + 1; cx < x + w - 1; cx += step) {
    const useNorth = ((cx - x) % 2 === 0) === northFirst;
    if (useNorth) cells.delete(cellKey(cx, y));
    else cells.delete(cellKey(cx, y + h - 1));
  }
  if (h >= 5 && w <= 5) {
    const cy = y + Math.floor(h / 2);
    if (rng() > 0.5) cells.delete(cellKey(x, cy));
    else cells.delete(cellKey(x + w - 1, cy));
  }
  return cells;
}

function buildArchiveMask(room, rng) {
  const cells = buildRectMask(room);
  const { x, y, w, h } = room.cellRect;
  if (w < 3 || h < 3) return cells;
  const sideInset = rng() > 0.5 ? "vertical" : "horizontal";
  if (sideInset === "vertical") {
    for (let cy = y + 1; cy < y + h - 1; cy += 2) {
      cells.delete(cellKey(x, cy));
      if (w >= 6) cells.delete(cellKey(x + w - 1, cy));
    }
  } else {
    for (let cx = x + 1; cx < x + w - 1; cx += 2) {
      cells.delete(cellKey(cx, y));
      if (h >= 5) cells.delete(cellKey(cx, y + h - 1));
    }
  }
  return cells;
}

function buildApseMask(room) {
  const cells = buildRectMask(room);
  const { x, y, w, h } = room.cellRect;
  if (w < 5 || h < 5) return cells;
  cells.delete(cellKey(x + w - 1, y));
  cells.delete(cellKey(x + w - 1, y + h - 1));
  if (h >= 7) {
    cells.delete(cellKey(x + w - 2, y));
    cells.delete(cellKey(x + w - 2, y + h - 1));
  }
  return cells;
}

function buildHallMask(room, rng) {
  const cells = new Set();
  const { x, y, w, h } = room.cellRect;
  if (w >= h) {
    const hallH = clamp(Math.min(h, Math.max(2, Math.round(h * 0.58))), 1, h);
    const startY = y + Math.floor((h - hallH) / 2);
    addRectCells(cells, x, startY, w, hallH);
    if (h >= 4 && rng() > 0.5) cells.delete(cellKey(x + randomInt(rng, 0, Math.max(0, w - 1)), startY));
  } else {
    const hallW = clamp(Math.min(w, Math.max(2, Math.round(w * 0.58))), 1, w);
    const startX = x + Math.floor((w - hallW) / 2);
    addRectCells(cells, startX, y, hallW, h);
    if (w >= 4 && rng() > 0.5) cells.delete(cellKey(startX, y + randomInt(rng, 0, Math.max(0, h - 1))));
  }
  return cells;
}

function buildOvalMask(room) {
  const cells = new Set();
  const { x, y, w, h } = room.cellRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = Math.max(1.8, w / 2);
  const ry = Math.max(1.8, h / 2);
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      const nx = (xx + 0.5 - cx) / rx;
      const ny = (yy + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1.02) cells.add(cellKey(xx, yy));
    }
  }
  return cells;
}

function buildCircleMask(room) {
  const cells = new Set();
  const { x, y, w, h } = room.cellRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.max(1.8, Math.min(w, h) / 2);
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      const dx = xx + 0.5 - cx;
      const dy = yy + 0.5 - cy;
      if ((dx * dx + dy * dy) <= radius * radius * 1.015) cells.add(cellKey(xx, yy));
    }
  }
  return cells;
}

function buildCaveMask(room, rng) {
  const cells = new Set();
  const { x, y, w, h } = room.cellRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = Math.max(2.15, w / 2);
  const ry = Math.max(2.15, h / 2);
  const lobeCount = clamp(randomInt(rng, 2, 4), 2, 5);
  const biteCount = clamp(randomInt(rng, 1, 3), 1, 4);
  const lobes = Array.from({ length: lobeCount }, (_, index) => {
    const angle = rng() * Math.PI * 2;
    const distance = 0.28 + rng() * 0.42;
    return {
      x: cx + Math.cos(angle) * rx * distance,
      y: cy + Math.sin(angle) * ry * distance,
      rx: Math.max(1.35, rx * (0.28 + rng() * 0.24)),
      ry: Math.max(1.35, ry * (0.28 + rng() * 0.24)),
      weight: 0.16 + rng() * 0.18,
      index,
    };
  });
  const bites = Array.from({ length: biteCount }, (_, index) => {
    const side = pickOne(rng, ["north", "south", "east", "west"]);
    const horizontal = side === "north" || side === "south";
    return {
      side,
      x: horizontal ? x + 1 + rng() * Math.max(1, w - 2) : side === "west" ? x - 0.35 : x + w + 0.35,
      y: horizontal ? side === "north" ? y - 0.35 : y + h + 0.35 : y + 1 + rng() * Math.max(1, h - 2),
      rx: Math.max(1.1, w * (0.14 + rng() * 0.16)),
      ry: Math.max(1.1, h * (0.14 + rng() * 0.16)),
      index,
    };
  });

  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      const px = xx + 0.5;
      const py = yy + 0.5;
      const nx = (px - cx) / rx;
      const ny = (py - cy) / ry;
      const superEllipse = Math.pow(Math.abs(nx), 2.15) + Math.pow(Math.abs(ny), 2.05);
      const edgeNoise = ((hashStringToSeed(room.id, xx, yy, "cave-edge-noise") % 100) / 100 - 0.5) * 0.38;
      const grainNoise = ((hashStringToSeed(room.id, xx, yy, "cave-grain-noise") % 100) / 100 - 0.5) * 0.12;
      const lobeBoost = lobes.reduce((boost, lobe) => {
        const lx = (px - lobe.x) / lobe.rx;
        const ly = (py - lobe.y) / lobe.ry;
        const influence = Math.max(0, 1 - (lx * lx + ly * ly));
        return boost + influence * lobe.weight;
      }, 0);
      const biteCut = bites.some((bite) => {
        const bx = (px - bite.x) / bite.rx;
        const by = (py - bite.y) / bite.ry;
        return bx * bx + by * by < 0.96;
      });
      const rimCell = xx === x || yy === y || xx === x + w - 1 || yy === y + h - 1;
      const threshold = 0.88 + edgeNoise + lobeBoost + grainNoise - (rimCell ? 0.08 : 0);
      if (superEllipse <= threshold && !biteCut) cells.add(cellKey(xx, yy));
    }
  }

  const withinRoom = (cell) => cell.x >= x && cell.y >= y && cell.x < x + w && cell.y < y + h;
  const countNeighbors8 = (set, cell) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        if (set.has(cellKey(cell.x + dx, cell.y + dy))) count += 1;
      }
    }
    return count;
  };

  let draft = new Set(cells);
  for (let pass = 0; pass < 2; pass += 1) {
    const next = new Set(draft);
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        const cell = { x: xx, y: yy };
        const key = cellKey(xx, yy);
        const neighbors = countNeighbors8(draft, cell);
        const nx = (xx + 0.5 - cx) / rx;
        const ny = (yy + 0.5 - cy) / ry;
        const radial = Math.pow(Math.abs(nx), 2.15) + Math.pow(Math.abs(ny), 2.05);
        if (draft.has(key) && neighbors <= 2) next.delete(key);
        if (!draft.has(key) && neighbors >= 5 && radial < 1.08) next.add(key);
      }
    }
    draft = next;
  }

  const connected = getLargestConnectedCellSet(draft);
  const minimum = Math.max(5, Math.floor(w * h * 0.36));
  if (connected.size < minimum) {
    const fallback = buildOvalMask(room);
    const fallbackCells = new Set(fallback);
    carveCorner(fallbackCells, x, y, w, h, pickOne(rng, ["nw", "ne", "sw", "se"]), 1, 1);
    return ensureRoomMaskViable(fallbackCells, room);
  }

  const organic = new Set(Array.from(connected).filter((key) => withinRoom(parseCellKey(key))));
  const area = w * h;
  if (organic.size > area * 0.9 && w >= 5 && h >= 4) {
    const corner = pickOne(rng, ["nw", "ne", "sw", "se"]);
    carveCorner(organic, x, y, w, h, corner, randomInt(rng, 1, Math.max(1, Math.floor(w * 0.22))), randomInt(rng, 1, Math.max(1, Math.floor(h * 0.22))));
  }
  return ensureRoomMaskViable(organic, room);
}

function resizeRoomAroundCenter(region, sizePreset, config) {
  const size = ROOM_SIZE_MENU_PRESETS[sizePreset];
  if (!size) return region;
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const centerX = region.cellRect.x + region.cellRect.w / 2;
  const centerY = region.cellRect.y + region.cellRect.h / 2;
  const cellRect = {
    ...region.cellRect,
    w: size.w,
    h: size.h,
    x: clamp(Math.round(centerX - size.w / 2), 1, Math.max(1, gridW - size.w - 1)),
    y: clamp(Math.round(centerY - size.h / 2), 1, Math.max(1, gridH - size.h - 1)),
  };
  return {
    ...region,
    size: sizePreset,
    cellRect,
    labelPoint: {
      x: (cellRect.x + cellRect.w / 2) * config.gridSize,
      y: (cellRect.y + cellRect.h / 2) * config.gridSize,
    },
  };
}

function applyRoomSizeOverrides(regions, config) {
  const styles = config.manualRoomStyles || {};
  return regions.map((region) => {
    const sizePreset = styles[region.id]?.sizePreset;
    if (!sizePreset) return region;
    const resized = resizeRoomAroundCenter(region, sizePreset, config);
    const overlaps = regions.some((otherRegion) => otherRegion.id !== region.id && rectsOverlapWithMargin(resized.cellRect, otherRegion.cellRect, 0));
    return overlaps ? region : resized;
  });
}

function applyRoomStyleOverrides(regions, config) {
  const styles = config.manualRoomStyles || {};
  return regions.map((region) => {
    const style = styles[region.id];
    if (!style) return region;
    const shape = style.shape || region.shape;
    return {
      ...region,
      shape,
      roomType: style.roomType || region.roomType || "none",
      shapeOptions: {
        sizePreset: style.sizePreset || null,
        roomType: style.roomType || "none",
        notch: Boolean(style.notch),
        ruined: Boolean(style.ruined),
      },
    };
  });
}

function buildBaseRoomMask(room, rng) {
  if (room.shape === "hall") return buildHallMask(room, rng);
  if (room.shape === "l-shape") return buildLShapeMask(room, rng);
  if (room.shape === "notched") return buildNotchedMask(room, rng);
  if (room.shape === "broken" || room.shape === "ruined-rect") return buildRuinedMask(room, rng);
  if (room.shape === "alcove") return buildAlcoveMask(room, rng);
  if (room.shape === "archive") return buildArchiveMask(room, rng);
  if (room.shape === "apse") return buildApseMask(room);
  if (room.shape === "circle") return buildCircleMask(room);
  if (room.shape === "oval" || room.shape === "shaft" || room.shape === "ritual") return buildOvalMask(room);
  if (room.shape === "irregular" || room.shape === "cave") return buildCaveMask(room, rng);
  return buildRectMask(room);
}

function applyMaskModifier(baseCells, room, rng, modifier) {
  const draft = new Set(baseCells);
  const proxyRoom = { ...room };
  if (modifier === "notch") {
    const notched = buildNotchedMask(proxyRoom, rng);
    baseCells.forEach((key) => {
      if (!notched.has(key)) draft.delete(key);
    });
  }
  if (modifier === "ruined") {
    const ruined = buildRuinedMask(proxyRoom, rng);
    baseCells.forEach((key) => {
      if (!ruined.has(key)) draft.delete(key);
    });
  }
  if (modifier === "alcove") {
    const alcove = buildAlcoveMask(proxyRoom, rng);
    baseCells.forEach((key) => {
      if (!alcove.has(key)) draft.delete(key);
    });
  }
  if (modifier === "archive") {
    const archive = buildArchiveMask(proxyRoom, rng);
    baseCells.forEach((key) => {
      if (!archive.has(key)) draft.delete(key);
    });
  }
  return draft;
}

function buildRoomMask(room, rng) {
  const type = room.shapeOptions?.roomType || "none";
  let cells = type === "apse" ? buildApseMask(room) : type === "ruined" ? buildRuinedMask(room, rng) : buildBaseRoomMask(room, rng);
  if (type === "alcove" && room.shape !== "alcove") cells = applyMaskModifier(cells, room, rng, "alcove");
  if (type === "archive" && room.shape !== "archive") cells = applyMaskModifier(cells, room, rng, "archive");
  if (room.shapeOptions?.notch && !["notched", "ruined-rect", "broken"].includes(room.shape)) cells = applyMaskModifier(cells, room, rng, "notch");
  if (room.shapeOptions?.ruined && type !== "ruined" && !["ruined-rect", "broken"].includes(room.shape)) cells = applyMaskModifier(cells, room, rng, "ruined");
  return ensureRoomMaskViable(cells, room);
}

function getFloorCellCentroid(floorCells, gridSize, fallbackPoint) {
  if (!Array.isArray(floorCells) || floorCells.length === 0) return fallbackPoint;
  return {
    x: floorCells.reduce((sum, cell) => sum + cell.x + 0.5, 0) / floorCells.length * gridSize,
    y: floorCells.reduce((sum, cell) => sum + cell.y + 0.5, 0) / floorCells.length * gridSize,
  };
}

function buildAllRoomMasks(regions, seed, gridSize = DEFAULT_CONFIG.gridSize) {
  return regions.map((room) => {
    const rng = createSeededRng(hashStringToSeed(seed, room.id, "room-mask"));
    const floorCells = Array.from(buildRoomMask(room, rng)).map(parseCellKey);
    return {
      ...room,
      floorCells,
      labelPoint: ["cave", "broken", "ruined-rect"].includes(room.shape)
        ? getFloorCellCentroid(floorCells, gridSize, room.labelPoint)
        : room.labelPoint,
    };
  });
}

function getRoomCellSet(regions) {
  const set = new Set();
  regions.forEach((region) => {
    region.floorCells.forEach((cell) => set.add(cellKey(cell.x, cell.y)));
  });
  return set;
}

function getRoomHaloCells(roomCells) {
  const halo = new Set();
  roomCells.forEach((key) => {
    const cell = parseCellKey(key);
    [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ].forEach((neighbor) => {
      const neighborKey = cellKey(neighbor.x, neighbor.y);
      if (!roomCells.has(neighborKey)) halo.add(neighborKey);
    });
  });
  return halo;
}

function getAnchorApproachCells(anchor) {
  if (!anchor) return [];
  return [
    anchor.outsideCell,
    {
      x: anchor.outsideCell.x + anchor.normal.x,
      y: anchor.outsideCell.y + anchor.normal.y,
    },
    {
      x: anchor.outsideCell.x + anchor.normal.x * 2,
      y: anchor.outsideCell.y + anchor.normal.y * 2,
    },
  ];
}

function getCircleGeometryFromRegion(region, gridSize) {
  const { x, y, w, h } = region.cellRect;
  const radiusCells = Math.max(1.8, Math.min(w, h) / 2);
  return {
    cx: (x + w / 2) * gridSize,
    cy: (y + h / 2) * gridSize,
    r: radiusCells * gridSize,
    cxCells: x + w / 2,
    cyCells: y + h / 2,
    rCells: radiusCells,
  };
}

function getCircularAnchorData(region, cell, normal) {
  if (region.shape !== "circle") return null;
  const cx = region.cellRect.x + region.cellRect.w / 2;
  const cy = region.cellRect.y + region.cellRect.h / 2;
  const radius = Math.max(1.8, Math.min(region.cellRect.w, region.cellRect.h) / 2);
  const aim = {
    x: cell.x + 0.5 + normal.x * 0.72 - cx,
    y: cell.y + 0.5 + normal.y * 0.72 - cy,
  };
  const length = Math.hypot(aim.x, aim.y) || 1;
  return {
    cx,
    cy,
    r: radius,
    normal: { x: aim.x / length, y: aim.y / length },
  };
}

function isCircleDoorEdgeInsidePerimeter(anchor) {
  if (!anchor?.circular) return false;
  const circle = anchor.circular;
  const samples = anchor.side === "north" || anchor.side === "south"
    ? [0.33, 0.5, 0.67].map((t) => ({
      x: anchor.cell.x + t,
      y: anchor.side === "north" ? anchor.cell.y : anchor.cell.y + 1,
    }))
    : [0.33, 0.5, 0.67].map((t) => ({
      x: anchor.side === "west" ? anchor.cell.x : anchor.cell.x + 1,
      y: anchor.cell.y + t,
    }));
  const insideCount = samples.filter((point) => {
    const dx = point.x - circle.cx;
    const dy = point.y - circle.cy;
    return Math.hypot(dx, dy) < circle.r - 0.035;
  }).length;
  return insideCount >= 2;
}

function createCircleDoorRoomExtensionAnchor(region, anchor, gridW, gridH, reservedRoomCells = null) {
  if (!anchor || region.shape !== "circle") return anchor;
  const portalRoomCell = { x: anchor.outsideCell.x, y: anchor.outsideCell.y };
  const outsideCell = {
    x: portalRoomCell.x + anchor.normal.x,
    y: portalRoomCell.y + anchor.normal.y,
  };
  if (outsideCell.x < 1 || outsideCell.y < 1 || outsideCell.x >= gridW - 1 || outsideCell.y >= gridH - 1) return anchor;
  if (reservedRoomCells?.has(cellKey(portalRoomCell.x, portalRoomCell.y))) return anchor;
  if (reservedRoomCells?.has(cellKey(outsideCell.x, outsideCell.y))) return anchor;
  return {
    ...anchor,
    cell: portalRoomCell,
    outsideCell,
    circular: null,
    expandedCircleDoor: true,
    portalRoomCell,
    originalCell: { x: anchor.cell.x, y: anchor.cell.y },
    originalOutsideCell: { x: anchor.outsideCell.x, y: anchor.outsideCell.y },
    wasCircleDoorEdgeInsidePerimeter: isCircleDoorEdgeInsidePerimeter(anchor),
  };
}

function addCircleDoorRoomExtensionCellToSet(anchor, cells) {
  if (!anchor?.expandedCircleDoor || !anchor.portalRoomCell) return;
  cells.add(cellKey(anchor.portalRoomCell.x, anchor.portalRoomCell.y));
}

function applyCircleDoorRoomExtensions(regions, corridors) {
  const extensionsByRegion = new Map();
  const addExtension = (regionId, anchor) => {
    if (!regionId || !anchor?.expandedCircleDoor || !anchor.portalRoomCell) return;
    if (!extensionsByRegion.has(regionId)) extensionsByRegion.set(regionId, new Map());
    extensionsByRegion.get(regionId).set(cellKey(anchor.portalRoomCell.x, anchor.portalRoomCell.y), {
      x: anchor.portalRoomCell.x,
      y: anchor.portalRoomCell.y,
    });
  };

  corridors.forEach((corridor) => {
    addExtension(corridor.from, corridor.fromAnchor);
    addExtension(corridor.to, corridor.toAnchor);
  });

  if (extensionsByRegion.size === 0) return regions;

  return regions.map((region) => {
    const extensions = extensionsByRegion.get(region.id);
    if (!extensions || region.shape !== "circle") return region;

    const previousExtensions = new Map(
      (Array.isArray(region.circleExtensionCells) ? region.circleExtensionCells : [])
        .map((cell) => [cellKey(cell.x, cell.y), { x: cell.x, y: cell.y }])
    );
    extensions.forEach((cell, key) => previousExtensions.set(key, cell));

    const existingFloor = new Set(region.floorCells.map((cell) => cellKey(cell.x, cell.y)));
    const addedFloorCells = Array.from(previousExtensions.values()).filter((cell) => !existingFloor.has(cellKey(cell.x, cell.y)));

    return {
      ...region,
      floorCells: [...region.floorCells, ...addedFloorCells],
      circleExtensionCells: Array.from(previousExtensions.values()),
    };
  });
}

function getBoundaryCells(region) {
  const cells = new Set(region.floorCells.map((cell) => cellKey(cell.x, cell.y)));
  const boundary = [];
  region.floorCells.forEach((cell) => {
    [
      { side: "north", x: cell.x, y: cell.y - 1, normal: { x: 0, y: -1 } },
      { side: "east", x: cell.x + 1, y: cell.y, normal: { x: 1, y: 0 } },
      { side: "south", x: cell.x, y: cell.y + 1, normal: { x: 0, y: 1 } },
      { side: "west", x: cell.x - 1, y: cell.y, normal: { x: -1, y: 0 } },
    ].forEach((neighbor) => {
      if (!cells.has(cellKey(neighbor.x, neighbor.y))) {
        boundary.push({
          regionId: region.id,
          regionShape: region.shape,
          side: neighbor.side,
          cell: { x: cell.x, y: cell.y },
          outsideCell: { x: neighbor.x, y: neighbor.y },
          normal: neighbor.normal,
          circular: getCircularAnchorData(region, cell, neighbor.normal),
        });
      }
    });
  });
  return boundary;
}

function getCircleExtensionCellKeys(region) {
  return new Set((Array.isArray(region.circleExtensionCells) ? region.circleExtensionCells : []).map((cell) => cellKey(cell.x, cell.y)));
}

function getDoorBoundaryCells(region) {
  if (region.shape !== "circle" || !Array.isArray(region.circleExtensionCells) || region.circleExtensionCells.length === 0) return getBoundaryCells(region);
  const extensionCells = getCircleExtensionCellKeys(region);
  const baseFloorCells = region.floorCells.filter((cell) => !extensionCells.has(cellKey(cell.x, cell.y)));
  return getBoundaryCells({ ...region, floorCells: baseFloorCells });
}

function getAnchorCenterOffset(anchor, region) {
  const rect = region.cellRect;
  if (anchor.side === "north" || anchor.side === "south") {
    const sideCenter = rect.x + rect.w / 2;
    const anchorPosition = anchor.cell.x + 0.5;
    const halfSpan = Math.max(1, rect.w / 2);
    return Math.abs(anchorPosition - sideCenter) / halfSpan;
  }
  const sideCenter = rect.y + rect.h / 2;
  const anchorPosition = anchor.cell.y + 0.5;
  const halfSpan = Math.max(1, rect.h / 2);
  return Math.abs(anchorPosition - sideCenter) / halfSpan;
}

function getDoorArchitectureBias(region, profile = {}) {
  const flags = getRegionSemanticFlags(region);
  const role = getPlacementRole(region);
  const shape = region.shape || "rect";
  const roomType = region.shapeOptions?.roomType || region.roomType || inferGeneratedRoomType(region);
  const text = `${region.role || ""} ${(region.tags || []).join(" ")} ${(region.sourceAnchors || []).join(" ")} ${region.name || ""} ${shape} ${roomType}`.toLowerCase();
  let bias = profile.doorCenterBias ?? 2;

  if (["rect", "hall"].includes(shape)) bias += 1.15;
  if (shape === "circle") bias += 0.65;
  if (["archive", "apse", "ritual"].includes(shape)) bias += 1.8;
  if (["archive", "apse"].includes(roomType)) bias += 1.8;
  if (flags.archive || flags.ritual || text.includes("temple") || text.includes("chapel") || text.includes("church") || text.includes("sanctuary")) bias += 2.2;
  if (role === "connector" && shape === "hall") bias += 0.9;
  if (role === "final" && !["cave", "broken", "ruined-rect"].includes(shape)) bias += 0.75;

  if (["cave", "irregular", "shaft"].includes(shape)) bias *= 0.38;
  if (["broken", "ruined-rect", "notched", "l-shape"].includes(shape)) bias *= 0.62;
  if (flags.ruined || flags.hazard) bias *= 0.72;

  return clamp(bias, 0.25, 7.5);
}

function getDirectionalDoorScore(anchor, region, targetRegion) {
  const sourceCenter = {
    x: region.cellRect.x + region.cellRect.w / 2,
    y: region.cellRect.y + region.cellRect.h / 2,
  };
  const targetCenter = {
    x: targetRegion.cellRect.x + targetRegion.cellRect.w / 2,
    y: targetRegion.cellRect.y + targetRegion.cellRect.h / 2,
  };
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const length = Math.hypot(dx, dy) || 1;
  const desired = { x: dx / length, y: dy / length };
  const dot = anchor.normal.x * desired.x + anchor.normal.y * desired.y;
  return (1 - dot) * 3.25;
}

function getAnchorDoorEdgeCenterInCells(anchor) {
  if (!anchor) return null;
  if (anchor.side === "north") return { x: anchor.cell.x + 0.5, y: anchor.cell.y };
  if (anchor.side === "south") return { x: anchor.cell.x + 0.5, y: anchor.cell.y + 1 };
  if (anchor.side === "west") return { x: anchor.cell.x, y: anchor.cell.y + 0.5 };
  return { x: anchor.cell.x + 1, y: anchor.cell.y + 0.5 };
}

function getCirclePerimeterDoorScore(anchor, region, targetRegion) {
  if (region.shape !== "circle" || !anchor?.circular) return 0;
  const circle = anchor.circular;
  const targetCenter = {
    x: targetRegion.cellRect.x + targetRegion.cellRect.w / 2,
    y: targetRegion.cellRect.y + targetRegion.cellRect.h / 2,
  };
  const dx = targetCenter.x - circle.cx;
  const dy = targetCenter.y - circle.cy;
  const length = Math.hypot(dx, dy) || 1;
  const desired = { x: dx / length, y: dy / length };
  const ideal = {
    x: circle.cx + desired.x * circle.r,
    y: circle.cy + desired.y * circle.r,
  };
  const edgeCenter = getAnchorDoorEdgeCenterInCells(anchor);
  if (!edgeCenter) return 0;
  const sideAlignment = Math.max(0, 1 - (anchor.normal.x * desired.x + anchor.normal.y * desired.y));
  const edgeDx = edgeCenter.x - ideal.x;
  const edgeDy = edgeCenter.y - ideal.y;
  return (edgeDx * edgeDx + edgeDy * edgeDy) * 8.5 + sideAlignment * 5.5;
}

function getDoorSegmentOrientationFromSide(side) {
  return side === "north" || side === "south" ? "horizontal" : "vertical";
}

function getCircularWallTangentOrientation(anchor) {
  if (!anchor?.circular) return null;
  const circle = anchor.circular;
  const edgeCenter = getAnchorDoorEdgeCenterInCells(anchor);
  if (!edgeCenter) return null;
  const radialX = edgeCenter.x - circle.cx;
  const radialY = edgeCenter.y - circle.cy;
  const tangentX = -radialY;
  const tangentY = radialX;
  const absX = Math.abs(tangentX);
  const absY = Math.abs(tangentY);
  const dominance = 1.16;
  if (absX >= absY * dominance) return "horizontal";
  if (absY >= absX * dominance) return "vertical";
  return "diagonal";
}

function isDoorOrientationCompatibleWithLocalWall(anchor) {
  if (!anchor?.circular) return true;
  const tangentOrientation = getCircularWallTangentOrientation(anchor);
  if (!tangentOrientation || tangentOrientation === "diagonal") return true;
  return getDoorSegmentOrientationFromSide(anchor.side) === tangentOrientation;
}

function chooseDoorAnchorForRegion(region, targetRegion, rng, forbiddenOutsideCells = null, profile = {}) {
  const rawBoundary = getDoorBoundaryCells(region).filter((anchor) => !forbiddenOutsideCells?.has(cellKey(anchor.outsideCell.x, anchor.outsideCell.y)));
  const compatibleBoundary = rawBoundary.filter(isDoorOrientationCompatibleWithLocalWall);
  const boundary = compatibleBoundary.length > 0 ? compatibleBoundary : rawBoundary;
  if (boundary.length === 0) return null;
  const targetCenter = {
    x: targetRegion.cellRect.x + targetRegion.cellRect.w / 2,
    y: targetRegion.cellRect.y + targetRegion.cellRect.h / 2,
  };
  const centerBias = getDoorArchitectureBias(region, profile);
  const ranked = boundary
    .map((anchor) => {
      const dx = anchor.outsideCell.x - targetCenter.x;
      const dy = anchor.outsideCell.y - targetCenter.y;
      const alignment = Math.abs(dx) + Math.abs(dy);
      const centerOffset = getAnchorCenterOffset(anchor, region);
      const circlePerimeterPenalty = getCirclePerimeterDoorScore(anchor, region, targetRegion);
      const centerPenalty = region.shape === "circle"
        ? centerOffset * centerOffset * centerBias * 0.18
        : centerOffset * centerOffset * centerBias;
      const directionalPenalty = getDirectionalDoorScore(anchor, region, targetRegion);
      return {
        anchor,
        score: alignment + directionalPenalty + centerPenalty + circlePerimeterPenalty + rng() * 0.35,
      };
    })
    .sort((a, b) => a.score - b.score);
  return ranked[0].anchor;
}

function getSharedBoundaryConnections(from, to, gridSize) {
  const toCells = new Set(to.floorCells.map((cell) => cellKey(cell.x, cell.y)));
  return getBoundaryCells(from)
    .filter((anchor) => toCells.has(cellKey(anchor.outsideCell.x, anchor.outsideCell.y)))
    .map((fromAnchor) => {
      const toAnchor = {
        regionId: to.id,
        side: fromAnchor.side === "north" ? "south" : fromAnchor.side === "south" ? "north" : fromAnchor.side === "east" ? "west" : "east",
        cell: fromAnchor.outsideCell,
        outsideCell: fromAnchor.cell,
        normal: { x: -fromAnchor.normal.x, y: -fromAnchor.normal.y },
      };
      const doorAnchor = fromAnchor.circular ? fromAnchor : toAnchor.circular ? toAnchor : fromAnchor;
      const door = {
        ...createDoorFromAnchor(doorAnchor, gridSize, false),
        connectedRegionIds: [from.id, to.id],
      };
      return {
        fromAnchor,
        toAnchor,
        door,
        point: {
          x: (door.x1 + door.x2) / 2,
          y: (door.y1 + door.y2) / 2,
        },
      };
    });
}

function anchorsMatch(a, b) {
  return Boolean(a && b) && a.side === b.side && a.cell.x === b.cell.x && a.cell.y === b.cell.y;
}

function getClosestSharedRoomConnectionToPoint(from, to, point, gridSize) {
  const connections = getSharedBoundaryConnections(from, to, gridSize);
  if (connections.length === 0) return null;
  return connections
    .map((connection) => {
      const dx = connection.point.x - point.x;
      const dy = connection.point.y - point.y;
      return { connection, score: dx * dx + dy * dy };
    })
    .sort((a, b) => a.score - b.score)[0].connection;
}

function getSharedRoomConnection(from, to, gridSize, rng, manualFromAnchor = null, manualToAnchor = null, profile = {}) {
  const connections = getSharedBoundaryConnections(from, to, gridSize);
  if (connections.length === 0) return null;
  const manualMatch = connections.find((connection) => anchorsMatch(connection.fromAnchor, manualFromAnchor) || anchorsMatch(connection.toAnchor, manualToAnchor));
  if (manualMatch) return manualMatch;
  const fromBias = getDoorArchitectureBias(from, profile);
  const toBias = getDoorArchitectureBias(to, profile);
  const ranked = connections
    .map((connection) => {
      const x = (connection.fromAnchor.cell.x + 0.5) * gridSize;
      const y = (connection.fromAnchor.cell.y + 0.5) * gridSize;
      const cx = (from.labelPoint.x + to.labelPoint.x) / 2;
      const cy = (from.labelPoint.y + to.labelPoint.y) / 2;
      const dx = x - cx;
      const dy = y - cy;
      const fromCenterPenalty = Math.pow(getAnchorCenterOffset(connection.fromAnchor, from) * gridSize, 2) * fromBias;
      const toCenterPenalty = Math.pow(getAnchorCenterOffset(connection.toAnchor, to) * gridSize, 2) * toBias;
      return { connection, score: dx * dx + dy * dy + fromCenterPenalty + toCenterPenalty + rng() * 0.2 };
    })
    .sort((a, b) => a.score - b.score);
  return ranked[0].connection;
}

function corridorEndpointKey(corridorId, endpoint) {
  return `${corridorId}:${endpoint}`;
}

function getClosestBoundaryAnchorToPoint(region, point, gridSize) {
  const rawBoundary = getDoorBoundaryCells(region);
  const compatibleBoundary = rawBoundary.filter(isDoorOrientationCompatibleWithLocalWall);
  const boundary = compatibleBoundary.length > 0 ? compatibleBoundary : rawBoundary;
  if (boundary.length === 0) return null;
  return boundary
    .map((anchor) => {
      const handlePoint = getAnchorHandlePoint(anchor, gridSize);
      const dx = handlePoint.x - point.x;
      const dy = handlePoint.y - point.y;
      return { anchor, score: dx * dx + dy * dy };
    })
    .sort((a, b) => a.score - b.score)[0].anchor;
}

function getAnchorHandlePoint(anchor, gridSize) {
  const door = createDoorFromAnchor(anchor, gridSize, false);
  return {
    x: (door.x1 + door.x2) / 2,
    y: (door.y1 + door.y2) / 2,
  };
}

function serializeManualAnchor(anchor) {
  if (!anchor) return null;
  return {
    side: anchor.side,
    cell: { x: anchor.cell.x, y: anchor.cell.y },
    ...(anchor.expandedCircleDoor && anchor.portalRoomCell ? {
      expandedCircleDoor: true,
      portalRoomCell: { x: anchor.portalRoomCell.x, y: anchor.portalRoomCell.y },
      originalCell: anchor.originalCell ? { x: anchor.originalCell.x, y: anchor.originalCell.y } : null,
      originalOutsideCell: anchor.originalOutsideCell ? { x: anchor.originalOutsideCell.x, y: anchor.originalOutsideCell.y } : null,
    } : {}),
  };
}

function findClosestBoundaryAnchorAcrossRegions(regions, point, gridSize, excludeRegionId = null, maxDistance = gridSize * 1.35) {
  let best = null;
  regions.forEach((region) => {
    if (region.id === excludeRegionId) return;
    const rawBoundary = getBoundaryCells(region);
    const compatibleBoundary = rawBoundary.filter(isDoorOrientationCompatibleWithLocalWall);
    const boundary = compatibleBoundary.length > 0 ? compatibleBoundary : rawBoundary;
    boundary.forEach((anchor) => {
      const handlePoint = getAnchorHandlePoint(anchor, gridSize);
      const dx = handlePoint.x - point.x;
      const dy = handlePoint.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > maxDistance) return;
      if (!best || distance < best.distance) best = { region, anchor, point: handlePoint, distance };
    });
  });
  return best;
}

function getEdgeEndpointForRegion(edge, regionId) {
  if (!edge || !regionId) return null;
  if (edge.from === regionId) return "from";
  if (edge.to === regionId) return "to";
  return null;
}

function findGraphEdgeBetween(graph, fromRegionId, toRegionId) {
  return graph.find((edge) =>
    (edge.from === fromRegionId && edge.to === toRegionId) ||
    (edge.from === toRegionId && edge.to === fromRegionId)
  ) || null;
}

function resolveManualDoorAnchor(region, manualAnchor) {
  if (!manualAnchor) return null;
  const boundary = getDoorBoundaryCells(region);
  const requestedCell = manualAnchor.expandedCircleDoor && manualAnchor.originalCell ? manualAnchor.originalCell : manualAnchor.cell;
  const exact = boundary.find((anchor) =>
    anchor.side === manualAnchor.side &&
    anchor.cell.x === requestedCell?.x &&
    anchor.cell.y === requestedCell?.y
  );
  if (exact) return exact;
  if (!requestedCell) return null;
  return boundary
    .map((anchor) => {
      const dx = anchor.cell.x - requestedCell.x;
      const dy = anchor.cell.y - requestedCell.y;
      return { anchor, score: dx * dx + dy * dy };
    })
    .sort((a, b) => a.score - b.score)[0]?.anchor || null;
}

function mapPointToCell(point, gridSize) {
  return {
    x: Math.floor(point.x / gridSize),
    y: Math.floor(point.y / gridSize),
  };
}

function isValidPoint(point) {
  return Boolean(point) && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function normalizeManualWaypoint(point, gridSize, gridW, gridH) {
  if (!isValidPoint(point)) return null;
  const cell = Number.isInteger(point.x) && Number.isInteger(point.y)
    ? point
    : mapPointToCell(point, gridSize);
  return {
    x: clamp(Math.round(cell.x), 1, gridW - 2),
    y: clamp(Math.round(cell.y), 1, gridH - 2),
  };
}

function linePathBetweenCells(start, goal) {
  const path = [{ x: start.x, y: start.y }];
  let x = start.x;
  let y = start.y;
  while (x !== goal.x) {
    x += Math.sign(goal.x - x);
    path.push({ x, y });
  }
  while (y !== goal.y) {
    y += Math.sign(goal.y - y);
    path.push({ x, y });
  }
  return path;
}

function findPath(start, goal, options) {
  const { gridW, gridH, blocked, softBlocked, existingCorridors, adjacentToExistingCorridors, routingProfile = {} } = options;
  const startKey = cellKey(start.x, start.y);
  const goalKey = cellKey(goal.x, goal.y);
  const open = [{ x: start.x, y: start.y, key: startKey, g: 0, f: 0, dir: null }];
  const cameFrom = new Map();
  const bestCost = new Map([[startKey, 0]]);
  const closed = new Set();
  const directions = [
    { x: 1, y: 0, name: "E" },
    { x: -1, y: 0, name: "W" },
    { x: 0, y: 1, name: "S" },
    { x: 0, y: -1, name: "N" },
  ];
  const heuristic = (cell) => Math.abs(cell.x - goal.x) + Math.abs(cell.y - goal.y);

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (closed.has(current.key)) continue;
    closed.add(current.key);

    if (current.key === goalKey) {
      const path = [];
      let key = current.key;
      while (key) {
        path.push(parseCellKey(key));
        key = cameFrom.get(key);
      }
      return path.reverse();
    }

    directions.forEach((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const nextKey = cellKey(next.x, next.y);
      if (next.x < 1 || next.y < 1 || next.x >= gridW - 1 || next.y >= gridH - 1) return;
      if (closed.has(nextKey)) return;
      if (blocked.has(nextKey) && nextKey !== goalKey && nextKey !== startKey) return;
      const turnCost = current.dir && current.dir !== direction.name ? (routingProfile.turnCost ?? 2.5) : 0;
      const wallPenalty = softBlocked.has(nextKey) ? (routingProfile.wallPenalty ?? 1.5) : 0;
      const corridorOverlapPenalty = existingCorridors.has(nextKey) && nextKey !== goalKey && nextKey !== startKey ? (routingProfile.corridorOverlapPenalty ?? 0) : 0;
      const parallelCorridorPenalty = adjacentToExistingCorridors.has(nextKey) && !existingCorridors.has(nextKey) ? (routingProfile.adjacentCorridorPenalty ?? 0.25) : 0;
      const g = current.g + 1 + turnCost + wallPenalty + parallelCorridorPenalty + corridorOverlapPenalty;
      if (!bestCost.has(nextKey) || g < bestCost.get(nextKey)) {
        bestCost.set(nextKey, g);
        cameFrom.set(nextKey, current.key);
        open.push({
          x: next.x,
          y: next.y,
          key: nextKey,
          g,
          f: g + heuristic(next),
          dir: direction.name,
        });
      }
    });
  }

  return [];
}

function getAdjacentCells(cells) {
  const adjacent = new Set();
  cells.forEach((key) => {
    const cell = parseCellKey(key);
    adjacent.add(cellKey(cell.x + 1, cell.y));
    adjacent.add(cellKey(cell.x - 1, cell.y));
    adjacent.add(cellKey(cell.x, cell.y + 1));
    adjacent.add(cellKey(cell.x, cell.y - 1));
  });
  return adjacent;
}

function getCellNeighbors(cell) {
  return [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 },
  ];
}

function isPartOfSolidCorridorBlock(key, cells) {
  const cell = parseCellKey(key);
  const origins = [
    { x: cell.x, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y - 1 },
    { x: cell.x - 1, y: cell.y - 1 },
  ];
  return origins.some((origin) =>
    cells.has(cellKey(origin.x, origin.y)) &&
    cells.has(cellKey(origin.x + 1, origin.y)) &&
    cells.has(cellKey(origin.x, origin.y + 1)) &&
    cells.has(cellKey(origin.x + 1, origin.y + 1))
  );
}

function findPathInCellSet(cells, start, goal) {
  const startKey = cellKey(start.x, start.y);
  const goalKey = cellKey(goal.x, goal.y);
  if (!cells.has(startKey) || !cells.has(goalKey)) return [];
  const queue = [startKey];
  const visited = new Set([startKey]);
  const cameFrom = new Map();

  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (currentKey === goalKey) break;
    const current = parseCellKey(currentKey);
    getCellNeighbors(current).forEach((neighbor) => {
      const neighborKey = cellKey(neighbor.x, neighbor.y);
      if (!cells.has(neighborKey) || visited.has(neighborKey)) return;
      visited.add(neighborKey);
      cameFrom.set(neighborKey, currentKey);
      queue.push(neighborKey);
    });
  }

  if (!visited.has(goalKey)) return [];
  const path = [];
  let key = goalKey;
  while (key) {
    path.push(parseCellKey(key));
    key = cameFrom.get(key);
  }
  return path.reverse();
}

function areCorridorLinksPreserved(cells, corridors) {
  return corridors.every((corridor) => {
    const start = corridor.fromAnchor?.outsideCell;
    const goal = corridor.toAnchor?.outsideCell;
    if (!start || !goal) return true;
    return findPathInCellSet(cells, start, goal).length >= 2;
  });
}

function normalizeCorridorCells(cells, corridors) {
  const protectedCells = new Set();
  corridors.forEach((corridor) => {
    [corridor.fromAnchor?.outsideCell, corridor.toAnchor?.outsideCell, ...(corridor.manualWaypoints || [])]
      .filter(Boolean)
      .forEach((cell) => protectedCells.add(cellKey(cell.x, cell.y)));
  });

  const normalized = new Set(cells);
  let changed = true;
  let passes = 0;

  while (changed && passes < 120) {
    changed = false;
    passes += 1;
    const candidates = Array.from(normalized)
      .filter((key) => !protectedCells.has(key) && isPartOfSolidCorridorBlock(key, normalized))
      .sort((a, b) => {
        const degreeA = getCellNeighbors(parseCellKey(a)).filter((neighbor) => normalized.has(cellKey(neighbor.x, neighbor.y))).length;
        const degreeB = getCellNeighbors(parseCellKey(b)).filter((neighbor) => normalized.has(cellKey(neighbor.x, neighbor.y))).length;
        return degreeB - degreeA;
      });

    for (const candidate of candidates) {
      const test = new Set(normalized);
      test.delete(candidate);
      if (!areCorridorLinksPreserved(test, corridors)) continue;
      normalized.delete(candidate);
      changed = true;
      break;
    }
  }

  return normalized;
}

function findPathThroughCellSet(cells, points) {
  if (points.length < 2) return [];
  const fullPath = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const segment = findPathInCellSet(cells, points[index], points[index + 1]);
    if (segment.length < 2) return [];
    fullPath.push(...(index === 0 ? segment : segment.slice(1)));
  }
  return fullPath;
}

function rebuildCorridorOnNetwork(corridor, normalizedCells, gridSize) {
  const start = corridor.fromAnchor?.outsideCell;
  const goal = corridor.toAnchor?.outsideCell;
  const routePoints = [start, ...(corridor.manualWaypoints || []), goal].filter(Boolean);
  const path = findPathThroughCellSet(normalizedCells, routePoints);
  if (path.length < 2) return corridor;
  const centerline = path.map((cell) => ({
    x: (cell.x + 0.5) * gridSize,
    y: (cell.y + 0.5) * gridSize,
  }));
  return {
    ...corridor,
    floorCells: path.map((cell) => ({ x: cell.x, y: cell.y })),
    pathCells: path.map((cell) => ({ x: cell.x, y: cell.y })),
    centerline,
    waypoints: dedupePoints(extractWaypoints(centerline)),
  };
}

function normalizeCorridorNetwork(corridors, gridSize) {
  const organicCorridors = corridors.filter(isOrganicCorridor);
  const structuredCorridors = corridors.filter((corridor) => !isOrganicCorridor(corridor));
  if (structuredCorridors.length === 0) return corridors;

  const cells = new Set();
  structuredCorridors.forEach((corridor) => corridor.floorCells.forEach((cell) => cells.add(cellKey(cell.x, cell.y))));
  const normalizedCells = normalizeCorridorCells(cells, structuredCorridors);
  const rebuiltStructured = new Map(structuredCorridors.map((corridor) => {
    const rebuilt = rebuildCorridorOnNetwork(corridor, normalizedCells, gridSize);
    return [corridor.id, { ...rebuilt, pathCells: rebuilt.floorCells.map((cell) => ({ x: cell.x, y: cell.y })) }];
  }));

  return corridors.map((corridor) => rebuiltStructured.get(corridor.id) || organicCorridors.find((item) => item.id === corridor.id) || corridor);
}

function routePathThroughCells(points, options) {
  const validPoints = points.filter(isValidPoint);
  if (validPoints.length < 2) return [];
  const fullPath = [];
  for (let index = 0; index < validPoints.length - 1; index += 1) {
    const segment = findPath(validPoints[index], validPoints[index + 1], options);
    if (segment.length < 2) return [];
    fullPath.push(...(index === 0 ? segment : segment.slice(1)));
  }
  return fullPath;
}

function routeDirectFallback(start, goal, options) {
  const path = findPath(start, goal, options);
  if (path.length >= 2) return path;
  return linePathBetweenCells(start, goal).filter((cell) =>
    cell.x > 0 &&
    cell.y > 0 &&
    cell.x < options.gridW - 1 &&
    cell.y < options.gridH - 1 &&
    !options.blocked.has(cellKey(cell.x, cell.y))
  );
}

function isCaveLikeRegion(region, config = null) {
  if (!region) return false;
  if (region.shape === "cave" || region.surfaceKind === "cave" || region.placementProfile === "cave") return true;
  if (!config) return false;
  return getRegionSurfaceKind(region, { config }) === "cave";
}

function shouldUseOrganicTunnel(config, from, to) {
  const contextKey = getContextKey(config?.context || config?.biome);
  return contextKey === "cave" || isCaveLikeRegion(from, config) || isCaveLikeRegion(to, config);
}

function isOrganicCorridor(corridor) {
  return corridor?.surfaceKind === "cave" || corridor?.corridorStyle === "natural-tunnel";
}

function getCorridorTopologyCells(corridor) {
  return Array.isArray(corridor?.pathCells) && corridor.pathCells.length > 0
    ? corridor.pathCells
    : Array.isArray(corridor?.floorCells) ? corridor.floorCells : [];
}

function getTunnelExpansionDirections(path, index) {
  const current = path[index];
  const previous = path[index - 1] || null;
  const next = path[index + 1] || null;
  const vectors = [previous ? { x: current.x - previous.x, y: current.y - previous.y } : null, next ? { x: next.x - current.x, y: next.y - current.y } : null].filter(Boolean);
  const horizontal = vectors.some((vector) => vector.x !== 0);
  const vertical = vectors.some((vector) => vector.y !== 0);
  if (horizontal && !vertical) return [{ x: 0, y: -1 }, { x: 0, y: 1 }];
  if (vertical && !horizontal) return [{ x: -1, y: 0 }, { x: 1, y: 0 }];
  return [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
}

function buildOrganicTunnelFloorCells(path, config, rng, blockedRoomCells = new Set(), corridorId = "organic-corridor") {
  const contextKey = getContextKey(config.context || config.biome);
  const caveContext = contextKey === "cave";
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const cells = new Set();
  const pathKeys = new Set(path.map((cell) => cellKey(cell.x, cell.y)));
  const canAdd = (cell, protectedCell = false) => {
    if (!cell || cell.x < 1 || cell.y < 1 || cell.x >= gridW - 1 || cell.y >= gridH - 1) return false;
    const key = cellKey(cell.x, cell.y);
    if (!protectedCell && blockedRoomCells.has(key)) return false;
    return true;
  };
  const add = (cell, protectedCell = false) => {
    if (!canAdd(cell, protectedCell)) return;
    cells.add(cellKey(cell.x, cell.y));
  };

  path.forEach((cell, index) => {
    add(cell, true);
    const endpoint = index === 0 || index === path.length - 1;
    const turn = index > 0 && index < path.length - 1 && (
      Math.sign(path[index].x - path[index - 1].x) !== Math.sign(path[index + 1].x - path[index].x) ||
      Math.sign(path[index].y - path[index - 1].y) !== Math.sign(path[index + 1].y - path[index].y)
    );
    const localSeed = hashStringToSeed(config.seed, corridorId, cell.x, cell.y, index, "organic-tunnel-width");
    const directions = getTunnelExpansionDirections(path, index);
    const widthChance = caveContext ? (endpoint ? 48 : turn ? 96 : 82) : endpoint ? 22 : turn ? 86 : 54;
    directions.forEach((direction, directionIndex) => {
      const chance = (hashStringToSeed(localSeed, directionIndex, "side") % 100);
      if (chance < widthChance) add({ x: cell.x + direction.x, y: cell.y + direction.y });
      if (caveContext && !endpoint && chance < 24) add({ x: cell.x + direction.x * 2, y: cell.y + direction.y * 2 });
    });
    const diagonalChance = caveContext ? 42 : 18;
    if (!endpoint && (localSeed % 100) < diagonalChance) {
      const diagonal = pickOne(rng, [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }]);
      const adjacentA = cellKey(cell.x + diagonal.x, cell.y);
      const adjacentB = cellKey(cell.x, cell.y + diagonal.y);
      if (cells.has(adjacentA) || cells.has(adjacentB) || pathKeys.has(adjacentA) || pathKeys.has(adjacentB)) {
        add({ x: cell.x + diagonal.x, y: cell.y + diagonal.y });
      }
    }
  });

  if (caveContext) {
    const protectedCells = new Set(pathKeys);
    let smoothed = new Set(cells);
    for (let pass = 0; pass < 2; pass += 1) {
      const candidates = new Set(smoothed);
      smoothed.forEach((key) => {
        const cell = parseCellKey(key);
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const candidate = { x: cell.x + dx, y: cell.y + dy };
            if (canAdd(candidate, false)) candidates.add(cellKey(candidate.x, candidate.y));
          }
        }
      });
      const next = new Set(smoothed);
      candidates.forEach((key) => {
        const cell = parseCellKey(key);
        let neighbors8 = 0;
        let neighbors4 = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const neighborKey = cellKey(cell.x + dx, cell.y + dy);
            if (!smoothed.has(neighborKey)) continue;
            neighbors8 += 1;
            if (Math.abs(dx) + Math.abs(dy) === 1) neighbors4 += 1;
          }
        }
        if (!smoothed.has(key) && (neighbors8 >= 5 || neighbors4 >= 3)) next.add(key);
        if (smoothed.has(key) && !protectedCells.has(key) && neighbors4 <= 1 && neighbors8 <= 2) next.delete(key);
      });
      smoothed = next;
    }
    path.forEach((cell) => smoothed.add(cellKey(cell.x, cell.y)));
    return Array.from(smoothed).map(parseCellKey);
  }

  const cleaned = getLargestConnectedCellSet(cells);
  path.forEach((cell) => cleaned.add(cellKey(cell.x, cell.y)));
  return Array.from(cleaned).map(parseCellKey);
}

const HEX_CAVE_DIRECTIONS = [
  { q: 1, r: 0, edge: [5, 0] },
  { q: 1, r: -1, edge: [0, 1] },
  { q: 0, r: -1, edge: [1, 2] },
  { q: -1, r: 0, edge: [2, 3] },
  { q: -1, r: 1, edge: [3, 4] },
  { q: 0, r: 1, edge: [4, 5] },
];

function hexKey(q, r) {
  return `${q},${r}`;
}

function parseHexKey(key) {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

function getCaveHexSize(config) {
  return config.gridSize * 0.78;
}

function getCaveHexOrigin(config) {
  return { x: config.gridSize * 0.35, y: config.gridSize * 0.25 };
}

function axialHexToPixel(hex, size, origin) {
  return {
    x: origin.x + size * Math.sqrt(3) * (hex.q + hex.r / 2),
    y: origin.y + size * 1.5 * hex.r,
  };
}

function roundAxialHex(q, r) {
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

function pixelToAxialHex(point, size, origin) {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  return roundAxialHex((Math.sqrt(3) / 3 * x - y / 3) / size, (2 / 3 * y) / size);
}

function getHexDistance(a, b) {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function addHexDisc(hexes, center, radius) {
  const r = Math.max(0, Math.round(radius));
  for (let dq = -r; dq <= r; dq += 1) {
    for (let dr = Math.max(-r, -dq - r); dr <= Math.min(r, -dq + r); dr += 1) {
      hexes.set(hexKey(center.q + dq, center.r + dr), { q: center.q + dq, r: center.r + dr });
    }
  }
}

function getHexCornerPoints(hex, size, origin) {
  const center = axialHexToPixel(hex, size, origin);
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (30 + index * 60);
    return {
      x: center.x + Math.cos(angle) * size,
      y: center.y + Math.sin(angle) * size,
    };
  });
}

function getHexNeighbors(hex) {
  return HEX_CAVE_DIRECTIONS.map((direction) => ({ q: hex.q + direction.q, r: hex.r + direction.r }));
}

function getLargestConnectedHexMap(hexMap) {
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

function addNoisyHexBlob(target, center, radius, config, seedParts = [], options = {}) {
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

function subtractNoisyHexBite(target, center, radius, config, seedParts = []) {
  Array.from(target.values()).forEach((cell) => {
    const distance = getHexDistance(center, cell);
    const noise = ((hashStringToSeed(config.seed, ...seedParts, cell.q, cell.r, "bite-noise") % 1000) / 1000 - 0.5) * 0.85;
    if (distance <= radius + noise) target.delete(hexKey(cell.q, cell.r));
  });
}

function createHexCaveRoomCells(hexes, region, centerHex, config, rng) {
  const singleCaveRegion = normalizeRoomCount(config.roomCount, config.regions?.length || 1) <= 1;
  const maxRectSide = Math.max(region.cellRect.w, region.cellRect.h);
  const minRectSide = Math.min(region.cellRect.w, region.cellRect.h);
  const baseRadius = singleCaveRegion
    ? clamp(Math.round(maxRectSide * 0.42 + minRectSide * 0.16), 7, 14)
    : clamp(Math.round(maxRectSide * 0.38), 2, 6);
  const local = new Map();

  addNoisyHexBlob(local, centerHex, baseRadius, config, [region.id, "main"], {
    noiseScale: singleCaveRegion ? 1.85 : 1.2,
    thresholdBias: singleCaveRegion ? 0.2 : 0,
  });

  const lobeCount = singleCaveRegion ? randomInt(rng, 9, 15) : randomInt(rng, 3, 6);
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
    const lobe = {
      q: centerHex.q + direction.q * distance + sideDirection.q * sideShift,
      r: centerHex.r + direction.r * distance + sideDirection.r * sideShift,
    };
    const lobeRadius = singleCaveRegion
      ? randomInt(rng, Math.max(3, Math.round(baseRadius * 0.28)), Math.max(4, Math.round(baseRadius * 0.58)))
      : randomInt(rng, 1, Math.max(2, Math.round(baseRadius * 0.55)));
    addNoisyHexBlob(local, lobe, lobeRadius, config, [region.id, index, "lobe"], {
      noiseScale: singleCaveRegion ? 1.65 : 1.05,
      thresholdBias: singleCaveRegion ? 0.1 : 0,
    });
  }

  if (singleCaveRegion) {
    const spurCount = randomInt(rng, 3, 6);
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

  const biteCount = singleCaveRegion ? randomInt(rng, 7, 12) : randomInt(rng, 1, 3);
  for (let index = 0; index < biteCount; index += 1) {
    const direction = HEX_CAVE_DIRECTIONS[hashStringToSeed(config.seed, region.id, index, "hex-cave-bite-dir") % HEX_CAVE_DIRECTIONS.length];
    const distance = singleCaveRegion ? randomInt(rng, Math.max(4, baseRadius - 1), baseRadius + 5) : randomInt(rng, Math.max(2, baseRadius - 1), baseRadius + 2);
    const bite = {
      q: centerHex.q + direction.q * distance,
      r: centerHex.r + direction.r * distance,
    };
    const radius = singleCaveRegion ? randomInt(rng, 2, 5) : randomInt(rng, 1, 2);
    subtractNoisyHexBite(local, bite, radius, config, [region.id, index, "bite"]);
  }

  const connected = getLargestConnectedHexMap(local);
  connected.forEach((cell, key) => hexes.set(key, cell));
}

function createHexCaveTunnelCells(hexes, fromRegion, toRegion, config, rng, edgeId) {
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
    const point = {
      x: start.x + dx * t + nx * (bend * arch + jitter * arch),
      y: start.y + dy * t + ny * (bend * arch + jitter * arch),
    };
    const hex = pixelToAxialHex(point, size, origin);
    const local = hashStringToSeed(config.seed, edgeId, index, "hex-cave-tunnel-width") % 100;
    const radius = index < 2 || index > sampleCount - 2 ? 2 : local > 78 ? 2 : 1;
    addHexDisc(hexes, hex, radius);
  }
}

function smoothHexCaveCells(hexes, passes = 2) {
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

function createHexCaveCells(generatedMap) {
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

  const smoothed = smoothHexCaveCells(hexes, singleCaveRegion ? 1 : 2);
  const connected = getLargestConnectedHexMap(smoothed);
  return Array.from(connected.size > 0 ? connected.values() : smoothed.values());
}

function roundGeometryPoint(point) {
  return {
    x: Math.round(point.x * 100) / 100,
    y: Math.round(point.y * 100) / 100,
  };
}

function createHexCaveBoundarySegments(hexCells, config) {
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

function createHexCavePathFromSegments(segments, config, layer = "floor") {
  const loops = buildBoundaryLoops(segments)
    .filter((loop) => loop.length > 3)
    .sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  const seed = hashStringToSeed(config.seed, layer, "hex-cave-contour");
  return loops
    .slice(0, 4)
    .map((loop, loopIndex) => {
      const smoothed = chaikinClosed(loop, layer === "wall" ? 2 : 3);
      const jittered = jitterCaveContourPoints(smoothed, `${seed}:${loopIndex}`, config.gridSize * (layer === "floor" ? 0.22 : 0.16));
      const softened = chaikinClosed(jittered, 1);
      return catmullRomClosedPath(softened);
    })
    .filter(Boolean)
    .join(" ");
}

function getApproximateSquareCellsForHexCave(hexCells, config) {
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

function createHexCaveSurface(generatedMap) {
  const hexCells = createHexCaveCells(generatedMap);
  const boundarySegments = createHexCaveBoundarySegments(hexCells, generatedMap.config);
  const visualFloorPath = createHexCavePathFromSegments(boundarySegments, generatedMap.config, "floor");
  const wallPath = createHexCavePathFromSegments(boundarySegments, generatedMap.config, "wall");
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
    boundarySegments,
  };
}

function createOrganicMapBoundaryPath(segments, config, layer = "floor") {
  const loops = buildBoundaryLoops(segments)
    .filter((loop) => loop.length > 3)
    .sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  const roughConfig = {
    ...config,
    seed: hashStringToSeed(config.seed, layer, "organic-map-boundary"),
  };
  return loops
    .map((loop, loopIndex) => {
      const rough = roughenBoundaryLoop(loop, roughConfig, loopIndex);
      if (rough.length <= 2) return "";
      const rounded = chaikinClosed(rough, layer === "floor" ? 2 : 1);
      const softened = chaikinClosed(rounded, 1);
      return catmullRomClosedPath(softened);
    })
    .filter(Boolean)
    .join(" ");
}

function countCellsAround(set, cell, diagonal = true) {
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

function createNaturalCaveVisualCells(floorCells, config) {
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


function addBoundaryEdge(edges, a, b) {
  edges.push({ a, b, used: false });
}

function traceBoundaryLoops(edges) {
  const starts = new Map();
  edges.forEach((edge, index) => {
    const key = pointKey(edge.a);
    if (!starts.has(key)) starts.set(key, []);
    starts.get(key).push(index);
  });

  const loops = [];
  edges.forEach((edge, startIndex) => {
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

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function simplifyCollinearPoints(points) {
  if (!points || points.length <= 4) return points || [];
  return points.filter((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const sameX = previous.x === point.x && point.x === next.x;
    const sameY = previous.y === point.y && point.y === next.y;
    return !sameX && !sameY;
  });
}

function chaikinClosed(points, iterations = 2) {
  let current = [...points];
  for (let pass = 0; pass < iterations; pass += 1) {
    const next = [];
    current.forEach((point, index) => {
      const following = current[(index + 1) % current.length];
      next.push({
        x: point.x * 0.75 + following.x * 0.25,
        y: point.y * 0.75 + following.y * 0.25,
      });
      next.push({
        x: point.x * 0.25 + following.x * 0.75,
        y: point.y * 0.25 + following.y * 0.75,
      });
    });
    current = next;
  }
  return current;
}

function jitterCaveContourPoints(points, seed, amount) {
  if (!points || points.length === 0) return [];
  const center = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  center.x /= points.length;
  center.y /= points.length;

  return points.map((point, index) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    const outward = { x: dx / length, y: dy / length };
    const noiseA = (hashStringToSeed(seed, index, "cave-contour-a") % 1000) / 1000;
    const noiseB = (hashStringToSeed(seed, index, "cave-contour-b") % 1000) / 1000;
    const radial = (noiseA - 0.5) * amount;
    const tangent = (noiseB - 0.5) * amount * 0.45;
    return {
      x: point.x + outward.x * radial + -outward.y * tangent,
      y: point.y + outward.y * radial + outward.x * tangent,
    };
  });
}

function catmullRomClosedPath(points) {
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

function buildOrganicCaveContourPath(floorCells, gridSize, seed) {
  const cells = new Set((floorCells || []).map((cell) => cellKey(cell.x, cell.y)));
  if (cells.size === 0) return "";

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

  if (loops.length === 0) return "";

  return loops.slice(0, 3).map((loop, loopIndex) => {
    const pixelLoop = loop.map((point) => ({ x: point.x * gridSize, y: point.y * gridSize }));
    const rounded = chaikinClosed(pixelLoop, loopIndex === 0 ? 3 : 2);
    const jittered = jitterCaveContourPoints(rounded, `${seed}:loop:${loopIndex}`, gridSize * (loopIndex === 0 ? 0.34 : 0.16));
    const softened = chaikinClosed(jittered, 1);
    return catmullRomClosedPath(softened);
  }).filter(Boolean).join(" ");
}

function isSingleRegionCaveMap(generatedMap) {
  const regions = Array.isArray(generatedMap?.regions) ? generatedMap.regions : [];
  return isPureCaveMap(generatedMap) && regions.length <= 1;
}

function createSeededRandom(seed) {
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

function valueNoise2D(x, y, scaleOrRandom = 1, maybeRandom) {
  let scale = 1;
  let random = maybeRandom;

  if (typeof scaleOrRandom === "function") {
    random = scaleOrRandom;
  } else if (Number.isFinite(scaleOrRandom) && scaleOrRandom !== 0) {
    scale = scaleOrRandom;
  }

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

function getCellBounds(cells) {
  if (!Array.isArray(cells) || cells.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
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
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

function createSingleRegionWildCaveCells(floorCells, config) {
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
    const radialNoise =
      Math.sin(angle * 3 + baseSeed * 0.00011) * indentationStrength +
      Math.sin(angle * 5.7 + baseSeed * 0.00017) * 0.18 +
      Math.sin(angle * 9.3 + baseSeed * 0.00023) * spikeStrength;
    const localNoise = valueNoise2D(cell.x * 0.43, cell.y * 0.43, baseSeed) * 0.24;
    const edgeNoise = valueNoise2D(cell.x * 0.91, cell.y * 0.91, baseSeed + 971) * 0.18;
    const threshold = 1.02 + radialNoise + localNoise + edgeNoise;
    const randomPocket = createSeededRandom(baseSeed, cell.x, cell.y, "single-cave-pocket")();
    if (radius <= threshold || (radius <= 1.22 && randomPocket > 0.78)) {
      keep.add(cellKey(cell.x, cell.y));
    }
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
        const x = cell.x + dx * step;
        const y = cell.y + dy * step;
        const key = cellKey(x, y);
        if (baseSet.has(key)) keep.add(key);
      }
    }
  });

  const cells = [...keep].map(parseCellKey);
  const naturalized = createNaturalCaveVisualCells(cells, { ...config, gridSize });
  return naturalized.length > 0 ? naturalized : cells;
}

function createCellBasedCaveSurface(generatedMap) {
  const { config, dungeonMask } = generatedMap;
  const floorCells = dungeonMask.floorCells || [];
  const visualFloorCells = isSingleRegionCaveMap(generatedMap)
    ? createSingleRegionWildCaveCells(floorCells, config)
    : createNaturalCaveVisualCells(floorCells, config);
  const renderCells = visualFloorCells.length > 0 ? visualFloorCells : floorCells;
  const boundarySegments = computeBoundarySegments(renderCells, config.gridSize);
  const organicContourPath = buildOrganicCaveContourPath(renderCells, config.gridSize, hashStringToSeed(config.seed, "cell-cave-unified-contour"));
  const visualFloorPath = organicContourPath || createOrganicMapBoundaryPath(boundarySegments, config, "floor") || buildFloorPath(renderCells, config.gridSize);
  const wallPath = createOrganicMapBoundaryPath(boundarySegments, config, "wall") || visualFloorPath;
  const sketchPath = createOrganicMapBoundaryPath(boundarySegments, config, "sketch") || wallPath;
  return {
    kind: "organic-cave-map",
    geometryKind: "organic-cave-map",
    surfaceKind: "cave",
    floorCells,
    visualFloorCells,
    visualFloorPath,
    clipPath: visualFloorPath,
    wallPath,
    sketchPath,
    boundarySegments,
  };
}

function isPureCaveMap(generatedMap) {
  return getContextKey(generatedMap?.config?.context || generatedMap?.config?.biome) === "cave";
}

function routeCorridors(config, regions, graph) {
  const routingProfile = getPlacementProfile(config);
  const gridW = Math.floor(config.mapWidth / config.gridSize);
  const gridH = Math.floor(config.mapHeight / config.gridSize);
  const regionById = new Map(regions.map((region) => [region.id, region]));
  const allRoomCells = getRoomCellSet(regions);
  const dynamicRoomCells = new Set(allRoomCells);
  const existingCorridors = new Set();

  const routedCorridors = graph.flatMap((edge) => {
    const from = regionById.get(edge.from);
    const to = regionById.get(edge.to);
    if (!from || !to) return [];
    const edgeRng = createSeededRng(hashStringToSeed(config.seed, edge.id, "corridor"));
    const manualDoorAnchors = config.manualDoorAnchors || {};
    const manualFromAnchor = resolveManualDoorAnchor(from, manualDoorAnchors[corridorEndpointKey(edge.id, "from")]);
    const manualToAnchor = resolveManualDoorAnchor(to, manualDoorAnchors[corridorEndpointKey(edge.id, "to")]);
    const sharedConnection = getSharedRoomConnection(from, to, config.gridSize, edgeRng, manualFromAnchor, manualToAnchor, routingProfile);
    if (sharedConnection) {
      return [{
        ...edge,
        isRoomLink: true,
        fromAnchor: sharedConnection.fromAnchor,
        toAnchor: sharedConnection.toAnchor,
        floorCells: [],
        centerline: [],
        manualWaypoints: [],
        waypoints: [],
        doors: [decorateDoorSegment(sharedConnection.door, config, edge, "shared")],
      }];
    }
    const forbiddenOutsideCells = new Set(dynamicRoomCells);
    const rawFromAnchor = manualFromAnchor || chooseDoorAnchorForRegion(from, to, edgeRng, forbiddenOutsideCells, routingProfile);
    const rawToAnchor = manualToAnchor || chooseDoorAnchorForRegion(to, from, edgeRng, forbiddenOutsideCells, routingProfile);
    if (!rawFromAnchor || !rawToAnchor) return [];
    const fromAnchor = createCircleDoorRoomExtensionAnchor(from, rawFromAnchor, gridW, gridH, dynamicRoomCells);
    const toAnchor = createCircleDoorRoomExtensionAnchor(to, rawToAnchor, gridW, gridH, dynamicRoomCells);
    addCircleDoorRoomExtensionCellToSet(fromAnchor, dynamicRoomCells);
    addCircleDoorRoomExtensionCellToSet(toAnchor, dynamicRoomCells);
    const blocked = new Set(dynamicRoomCells);
    const allowedApproachCells = [...getAnchorApproachCells(fromAnchor), ...getAnchorApproachCells(toAnchor)];
    allowedApproachCells.forEach((cell) => blocked.delete(cellKey(cell.x, cell.y)));
    existingCorridors.forEach((key) => blocked.delete(key));
    const softBlocked = new Set();

    const adjacentToExistingCorridors = getAdjacentCells(existingCorridors);
    allowedApproachCells.forEach((cell) => adjacentToExistingCorridors.delete(cellKey(cell.x, cell.y)));
    const manualWaypoints = Array.isArray(edge.manualWaypoints)
      ? edge.manualWaypoints
        .map((point) => normalizeManualWaypoint(point, config.gridSize, gridW, gridH))
        .filter((cell) => cell && !dynamicRoomCells.has(cellKey(cell.x, cell.y)))
      : [];
    manualWaypoints.forEach((cell) => blocked.delete(cellKey(cell.x, cell.y)));
    const routingOptions = { gridW, gridH, blocked, softBlocked, existingCorridors, adjacentToExistingCorridors, routingProfile };
    const routePoints = [fromAnchor.outsideCell, ...manualWaypoints, toAnchor.outsideCell];
    let path = routePathThroughCells(routePoints, routingOptions);
    if (path.length < 2 && manualWaypoints.length > 0) {
      path = routePathThroughCells([fromAnchor.outsideCell, toAnchor.outsideCell], routingOptions);
    }
    if (path.length < 2) {
      path = routeDirectFallback(fromAnchor.outsideCell, toAnchor.outsideCell, routingOptions);
    }
    if (path.length < 2) return [];
    const organicTunnel = shouldUseOrganicTunnel(config, from, to);
    const pathCells = path.map((cell) => ({ x: cell.x, y: cell.y }));
    const floorCells = organicTunnel
      ? buildOrganicTunnelFloorCells(pathCells, config, edgeRng, dynamicRoomCells, edge.id)
      : pathCells;
    floorCells.forEach((cell) => existingCorridors.add(cellKey(cell.x, cell.y)));
    const centerline = pathCells.map((cell) => ({
      x: (cell.x + 0.5) * config.gridSize,
      y: (cell.y + 0.5) * config.gridSize,
    }));

    return [{
      ...edge,
      surfaceKind: organicTunnel ? "cave" : "dungeon",
      corridorStyle: organicTunnel ? "natural-tunnel" : "structured-corridor",
      fromAnchor,
      toAnchor,
      floorCells,
      pathCells,
      centerline,
      manualWaypoints,
      waypoints: dedupePoints(extractWaypoints(centerline)),
      doors: dedupeDoorSegments([
        decorateDoorSegment(createDoorFromAnchor(fromAnchor, config.gridSize, edge.secret), config, edge, "from"),
        decorateDoorSegment(createDoorFromAnchor(toAnchor, config.gridSize, edge.secret), config, edge, "to"),
      ]),
    }];
  });

  return normalizeCorridorNetwork(routedCorridors, config.gridSize);
}

function extractWaypoints(centerline) {
  if (centerline.length < 3) return [];
  const waypoints = [];
  for (let i = 1; i < centerline.length - 1; i += 1) {
    const prev = centerline[i - 1];
    const current = centerline[i];
    const next = centerline[i + 1];
    const dx1 = Math.sign(current.x - prev.x);
    const dy1 = Math.sign(current.y - prev.y);
    const dx2 = Math.sign(next.x - current.x);
    const dy2 = Math.sign(next.y - current.y);
    if (dx1 !== dx2 || dy1 !== dy2) waypoints.push({ x: current.x, y: current.y });
  }
  return waypoints;
}

function getSnappedCirclePortalCellFromAnchor(anchor) {
  return anchor?.cell || null;
}

function createDoorFromAnchor(anchor, gridSize, secret = false) {
  const snappedCircleCell = getSnappedCirclePortalCellFromAnchor(anchor);
  const cell = snappedCircleCell || anchor.cell;
  const x = cell.x * gridSize;
  const y = cell.y * gridSize;
  const midX = x + gridSize / 2;
  const midY = y + gridSize / 2;
  const half = gridSize * 0.34;
  const anchorMeta = {
    side: anchor.side,
    secret,
    regionId: anchor.regionId,
    regionShape: anchor.regionShape,
    cell: anchor.cell ? { x: anchor.cell.x, y: anchor.cell.y } : null,
    outsideCell: anchor.outsideCell ? { x: anchor.outsideCell.x, y: anchor.outsideCell.y } : null,
    normal: anchor.normal ? { x: anchor.normal.x, y: anchor.normal.y } : null,
  };
  if (anchor.side === "north") return { x1: midX - half, y1: y, x2: midX + half, y2: y, ...anchorMeta };
  if (anchor.side === "south") return { x1: midX - half, y1: y + gridSize, x2: midX + half, y2: y + gridSize, ...anchorMeta };
  if (anchor.side === "west") return { x1: x, y1: midY - half, x2: x, y2: midY + half, ...anchorMeta };
  return { x1: x + gridSize, y1: midY - half, x2: x + gridSize, y2: midY + half, ...anchorMeta };
}

function decorateDoorSegment(door, config, edge, endpoint) {
  const doorType = resolveDoorType(config, edge.id, endpoint, Boolean(edge.secret));
  const stairTransition = resolveStairTransition(config, edge.id, endpoint, "none");
  return {
    ...door,
    corridorId: edge.id,
    endpoint,
    doorType,
    stairTransition,
    hasStairs: stairTransition !== "none",
    secret: doorType === "secret",
    locked: doorType === "locked",
    open: doorType === "open",
  };
}

function getPrimaryCorridorLevelTransition(config, corridor) {
  const from = resolveStairTransition(config, corridor.id, "from", "none");
  const to = resolveStairTransition(config, corridor.id, "to", "none");
  const shared = resolveStairTransition(config, corridor.id, "shared", "none");
  if (from !== "none") return { endpoint: "from", type: from };
  if (to !== "none") return { endpoint: "to", type: to };
  if (shared !== "none") return { endpoint: "shared", type: shared };
  return { endpoint: null, type: "none" };
}

function getCorridorConfiguredLevelDelta(config, corridor) {
  const transition = getPrimaryCorridorLevelTransition(config, corridor);
  if (transition.type === "none") return 0;
  if (transition.endpoint === "from" || transition.endpoint === "shared") return transition.type === "up" ? 1 : -1;
  return transition.type === "up" ? -1 : 1;
}

function computeRegionLevels(regions, corridors, config) {
  const regionIds = new Set(regions.map((region) => region.id));
  const adjacency = new Map(regions.map((region) => [region.id, []]));
  corridors.forEach((corridor) => {
    if (!regionIds.has(corridor.from) || !regionIds.has(corridor.to)) return;
    const delta = getCorridorConfiguredLevelDelta(config, corridor);
    adjacency.get(corridor.from)?.push({ id: corridor.to, delta });
    adjacency.get(corridor.to)?.push({ id: corridor.from, delta: -delta });
  });

  const levels = new Map();
  const starts = [regions.find((region) => classifyRegion(region).entrance) || regions[0], ...regions].filter(Boolean);
  starts.forEach((start) => {
    if (levels.has(start.id)) return;
    levels.set(start.id, 0);
    const queue = [start.id];
    while (queue.length > 0) {
      const current = queue.shift();
      const currentLevel = levels.get(current) || 0;
      (adjacency.get(current) || []).forEach((neighbor) => {
        const nextLevel = currentLevel + neighbor.delta;
        if (levels.has(neighbor.id)) return;
        levels.set(neighbor.id, nextLevel);
        queue.push(neighbor.id);
      });
    }
  });
  return levels;
}

function resolveCorridorDrawLevel(corridor, fromLevel, toLevel, transition) {
  if (transition.endpoint === "from") return toLevel;
  if (transition.endpoint === "to") return fromLevel;
  if (transition.endpoint === "shared") return Math.max(fromLevel, toLevel);
  return fromLevel;
}

function applyLevelMetadata(regions, corridors, config) {
  const levelMap = computeRegionLevels(regions, corridors, config);
  const leveledRegions = regions.map((region) => ({
    ...region,
    level: levelMap.get(region.id) ?? 0,
  }));
  const regionById = new Map(leveledRegions.map((region) => [region.id, region]));
  const leveledCorridors = corridors.map((corridor) => {
    const fromLevel = regionById.get(corridor.from)?.level ?? 0;
    const toLevel = regionById.get(corridor.to)?.level ?? fromLevel;
    const transition = getPrimaryCorridorLevelTransition(config, corridor);
    return {
      ...corridor,
      fromLevel,
      toLevel,
      level: resolveCorridorDrawLevel(corridor, fromLevel, toLevel, transition),
      levelDelta: toLevel - fromLevel,
      stairEndpoint: transition.endpoint,
      stairTransition: transition.type,
      verticalTransition: fromLevel !== toLevel,
    };
  });
  return { regions: leveledRegions, corridors: leveledCorridors };
}

function formatMapLevel(level) {
  const numeric = Number(level);
  if (!Number.isFinite(numeric)) return "All";
  if (numeric > 0) return `+${numeric}`;
  return String(numeric);
}

function getRegionLevel(region) {
  return Number.isFinite(region?.level) ? region.level : 0;
}

function getAvailableMapLevels(generatedMap) {
  const levels = new Set();
  (generatedMap?.regions || []).forEach((region) => levels.add(getRegionLevel(region)));
  (generatedMap?.corridors || []).forEach((corridor) => {
    if (Number.isFinite(corridor.level)) levels.add(corridor.level);
    if (Number.isFinite(corridor.fromLevel)) levels.add(corridor.fromLevel);
    if (Number.isFinite(corridor.toLevel)) levels.add(corridor.toLevel);
  });
  return Array.from(levels).sort((a, b) => a - b);
}

function normalizeLevelView(value, availableLevels = []) {
  if (value === LEVEL_VIEW_ALL || value === null || typeof value === "undefined") return LEVEL_VIEW_ALL;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return LEVEL_VIEW_ALL;
  const rounded = Math.round(parsed);
  if (availableLevels.length > 0 && !availableLevels.includes(rounded)) return LEVEL_VIEW_ALL;
  return rounded;
}

function isCorridorVisibleOnLevel(corridor, level) {
  const corridorLevel = getCorridorPlanarLevel(corridor);
  if (corridorLevel === level) return true;
  return Boolean(corridor.verticalTransition && (corridor.fromLevel === level || corridor.toLevel === level));
}

function createRenderableSubsetMap(generatedMap, regionPredicate, corridorPredicate) {
  const regions = generatedMap.regions.filter(regionPredicate);
  const regionIds = new Set(regions.map((region) => region.id));
  const corridors = generatedMap.corridors.filter((corridor) => corridorPredicate(corridor, regionIds));
  const baseDungeonMask = buildDungeonMask(regions, corridors, generatedMap.config.gridSize);
  const mapAccesses = (generatedMap.dungeonMask.mapAccesses || generatedMap.mapAccesses || [])
    .filter((access) => regionIds.has(access.regionId));
  const dungeonMask = { ...baseDungeonMask, mapAccesses };
  return {
    ...generatedMap,
    regions,
    corridors,
    dungeonMask,
    mapAccesses,
    props: (generatedMap.props || []).filter((prop) => regionIds.has(prop.regionId)),
    contentBounds: computeContentBounds(dungeonMask.floorCells, generatedMap.config.gridSize, generatedMap.contentBounds || { x: 0, y: 0, width: generatedMap.config.mapWidth, height: generatedMap.config.mapHeight }),
  };
}

function createLevelFilteredMap(generatedMap, levelView, variant = "active") {
  const level = normalizeLevelView(levelView, getAvailableMapLevels(generatedMap));
  if (level === LEVEL_VIEW_ALL) return generatedMap;
  const active = variant === "active";
  return createRenderableSubsetMap(
    generatedMap,
    (region) => active ? getRegionLevel(region) === level : getRegionLevel(region) !== level,
    (corridor) => active ? isCorridorVisibleOnLevel(corridor, level) : !isCorridorVisibleOnLevel(corridor, level)
  );
}

function hasRenderableGeometry(generatedMap) {
  return Boolean(generatedMap?.regions?.length || generatedMap?.corridors?.length || generatedMap?.dungeonMask?.floorCells?.length);
}

function pointKey(point) {
  return `${Math.round(point.x * 10) / 10},${Math.round(point.y * 10) / 10}`;
}

function doorKey(door) {
  const a = `${Math.round(door.x1 * 10) / 10},${Math.round(door.y1 * 10) / 10}`;
  const b = `${Math.round(door.x2 * 10) / 10},${Math.round(door.y2 * 10) / 10}`;
  return `${a}|${b}|${door.doorType || (door.secret ? "secret" : "default")}`;
}

function dedupePoints(points) {
  const seen = new Set();
  return points.filter((point) => {
    const key = pointKey(point);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeDoorSegments(doors) {
  const seen = new Set();
  return doors.filter((door) => {
    if (!door) return false;
    const key = doorKey(door);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeDungeonSurfaces(regions, corridors) {
  const floor = new Set();
  const roomFloor = new Set();
  const corridorFloor = new Set();
  regions.forEach((region) => region.floorCells.forEach((cell) => {
    const key = cellKey(cell.x, cell.y);
    floor.add(key);
    roomFloor.add(key);
  }));
  corridors.forEach((corridor) => corridor.floorCells.forEach((cell) => {
    const key = cellKey(cell.x, cell.y);
    floor.add(key);
    if (!roomFloor.has(key)) corridorFloor.add(key);
  }));
  return {
    floorCells: Array.from(floor).map(parseCellKey),
    roomFloorCells: Array.from(roomFloor).map(parseCellKey),
    corridorFloorCells: Array.from(corridorFloor).map(parseCellKey),
  };
}

function computeBoundarySegments(floorCells, gridSize) {
  const floor = new Set(floorCells.map((cell) => cellKey(cell.x, cell.y)));
  const segments = [];
  floorCells.forEach((cell) => {
    const x = cell.x * gridSize;
    const y = cell.y * gridSize;
    const g = gridSize;
    [
      { side: "north", neighbor: cellKey(cell.x, cell.y - 1), x1: x, y1: y, x2: x + g, y2: y },
      { side: "east", neighbor: cellKey(cell.x + 1, cell.y), x1: x + g, y1: y, x2: x + g, y2: y + g },
      { side: "south", neighbor: cellKey(cell.x, cell.y + 1), x1: x + g, y1: y + g, x2: x, y2: y + g },
      { side: "west", neighbor: cellKey(cell.x - 1, cell.y), x1: x, y1: y + g, x2: x, y2: y },
    ].forEach((segment) => {
      if (!floor.has(segment.neighbor)) segments.push(segment);
    });
  });
  return mergeCollinearWallSegments(segments);
}

function mergeCollinearWallSegments(segments) {
  const horizontal = new Map();
  const vertical = new Map();

  segments.forEach((segment) => {
    if (segment.y1 === segment.y2) {
      const y = segment.y1;
      const a = Math.min(segment.x1, segment.x2);
      const b = Math.max(segment.x1, segment.x2);
      const key = `h-${y}`;
      if (!horizontal.has(key)) horizontal.set(key, []);
      horizontal.get(key).push({ y, a, b });
    } else if (segment.x1 === segment.x2) {
      const x = segment.x1;
      const a = Math.min(segment.y1, segment.y2);
      const b = Math.max(segment.y1, segment.y2);
      const key = `v-${x}`;
      if (!vertical.has(key)) vertical.set(key, []);
      vertical.get(key).push({ x, a, b });
    }
  });

  const merged = [];
  horizontal.forEach((parts) => {
    parts.sort((a, b) => a.a - b.a);
    let current = null;
    parts.forEach((part) => {
      if (!current) {
        current = { ...part };
        return;
      }
      if (part.a <= current.b) {
        current.b = Math.max(current.b, part.b);
      } else {
        merged.push({ x1: current.a, y1: current.y, x2: current.b, y2: current.y });
        current = { ...part };
      }
    });
    if (current) merged.push({ x1: current.a, y1: current.y, x2: current.b, y2: current.y });
  });

  vertical.forEach((parts) => {
    parts.sort((a, b) => a.a - b.a);
    let current = null;
    parts.forEach((part) => {
      if (!current) {
        current = { ...part };
        return;
      }
      if (part.a <= current.b) {
        current.b = Math.max(current.b, part.b);
      } else {
        merged.push({ x1: current.x, y1: current.a, x2: current.x, y2: current.b });
        current = { ...part };
      }
    });
    if (current) merged.push({ x1: current.x, y1: current.a, x2: current.x, y2: current.b });
  });

  return merged;
}

function segmentKey(segment) {
  const a = `${segment.x1},${segment.y1}`;
  const b = `${segment.x2},${segment.y2}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function getSharedEdgeSegment(cell, neighbor, gridSize) {
  const x = cell.x * gridSize;
  const y = cell.y * gridSize;
  const g = gridSize;
  if (neighbor.x === cell.x + 1 && neighbor.y === cell.y) return { x1: x + g, y1: y, x2: x + g, y2: y + g };
  if (neighbor.x === cell.x - 1 && neighbor.y === cell.y) return { x1: x, y1: y + g, x2: x, y2: y };
  if (neighbor.x === cell.x && neighbor.y === cell.y + 1) return { x1: x + g, y1: y + g, x2: x, y2: y + g };
  if (neighbor.x === cell.x && neighbor.y === cell.y - 1) return { x1: x, y1: y, x2: x + g, y2: y };
  return null;
}

function computeRoomCorridorWallSegments(roomFloorCells, corridorFloorCells, gridSize) {
  const corridorSet = new Set(corridorFloorCells.map((cell) => cellKey(cell.x, cell.y)));
  const seen = new Set();
  const segments = [];

  roomFloorCells.forEach((cell) => {
    [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ].forEach((neighbor) => {
      if (!corridorSet.has(cellKey(neighbor.x, neighbor.y))) return;
      const segment = getSharedEdgeSegment(cell, neighbor, gridSize);
      if (!segment) return;
      const key = segmentKey(segment);
      if (seen.has(key)) return;
      seen.add(key);
      segments.push(segment);
    });
  });

  return segments;
}

function computeRoomRoomWallSegments(regions, gridSize) {
  const ownerByCell = new Map();
  regions.forEach((region) => {
    region.floorCells.forEach((cell) => ownerByCell.set(cellKey(cell.x, cell.y), region.id));
  });
  const seen = new Set();
  const segments = [];
  regions.forEach((region) => {
    region.floorCells.forEach((cell) => {
      [
        { x: cell.x + 1, y: cell.y },
        { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 },
        { x: cell.x, y: cell.y - 1 },
      ].forEach((neighbor) => {
        const owner = ownerByCell.get(cellKey(neighbor.x, neighbor.y));
        if (!owner || owner === region.id) return;
        const segment = getSharedEdgeSegment(cell, neighbor, gridSize);
        if (!segment) return;
        const key = segmentKey(segment);
        if (seen.has(key)) return;
        seen.add(key);
        segments.push(segment);
      });
    });
  });
  return segments;
}

function buildDungeonMask(regions, corridors, gridSize) {
  const dungeonMask = mergeDungeonSurfaces(regions, corridors);
  const doorSegments = dedupeDoorSegments(corridors.flatMap((corridor) => corridor.doors));
  const externalWallSegments = computeBoundarySegments(dungeonMask.floorCells, gridSize);
  const corridorSeparationWallSegments = computeRoomCorridorWallSegments(dungeonMask.roomFloorCells, dungeonMask.corridorFloorCells, gridSize);
  const roomSeparationWallSegments = computeRoomRoomWallSegments(regions, gridSize);
  const wallSegments = mergeCollinearWallSegments([...externalWallSegments, ...corridorSeparationWallSegments, ...roomSeparationWallSegments]);
  return {
    surfaceKind: "dungeon",
    ...dungeonMask,
    externalWallSegments,
    internalWallSegments: mergeCollinearWallSegments([...corridorSeparationWallSegments, ...roomSeparationWallSegments]),
    wallSegments,
    doorSegments,
    mapAccesses: [],
  };
}

function normalizeMapAccessType(value, fallback = "passage") {
  return ["entrance", "exit", "passage"].includes(value) ? value : fallback;
}

function getMapAccessLabelForType(type) {
  if (type === "entrance") return "IN";
  if (type === "exit") return "OUT";
  return "PASS";
}

function serializeMapAccessAnchor(anchor) {
  if (!anchor) return null;
  return {
    side: anchor.side,
    cell: { x: anchor.cell.x, y: anchor.cell.y },
  };
}

function anchorsShareSideAndCell(a, b) {
  return Boolean(a && b) && a.side === b.side && a.cell?.x === b.cell?.x && a.cell?.y === b.cell?.y;
}

function getExternalBoundaryAnchors(region, generatedMap) {
  const floorSet = new Set(generatedMap.dungeonMask.floorCells.map((cell) => cellKey(cell.x, cell.y)));
  return getBoundaryCells(region).filter((anchor) => !floorSet.has(cellKey(anchor.outsideCell.x, anchor.outsideCell.y)));
}

function resolveMapAccessAnchor(region, serializedAnchor, generatedMap) {
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

function scoreMapAccessAnchor(anchor, region, generatedMap, intent, index) {
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

function createMapAccessFromAnchor(region, anchor, intent, generatedMap, index) {
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

function chooseMapAccessForRegion(region, generatedMap, intent, index) {
  const anchors = getExternalBoundaryAnchors(region, generatedMap);
  if (anchors.length === 0) return null;
  const ranked = anchors
    .map((anchor) => ({ anchor, score: scoreMapAccessAnchor(anchor, region, generatedMap, intent, index) }))
    .sort((a, b) => a.score - b.score);
  return createMapAccessFromAnchor(region, ranked[0].anchor, intent, generatedMap, index);
}

function getClosestExternalBoundaryAnchorToPoint(region, point, generatedMap) {
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

function createManualMapAccessForRegion(region, override, generatedMap, index) {
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

function areMapAccessesTooClose(a, b, gridSize) {
  const dx = (a.wallGap.x1 + a.wallGap.x2) / 2 - (b.wallGap.x1 + b.wallGap.x2) / 2;
  const dy = (a.wallGap.y1 + a.wallGap.y2) / 2 - (b.wallGap.y1 + b.wallGap.y2) / 2;
  return Math.hypot(dx, dy) < gridSize * 2.25;
}

function createMapAccesses(generatedMap) {
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

function cellRectToPath(cell, gridSize) {
  const x = cell.x * gridSize;
  const y = cell.y * gridSize;
  const g = gridSize;
  return `M${x} ${y}H${x + g}V${y + g}H${x}Z`;
}

function buildFloorPath(floorCells, gridSize) {
  return floorCells.map((cell) => cellRectToPath(cell, gridSize)).join(" ");
}

function buildOrganicCellBoundaryPath(region, generatedMap = null, gridSize = DEFAULT_CONFIG.gridSize) {
  const sourceCells = Array.isArray(region.floorCells) ? region.floorCells : [];
  if (sourceCells.length === 0) return "";
  const seed = generatedMap?.config?.seed || DEFAULT_CONFIG.seed;
  const floorCells = isSingleRegionCaveMap(generatedMap)
    ? createSingleRegionWildCaveCells(sourceCells, { ...(generatedMap?.config || DEFAULT_CONFIG), gridSize, seed: hashStringToSeed(seed, region.id, "single-region-path") })
    : sourceCells;
  const organicContourPath = buildOrganicCaveContourPath(
    floorCells,
    gridSize,
    hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-contour")
  );
  if (organicContourPath) return organicContourPath;
  const boundarySegments = computeBoundarySegments(floorCells, gridSize);
  const loops = buildBoundaryLoops(boundarySegments);
  const roughConfig = {
    gridSize,
    seed: hashStringToSeed(seed, region.id, region.shape || "cave", "organic-region-surface"),
  };
  return loops
    .map((loop, loopIndex) => roughenBoundaryLoop(loop, roughConfig, loopIndex))
    .filter((points) => points.length > 2)
    .map((points) => catmullRomClosedPath(chaikinClosed(points, 1)))
    .filter(Boolean)
    .join(" ");
}

function buildOrganicCorridorBoundaryPath(corridor, generatedMap = null, gridSize = DEFAULT_CONFIG.gridSize, layer = "surface") {
  const floorCells = Array.isArray(corridor.floorCells) ? corridor.floorCells : [];
  if (!isOrganicCorridor(corridor) || floorCells.length === 0) return "";
  const seed = generatedMap?.config?.seed || DEFAULT_CONFIG.seed;
  const organicContourPath = buildOrganicCaveContourPath(
    floorCells,
    gridSize,
    hashStringToSeed(seed, corridor.id, layer, "organic-corridor-contour")
  );
  if (organicContourPath) return organicContourPath;
  const boundarySegments = computeBoundarySegments(floorCells, gridSize);
  const loops = buildBoundaryLoops(boundarySegments);
  const roughConfig = {
    gridSize,
    seed: hashStringToSeed(seed, corridor.id, layer, "organic-corridor-surface"),
  };
  return loops
    .map((loop, loopIndex) => roughenBoundaryLoop(loop, roughConfig, loopIndex))
    .filter((points) => points.length > 2)
    .map((points) => catmullRomClosedPath(chaikinClosed(points, 1)))
    .filter(Boolean)
    .join(" ");
}

function createCorridorSurface(corridor, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
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

function buildCorridorsVisualFloorPath(corridors, generatedMap, gridSize) {
  return corridors
    .map((corridor) => createCorridorSurface(corridor, generatedMap, gridSize).visualFloorPath)
    .filter(Boolean)
    .join(" ");
}

function isOrganicRegionSurface(region) {
  return region?.shape === "cave" || region?.surfaceKind === "cave" || region?.placementProfile === "cave";
}

function buildCircleRoomPath(region, gridSize) {
  const circle = getCircleGeometryFromRegion(region, gridSize);
  const { cx, cy, r } = circle;
  return `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}Z`;
}

function getCirclePortalCellFromAnchor(region, anchor) {
  if (!anchor) return null;
  if (anchor.portalRoomCell) return { x: anchor.portalRoomCell.x, y: anchor.portalRoomCell.y };
  return getSnappedCirclePortalCellFromAnchor(anchor) || anchor.cell;
}

function getCirclePortalSupportCell(region, portal) {
  if (!portal?.anchor || region.shape !== "circle") return null;
  const anchor = portal.anchor;
  const portalCell = { x: portal.x, y: portal.y };
  const supportCell = anchor.originalCell
    ? { x: anchor.originalCell.x, y: anchor.originalCell.y }
    : anchor.expandedCircleDoor && anchor.normal
      ? { x: portalCell.x - anchor.normal.x, y: portalCell.y - anchor.normal.y }
      : null;

  if (!supportCell) return null;
  const distance = Math.abs(supportCell.x - portalCell.x) + Math.abs(supportCell.y - portalCell.y);
  if (distance !== 1) return null;

  return {
    x: supportCell.x,
    y: supportCell.y,
    side: anchor.side,
    anchor,
    support: true,
  };
}

function isCellCenterOutsideCircle(cell, circle) {
  const cx = cell.x + 0.5;
  const cy = cell.y + 0.5;
  return Math.hypot(cx - circle.cxCells, cy - circle.cyCells) > circle.rCells - 0.04;
}

function getCirclePortalCells(generatedMap, region) {
  if (!generatedMap || region.shape !== "circle") return [];
  const seen = new Set();
  const cells = [];
  const addCell = (cell, source = {}) => {
    if (!cell) return;
    const key = cellKey(cell.x, cell.y);
    if (seen.has(key)) return;
    seen.add(key);
    cells.push({
      x: cell.x,
      y: cell.y,
      side: source.side || cell.side || null,
      anchor: source.anchor || cell.anchor || null,
      support: Boolean(source.support),
    });
  };

  generatedMap.corridors.forEach((corridor) => {
    [
      corridor.from === region.id ? corridor.fromAnchor : null,
      corridor.to === region.id ? corridor.toAnchor : null,
    ].filter(Boolean).forEach((anchor) => {
      const portalCell = getCirclePortalCellFromAnchor(region, anchor);
      const portal = {
        x: portalCell.x,
        y: portalCell.y,
        side: anchor.side,
        anchor,
      };
      addCell(portal, portal);
      addCell(getCirclePortalSupportCell(region, portal), { anchor, side: anchor.side, support: true });
    });
  });
  return cells;
}

function getCircleCompositeSquareCells(generatedMap, region) {
  if (!generatedMap || region.shape !== "circle") return [];
  const cellsByKey = new Map();
  const addCompositeCell = (cell, source, anchor = null) => {
    if (!cell) return;
    const key = cellKey(cell.x, cell.y);
    if (cellsByKey.has(key)) return;
    cellsByKey.set(key, {
      x: cell.x,
      y: cell.y,
      source,
      anchor,
      support: source === "support",
    });
  };

  (Array.isArray(region.circleExtensionCells) ? region.circleExtensionCells : []).forEach((cell) => {
    addCompositeCell(cell, "extension");
  });

  generatedMap.corridors.forEach((corridor) => {
    [
      corridor.from === region.id ? corridor.fromAnchor : null,
      corridor.to === region.id ? corridor.toAnchor : null,
    ].filter((anchor) => anchor?.expandedCircleDoor && anchor.portalRoomCell).forEach((anchor) => {
      const portal = {
        x: anchor.portalRoomCell.x,
        y: anchor.portalRoomCell.y,
        side: anchor.side,
        anchor,
      };
      addCompositeCell(portal, "expanded-door", anchor);
      addCompositeCell(getCirclePortalSupportCell(region, portal), "support", anchor);
    });
  });

  return Array.from(cellsByKey.values());
}

function getRegionSurfaceKind(region, generatedMap = null) {
  const explicit = region?.surfaceKind || region?.generationKind || region?.surface?.kind;
  if (["cave", "organic-cave", "natural"].includes(explicit)) return "cave";
  if (["dungeon", "structured", "room"].includes(explicit)) return "dungeon";
  if (region?.placementProfile === "cave" || region?.shape === "cave") return "cave";
  const contextKey = generatedMap?.config ? getContextKey(generatedMap.config.context || generatedMap.config.biome) : "";
  return contextKey === "cave" ? "cave" : "dungeon";
}

function createCellMaskRegionSurface(region, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
  const gridSize = generatedMap?.config?.gridSize || gridSizeFallback || DEFAULT_CONFIG.gridSize;
  const floorCells = Array.isArray(region.floorCells) ? region.floorCells : [];
  const boundarySegments = computeBoundarySegments(floorCells, gridSize);
  const organicPath = isOrganicRegionSurface(region) ? buildOrganicCellBoundaryPath(region, generatedMap, gridSize) : "";
  const visualFloorPath = organicPath || buildFloorPath(floorCells, gridSize);
  const organicSurface = Boolean(organicPath);
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
    wallArcPath: organicSurface ? visualFloorPath : "",
    wallSegments: boundarySegments,
    boundarySegments,
    connectionAnchors: getDoorBoundaryCells(region),
  };
}

function createCircleCompositeRegionSurface(region, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
  const gridSize = generatedMap?.config?.gridSize || gridSizeFallback || DEFAULT_CONFIG.gridSize;
  const floorCells = Array.isArray(region.floorCells) ? region.floorCells : [];
  const circlePath = buildCircleRoomPath(region, gridSize);
  const extensionCells = getCircleCompositeSquareCells(generatedMap, region);
  const extensionPath = extensionCells.map((cell) => cellRectToPath(cell, gridSize)).join(" ");
  const visualFloorPath = [circlePath, extensionPath].filter(Boolean).join(" ");
  const hoverPath = generatedMap ? createCircleCompositeArcPath(region, generatedMap) : circlePath;
  const hoverSegments = generatedMap ? getCirclePortalSquareWallSegments(region, generatedMap) : [];
  return {
    regionId: region.id,
    surfaceKind: getRegionSurfaceKind(region, generatedMap),
    kind: "circle-composite",
    geometryKind: "circle-composite",
    gridSize,
    floorCells,
    extensionCells,
    visualFloorPath,
    clipPath: visualFloorPath,
    hoverPath,
    hoverSegments,
    wallArcPath: hoverPath,
    wallSegments: hoverSegments,
    boundarySegments: hoverSegments,
    connectionAnchors: getDoorBoundaryCells(region),
  };
}

function getRegionSurface(region, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
  if (region.shape === "circle") return createCircleCompositeRegionSurface(region, generatedMap, gridSizeFallback);
  return createCellMaskRegionSurface(region, generatedMap, gridSizeFallback);
}

function getRegionCompositeShape(region, generatedMap = null, gridSizeFallback = DEFAULT_CONFIG.gridSize) {
  return getRegionSurface(region, generatedMap, gridSizeFallback);
}

function buildCircleRoomVisualPath(region, gridSize, generatedMap = null) {
  return getRegionSurface(region, generatedMap, gridSize).visualFloorPath;
}

function buildRegionVisualFloorPath(region, gridSize, generatedMap = null) {
  return getRegionSurface(region, generatedMap, gridSize).visualFloorPath;
}

function isUsableSvgPath(path) {
  return typeof path === "string" && path.trim().length > 0 && !/(NaN|undefined|null)/i.test(path);
}

function getMapSurface(generatedMap) {
  const { config, dungeonMask, regions, corridors = [] } = generatedMap;
  const gridSize = config.gridSize;

  if (isPureCaveMap(generatedMap)) {
    const hexCaveSurface = createHexCaveSurface(generatedMap);
    const caveSurface = isUsableSvgPath(hexCaveSurface.visualFloorPath) ? hexCaveSurface : createCellBasedCaveSurface(generatedMap);
    const regionSurfaces = regions.map((region) => getRegionSurface(region, generatedMap, gridSize));
    const corridorSurfaces = corridors.map((corridor) => createCorridorSurface(corridor, generatedMap, gridSize));
    return {
      kind: "map-surface",
      geometryKind: "hex-cave-map",
      surfaceKind: "cave",
      gridSize,
      caveSurface,
      regionSurfaces,
      corridorSurfaces,
      floorCells: caveSurface.floorCells || dungeonMask.floorCells || [],
      roomFloorCells: dungeonMask.roomFloorCells || [],
      corridorFloorCells: dungeonMask.corridorFloorCells || [],
      visualFloorPath: caveSurface.visualFloorPath,
      clipPath: caveSurface.clipPath,
      externalWallSegments: caveSurface.boundarySegments || [],
      internalWallSegments: [],
      wallSegments: caveSurface.boundarySegments || [],
      doorSegments: dungeonMask.doorSegments || [],
      mapAccesses: dungeonMask.mapAccesses || [],
    };
  }

  const regionSurfaces = regions.map((region) => getRegionSurface(region, generatedMap, gridSize));
  const corridorSurfaces = corridors.map((corridor) => createCorridorSurface(corridor, generatedMap, gridSize));
  const vectorRegionIds = new Set(regionSurfaces
    .filter((surface) => surface.geometryKind !== "cell-mask")
    .map((surface) => surface.regionId));
  const vectorCorridorIds = new Set(corridorSurfaces
    .filter((surface) => surface.geometryKind !== "corridor-cell-mask")
    .map((surface) => surface.corridorId));
  const vectorFloorKeys = new Set();
  regions.forEach((region) => {
    if (!vectorRegionIds.has(region.id)) return;
    region.floorCells.forEach((cell) => vectorFloorKeys.add(cellKey(cell.x, cell.y)));
  });
  corridors.forEach((corridor) => {
    if (!vectorCorridorIds.has(corridor.id)) return;
    corridor.floorCells.forEach((cell) => vectorFloorKeys.add(cellKey(cell.x, cell.y)));
  });
  const baseFloorCells = vectorFloorKeys.size === 0
    ? dungeonMask.floorCells
    : dungeonMask.floorCells.filter((cell) => !vectorFloorKeys.has(cellKey(cell.x, cell.y)));
  const vectorRegionFloorPath = regionSurfaces
    .filter((surface) => vectorRegionIds.has(surface.regionId))
    .map((surface) => surface.visualFloorPath)
    .filter(Boolean)
    .join(" ");
  const vectorCorridorFloorPath = corridorSurfaces
    .filter((surface) => vectorCorridorIds.has(surface.corridorId))
    .map((surface) => surface.visualFloorPath)
    .filter(Boolean)
    .join(" ");
  const visualFloorPath = [buildFloorPath(baseFloorCells, gridSize), vectorRegionFloorPath, vectorCorridorFloorPath].filter(Boolean).join(" ");
  return {
    kind: "map-surface",
    surfaceKind: regionSurfaces.some((surface) => surface.surfaceKind === "cave") || corridorSurfaces.some((surface) => surface.surfaceKind === "cave") ? "mixed" : "dungeon",
    gridSize,
    regionSurfaces,
    corridorSurfaces,
    floorCells: dungeonMask.floorCells || [],
    roomFloorCells: dungeonMask.roomFloorCells || [],
    corridorFloorCells: dungeonMask.corridorFloorCells || [],
    visualFloorPath,
    clipPath: visualFloorPath,
    externalWallSegments: dungeonMask.externalWallSegments || [],
    internalWallSegments: dungeonMask.internalWallSegments || [],
    wallSegments: dungeonMask.wallSegments || [],
    doorSegments: dungeonMask.doorSegments || [],
    mapAccesses: dungeonMask.mapAccesses || [],
  };
}

function buildVisualFloorPath(generatedMap) {
  return getMapSurface(generatedMap).visualFloorPath;
}

function computeContentBounds(floorCells, gridSize, fallback) {
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

function createGridElements(config, gridStyle, keyPrefix) {
  const style = normalizeGridStyle(gridStyle);
  if (style === "none") return [];
  const elements = [];
  const g = config.gridSize;

  if (style === "solid") {
    for (let x = 0; x <= config.mapWidth; x += g) elements.push(<line key={`${keyPrefix}-x-${x}`} x1={x} y1={0} x2={x} y2={config.mapHeight} />);
    for (let y = 0; y <= config.mapHeight; y += g) elements.push(<line key={`${keyPrefix}-y-${y}`} x1={0} y1={y} x2={config.mapWidth} y2={y} />);
    return elements;
  }

  if (style === "dotted") {
    for (let x = 0; x <= config.mapWidth; x += g) {
      for (let y = 0; y <= config.mapHeight; y += g) {
        elements.push(<circle key={`${keyPrefix}-dot-${x}-${y}`} cx={x} cy={y} r={0.85} />);
      }
    }
    return elements;
  }

  const seen = new Set();
  const addDash = (x1, y1, x2, y2) => {
    const key = `${Math.round(x1)},${Math.round(y1)}:${Math.round(x2)},${Math.round(y2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    elements.push(<line key={`${keyPrefix}-dash-${key}`} x1={x1} y1={y1} x2={x2} y2={y2} />);
  };

  for (let x = 0; x < config.mapWidth; x += g) {
    for (let y = 0; y < config.mapHeight; y += g) {
      const xA = x + g * 0.34;
      const xB = x + g * 0.66;
      const yA = y + g * 0.34;
      const yB = y + g * 0.66;
      addDash(xA, y, xB, y);
      addDash(xA, y + g, xB, y + g);
      addDash(x, yA, x, yB);
      addDash(x + g, yA, x + g, yB);
    }
  }
  return elements;
}

function renderGrid(config, gridStyle = "solid") {
  const style = normalizeGridStyle(gridStyle);
  if (style === "none") return null;
  return <g className={`map-grid grid-style-${style}`}>{createGridElements(config, style, "mg")}</g>;
}

function createOrganicPath(region, gridSize) {
  const { x, y, w, h } = region.cellRect;
  const px = x * gridSize;
  const py = y * gridSize;
  const pw = w * gridSize;
  const ph = h * gridSize;
  const rng = createSeededRng(hashStringToSeed(region.id, region.name, "organic-path"));
  const inset = Math.min(gridSize * 0.65, Math.min(pw, ph) * 0.12);
  const jitter = (amount) => (rng() - 0.5) * amount;
  const left = px + inset;
  const top = py + inset;
  const right = px + pw - inset;
  const bottom = py + ph - inset;
  const cx = px + pw / 2;
  const cy = py + ph / 2;

  if (region.shape === "circle") {
    return buildCircleRoomPath(region, gridSize);
  }

  if (region.shape === "oval" || region.shape === "shaft" || region.shape === "ritual") {
    const rx = (right - left) / 2;
    const ry = (bottom - top) / 2;
    return `M${cx} ${cy - ry}C${cx + rx * 0.56} ${cy - ry},${cx + rx} ${cy - ry * 0.56},${cx + rx} ${cy}C${cx + rx} ${cy + ry * 0.56},${cx + rx * 0.56} ${cy + ry},${cx} ${cy + ry}C${cx - rx * 0.56} ${cy + ry},${cx - rx} ${cy + ry * 0.56},${cx - rx} ${cy}C${cx - rx} ${cy - ry * 0.56},${cx - rx * 0.56} ${cy - ry},${cx} ${cy - ry}Z`;
  }

  if (region.shape === "irregular" || region.shape === "cave" || region.shape === "broken" || region.shape === "ruined-rect") {
    const p1 = { x: left + pw * 0.08 + jitter(8), y: top + jitter(8) };
    const p2 = { x: cx + jitter(14), y: top + ph * 0.04 + jitter(10) };
    const p3 = { x: right - pw * 0.08 + jitter(8), y: top + ph * 0.12 + jitter(8) };
    const p4 = { x: right + jitter(6), y: cy + jitter(14) };
    const p5 = { x: right - pw * 0.12 + jitter(8), y: bottom - ph * 0.1 + jitter(8) };
    const p6 = { x: cx + jitter(14), y: bottom + jitter(6) };
    const p7 = { x: left + pw * 0.12 + jitter(8), y: bottom - ph * 0.06 + jitter(8) };
    const p8 = { x: left + jitter(6), y: cy + jitter(14) };
    return `M${p1.x} ${p1.y}C${p1.x + pw * 0.18} ${p1.y - 4},${p2.x - pw * 0.14} ${p2.y - 8},${p2.x} ${p2.y}C${p2.x + pw * 0.18} ${p2.y + 4},${p3.x - pw * 0.16} ${p3.y - 4},${p3.x} ${p3.y}C${p4.x} ${p4.y - ph * 0.18},${p4.x + 6} ${p4.y - ph * 0.05},${p4.x} ${p4.y}C${p4.x - 2} ${p4.y + ph * 0.16},${p5.x + pw * 0.16} ${p5.y - 2},${p5.x} ${p5.y}C${p5.x - pw * 0.18} ${p5.y + 4},${p6.x + pw * 0.14} ${p6.y + 4},${p6.x} ${p6.y}C${p6.x - pw * 0.18} ${p6.y - 2},${p7.x + pw * 0.16} ${p7.y + 4},${p7.x} ${p7.y}C${p8.x} ${p8.y + ph * 0.18},${p8.x - 6} ${p8.y + ph * 0.05},${p8.x} ${p8.y}C${p8.x + 2} ${p8.y - ph * 0.16},${p1.x - pw * 0.16} ${p1.y + 2},${p1.x} ${p1.y}Z`;
  }

  if (region.shape === "apse") {
    return `M${left} ${top}H${right - gridSize * 0.6}Q${right} ${cy} ${right - gridSize * 0.6} ${bottom}H${left}Z`;
  }

  return `M${left} ${top}H${right}V${bottom}H${left}Z`;
}

function renderShapeDetails(region, gridSize) {
  const { x, y, w, h } = region.cellRect;
  const px = x * gridSize;
  const py = y * gridSize;
  const pw = w * gridSize;
  const ph = h * gridSize;
  const details = [];
  if (region.shape === "archive" || region.shapeOptions?.roomType === "archive") {
    for (let i = 1; i < Math.max(2, Math.floor(w / 2)); i += 1) {
      details.push(<line key={`archive-${region.id}-${i}`} className="shape-detail" x1={px + i * gridSize * 2} y1={py + gridSize * 0.55} x2={px + i * gridSize * 2} y2={py + ph - gridSize * 0.55} />);
    }
  }
  if (region.shape === "alcove" || region.shapeOptions?.roomType === "alcove") {
    for (let i = 1; i < w - 1; i += 3) {
      details.push(<path key={`alcove-n-${region.id}-${i}`} className="shape-detail" d={`M${px + i * gridSize + gridSize * 0.25} ${py + gridSize * 0.35}h${gridSize * 0.5}`} />);
      details.push(<path key={`alcove-s-${region.id}-${i}`} className="shape-detail" d={`M${px + i * gridSize + gridSize * 0.25} ${py + ph - gridSize * 0.35}h${gridSize * 0.5}`} />);
    }
  }
  if (region.shape === "shaft") {
    details.push(<circle key={`shaft-ring-${region.id}`} className="shape-detail" cx={px + pw / 2} cy={py + ph / 2} r={Math.max(gridSize * 0.65, Math.min(pw, ph) * 0.22)} />);
  }
  return details.length > 0 ? <g clipPath={`url(#clip-${region.id})`}>{details}</g> : null;
}

function renderRegionClipPaths(generatedMap) {
  return generatedMap.regions.map((region) => {
    const shape = getRegionCompositeShape(region, generatedMap, generatedMap.config.gridSize);
    return (
      <clipPath key={`clip-${region.id}`} id={`clip-${region.id}`}>
        <path d={shape.clipPath} fillRule="nonzero" />
      </clipPath>
    );
  });
}

function renderDungeonFloorClipPath(generatedMap) {
  const mapSurface = getMapSurface(generatedMap);
  const clipPath = mapSurface.clipPath || mapSurface.visualFloorPath || buildVisualFloorPath(generatedMap);
  return (
    <clipPath id="clip-dungeon-floor">
      <path d={clipPath} fillRule="nonzero" />
    </clipPath>
  );
}

function renderFloorGrid(generatedMap, gridStyle = "solid") {
  const { config } = generatedMap;
  const style = normalizeGridStyle(gridStyle);
  if (style === "none") return null;
  return <g className={`floor-grid grid-style-${style}`} clipPath="url(#clip-dungeon-floor)">{createGridElements(config, style, "fg")}</g>;
}

function renderVisualAccents(generatedMap) {
  const { config, dungeonMask, regions, corridors } = generatedMap;
  return (
    <>
      <path className="room-floor-accent" d={regions.map((region) => buildRegionVisualFloorPath(region, config.gridSize, generatedMap)).join(" ")} fillRule="nonzero" />
      <path className="corridor-floor-accent" d={buildCorridorsVisualFloorPath(corridors, generatedMap, config.gridSize)} fillRule="nonzero" />
      <g className="room-shape-accents">
        {regions.filter((region) => ["irregular", "cave", "oval", "shaft", "ritual", "broken", "ruined-rect", "apse"].includes(region.shape)).map((region) => (
          <g key={`organic-${region.id}`} clipPath={`url(#clip-${region.id})`}>
            <path className="organic-floor-accent" d={createOrganicPath(region, config.gridSize)} />
            {region.shape === "ritual" && <path className="ritual-floor-ring" d={createOrganicPath(region, config.gridSize)} transform={`scale(.72) translate(${region.labelPoint.x * 0.38} ${region.labelPoint.y * 0.38})`} />}
          </g>
        ))}
        {regions.map((region) => <React.Fragment key={`shape-details-${region.id}`}>{renderShapeDetails(region, config.gridSize)}</React.Fragment>)}
      </g>
      <g className="corridor-texture">
        {corridors.map((corridor) => {
          if (corridor.centerline.length < 2) return null;
          const d = corridor.centerline.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join("");
          return <path key={`corridor-center-${corridor.id}`} className="corridor-centerline" d={d} />;
        })}
      </g>
    </>
  );
}

function createFloorTexture(generatedMap) {
  const { config, dungeonMask } = generatedMap;
  const rng = createSeededRng(hashStringToSeed(config.seed, config.context, "floor-texture"));
  const cells = dungeonMask.floorCells.filter((cell) => hashStringToSeed(config.seed, cell.x, cell.y, "speckle") % 100 < 18);
  const grains = dungeonMask.floorCells.filter((cell) => hashStringToSeed(config.seed, cell.x, cell.y, "grain") % 100 < 10);
  return (
    <g clipPath="url(#clip-dungeon-floor)">
      <g className="floor-speckle">
        {cells.map((cell, index) => (
          <circle
            key={`speckle-${cell.x}-${cell.y}-${index}`}
            cx={(cell.x + 0.25 + rng() * 0.5) * config.gridSize}
            cy={(cell.y + 0.25 + rng() * 0.5) * config.gridSize}
            r={0.55 + rng() * 0.75}
          />
        ))}
      </g>
      <g className="floor-grain">
        {grains.map((cell, index) => {
          const x = (cell.x + 0.24 + rng() * 0.42) * config.gridSize;
          const y = (cell.y + 0.24 + rng() * 0.42) * config.gridSize;
          const len = 3 + rng() * 7;
          return <path key={`grain-${cell.x}-${cell.y}-${index}`} d={`M${x} ${y}l${len} ${rng() > 0.5 ? 1.5 : -1.5}`} />;
        })}
      </g>
    </g>
  );
}

const HATCH_PATTERN_LIBRARY = [{"cellLines":[[[24,10],[0,25]],[[28,22],[1,39]],[[34,30],[-3,50]]],"centre":[15,32]},{"cellLines":[[[25,10],[88,8]],[[30,21],[88,16]],[[34,30],[91,22]]],"centre":[58,17]},{"cellLines":[[[86,0],[91,24]],[[97,-6],[103,19]],[[106,-14],[117,11]]],"centre":[101,6]},{"cellLines":[[[77,33],[121,8]],[[124,18],[80,41]],[[86,51],[125,29]]],"centre":[106,30]},{"cellLines":[[[125,19],[141,32]],[[123,7],[158,34]],[[131,0],[174,30]]],"centre":[142,21]},{"cellLines":[[[126,30],[194,35]],[[114,39],[195,46]],[[124,49],[196,53]]],"centre":[155,44]},{"cellLines":[[[110,40],[138,63]],[[132,69],[98,47]],[[89,53],[120,78]]],"centre":[113,58]},{"cellLines":[[[148,12],[175,-13]],[[158,19],[186,-5]],[[167,26],[198,0]]],"centre":[173,5]},{"cellLines":[[[177,20],[176,36]],[[188,11],[187,36]],[[196,6],[195,36]]],"centre":[187,24]},{"cellLines":[[[196,4],[229,27]],[[197,16],[229,35]],[[197,26],[231,45]]],"centre":[214,27]},{"cellLines":[[[206,11],[236,-13]],[[216,19],[243,-4]],[[226,24],[246,2]]],"centre":[230,8]},{"cellLines":[[[229,27],[232,46]],[[240,14],[243,39]],[[249,-1],[254,35]],[[260,-9],[266,28]]],"centre":[246,20]},{"cellLines":[[[233,44],[270,26]],[[232,55],[270,41]],[[235,64],[264,52]]],"centre":[251,50]},{"cellLines":[[[265,9],[286,-13]],[[267,19],[297,-13]],[[276,27],[301,-2]]],"centre":[282,6]},{"cellLines":[[[296,7],[303,46]],[[290,15],[293,49]],[[284,22],[288,52]]],"centre":[292,32]},{"cellLines":[[[275,31],[253,77]],[[285,41],[264,88]],[[288,52],[272,97]]],"centre":[274,61]},{"cellLines":[[[290,52],[316,58]],[[286,61],[315,69]],[[284,71],[312,78]]],"centre":[298,65]},{"cellLines":[[[278,84],[295,75]],[[275,96],[300,79]],[[280,106],[301,93]]],"centre":[289,91]},{"cellLines":[[[251,77],[284,108]],[[277,120],[243,89]],[[240,98],[271,134]]],"centre":[261,106]},{"cellLines":[[[223,65],[259,69]],[[213,78],[252,78]],[[198,92],[244,89]],[[197,102],[241,99]]],"centre":[227,84]},{"cellLines":[[[195,35],[198,60]],[[204,33],[209,62]],[[218,39],[222,69]],[[231,46],[234,67]]],"centre":[213,49]},{"cellLines":[[[182,75],[197,60]],[[208,63],[187,85]],[[191,96],[221,69]]],"centre":[200,76]},{"cellLines":[[[149,95],[188,53]],[[135,91],[174,53]],[[117,91],[164,53]],[[109,89],[151,52]]],"centre":[150,72]},{"cellLines":[[[162,85],[170,100]],[[169,77],[184,105]],[[177,67],[201,109]]],"centre":[178,89]},{"cellLines":[[[72,27],[88,54]],[[59,28],[72,53]],[[45,31],[59,54]]],"centre":[65,39]},{"cellLines":[[[47,36],[29,88]],[[5,94],[19,42]],[[20,90],[34,32]]],"centre":[28,61]},{"cellLines":[[[42,55],[87,55]],[[39,67],[78,66]],[[50,75],[72,76]]],"centre":[61,65]},{"cellLines":[[[45,68],[79,112]],[[37,75],[66,112]],[[31,87],[51,112]]],"centre":[51,92]},{"cellLines":[[[62,89],[88,55]],[[71,103],[97,60]],[[80,113],[107,68]]],"centre":[84,81]},{"cellLines":[[[216,102],[201,141]],[[211,140],[227,101]],[[240,102],[225,139]]],"centre":[219,121]},{"cellLines":[[[236,114],[249,108]],[[253,114],[232,126]],[[228,139],[263,123]]],"centre":[244,120]},{"cellLines":[[[283,106],[266,144]],[[282,141],[295,98]]],"centre":[281,122]},{"cellLines":[[[241,176],[232,141]],[[241,136],[251,173]],[[249,132],[263,169]],[[259,127],[272,166]]],"centre":[250,152]},{"cellLines":[[[268,144],[302,140]],[[302,153],[270,154]],[[273,165],[301,165]]],"centre":[282,154]},{"cellLines":[[[295,101],[329,88]],[[293,113],[321,103]],[[288,126],[315,115]]],"centre":[302,111]},{"cellLines":[[[8,130],[27,91]],[[36,96],[19,134]],[[44,104],[28,137]],[[50,111],[38,140]]],"centre":[34,117]},{"cellLines":[[[51,112],[94,114]],[[49,122],[96,124]],[[44,129],[100,135]]],"centre":[72,125]},{"cellLines":[[[90,101],[104,151]],[[95,91],[112,148]],[[100,82],[119,139]]],"centre":[103,121]},{"cellLines":[[[102,90],[151,95]],[[108,106],[153,109]],[[111,120],[155,121]]],"centre":[131,108]},{"cellLines":[[[150,96],[160,139]],[[158,91],[166,125]]],"centre":[159,111]},{"cellLines":[[[161,98],[212,112]],[[163,110],[210,123]],[[166,124],[204,136]]],"centre":[185,117]},{"cellLines":[[[-1,124],[43,146]],[[-12,133],[42,158]],[[1,150],[33,163]]],"centre":[21,149]},{"cellLines":[[[43,147],[60,143]],[[41,160],[65,150]],[[31,176],[69,157]]],"centre":[49,160]},{"cellLines":[[[51,132],[85,178]],[[64,132],[96,175]],[[74,134],[92,157]]],"centre":[76,150]},{"cellLines":[[[86,135],[100,186]],[[95,137],[107,184]],[[106,155],[118,182]]],"centre":[101,163]},{"cellLines":[[[107,156],[132,121]],[[113,168],[138,137]],[[130,166],[142,153]]],"centre":[124,152]},{"cellLines":[[[133,123],[146,165]],[[144,123],[154,152]]],"centre":[143,140]},{"cellLines":[[[146,168],[166,126]],[[177,129],[158,171]],[[189,133],[172,177]]],"centre":[168,149]},{"cellLines":[[[187,143],[231,139]],[[183,152],[234,147]],[[181,161],[236,158]]],"centre":[206,149]},{"cellLines":[[[16,157],[8,201]],[[17,204],[23,160]],[[32,164],[26,207]]],"centre":[19,184]},{"cellLines":[[[29,181],[68,193]],[[72,181],[42,173]],[[57,165],[79,171]]],"centre":[59,176]},{"cellLines":[[[72,182],[98,176]],[[68,194],[100,185]],[[82,200],[121,192]]],"centre":[90,189]},{"cellLines":[[[28,206],[56,191]],[[47,188],[29,198]]],"centre":[41,197]},{"cellLines":[[[1,153],[13,175]],[[-3,167],[10,189]],[[-12,167],[8,202]]],"centre":[3,175]},{"cellLines":[[[112,169],[147,167]],[[116,180],[158,173]],[[119,187],[173,178]]],"centre":[137,177]},{"cellLines":[[[181,162],[217,188]],[[211,199],[175,172]],[[169,178],[202,208]]],"centre":[194,185]},{"cellLines":[[[203,178],[209,161]],[[226,159],[214,186]],[[236,159],[223,192]]],"centre":[219,175]},{"cellLines":[[[241,176],[227,184]],[[224,196],[251,174]],[[275,167],[245,189]]],"centre":[241,182]},{"cellLines":[[[272,172],[295,181]],[[263,178],[301,191]],[[257,183],[302,200]]],"centre":[283,186]},{"cellLines":[[[240,185],[258,205]],[[231,193],[255,219]],[[220,201],[252,232]]],"centre":[242,206]},{"cellLines":[[[258,204],[253,234]],[[268,205],[263,238]],[[275,207],[273,245]]],"centre":[265,223]},{"cellLines":[[[257,201],[283,211]],[[247,191],[284,203]]],"centre":[268,200]},{"cellLines":[[[283,194],[283,224]],[[293,197],[290,229]],[[300,201],[300,235]]],"centre":[291,214]},{"cellLines":[[[275,221],[302,237]],[[274,232],[302,250]],[[273,248],[302,260]]],"centre":[288,241]},{"cellLines":[[[3,200],[36,207]],[[42,220],[1,206]],[[1,217],[47,230]]],"centre":[25,212]},{"cellLines":[[[1,228],[13,221]],[[27,226],[1,237]],[[2,248],[42,229]]],"centre":[13,236]},{"cellLines":[[[35,205],[52,242]],[[44,200],[61,241]],[[54,197],[73,237]]],"centre":[52,220]},{"cellLines":[[[58,209],[69,193]],[[67,224],[83,202]],[[73,236],[100,199]]],"centre":[77,212]},{"cellLines":[[[109,197],[136,222]],[[101,202],[130,229]],[[95,208],[124,235]]],"centre":[115,217]},{"cellLines":[[[118,206],[129,188]],[[144,185],[126,212]],[[135,220],[155,183]]],"centre":[135,200]},{"cellLines":[[[154,189],[180,189]],[[148,199],[190,197]],[[144,207],[199,207]]],"centre":[169,197]},{"cellLines":[[[2,250],[1,281]],[[12,246],[11,278]],[[21,242],[21,275]],[[30,237],[30,270]]],"centre":[15,259]},{"cellLines":[[[31,250],[48,232]],[[53,242],[31,263]],[[39,267],[62,243]]],"centre":[44,254]},{"cellLines":[[[88,219],[104,219]],[[81,228],[111,227]],[[73,238],[120,238]]],"centre":[96,229]},{"cellLines":[[[141,233],[154,209]],[[165,209],[145,244]],[[177,208],[148,252]]],"centre":[154,228]},{"cellLines":[[[169,225],[199,207]],[[183,230],[220,210]]],"centre":[192,218]},{"cellLines":[[[213,215],[197,242]],[[208,253],[227,209]],[[233,215],[220,252]]],"centre":[217,230]},{"cellLines":[[[230,227],[265,240]],[[228,235],[266,249]],[[225,245],[257,256]]],"centre":[246,243]},{"cellLines":[[[239,267],[273,246]],[[243,273],[278,257]],[[247,283],[279,268]]],"centre":[260,265]},{"cellLines":[[[277,251],[286,289]],[[291,258],[297,289]]],"centre":[287,272]},{"cellLines":[[[284,282],[263,299]],[[283,275],[249,298]]],"centre":[269,289]},{"cellLines":[[[232,249],[251,298]],[[221,253],[236,288]],[[208,253],[229,295]]],"centre":[228,271]},{"cellLines":[[[180,274],[207,253]],[[195,280],[211,262]],[[218,272],[206,284]]],"centre":[203,272]},{"cellLines":[[[191,227],[204,258]],[[195,264],[183,231]],[[187,269],[171,226]]],"centre":[189,248]},{"cellLines":[[[176,242],[152,283]],[[172,229],[151,266]]],"centre":[161,256]},{"cellLines":[[[163,268],[226,291]],[[157,276],[214,301]]],"centre":[191,283]},{"cellLines":[[[114,240],[127,270]],[[123,236],[139,270]],[[130,230],[147,268]]],"centre":[131,256]},{"cellLines":[[[108,268],[151,270]],[[116,284],[152,284]],[[122,298],[160,299]]],"centre":[135,284]},{"cellLines":[[[62,241],[106,261]],[[66,253],[100,271]],[[65,265],[93,284]]],"centre":[84,263]},{"cellLines":[[[84,254],[91,240]],[[106,239],[94,258]],[[116,242],[105,264]]],"centre":[102,246]},{"cellLines":[[[71,309],[115,282]],[[110,269],[58,307]]],"centre":[89,293]},{"cellLines":[[[-4,285],[42,266]],[[0,293],[41,274]],[[1,302],[45,283]]],"centre":[20,286]},{"cellLines":[[[41,269],[48,294]],[[49,257],[61,304]],[[64,245],[72,299]]],"centre":[56,280]},{"cellLines":[[[1,302],[7,319]],[[15,299],[20,311]],[[29,293],[40,311]],[[40,287],[54,311]]],"centre":[23,300]}];

function distancePointToSegment(point, segment) {
  const vx = segment.x2 - segment.x1;
  const vy = segment.y2 - segment.y1;
  const wx = point.x - segment.x1;
  const wy = point.y - segment.y1;
  const lengthSq = vx * vx + vy * vy;
  if (lengthSq <= 0) {
    const dx = point.x - segment.x1;
    const dy = point.y - segment.y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  const t = clamp((wx * vx + wy * vy) / lengthSq, 0, 1);
  const px = segment.x1 + vx * t;
  const py = segment.y1 + vy * t;
  const dx = point.x - px;
  const dy = point.y - py;
  return Math.sqrt(dx * dx + dy * dy);
}

function isPointCloseToExternalWall(point, wallSegments, wallDistance) {
  return wallSegments.some((segment) => distancePointToSegment(point, segment) <= wallDistance);
}

function getExternalHatchingBounds(generatedMap, tileSize, wallDistance) {
  const bounds = generatedMap.contentBounds || { x: 0, y: 0, width: generatedMap.config.mapWidth, height: generatedMap.config.mapHeight };
  const pad = tileSize + wallDistance;
  return {
    minTileX: Math.floor((bounds.x - pad) / tileSize),
    maxTileX: Math.ceil((bounds.x + bounds.width + pad) / tileSize),
    minTileY: Math.floor((bounds.y - pad) / tileSize),
    maxTileY: Math.ceil((bounds.y + bounds.height + pad) / tileSize),
  };
}

function createHatchLineFromPattern(origin, scale, rawLine) {
  const start = rawLine[0];
  const end = rawLine[1];
  return {
    x1: origin.x + start[0] * scale,
    y1: origin.y + start[1] * scale,
    x2: origin.x + end[0] * scale,
    y2: origin.y + end[1] * scale,
  };
}

function createExternalHatchingLines(generatedMap) {
  const { config, dungeonMask } = generatedMap;
  const wallSegments = dungeonMask.externalWallSegments || [];
  if (wallSegments.length === 0) return [];

  const tileSize = config.gridSize * 7.5;
  const wallDistance = config.gridSize * 1.45;
  const scale = tileSize / 300;
  const bounds = getExternalHatchingBounds(generatedMap, tileSize, wallDistance);
  const lines = [];

  for (let tileX = bounds.minTileX; tileX <= bounds.maxTileX; tileX += 1) {
    for (let tileY = bounds.minTileY; tileY <= bounds.maxTileY; tileY += 1) {
      const origin = { x: tileX * tileSize, y: tileY * tileSize };
      HATCH_PATTERN_LIBRARY.forEach((pattern) => {
        const centre = {
          x: origin.x + pattern.centre[0] * scale,
          y: origin.y + pattern.centre[1] * scale,
        };
        if (!isPointCloseToExternalWall(centre, wallSegments, wallDistance)) return;
        pattern.cellLines.forEach((rawLine) => {
          lines.push(createHatchLineFromPattern(origin, scale, rawLine));
        });
      });
    }
  }

  return lines;
}

function renderExternalHatching(generatedMap) {
  const lines = createExternalHatchingLines(generatedMap);
  if (lines.length === 0) return null;
  const d = lines.map((line) => `M${line.x1.toFixed(2)} ${line.y1.toFixed(2)}L${line.x2.toFixed(2)} ${line.y2.toFixed(2)}`).join(" ");
  return <g className="external-hatching"><path d={d} /></g>;
}

function isMapPointInsideFloor(point, floorSet, gridSize) {
  return floorSet.has(cellKey(Math.floor(point.x / gridSize), Math.floor(point.y / gridSize)));
}

function inferExternalWallNormal(segment, floorSet, gridSize) {
  const horizontal = segment.y1 === segment.y2;
  const mid = {
    x: (segment.x1 + segment.x2) / 2,
    y: (segment.y1 + segment.y2) / 2,
  };
  const offset = gridSize * 0.5;

  if (horizontal) {
    const above = isMapPointInsideFloor({ x: mid.x, y: mid.y - offset }, floorSet, gridSize);
    const below = isMapPointInsideFloor({ x: mid.x, y: mid.y + offset }, floorSet, gridSize);
    if (above && !below) return { x: 0, y: 1 };
    if (below && !above) return { x: 0, y: -1 };
    return null;
  }

  const left = isMapPointInsideFloor({ x: mid.x - offset, y: mid.y }, floorSet, gridSize);
  const right = isMapPointInsideFloor({ x: mid.x + offset, y: mid.y }, floorSet, gridSize);
  if (left && !right) return { x: 1, y: 0 };
  if (right && !left) return { x: -1, y: 0 };
  return null;
}

function boundaryPointKey(point) {
  return `${point.x},${point.y}`;
}

function boundaryEdgeKey(a, b) {
  const ka = boundaryPointKey(a);
  const kb = boundaryPointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

function parseBoundaryPoint(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function addBoundaryAdjacency(adjacency, from, to) {
  const key = boundaryPointKey(from);
  if (!adjacency.has(key)) adjacency.set(key, []);
  adjacency.get(key).push(to);
}

function buildBoundaryLoops(segments) {
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
      const currentKey = boundaryPointKey(current);
      const candidates = (adjacency.get(currentKey) || [])
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

function createRoughBoundaryPoint(point, tangent, normal, config, loopIndex, segmentIndex, stepIndex) {
  const rng = createSeededRng(hashStringToSeed(config.seed, loopIndex, segmentIndex, stepIndex, point.x, point.y, "halo-geometry"));
  const maxNormalOffset = config.gridSize * 0.32;
  const broad = (rng() - 0.5) * config.gridSize * 0.34;
  const chip = rng() > 0.86 ? (rng() > 0.5 ? 1 : -1) * config.gridSize * (0.06 + rng() * 0.1) : 0;
  const normalOffset = clamp(broad + chip, -maxNormalOffset, maxNormalOffset);
  const tangentOffset = clamp((rng() - 0.5) * config.gridSize * 0.1, -config.gridSize * 0.05, config.gridSize * 0.05);
  return {
    x: point.x + normal.x * normalOffset + tangent.x * tangentOffset,
    y: point.y + normal.y * normalOffset + tangent.y * tangentOffset,
  };
}

function limitRoughBoundaryDeltas(points, config) {
  if (points.length < 3) return points;
  const maxDistance = config.gridSize * 1.16;
  const limited = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const previous = limited[limited.length - 1];
    const current = points[index];
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      limited.push({
        x: previous.x + dx * ratio,
        y: previous.y + dy * ratio,
      });
    } else {
      limited.push(current);
    }
  }
  const first = limited[0];
  const last = limited[limited.length - 1];
  const closingDx = first.x - last.x;
  const closingDy = first.y - last.y;
  const closingDistance = Math.hypot(closingDx, closingDy);
  if (closingDistance > maxDistance) {
    const ratio = maxDistance / closingDistance;
    limited[0] = {
      x: last.x + closingDx * ratio,
      y: last.y + closingDy * ratio,
    };
  }
  return limited;
}

function roughenBoundaryLoop(loop, config, loopIndex) {
  const points = [];
  const stepLength = config.gridSize * 0.40;
  for (let segmentIndex = 0; segmentIndex < loop.length; segmentIndex += 1) {
    const a = loop[segmentIndex];
    const b = loop[(segmentIndex + 1) % loop.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length <= 0) continue;
    const tangent = { x: dx / length, y: dy / length };
    const normal = { x: -tangent.y, y: tangent.x };
    const steps = Math.max(1, Math.ceil(length / stepLength));
    for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
      if (segmentIndex > 0 || stepIndex > 0) {
        const t = stepIndex / steps;
        const base = { x: a.x + dx * t, y: a.y + dy * t };
        points.push(createRoughBoundaryPoint(base, tangent, normal, config, loopIndex, segmentIndex, stepIndex));
      } else {
        points.push(createRoughBoundaryPoint(a, tangent, normal, config, loopIndex, segmentIndex, stepIndex));
      }
    }
  }
  return limitRoughBoundaryDeltas(points, config);
}

function createExternalHaloBufferPath(generatedMap) {
  const loops = buildBoundaryLoops(generatedMap.dungeonMask.externalWallSegments || []);
  return loops
    .map((loop, loopIndex) => roughenBoundaryLoop(loop, generatedMap.config, loopIndex))
    .filter((points) => points.length > 2)
    .map((points) => points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("") + "Z")
    .join(" ");
}

function renderExternalHatchingUnderlay(generatedMap) {
  const path = createExternalHaloBufferPath(generatedMap);
  if (!path) return null;
  const bufferWidth = generatedMap.config.gridSize * 1.34;
  return (
    <g className="external-hatching-underlay">
      <path className="halo-buffer" d={path} strokeWidth={bufferWidth} />
    </g>
  );
}

function createRoughWallPath(wall, config, index, layer = "main") {
  const length = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
  if (length <= 0) return "";
  const rng = createSeededRng(hashStringToSeed(config.seed, index, wall.x1, wall.y1, wall.x2, wall.y2, layer, "wall-rough-path"));
  const dx = (wall.x2 - wall.x1) / length;
  const dy = (wall.y2 - wall.y1) / length;
  const nx = -dy;
  const ny = dx;
  const stepLength = config.gridSize * (layer === "main" ? 0.54 : layer === "door" ? 0.32 : layer === "door-sketch" ? 0.36 : 0.66);
  const steps = Math.max(1, Math.ceil(length / stepLength));
  const jitterAmount = layer === "main" ? 1.02 : layer === "door" ? 1.28 : layer === "door-sketch" ? 1.55 : 1.52;
  const tangentJitterAmount = layer === "main" ? 0.28 : layer === "door" ? 0.32 : layer === "door-sketch" ? 0.42 : 0.48;
  const points = [];

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const endpointFactor = step === 0 || step === steps ? 0.26 : 1;
    const normalJitter = (rng() - 0.5) * jitterAmount * endpointFactor;
    const tangentJitter = (rng() - 0.5) * tangentJitterAmount * endpointFactor;
    points.push({
      x: wall.x1 + (wall.x2 - wall.x1) * t + nx * normalJitter + dx * tangentJitter,
      y: wall.y1 + (wall.y2 - wall.y1) * t + ny * normalJitter + dy * tangentJitter,
    });
  }

  return points.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("");
}

function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function angleDistance(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, Math.PI * 2 - diff);
}

function isCirclePointInsideRectAtAngle(circle, rect, angle, inset = 0) {
  const x = circle.cx + Math.cos(angle) * circle.r;
  const y = circle.cy + Math.sin(angle) * circle.r;
  return x >= rect.x + inset && x <= rect.x + rect.w - inset && y >= rect.y + inset && y <= rect.y + rect.h - inset;
}

function getCircleRectIntersectionAngles(circle, rect) {
  const angles = [];
  const addPoint = (x, y) => {
    if (x < rect.x - 0.01 || x > rect.x + rect.w + 0.01 || y < rect.y - 0.01 || y > rect.y + rect.h + 0.01) return;
    angles.push(normalizeAngle(Math.atan2(y - circle.cy, x - circle.cx)));
  };

  [rect.x, rect.x + rect.w].forEach((x) => {
    const dx = x - circle.cx;
    const remaining = circle.r * circle.r - dx * dx;
    if (remaining < 0) return;
    const dy = Math.sqrt(Math.max(0, remaining));
    addPoint(x, circle.cy - dy);
    addPoint(x, circle.cy + dy);
  });

  [rect.y, rect.y + rect.h].forEach((y) => {
    const dy = y - circle.cy;
    const remaining = circle.r * circle.r - dy * dy;
    if (remaining < 0) return;
    const dx = Math.sqrt(Math.max(0, remaining));
    addPoint(circle.cx - dx, y);
    addPoint(circle.cx + dx, y);
  });

  return Array.from(new Set(angles.map((angle) => Math.round(angle * 100000) / 100000)));
}

function getCircleRectInsideIntervals(circle, rect, gridSize) {
  const full = Math.PI * 2;
  const intersections = getCircleRectIntersectionAngles(circle, rect);
  if (intersections.length === 0) {
    const centerAngle = normalizeAngle(Math.atan2(rect.y + rect.h / 2 - circle.cy, rect.x + rect.w / 2 - circle.cx));
    return isCirclePointInsideRectAtAngle(circle, rect, centerAngle) ? [{ start: 0, end: full }] : [];
  }

  const cuts = [0, full, ...intersections].sort((a, b) => a - b);
  const intervals = [];
  const inset = Math.min(gridSize * 0.015, 0.5);
  for (let index = 0; index < cuts.length - 1; index += 1) {
    const start = cuts[index];
    const end = cuts[index + 1];
    if (end - start <= 0.0001) continue;
    const mid = (start + end) / 2;
    if (isCirclePointInsideRectAtAngle(circle, rect, mid, inset)) intervals.push({ start, end });
  }

  const wrapMid = normalizeAngle((cuts[cuts.length - 1] + full + cuts[0]) / 2);
  if (isCirclePointInsideRectAtAngle(circle, rect, wrapMid, inset)) {
    intervals.push({ start: cuts[cuts.length - 1], end: full });
    intervals.push({ start: 0, end: cuts[0] });
  }

  return mergeAngleIntervals(intervals);
}

function shrinkCircleDoorGapForWallOverlap(interval, circle, gridSize) {
  const overlap = Math.max(0.01, gridSize * 0.025 / Math.max(1, circle.r));
  const length = interval.end - interval.start;
  if (length <= overlap * 2.6) return interval;
  return {
    start: interval.start + overlap,
    end: interval.end - overlap,
  };
}

function getCircleDoorGaps(region, generatedMap) {
  const circle = getCircleGeometryFromRegion(region, generatedMap.config.gridSize);
  const g = generatedMap.config.gridSize;
  const squareGaps = getCircleCompositeSquareCells(generatedMap, region).flatMap((cell) => {
    const rect = { x: cell.x * g, y: cell.y * g, w: g, h: g };
    return getCircleRectInsideIntervals(circle, rect, g)
      .map((interval) => shrinkCircleDoorGapForWallOverlap(interval, circle, g))
      .filter((interval) => interval.end - interval.start > 0.025);
  });
  const accessGaps = (generatedMap.dungeonMask?.mapAccesses || generatedMap.mapAccesses || [])
    .filter((access) => access.regionId === region.id)
    .flatMap((access) => {
      const rect = { x: access.cell.x * g, y: access.cell.y * g, w: g, h: g };
      return getCircleRectInsideIntervals(circle, rect, g)
        .map((interval) => shrinkCircleDoorGapForWallOverlap(interval, circle, g))
        .filter((interval) => interval.end - interval.start > 0.025);
    });
  return [...squareGaps, ...accessGaps];
}

function mergeAngleIntervals(intervals) {
  if (intervals.length === 0) return [];
  const expanded = intervals.flatMap((interval) => interval.start <= interval.end
    ? [interval]
    : [{ start: 0, end: interval.end }, { start: interval.start, end: Math.PI * 2 }]);
  expanded.sort((a, b) => a.start - b.start);
  const merged = [];
  expanded.forEach((interval) => {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) merged.push({ ...interval });
    else last.end = Math.max(last.end, interval.end);
  });
  return merged;
}

function getVisibleCircleIntervals(gaps) {
  const full = Math.PI * 2;
  const merged = mergeAngleIntervals(gaps);
  if (merged.length === 0) return [{ start: 0, end: full }];
  const visible = [];
  let cursor = 0;
  merged.forEach((gap) => {
    if (gap.start > cursor) visible.push({ start: cursor, end: gap.start });
    cursor = Math.max(cursor, gap.end);
  });
  if (cursor < full) visible.push({ start: cursor, end: full });
  return visible.filter((interval) => interval.end - interval.start > 0.035);
}

function createCircleArcPathFromInterval(circle, interval) {
  const startX = circle.cx + Math.cos(interval.start) * circle.r;
  const startY = circle.cy + Math.sin(interval.start) * circle.r;
  const endX = circle.cx + Math.cos(interval.end) * circle.r;
  const endY = circle.cy + Math.sin(interval.end) * circle.r;
  const largeArc = interval.end - interval.start > Math.PI ? 1 : 0;
  return `M${startX.toFixed(2)} ${startY.toFixed(2)}A${circle.r.toFixed(2)} ${circle.r.toFixed(2)} 0 ${largeArc} 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`;
}

function createCircleCompositeArcPath(region, generatedMap) {
  const circle = getCircleGeometryFromRegion(region, generatedMap.config.gridSize);
  const gaps = getCircleDoorGaps(region, generatedMap);
  const intervals = getVisibleCircleIntervals(gaps);
  return intervals.map((interval) => createCircleArcPathFromInterval(circle, interval)).join(" ");
}

function createRoughCircleWallPath(region, generatedMap, layer = "main") {
  const circle = getCircleGeometryFromRegion(region, generatedMap.config.gridSize);
  const gaps = getCircleDoorGaps(region, generatedMap);
  const intervals = getVisibleCircleIntervals(gaps);
  const rng = createSeededRng(hashStringToSeed(generatedMap.config.seed, region.id, layer, "circle-wall"));
  const stepAngle = Math.max(0.035, generatedMap.config.gridSize * 0.42 / Math.max(1, circle.r));
  const jitter = layer === "main" ? 0.8 : 1.15;
  return intervals.map((interval, intervalIndex) => {
    const steps = Math.max(3, Math.ceil((interval.end - interval.start) / stepAngle));
    const points = [];
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const angle = interval.start + (interval.end - interval.start) * t;
      const endpointFactor = step === 0 || step === steps ? 0.28 : 1;
      const radiusJitter = (rng() - 0.5) * jitter * endpointFactor;
      const tangentJitter = (rng() - 0.5) * 0.35 * endpointFactor;
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const tx = -ny;
      const ty = nx;
      const r = circle.r + radiusJitter;
      points.push({
        x: circle.cx + nx * r + tx * tangentJitter,
        y: circle.cy + ny * r + ty * tangentJitter,
      });
    }
    return points.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("");
  }).join(" ");
}

function renderCircleRoomWalls(generatedMap) {
  const circles = generatedMap.regions.filter((region) => region.shape === "circle");
  if (circles.length === 0) return null;
  return (
    <>
      <g className="wall-main circular-room-walls">
        {circles.map((region) => (
          <React.Fragment key={`circle-composite-wall-${region.id}`}>
            <path d={createRoughCircleWallPath(region, generatedMap, "main")} />
            {getCirclePortalSquareWallSegments(region, generatedMap).map((segment, index) => (
              <path key={`circle-portal-wall-${region.id}-${index}`} d={createRoughWallPath(segment, generatedMap.config, `circle-portal-${region.id}-${index}`, "main")} />
            ))}
          </React.Fragment>
        ))}
      </g>
      <g className="wall-sketch circular-room-wall-sketch">
        {circles.map((region) => (
          <React.Fragment key={`circle-composite-wall-sketch-${region.id}`}>
            <path d={createRoughCircleWallPath(region, generatedMap, "sketch")} />
            {getCirclePortalSquareWallSegments(region, generatedMap).map((segment, index) => (
              <path key={`circle-portal-wall-sketch-${region.id}-${index}`} d={createRoughWallPath(segment, generatedMap.config, `circle-portal-sketch-${region.id}-${index}`, "sketch")} />
            ))}
          </React.Fragment>
        ))}
      </g>
    </>
  );
}

function createRoughOrganicCorridorWallPath(corridor, generatedMap, layer = "main") {
  return buildOrganicCorridorBoundaryPath(corridor, generatedMap, generatedMap.config.gridSize, layer);
}

function renderOrganicCorridorWalls(generatedMap) {
  const organicCorridors = generatedMap.corridors.filter(isOrganicCorridor);
  if (organicCorridors.length === 0) return null;
  return (
    <>
      <g className="wall-main organic-corridor-walls">
        {organicCorridors.map((corridor) => <path key={`organic-corridor-wall-${corridor.id}`} d={createRoughOrganicCorridorWallPath(corridor, generatedMap, "main")} />)}
      </g>
      <g className="wall-sketch organic-corridor-wall-sketch">
        {organicCorridors.map((corridor) => <path key={`organic-corridor-wall-sketch-${corridor.id}`} d={createRoughOrganicCorridorWallPath(corridor, generatedMap, "sketch")} />)}
      </g>
    </>
  );
}

function renderCircularRoomSurfaceOverlay(generatedMap) {
  const circles = generatedMap.regions.filter((region) => region.shape === "circle");
  if (circles.length === 0) return null;
  const d = circles.map((region) => buildCircleRoomPath(region, generatedMap.config.gridSize)).join(" ");
  return (
    <g className="circular-room-surface-cover">
      <path className="floor-fill" d={d} fillRule="nonzero" />
      <path className="room-floor-accent" d={d} fillRule="nonzero" />
    </g>
  );
}

function createRoughDoorPanelPath(rect, config, index) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return "";
  const rng = createSeededRng(hashStringToSeed(config.seed, index, rect.x, rect.y, rect.width, rect.height, "door-panel-rough-path"));
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  const stepLength = config.gridSize * 0.22;
  const points = [];

  for (let sideIndex = 0; sideIndex < corners.length; sideIndex += 1) {
    const a = corners[sideIndex];
    const b = corners[(sideIndex + 1) % corners.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length <= 0) continue;
    const tangent = { x: dx / length, y: dy / length };
    const normal = { x: -tangent.y, y: tangent.x };
    const steps = Math.max(1, Math.ceil(length / stepLength));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      const endpointFactor = step === 0 ? 0.34 : 1;
      const normalJitter = (rng() - 0.5) * 1.05 * endpointFactor;
      const tangentJitter = (rng() - 0.5) * 0.42 * endpointFactor;
      points.push({
        x: a.x + dx * t + normal.x * normalJitter + tangent.x * tangentJitter,
        y: a.y + dy * t + normal.y * normalJitter + tangent.y * tangentJitter,
      });
    }
  }

  return points.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("") + "Z";
}

function renderWallShadows(generatedMap) {
  const { config } = generatedMap;
  const walls = getDrawableWallSegments(generatedMap);
  const circles = generatedMap.regions.filter((region) => region.shape === "circle");
  const organicCorridors = generatedMap.corridors.filter(isOrganicCorridor);
  const crossings = getCrossLevelCorridorIntersectionCells(generatedMap.corridors)
    .map((crossing) => {
      const topLevel = Math.max(...crossing.levels);
      const topCorridor = crossing.corridors.find((corridor) => getCorridorPlanarLevel(corridor) === topLevel) || crossing.corridors[0];
      return {
        ...crossing,
        topLevel,
        topCorridor,
        topWalls: getCorridorLocalWallSegmentsForCell(topCorridor, crossing.cell, config.gridSize),
      };
    })
    .filter((crossing) => crossing.topCorridor && crossing.topWalls.length > 0)
    .sort((a, b) => a.topLevel - b.topLevel);

  return (
    <g className="wall-shadow" clipPath="url(#clip-dungeon-floor)" aria-hidden="true">
      {walls.map((wall, index) => (
        <path key={`wall-shadow-${index}`} d={createRoughWallPath(wall, config, index, "main")} />
      ))}
      {circles.map((region) => (
        <React.Fragment key={`circle-wall-shadow-${region.id}`}>
          <path d={createRoughCircleWallPath(region, generatedMap, "main")} />
          {getCirclePortalSquareWallSegments(region, generatedMap).map((segment, index) => (
            <path
              key={`circle-portal-wall-shadow-${region.id}-${index}`}
              d={createRoughWallPath(segment, config, `circle-portal-${region.id}-${index}`, "main")}
            />
          ))}
        </React.Fragment>
      ))}
      {organicCorridors.map((corridor) => (
        <path
          key={`organic-corridor-wall-shadow-${corridor.id}`}
          d={createRoughOrganicCorridorWallPath(corridor, generatedMap, "main")}
        />
      ))}
      {crossings.flatMap((crossing, index) => crossing.topWalls.map((wall, wallIndex) => (
        <path
          key={`cross-level-wall-shadow-${crossing.key}-${wallIndex}`}
          d={createRoughWallPath(wall, config, `cross-level-top-${crossing.key}-${index}-${wallIndex}`, "main")}
        />
      )))}
    </g>
  );
}

function renderRoughWalls(generatedMap) {
  const { config } = generatedMap;
  const walls = getDrawableWallSegments(generatedMap);
  return (
    <g className="wall-main">
      {walls.map((wall, index) => (
        <path key={`wall-${index}`} d={createRoughWallPath(wall, config, index, "main")} />
      ))}
    </g>
  );
}

function renderWallSketch(generatedMap) {
  const { config } = generatedMap;
  const walls = getDrawableWallSegments(generatedMap);
  return (
    <g className="wall-sketch">
      {walls.map((wall, index) => (
        <path key={`wall-sketch-${index}`} d={createRoughWallPath(wall, config, index, "sketch")} />
      ))}
    </g>
  );
}

function renderWallImperfections(generatedMap) {
  const { config } = generatedMap;
  return (
    <g className="wall-breaks">
      {generatedMap.regions.flatMap((region) => {
        const flags = getRegionSemanticFlags(region);
        const intensity = (flags.hazard ? 2 : 0) + (flags.ruined ? 2 : 0) + (flags.crypt ? 1 : 0);
        if (intensity <= 0) return [];
        const boundary = getBoundaryCells(region);
        const rng = createSeededRng(hashStringToSeed(config.seed, region.id, "wall-breaks"));
        const selected = boundary
          .filter((anchor) => hashStringToSeed(config.seed, region.id, anchor.side, anchor.cell.x, anchor.cell.y, "break") % 100 < 10 + intensity * 7)
          .slice(0, intensity + 2);
        return selected.map((anchor, index) => {
          const point = getAnchorHandlePoint(anchor, config.gridSize);
          const dx = anchor.side === "north" || anchor.side === "south" ? 1 : 0;
          const dy = anchor.side === "east" || anchor.side === "west" ? 1 : 0;
          const jitter = 3 + rng() * 4;
          const d = `M${point.x - dx * 5} ${point.y - dy * 5}l${dx * 4 + (rng() - 0.5) * jitter} ${dy * 4 + (rng() - 0.5) * jitter}l${dx * 5 + (rng() - 0.5) * jitter} ${dy * 5 + (rng() - 0.5) * jitter}`;
          return <path key={`wall-break-${region.id}-${index}`} className={flags.hazard || flags.ruined ? "break" : "crack"} d={d} />;
        });
      })}
    </g>
  );
}

function getDoorGeometry(door, gridSize) {
  const horizontal = Math.abs(door.x2 - door.x1) >= Math.abs(door.y2 - door.y1);
  const cx = (door.x1 + door.x2) / 2;
  const cy = (door.y1 + door.y2) / 2;
  const length = gridSize * 0.62;
  const thickness = gridSize * 0.24;
  const wallLength = gridSize * 0.96;
  return horizontal
    ? {
      horizontal,
      cx,
      cy,
      rect: { x: cx - length / 2, y: cy - thickness / 2, width: length, height: thickness },
      line: { x1: cx - wallLength / 2, y1: cy, x2: cx + wallLength / 2, y2: cy },
    }
    : {
      horizontal,
      cx,
      cy,
      rect: { x: cx - thickness / 2, y: cy - length / 2, width: thickness, height: length },
      line: { x1: cx, y1: cy - wallLength / 2, x2: cx, y2: cy + wallLength / 2 },
    };
}

function renderLockedDoorMark(geometry, index) {
  const pad = Math.min(geometry.rect.width, geometry.rect.height) * 0.16;
  const x1 = geometry.rect.x + pad;
  const y1 = geometry.rect.y + pad;
  const x2 = geometry.rect.x + geometry.rect.width - pad;
  const y2 = geometry.rect.y + geometry.rect.height - pad;
  return (
    <g className="locked-door-mark" key={`locked-door-mark-${index}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <line x1={x2} y1={y1} x2={x1} y2={y2} />
    </g>
  );
}

function getDoorSquareCenter(door, gridSize) {
  if (door?.outsideCell) {
    return {
      x: (door.outsideCell.x + 0.5) * gridSize,
      y: (door.outsideCell.y + 0.5) * gridSize,
    };
  }
  const cx = (door.x1 + door.x2) / 2;
  const cy = (door.y1 + door.y2) / 2;
  if (door.side === "north") return { x: cx, y: cy + gridSize / 2 };
  if (door.side === "south") return { x: cx, y: cy - gridSize / 2 };
  if (door.side === "west") return { x: cx + gridSize / 2, y: cy };
  if (door.side === "east") return { x: cx - gridSize / 2, y: cy };
  return { x: cx, y: cy };
}

function normalizeDirectionVector(vector) {
  const length = Math.hypot(vector?.x || 0, vector?.y || 0) || 1;
  return { x: (vector?.x || 0) / length, y: (vector?.y || 0) / length };
}

function getDoorCorridorTravelDirection(door, generatedMap) {
  const fallback = normalizeDirectionVector(door?.normal || { x: 1, y: 0 });
  const corridor = generatedMap?.corridors?.find((item) => item.id === door?.corridorId);
  const cell = door?.outsideCell;
  if (!corridor || !cell || !Array.isArray(corridor.floorCells) || corridor.floorCells.length < 2) return fallback;
  const topologyCells = getCorridorTopologyCells(corridor);
  const index = topologyCells.findIndex((candidate) => candidate.x === cell.x && candidate.y === cell.y);
  if (index < 0) return fallback;
  const next = index === 0 ? topologyCells[1] : index === topologyCells.length - 1 ? topologyCells[index - 1] : topologyCells[index + 1];
  if (!next) return fallback;
  return normalizeDirectionVector({ x: next.x - cell.x, y: next.y - cell.y });
}

function createStairStepSegments(door, generatedMap, stairTransition, gridSize) {
  const center = getDoorSquareCenter(door, gridSize);
  const travel = getDoorCorridorTravelDirection(door, generatedMap);
  const descent = normalizeStairTransition(stairTransition, "none") === "up"
    ? { x: -travel.x, y: -travel.y }
    : travel;
  const tangent = { x: -descent.y, y: descent.x };
  const stepCount = 4;
  const maxLength = gridSize * 0.68;
  const minLength = gridSize * 0.34;
  const runSpan = gridSize * 0.66;
  const stepGap = runSpan / Math.max(1, stepCount - 1);
  return Array.from({ length: stepCount }, (_, stepIndex) => {
    const t = stepIndex / Math.max(1, stepCount - 1);
    const length = maxLength - (maxLength - minLength) * t;
    const offset = -runSpan / 2 + stepIndex * stepGap;
    const cx = center.x + descent.x * offset;
    const cy = center.y + descent.y * offset;
    return {
      x1: cx - tangent.x * length / 2,
      y1: cy - tangent.y * length / 2,
      x2: cx + tangent.x * length / 2,
      y2: cy + tangent.y * length / 2,
    };
  });
}

function renderStairMark(door, stairTransition, index, generatedMap) {
  const transition = normalizeStairTransition(stairTransition, "none");
  if (transition === "none") return null;
  const segments = createStairStepSegments(door, generatedMap, transition, generatedMap.config.gridSize);
  return (
    <g className={`stair-mark stair-mark--${transition}`} key={`stair-mark-${index}`}>
      <g className="stair-mark__main">
        {segments.map((segment, stepIndex) => (
          <path
            key={`stair-step-main-${index}-${stepIndex}`}
            d={createRoughWallPath(segment, generatedMap.config, `stair-main-${door.corridorId}-${door.endpoint}-${index}-${stepIndex}`, "door")}
          />
        ))}
      </g>
      <g className="stair-mark__sketch">
        {segments.map((segment, stepIndex) => (
          <path
            key={`stair-step-sketch-${index}-${stepIndex}`}
            d={createRoughWallPath(segment, generatedMap.config, `stair-sketch-${door.corridorId}-${door.endpoint}-${index}-${stepIndex}`, "door-sketch")}
          />
        ))}
      </g>
    </g>
  );
}

function renderDoorSymbols(generatedMap) {
  const { config, dungeonMask } = generatedMap;
  return (
    <g className="door-symbols">
      {dungeonMask.doorSegments.map((door, index) => {
        const doorType = normalizeDoorType(door.doorType, door.secret ? "secret" : "default");
        const stairTransition = normalizeStairTransition(door.stairTransition, "none");
        if (doorType === "open" && stairTransition === "none") return null;
        const geometry = getDoorGeometry(door, config.gridSize);
        const symbolClass = `door-symbol door-symbol--${doorType} ${stairTransition !== "none" ? `door-symbol--stairs-${stairTransition}` : ""}`;
        const panelClass = ["door-panel", doorType === "secret" ? "secret-door-panel" : "", doorType === "locked" ? "locked-door-panel" : ""].filter(Boolean).join(" ");
        return (
          <g key={`door-symbol-${index}`} className={symbolClass}>
            {doorType !== "open" && (
              <>
                <path className="door-wall-line" d={createRoughWallPath(geometry.line, config, `door-${index}`, "door")} />
                <path className="door-wall-sketch" d={createRoughWallPath(geometry.line, config, `door-sketch-${index}`, "door-sketch")} />
                <path className={panelClass} d={createRoughDoorPanelPath(geometry.rect, config, `door-panel-${index}`)} />
                {doorType === "locked" && renderLockedDoorMark(geometry, index)}
              </>
            )}
            {renderStairMark(door, stairTransition, index, generatedMap)}
          </g>
        );
      })}
    </g>
  );
}

function createMapAccessArrowHeadSegments(tip, tail, gridSize) {
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const tx = -uy;
  const ty = ux;
  const headLength = gridSize * 0.3;
  const headWidth = gridSize * 0.2;
  const base = {
    x: tip.x - ux * headLength,
    y: tip.y - uy * headLength,
  };
  return [
    { x1: tip.x, y1: tip.y, x2: base.x + tx * headWidth, y2: base.y + ty * headWidth },
    { x1: tip.x, y1: tip.y, x2: base.x - tx * headWidth, y2: base.y - ty * headWidth },
  ];
}

function renderMapAccessArrowHead(tip, tail, config, keyPrefix) {
  return createMapAccessArrowHeadSegments(tip, tail, config.gridSize).map((segment, index) => (
    <React.Fragment key={`${keyPrefix}-${index}`}>
      <path className="map-access-head-line" d={createRoughWallPath(segment, config, `${keyPrefix}-main-${index}`, "door")} />
      <path className="map-access-head-sketch" d={createRoughWallPath(segment, config, `${keyPrefix}-sketch-${index}`, "door-sketch")} />
    </React.Fragment>
  ));
}

function renderMapAccessSymbols(generatedMap) {
  const accesses = generatedMap.dungeonMask.mapAccesses || generatedMap.mapAccesses || [];
  if (accesses.length === 0) return null;
  const { config } = generatedMap;
  return (
    <g className="map-accesses">
      {accesses.map((access, index) => {
        const labelPoint = {
          x: access.start.x + access.normal.x * config.gridSize * 0.32,
          y: access.start.y + access.normal.y * config.gridSize * 0.32,
        };
        return (
          <g key={access.id || `map-access-${index}`} className={`map-access map-access--${access.type}`}>
            <path className="map-access-stem-sketch" d={createRoughWallPath({ x1: access.start.x, y1: access.start.y, x2: access.end.x, y2: access.end.y }, config, `map-access-stem-sketch-${access.id || index}`, "door-sketch")} />
            <path className="map-access-line" d={createRoughWallPath({ x1: access.start.x, y1: access.start.y, x2: access.end.x, y2: access.end.y }, config, `map-access-stem-${access.id || index}`, "door")} />
            {renderMapAccessArrowHead(access.end, access.start, config, `map-access-head-${access.id || index}`)}
            {access.doubleHeaded && renderMapAccessArrowHead(access.start, access.end, config, `map-access-head-back-${access.id || index}`)}
            {access.label && <text className="map-access-label" x={labelPoint.x} y={labelPoint.y} textAnchor="middle">{access.label}</text>}
          </g>
        );
      })}
    </g>
  );
}

function getDoorCutSegment(door, config) {
  return door;
}

function getOpenDoorWallGapSegment(door, config) {
  const horizontal = Math.abs(door.x2 - door.x1) >= Math.abs(door.y2 - door.y1);
  const cx = (door.x1 + door.x2) / 2;
  const cy = (door.y1 + door.y2) / 2;
  const length = config.gridSize * 1.12;
  return horizontal
    ? { x1: cx - length / 2, y1: cy, x2: cx + length / 2, y2: cy }
    : { x1: cx, y1: cy - length / 2, x2: cx, y2: cy + length / 2 };
}

function splitWallSegmentByGap(wall, gap) {
  const epsilon = 0.01;
  const wallHorizontal = Math.abs(wall.y1 - wall.y2) < epsilon;
  const gapHorizontal = Math.abs(gap.y1 - gap.y2) < epsilon;
  if (wallHorizontal !== gapHorizontal) return [wall];

  if (wallHorizontal) {
    if (Math.abs(wall.y1 - gap.y1) > epsilon) return [wall];
    const y = wall.y1;
    const wallMin = Math.min(wall.x1, wall.x2);
    const wallMax = Math.max(wall.x1, wall.x2);
    const gapMin = Math.min(gap.x1, gap.x2);
    const gapMax = Math.max(gap.x1, gap.x2);
    const start = Math.max(wallMin, gapMin);
    const end = Math.min(wallMax, gapMax);
    if (end <= start) return [wall];
    return [
      start - wallMin > epsilon ? { x1: wallMin, y1: y, x2: start, y2: y } : null,
      wallMax - end > epsilon ? { x1: end, y1: y, x2: wallMax, y2: y } : null,
    ].filter(Boolean);
  }

  if (Math.abs(wall.x1 - gap.x1) > epsilon) return [wall];
  const x = wall.x1;
  const wallMin = Math.min(wall.y1, wall.y2);
  const wallMax = Math.max(wall.y1, wall.y2);
  const gapMin = Math.min(gap.y1, gap.y2);
  const gapMax = Math.max(gap.y1, gap.y2);
  const start = Math.max(wallMin, gapMin);
  const end = Math.min(wallMax, gapMax);
  if (end <= start) return [wall];
  return [
    start - wallMin > epsilon ? { x1: x, y1: wallMin, x2: x, y2: start } : null,
    wallMax - end > epsilon ? { x1: x, y1: end, x2: x, y2: wallMax } : null,
  ].filter(Boolean);
}

function splitWallIntoGridSegments(wall, gridSize) {
  const epsilon = 0.01;
  const horizontal = Math.abs(wall.y1 - wall.y2) < epsilon;
  const vertical = Math.abs(wall.x1 - wall.x2) < epsilon;
  if (!horizontal && !vertical) return [wall];

  const segments = [];
  if (horizontal) {
    const y = wall.y1;
    const minX = Math.min(wall.x1, wall.x2);
    const maxX = Math.max(wall.x1, wall.x2);
    for (let x = minX; x < maxX - epsilon; x += gridSize) {
      segments.push({ x1: x, y1: y, x2: Math.min(x + gridSize, maxX), y2: y });
    }
    return segments.length > 0 ? segments : [wall];
  }

  const x = wall.x1;
  const minY = Math.min(wall.y1, wall.y2);
  const maxY = Math.max(wall.y1, wall.y2);
  for (let y = minY; y < maxY - epsilon; y += gridSize) {
    segments.push({ x1: x, y1: y, x2: x, y2: Math.min(y + gridSize, maxY) });
  }
  return segments.length > 0 ? segments : [wall];
}

function segmentMatches(a, b) {
  const epsilon = 0.01;
  const direct = Math.abs(a.x1 - b.x1) < epsilon && Math.abs(a.y1 - b.y1) < epsilon && Math.abs(a.x2 - b.x2) < epsilon && Math.abs(a.y2 - b.y2) < epsilon;
  const reverse = Math.abs(a.x1 - b.x2) < epsilon && Math.abs(a.y1 - b.y2) < epsilon && Math.abs(a.x2 - b.x1) < epsilon && Math.abs(a.y2 - b.y1) < epsilon;
  return direct || reverse;
}

function getCellBoundarySegmentsForCell(cell, gridSize) {
  const x = cell.x * gridSize;
  const y = cell.y * gridSize;
  const g = gridSize;
  return [
    { side: "north", x1: x, y1: y, x2: x + g, y2: y },
    { side: "east", x1: x + g, y1: y, x2: x + g, y2: y + g },
    { side: "south", x1: x + g, y1: y + g, x2: x, y2: y + g },
    { side: "west", x1: x, y1: y + g, x2: x, y2: y },
  ];
}

function getNeighborForCellSide(cell, side) {
  if (side === "north") return { x: cell.x, y: cell.y - 1 };
  if (side === "east") return { x: cell.x + 1, y: cell.y };
  if (side === "south") return { x: cell.x, y: cell.y + 1 };
  return { x: cell.x - 1, y: cell.y };
}

function getCircleRoomGridBoundarySegments(region, gridSize) {
  if (region.shape !== "circle") return [];
  const cells = new Set(region.floorCells.map((cell) => cellKey(cell.x, cell.y)));
  const seen = new Set();
  const segments = [];

  region.floorCells.forEach((cell) => {
    getCellNeighbors(cell).forEach((neighbor) => {
      if (cells.has(cellKey(neighbor.x, neighbor.y))) return;
      const segment = getSharedEdgeSegment(cell, neighbor, gridSize);
      if (!segment) return;
      const key = segmentKey(segment);
      if (seen.has(key)) return;
      seen.add(key);
      segments.push(segment);
    });
  });

  return segments;
}

function isWallSegmentOnCircleRoom(segment, region, generatedMap) {
  if (region.shape !== "circle") return false;
  return getCircleRoomGridBoundarySegments(region, generatedMap.config.gridSize, generatedMap).some((edge) => segmentMatches(segment, edge));
}

function getWallSegmentAdjacentCells(segment, gridSize) {
  const epsilon = 0.01;
  const horizontal = Math.abs(segment.y1 - segment.y2) < epsilon;
  const vertical = Math.abs(segment.x1 - segment.x2) < epsilon;
  if (!horizontal && !vertical) return null;

  if (horizontal) {
    const x = Math.floor(Math.min(segment.x1, segment.x2) / gridSize);
    const y = Math.round(segment.y1 / gridSize);
    return {
      a: { x, y: y - 1 },
      b: { x, y },
    };
  }

  const x = Math.round(segment.x1 / gridSize);
  const y = Math.floor(Math.min(segment.y1, segment.y2) / gridSize);
  return {
    a: { x: x - 1, y },
    b: { x, y },
  };
}

function getCircleRoomCellKeys(generatedMap) {
  const keys = new Set();
  generatedMap.regions.forEach((region) => {
    if (region.shape !== "circle") return;
    region.floorCells.forEach((cell) => keys.add(cellKey(cell.x, cell.y)));
  });
  return keys;
}

function shouldHideCellWallForVectorRoom(segment, generatedMap) {
  if (!generatedMap.regions.some((region) => isWallSegmentOnCircleRoom(segment, region, generatedMap))) return false;
  const adjacent = getWallSegmentAdjacentCells(segment, generatedMap.config.gridSize);
  if (!adjacent) return false;
  const circleCells = getCircleRoomCellKeys(generatedMap);
  return circleCells.has(cellKey(adjacent.a.x, adjacent.a.y)) || circleCells.has(cellKey(adjacent.b.x, adjacent.b.y));
}

function getOrganicCorridorCellKeys(generatedMap) {
  const keys = new Set();
  generatedMap.corridors.filter(isOrganicCorridor).forEach((corridor) => {
    corridor.floorCells.forEach((cell) => keys.add(cellKey(cell.x, cell.y)));
  });
  return keys;
}

function shouldHideCellWallForOrganicCorridor(segment, generatedMap) {
  const adjacent = getWallSegmentAdjacentCells(segment, generatedMap.config.gridSize);
  if (!adjacent) return false;
  const organicCells = getOrganicCorridorCellKeys(generatedMap);
  return organicCells.has(cellKey(adjacent.a.x, adjacent.a.y)) || organicCells.has(cellKey(adjacent.b.x, adjacent.b.y));
}

function splitSegmentOutsideVectorRooms(segment, generatedMap) {
  return generatedMap.regions
    .filter((region) => region.shape === "circle")
    .reduce((parts, region) => {
      const circle = getCircleGeometryFromRegion(region, generatedMap.config.gridSize);
      return parts.flatMap((part) => splitSegmentOutsideCircle(part, circle, generatedMap.config.gridSize));
    }, [segment]);
}

function getCorridorWallSegmentsNearVectorRooms(generatedMap) {
  return computeBoundarySegments(generatedMap.dungeonMask.corridorFloorCells || [], generatedMap.config.gridSize)
    .flatMap((wall) => splitWallIntoGridSegments(wall, generatedMap.config.gridSize))
    .filter((wall) => shouldHideCellWallForVectorRoom(wall, generatedMap))
    .flatMap((wall) => splitSegmentOutsideVectorRooms(wall, generatedMap));
}

function splitSegmentOutsideCircle(segment, circle, gridSize) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const a = dx * dx + dy * dy;
  if (a <= 0) return [];

  const fx = segment.x1 - circle.cx;
  const fy = segment.y1 - circle.cy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circle.r * circle.r;
  const discriminant = b * b - 4 * a * c;
  const cuts = [0, 1];

  if (discriminant > 0) {
    const root = Math.sqrt(discriminant);
    const t1 = (-b - root) / (2 * a);
    const t2 = (-b + root) / (2 * a);
    [t1, t2].forEach((t) => {
      if (t > 0.001 && t < 0.999) cuts.push(t);
    });
  }

  cuts.sort((p, q) => p - q);
  const segments = [];
  for (let index = 0; index < cuts.length - 1; index += 1) {
    const start = cuts[index];
    const end = cuts[index + 1];
    if (end - start <= 0.01) continue;
    const mid = (start + end) / 2;
    const mx = segment.x1 + dx * mid;
    const my = segment.y1 + dy * mid;
    const outside = Math.hypot(mx - circle.cx, my - circle.cy) >= circle.r - gridSize * 0.045;
    if (!outside) continue;
    const clipped = {
      x1: segment.x1 + dx * start,
      y1: segment.y1 + dy * start,
      x2: segment.x1 + dx * end,
      y2: segment.y1 + dy * end,
    };
    if (Math.hypot(clipped.x2 - clipped.x1, clipped.y2 - clipped.y1) >= gridSize * 0.08) segments.push(clipped);
  }
  return segments;
}

function getCirclePortalSquareWallSegments(region, generatedMap) {
  if (region.shape !== "circle") return [];
  const circle = getCircleGeometryFromRegion(region, generatedMap.config.gridSize);
  const portals = getCircleCompositeSquareCells(generatedMap, region);
  const extensionCellKeys = new Set(portals.map((cell) => cellKey(cell.x, cell.y)));
  const seen = new Set();
  const segments = [];

  portals.forEach((portal) => {
    getCellBoundarySegmentsForCell(portal, generatedMap.config.gridSize).forEach((edge) => {
      const neighbor = getNeighborForCellSide(portal, edge.side);
      if (extensionCellKeys.has(cellKey(neighbor.x, neighbor.y))) return;
      splitSegmentOutsideCircle(edge, circle, generatedMap.config.gridSize).forEach((part) => {
        const key = segmentKey({
          x1: Math.round(part.x1 * 100) / 100,
          y1: Math.round(part.y1 * 100) / 100,
          x2: Math.round(part.x2 * 100) / 100,
          y2: Math.round(part.y2 * 100) / 100,
        });
        if (seen.has(key)) return;
        seen.add(key);
        segments.push(part);
      });
    });
  });

  return segments;
}

function getDrawableWallSegments(generatedMap) {
  const gridWalls = (generatedMap.dungeonMask.wallSegments || [])
    .flatMap((wall) => splitWallIntoGridSegments(wall, generatedMap.config.gridSize))
    .filter((wall) => !shouldHideCellWallForVectorRoom(wall, generatedMap))
    .filter((wall) => !shouldHideCellWallForOrganicCorridor(wall, generatedMap));
  const corridorWallsNearCircles = getCorridorWallSegmentsNearVectorRooms(generatedMap);
  const baseWalls = mergeCollinearWallSegments([...gridWalls, ...corridorWallsNearCircles]);
  const openDoorGaps = (generatedMap.dungeonMask.doorSegments || [])
    .filter((door) => normalizeDoorType(door.doorType, door.secret ? "secret" : "default") === "open")
    .map((door) => getOpenDoorWallGapSegment(door, generatedMap.config));
  const mapAccessGaps = (generatedMap.dungeonMask.mapAccesses || generatedMap.mapAccesses || [])
    .map((access) => access.wallGap)
    .filter(Boolean);
  const wallGaps = [...openDoorGaps, ...mapAccessGaps];
  if (wallGaps.length === 0) return baseWalls;

  return baseWalls.flatMap((wall) => {
    let parts = [wall];
    wallGaps.forEach((gap) => {
      parts = parts.flatMap((part) => splitWallSegmentByGap(part, gap));
    });
    return parts;
  });
}

function getDoorCutClassName(door) {
  const doorType = normalizeDoorType(door.doorType, door.secret ? "secret" : "default");
  if (doorType === "secret") return "door-opening secret-door-opening";
  if (doorType === "open") return "door-opening open-door-opening";
  return "door-opening";
}

function renderHexCaveUnifiedSurface(generatedMap, mapSurface, gridStyle = "solid") {
  const caveSurface = mapSurface.caveSurface || createHexCaveSurface(generatedMap);
  const floorPath = caveSurface.visualFloorPath;
  const wallPath = caveSurface.wallPath || floorPath;
  const sketchPath = createHexCavePathFromSegments(caveSurface.boundarySegments || [], generatedMap.config, "sketch") || wallPath;
  return (
    <>
      <path className="floor-fill" d={floorPath} fillRule="nonzero" />
      {createFloorTexture(generatedMap)}
      {renderFloorGrid(generatedMap, gridStyle)}
      <g className="wall-shadow cave-wall-shadow" clipPath="url(#clip-dungeon-floor)" aria-hidden="true">
        <path d={wallPath} />
      </g>
      <g className="wall-main cave-surface-walls">
        <path d={wallPath} />
      </g>
      <g className="wall-sketch cave-surface-wall-sketch">
        <path d={sketchPath} />
      </g>
      {renderMapAccessSymbols(generatedMap)}
    </>
  );
}

function renderOrganicCaveUnifiedSurface(generatedMap, mapSurface, gridStyle = "solid") {
  const caveSurface = mapSurface.caveSurface || createCellBasedCaveSurface(generatedMap);
  return (
    <>
      <path className="floor-fill" d={caveSurface.visualFloorPath} fillRule="nonzero" />
      {createFloorTexture(generatedMap)}
      {renderFloorGrid(generatedMap, gridStyle)}
      <g className="wall-shadow cave-wall-shadow" clipPath="url(#clip-dungeon-floor)" aria-hidden="true">
        <path d={caveSurface.wallPath} />
      </g>
      <g className="wall-main cave-surface-walls">
        <path d={caveSurface.wallPath} />
      </g>
      <g className="wall-sketch cave-surface-wall-sketch">
        <path d={caveSurface.sketchPath} />
      </g>
      {renderMapAccessSymbols(generatedMap)}
    </>
  );
}

function renderUnifiedDungeonSurface(generatedMap, gridStyle = "solid") {
  const { config, dungeonMask } = generatedMap;
  const mapSurface = getMapSurface(generatedMap);
  const floorPath = mapSurface.visualFloorPath;

  if (mapSurface.geometryKind === "hex-cave-map") {
    return renderHexCaveUnifiedSurface(generatedMap, mapSurface, gridStyle);
  }

  if (mapSurface.geometryKind === "organic-cave-map") {
    return renderOrganicCaveUnifiedSurface(generatedMap, mapSurface, gridStyle);
  }

  return (
    <>
      {renderExternalHatchingUnderlay(generatedMap)}
      {renderExternalHatching(generatedMap)}
      <path className="floor-fill" d={floorPath} fillRule="nonzero" />
      {createFloorTexture(generatedMap)}
      {renderVisualAccents(generatedMap)}
      {renderFloorGrid(generatedMap, gridStyle)}
      {renderWallShadows(generatedMap)}
      {renderRoughWalls(generatedMap)}
      {renderWallSketch(generatedMap)}
      {renderCircleRoomWalls(generatedMap)}
      {renderOrganicCorridorWalls(generatedMap)}
      {renderCrossLevelCorridorOverpasses(generatedMap)}
      <g className="door-cuts">
        {dungeonMask.doorSegments.map((door, index) => {
          const doorType = normalizeDoorType(door.doorType, door.secret ? "secret" : "default");
          if (doorType === "open") return null;
          const cut = getDoorCutSegment(door, config);
          return <line key={`door-opening-${index}`} x1={cut.x1} y1={cut.y1} x2={cut.x2} y2={cut.y2} className={getDoorCutClassName(door)} />;
        })}
      </g>
      {renderDoorSymbols(generatedMap)}
      {renderMapAccessSymbols(generatedMap)}
      {renderCorridorJunctionOverrides(generatedMap)}
    </>
  );
}

function getPropBudget(region, flags, contextKey = "crypt") {
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

function chooseContentAwarePropKind(region, flags, index, rng, contextKey = "crypt") {
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

function getPropCandidateCells(region) {
  const boundary = new Set(getBoundaryCells(region).map((anchor) => cellKey(anchor.cell.x, anchor.cell.y)));
  const cells = region.floorCells.filter((cell) => !boundary.has(cellKey(cell.x, cell.y)));
  return cells.length > 0 ? cells : region.floorCells;
}

function getRegionFloorBounds(region) {
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

function getRoomAxis(region) {
  return region.cellRect.w >= region.cellRect.h ? "horizontal" : "vertical";
}

function targetCellByRatio(region, rx, ry) {
  const bounds = getRegionFloorBounds(region);
  return {
    x: bounds.x + Math.round((bounds.w - 1) * clamp(rx, 0, 1)),
    y: bounds.y + Math.round((bounds.h - 1) * clamp(ry, 0, 1)),
  };
}

function findClosestPropCell(region, target, reservedCells = new Set()) {
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

function reservePropCell(reservedCells, cell) {
  if (!cell) return;
  reservedCells.add(cellKey(cell.x, cell.y));
}

function makeProp(region, kind, cell, config, index, options = {}) {
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

function addPlannedProp(props, region, config, reservedCells, plan, index) {
  const target = plan.cell || targetCellByRatio(region, plan.rx ?? 0.5, plan.ry ?? 0.5);
  const cell = findClosestPropCell(region, target, reservedCells);
  if (!cell) return index;
  reservePropCell(reservedCells, cell);
  props.push(makeProp(region, plan.kind, cell, config, index, plan));
  return index + 1;
}

function wallRotationForRatio(rx, ry, fallback = 0) {
  if (rx <= 0.22) return 90;
  if (rx >= 0.78) return 90;
  if (ry <= 0.22) return 0;
  if (ry >= 0.78) return 0;
  return fallback;
}

function createChapelPropPlan(region, flags, budget) {
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

function createNobleHousePropPlan(region, flags, budget) {
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

function createMinePropPlan(region, flags, budget) {
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

function createCavePropPlan(region, flags, budget, rng) {
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

function createRuinsPropPlan(region, flags, budget) {
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

function createCryptPropPlan(region, flags, budget, rng) {
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

function createPropLayoutPlan(region, flags, budget, rng, contextKey) {
  if (budget <= 0) return [];
  if (contextKey === "chapel") return createChapelPropPlan(region, flags, budget, rng);
  if (contextKey === "noble-house") return createNobleHousePropPlan(region, flags, budget, rng);
  if (contextKey === "mine") return createMinePropPlan(region, flags, budget, rng);
  if (contextKey === "cave") return createCavePropPlan(region, flags, budget, rng);
  if (contextKey === "ruins") return createRuinsPropPlan(region, flags, budget, rng);
  return createCryptPropPlan(region, flags, budget, rng);
}

function createProps(generatedMap) {
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

function renderProp(prop) {
  const s = prop.size || 20;
  if (prop.kind === "pew") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-fill" x={-s * 0.7} y={-s * 0.14} width={s * 1.4} height={s * 0.28} rx="1" />
        <line x1={-s * 0.62} y1={s * 0.18} x2={s * 0.62} y2={s * 0.18} />
      </g>
    );
  }
  if (prop.kind === "bed") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-fill" x={-s * 0.48} y={-s * 0.56} width={s * 0.96} height={s * 1.12} rx="2" />
        <line x1={-s * 0.42} y1={-s * 0.22} x2={s * 0.42} y2={-s * 0.22} />
      </g>
    );
  }
  if (prop.kind === "desk") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-fill" x={-s * 0.5} y={-s * 0.34} width={s} height={s * 0.68} rx="1" />
        <path d={`M${-s * 0.32} ${-s * 0.08}h${s * 0.64}M${-s * 0.24} ${s * 0.12}h${s * 0.38}`} />
      </g>
    );
  }
  if (prop.kind === "chest") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-fill" x={-s * 0.42} y={-s * 0.28} width={s * 0.84} height={s * 0.56} rx="1" />
        <path d={`M${-s * 0.42} 0h${s * 0.84}M0 ${-s * 0.24}v${s * 0.48}`} />
      </g>
    );
  }
  if (prop.kind === "fireplace") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <path className="prop-fill" d={`M${-s * 0.5} ${s * 0.3}V${-s * 0.3}H${s * 0.5}V${s * 0.3}`} />
        <path d={`M${-s * 0.18} ${s * 0.22}C${-s * 0.1} ${-s * 0.1},${s * 0.1} ${-s * 0.1},${s * 0.18} ${s * 0.22}`} />
      </g>
    );
  }
  if (prop.kind === "mine-rail") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <line x1={-s * 0.62} y1={-s * 0.18} x2={s * 0.62} y2={-s * 0.18} />
        <line x1={-s * 0.62} y1={s * 0.18} x2={s * 0.62} y2={s * 0.18} />
        <line x1={-s * 0.42} y1={-s * 0.26} x2={-s * 0.42} y2={s * 0.26} />
        <line x1="0" y1={-s * 0.26} x2="0" y2={s * 0.26} />
        <line x1={s * 0.42} y1={-s * 0.26} x2={s * 0.42} y2={s * 0.26} />
      </g>
    );
  }
  if (prop.kind === "mine-support") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <path d={`M${-s * 0.5} ${s * 0.42}V${-s * 0.42}H${s * 0.5}V${s * 0.42}`} />
      </g>
    );
  }
  if (prop.kind === "stalagmite") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <polygon className="prop-fill" points={`0,${-s * 0.48} ${-s * 0.22},${s * 0.34} ${s * 0.2},${s * 0.32}`} />
        <polygon className="prop-fill" points={`${-s * 0.34},${-s * 0.12} ${-s * 0.52},${s * 0.36} ${-s * 0.16},${s * 0.28}`} />
      </g>
    );
  }
  if (prop.kind === "broken-wall") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <path d={`M${-s * 0.62} ${-s * 0.08}h${s * 0.38}m${s * 0.16} 0h${s * 0.46}`} />
        <path className="prop-crack" d={`M${-s * 0.12} ${-s * 0.24}l${s * 0.16} ${s * 0.22}l${-s * 0.12} ${s * 0.18}`} />
      </g>
    );
  }
  if (prop.kind === "shelf") return <rect className="prop-shelf" x={prop.x - s * 0.66} y={prop.y - s * 0.18} width={s * 1.32} height={s * 0.36} transform={`rotate(${prop.rotation} ${prop.x} ${prop.y})`} />;
  if (prop.kind === "scroll-table") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-fill" x={-s * 0.48} y={-s * 0.32} width={s * 0.96} height={s * 0.64} rx="1" />
        <path d={`M${-s * 0.28} ${-s * 0.05}h${s * 0.56}M${-s * 0.22} ${s * 0.12}h${s * 0.38}`} />
      </g>
    );
  }
  if (prop.kind === "pit") return <circle className="prop-pit" cx={prop.x} cy={prop.y} r={s * 0.42} />;
  if (prop.kind === "pillar") return <circle className="prop-light-fill" cx={prop.x} cy={prop.y} r={s * 0.22} />;
  if (prop.kind === "statue") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-fill" x={-s * 0.22} y={-s * 0.38} width={s * 0.44} height={s * 0.76} rx="2" />
        <circle cx="0" cy={-s * 0.24} r={s * 0.12} />
      </g>
    );
  }
  if (prop.kind === "tomb") return <rect className="prop-tomb" x={prop.x - s * 0.52} y={prop.y - s * 0.28} width={s * 1.04} height={s * 0.56} rx="2" transform={`rotate(${prop.rotation} ${prop.x} ${prop.y})`} />;
  if (prop.kind === "altar") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <rect className="prop-altar" x={-s * 0.5} y={-s * 0.28} width={s} height={s * 0.56} rx="1" />
        <path d={`M${-s * 0.24} 0h${s * 0.48}M0 ${-s * 0.18}v${s * 0.36}`} />
      </g>
    );
  }
  if (prop.kind === "bones") {
    return (
      <g className="prop-bones" transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <line x1={-s * 0.36} y1="0" x2={s * 0.36} y2="0" />
        <line x1="0" y1={-s * 0.25} x2="0" y2={s * 0.25} />
        <circle cx={-s * 0.42} cy="0" r={s * 0.08} />
        <circle cx={s * 0.42} cy="0" r={s * 0.08} />
      </g>
    );
  }
  if (prop.kind === "rubble") {
    return (
      <g className="prop-rubble" transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <polygon points={`${-s * 0.38},${s * 0.2} ${-s * 0.14},${-s * 0.3} ${s * 0.2},${-s * 0.12} ${s * 0.4},${s * 0.28}`} />
        <polygon points={`${-s * 0.08},${s * 0.34} ${s * 0.14},${s * 0.04} ${s * 0.34},${s * 0.36}`} />
      </g>
    );
  }
  if (prop.kind === "water") return <ellipse className="prop-water" cx={prop.x} cy={prop.y} rx={s * 0.72} ry={s * 0.42} transform={`rotate(${prop.rotation} ${prop.x} ${prop.y})`} />;
  if (prop.kind === "fog") {
    return (
      <g className="prop-fog" transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <path d={`M${-s * 0.7} ${-s * 0.08}C${-s * 0.36} ${-s * 0.28},${-s * 0.1} ${s * 0.16},${s * 0.28} ${-s * 0.06}S${s * 0.68} ${s * 0.08},${s * 0.78} ${-s * 0.02}`} />
        <path d={`M${-s * 0.52} ${s * 0.2}C${-s * 0.16} ${s * 0.02},${s * 0.18} ${s * 0.36},${s * 0.56} ${s * 0.16}`} />
      </g>
    );
  }
  if (prop.kind === "clue-marker") {
    return (
      <g transform={`translate(${prop.x} ${prop.y}) rotate(${prop.rotation})`}>
        <circle className="prop-light-fill" cx="0" cy="0" r={s * 0.28} />
        <path d={`M${-s * 0.18} 0h${s * 0.36}M0 ${-s * 0.18}v${s * 0.36}`} />
      </g>
    );
  }
  if (prop.kind === "table") return <rect className="prop-fill" x={prop.x - s * 0.45} y={prop.y - s * 0.3} width={s * 0.9} height={s * 0.6} rx="1" transform={`rotate(${prop.rotation} ${prop.x} ${prop.y})`} />;
  return <path className="prop-crack" d={`M${prop.x - s * 0.36} ${prop.y + s * 0.14}C${prop.x - s * 0.1} ${prop.y - s * 0.38},${prop.x + s * 0.2} ${prop.y + s * 0.4},${prop.x + s * 0.42} ${prop.y - s * 0.16}`} />;
}

function renderProps(props) {
  return <g className="props">{props.map((prop) => <g key={prop.id}>{renderProp(prop)}</g>)}</g>;
}

function renderLabels(generatedMap, options) {
  return (
    <g className="labels">
      {generatedMap.regions.map((region) => (
        <g key={`label-${region.id}`}>
          <circle cx={region.labelPoint.x} cy={region.labelPoint.y} r={11} />
          <text x={region.labelPoint.x} y={region.labelPoint.y + 4} textAnchor="middle">{region.number}</text>
          {options.showNames && <text className="room-name" x={region.labelPoint.x} y={region.labelPoint.y + 27} textAnchor="middle">{region.name}</text>}
        </g>
      ))}
    </g>
  );
}

function getRoomDragCells(region, gridSize) {
  const regionCells = new Set(region.floorCells.map((cell) => cellKey(cell.x, cell.y)));
  const interiorCells = region.floorCells.filter((cell) =>
    regionCells.has(cellKey(cell.x + 1, cell.y)) &&
    regionCells.has(cellKey(cell.x - 1, cell.y)) &&
    regionCells.has(cellKey(cell.x, cell.y + 1)) &&
    regionCells.has(cellKey(cell.x, cell.y - 1))
  );
  if (interiorCells.length > 0) return interiorCells;
  const center = {
    x: region.labelPoint.x,
    y: region.labelPoint.y,
  };
  const fallback = [...region.floorCells]
    .map((cell) => {
      const px = (cell.x + 0.5) * gridSize;
      const py = (cell.y + 0.5) * gridSize;
      const dx = px - center.x;
      const dy = py - center.y;
      return { cell, score: dx * dx + dy * dy };
    })
    .sort((a, b) => a.score - b.score)[0]?.cell;
  return fallback ? [fallback] : [];
}

function createOppositeSharedAnchor(anchor, adjacentRegionId) {
  if (!anchor || !adjacentRegionId) return null;
  return {
    regionId: adjacentRegionId,
    side: anchor.side === "north" ? "south" : anchor.side === "south" ? "north" : anchor.side === "east" ? "west" : "east",
    cell: { x: anchor.outsideCell.x, y: anchor.outsideCell.y },
    outsideCell: { x: anchor.cell.x, y: anchor.cell.y },
    normal: { x: -anchor.normal.x, y: -anchor.normal.y },
  };
}

function getCellRegionOwnerMap(regions) {
  const owners = new Map();
  regions.forEach((region) => {
    region.floorCells.forEach((cell) => owners.set(cellKey(cell.x, cell.y), region.id));
  });
  return owners;
}

function getWallConnectionZones(region, regions, gridSize) {
  const ownerByCell = getCellRegionOwnerMap(regions);
  return getBoundaryCells(region).map((anchor) => {
    const segment = getSharedEdgeSegment(anchor.cell, anchor.outsideCell, gridSize);
    const point = getAnchorHandlePoint(anchor, gridSize);
    const adjacentRegionId = ownerByCell.get(cellKey(anchor.outsideCell.x, anchor.outsideCell.y));
    const adjacentAnchor = adjacentRegionId && adjacentRegionId !== region.id
      ? createOppositeSharedAnchor(anchor, adjacentRegionId)
      : null;
    return segment ? {
      id: `${region.id}:${anchor.side}:${anchor.cell.x}:${anchor.cell.y}`,
      regionId: region.id,
      adjacentRegionId: adjacentAnchor ? adjacentRegionId : null,
      adjacentAnchor,
      anchor,
      point,
      ...segment,
    } : null;
  }).filter(Boolean);
}

function getClosestCorridorPathIndex(corridor, cell) {
  const topologyCells = getCorridorTopologyCells(corridor);
  if (topologyCells.length === 0 || !cell) return 0;
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  topologyCells.forEach((pathCell, index) => {
    const dx = pathCell.x - cell.x;
    const dy = pathCell.y - cell.y;
    const score = dx * dx + dy * dy;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function getManualWaypointInsertIndex(corridor, cell) {
  const targetIndex = getClosestCorridorPathIndex(corridor, cell);
  const manualPoints = Array.isArray(corridor.manualWaypoints) ? corridor.manualWaypoints.filter(isValidPoint) : [];
  const manualPathIndexes = manualPoints.map((point) => getClosestCorridorPathIndex(corridor, point));
  const insertIndex = manualPathIndexes.findIndex((pathIndex) => pathIndex > targetIndex);
  return insertIndex === -1 ? manualPoints.length : insertIndex;
}

function getCorridorInsertionZones(corridor, gridSize) {
  const topologyCells = getCorridorTopologyCells(corridor);
  if (corridor.isRoomLink || topologyCells.length < 3) return [];
  return topologyCells.slice(1, -1).map((cell, index) => ({
    id: `${corridor.id}:insert:${index}:${cell.x}:${cell.y}`,
    corridor,
    cell,
    insertIndex: getManualWaypointInsertIndex(corridor, cell),
    x: cell.x * gridSize,
    y: cell.y * gridSize,
    point: { x: (cell.x + 0.5) * gridSize, y: (cell.y + 0.5) * gridSize },
  }));
}

function getCorridorPlanarLevel(corridor) {
  return Number.isFinite(corridor?.level) ? corridor.level : 0;
}

function getCorridorIntersectionCells(corridors) {
  const byCellAndLevel = new Map();
  corridors.forEach((corridor) => {
    const localSeen = new Set();
    const level = getCorridorPlanarLevel(corridor);
    getCorridorTopologyCells(corridor).forEach((cell, index) => {
      const baseKey = cellKey(cell.x, cell.y);
      if (localSeen.has(baseKey)) return;
      localSeen.add(baseKey);
      const key = `${baseKey}:L${level}`;
      if (!byCellAndLevel.has(key)) {
        byCellAndLevel.set(key, {
          key: baseKey,
          cell: { x: cell.x, y: cell.y },
          level,
          corridors: [],
          pathIndexes: [],
        });
      }
      byCellAndLevel.get(key).corridors.push(corridor);
      byCellAndLevel.get(key).pathIndexes.push({ corridorId: corridor.id, index });
    });
  });
  return Array.from(byCellAndLevel.values()).filter((junction) => junction.corridors.length >= 2);
}

function getCrossLevelCorridorIntersectionCells(corridors) {
  const byCell = new Map();
  corridors.forEach((corridor) => {
    const localSeen = new Set();
    const level = getCorridorPlanarLevel(corridor);
    getCorridorTopologyCells(corridor).forEach((cell, index) => {
      const key = cellKey(cell.x, cell.y);
      if (localSeen.has(key)) return;
      localSeen.add(key);
      if (!byCell.has(key)) {
        byCell.set(key, {
          key,
          cell: { x: cell.x, y: cell.y },
          levels: new Set(),
          corridors: [],
          pathIndexes: [],
        });
      }
      const entry = byCell.get(key);
      entry.levels.add(level);
      entry.corridors.push(corridor);
      entry.pathIndexes.push({ corridorId: corridor.id, index, level });
    });
  });
  return Array.from(byCell.values())
    .filter((crossing) => crossing.levels.size >= 2)
    .map((crossing) => ({ ...crossing, levels: Array.from(crossing.levels).sort((a, b) => a - b) }));
}

function getCorridorCellDirection(corridor, cell) {
  const topologyCells = getCorridorTopologyCells(corridor);
  const index = topologyCells.findIndex((candidate) => candidate.x === cell.x && candidate.y === cell.y);
  const previous = index > 0 ? topologyCells[index - 1] : null;
  const next = index >= 0 && index < topologyCells.length - 1 ? topologyCells[index + 1] : null;
  const neighbors = [previous, next].filter(Boolean);
  return {
    horizontal: neighbors.some((neighbor) => neighbor.y === cell.y && neighbor.x !== cell.x),
    vertical: neighbors.some((neighbor) => neighbor.x === cell.x && neighbor.y !== cell.y),
  };
}

function inferCorridorJunctionOrientation(junction, seed = "") {
  let horizontal = 0;
  let vertical = 0;
  junction.corridors.forEach((corridor) => {
    const direction = getCorridorCellDirection(corridor, junction.cell);
    if (direction.horizontal) horizontal += 1;
    if (direction.vertical) vertical += 1;
  });
  if (horizontal > vertical) return "vertical";
  if (vertical > horizontal) return "horizontal";
  return hashStringToSeed(seed, junction.key, "junction-orientation") % 2 === 0 ? "horizontal" : "vertical";
}

function getCorridorJunctionGeometry(junction, config, sideIndex = 0) {
  const g = config.gridSize;
  const x = junction.cell.x * g;
  const y = junction.cell.y * g;
  const cx = x + g / 2;
  const cy = y + g / 2;
  const lineLength = g * 0.92;
  const panelLength = g * 0.6;
  const panelThickness = g * 0.22;
  const side = ((sideIndex % 4) + 4) % 4;

  if (side === 0) {
    return {
      side: "north",
      orientation: "horizontal",
      line: { x1: cx - lineLength / 2, y1: y, x2: cx + lineLength / 2, y2: y },
      panel: { x: cx - panelLength / 2, y: y - panelThickness / 2, width: panelLength, height: panelThickness },
    };
  }
  if (side === 1) {
    return {
      side: "east",
      orientation: "vertical",
      line: { x1: x + g, y1: cy - lineLength / 2, x2: x + g, y2: cy + lineLength / 2 },
      panel: { x: x + g - panelThickness / 2, y: cy - panelLength / 2, width: panelThickness, height: panelLength },
    };
  }
  if (side === 2) {
    return {
      side: "south",
      orientation: "horizontal",
      line: { x1: cx - lineLength / 2, y1: y + g, x2: cx + lineLength / 2, y2: y + g },
      panel: { x: cx - panelLength / 2, y: y + g - panelThickness / 2, width: panelLength, height: panelThickness },
    };
  }
  return {
    side: "west",
    orientation: "vertical",
    line: { x1: x, y1: cy - lineLength / 2, x2: x, y2: cy + lineLength / 2 },
    panel: { x: x - panelThickness / 2, y: cy - panelLength / 2, width: panelThickness, height: panelLength },
  };
}

function renderCorridorJunctionOverrides(generatedMap) {
  const junctions = getCorridorIntersectionCells(generatedMap.corridors);
  if (junctions.length === 0) return null;
  const manualJunctions = generatedMap.config.manualCorridorJunctions || {};
  const visible = junctions
    .map((junction) => {
      const override = getManualJunctionOverride(manualJunctions, junction.key, "merge");
      return { ...junction, type: override.type, sideIndex: override.sideIndex };
    })
    .filter((junction) => junction.type !== "merge");
  if (visible.length === 0) return null;
  return (
    <g className="corridor-junctions">
      {visible.map((junction, index) => {
        const geometry = getCorridorJunctionGeometry(junction, generatedMap.config, junction.sideIndex);
        if (junction.type === "wall") {
          return (
            <g key={`junction-wall-${junction.key}`}>
              <path className="junction-wall-line" d={createRoughWallPath(geometry.line, generatedMap.config, `junction-${junction.key}-${index}`, "main")} />
              <path className="junction-wall-sketch" d={createRoughWallPath(geometry.line, generatedMap.config, `junction-sketch-${junction.key}-${index}`, "sketch")} />
            </g>
          );
        }
        return (
          <g key={`junction-door-${junction.key}`}>
            <path className="junction-wall-line" d={createRoughWallPath(geometry.line, generatedMap.config, `junction-door-${junction.key}-${index}`, "door")} />
            <path className="junction-wall-sketch" d={createRoughWallPath(geometry.line, generatedMap.config, `junction-door-sketch-${junction.key}-${index}`, "door-sketch")} />
            <path className="junction-door-panel" d={createRoughDoorPanelPath(geometry.panel, generatedMap.config, `junction-door-panel-${junction.key}-${index}`)} />
          </g>
        );
      })}
    </g>
  );
}

function getCorridorCrossingOrientation(corridor, cell, fallback = "horizontal") {
  const direction = getCorridorCellDirection(corridor, cell);
  if (direction.horizontal && !direction.vertical) return "horizontal";
  if (direction.vertical && !direction.horizontal) return "vertical";
  return fallback;
}

function getCorridorLocalWallSegmentsForCell(corridor, cell, gridSize) {
  if (!corridor || !cell) return [];
  const corridorCells = new Set((corridor.floorCells || []).map((item) => cellKey(item.x, item.y)));
  return getCellBoundarySegmentsForCell(cell, gridSize).filter((edge) => {
    const neighbor = getNeighborForCellSide(cell, edge.side);
    return !corridorCells.has(cellKey(neighbor.x, neighbor.y));
  });
}

function renderCrossLevelCorridorOverpasses(generatedMap) {
  const crossings = getCrossLevelCorridorIntersectionCells(generatedMap.corridors)
    .map((crossing) => {
      const topLevel = Math.max(...crossing.levels);
      const topCorridor = crossing.corridors.find((corridor) => getCorridorPlanarLevel(corridor) === topLevel) || crossing.corridors[0];
      return {
        ...crossing,
        topLevel,
        topCorridor,
        topWalls: getCorridorLocalWallSegmentsForCell(topCorridor, crossing.cell, generatedMap.config.gridSize),
      };
    })
    .filter((crossing) => crossing.topCorridor && crossing.topWalls.length > 0)
    .sort((a, b) => a.topLevel - b.topLevel);

  if (crossings.length === 0) return null;
  const { config } = generatedMap;
  return (
    <g className="corridor-overpass-patches">
      {crossings.map((crossing, index) => (
        <g key={`cross-level-corridor-${crossing.key}-${index}`} className="corridor-overpass-patch">
          <path className="overpass-corridor-floor" d={cellRectToPath(crossing.cell, config.gridSize)} />
          <g className="wall-main overpass-corridor-walls">
            {crossing.topWalls.map((wall, wallIndex) => (
              <path
                key={`cross-level-wall-${crossing.key}-${wallIndex}`}
                d={createRoughWallPath(wall, config, `cross-level-top-${crossing.key}-${index}-${wallIndex}`, "main")}
              />
            ))}
          </g>
          <g className="wall-sketch overpass-corridor-wall-sketch">
            {crossing.topWalls.map((wall, wallIndex) => (
              <path
                key={`cross-level-wall-sketch-${crossing.key}-${wallIndex}`}
                d={createRoughWallPath(wall, config, `cross-level-top-sketch-${crossing.key}-${index}-${wallIndex}`, "sketch")}
              />
            ))}
          </g>
        </g>
      ))}
    </g>
  );
}

function renderRoomHoverHighlight(region, generatedMap) {
  if (!region) return null;

  const shape = getRegionCompositeShape(region, generatedMap, generatedMap.config.gridSize);
  const pathOnlyHighlight = Boolean(shape.hoverPath) && (shape.surfaceKind === "cave" || shape.geometryKind === "organic-cell-mask" || isPureCaveMap(generatedMap));
  const haloSegments = pathOnlyHighlight ? [] : shape.hoverSegments.map((segment, index) => (
    <line
      key={`room-hover-halo-${region.id}-${index}`}
      x1={segment.x1}
      y1={segment.y1}
      x2={segment.x2}
      y2={segment.y2}
    />
  ));
  const edgeSegments = pathOnlyHighlight ? [] : shape.hoverSegments.map((segment, index) => (
    <line
      key={`room-hover-edge-${region.id}-${index}`}
      x1={segment.x1}
      y1={segment.y1}
      x2={segment.x2}
      y2={segment.y2}
    />
  ));

  return (
    <g className="room-hover-highlight">
      <g className="room-hover-highlight__halo">
        {shape.hoverPath ? <path d={shape.hoverPath} /> : null}
        {haloSegments}
      </g>
      <g className="room-hover-highlight__edge">
        {shape.hoverPath ? <path d={shape.hoverPath} /> : null}
        {edgeSegments}
      </g>
    </g>
  );
}

function corridorPathD(corridor, gridSize) {
  let points = [];
  if (Array.isArray(corridor.centerline) && corridor.centerline.length >= 2) {
    points = corridor.centerline;
  } else {
    const startAnchor = corridor.fromAnchor;
    const endAnchor = corridor.toAnchor;
    if (startAnchor && endAnchor) {
      points = [getAnchorHandlePoint(startAnchor, gridSize), getAnchorHandlePoint(endAnchor, gridSize)];
    }
  }
  if (points.length < 2) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join("");
}

function renderCorridorHoverHighlight(corridor, gridSize) {
  if (!corridor) return null;
  const d = corridorPathD(corridor, gridSize);
  if (!d) return null;
  return (
    <g className="corridor-hover-highlight">
      <path className="corridor-hover-highlight__halo" d={d} />
      <path className="corridor-hover-highlight__line" d={d} />
    </g>
  );
}

function renderEditorOverlays(generatedMap, editorOptions = {}) {
  const { regions, corridors, config } = generatedMap;
  const {
    draggingRegionId,
    hoveredRegionId,
    draggingCorridorHandle,
    draggingMapAccessId,
    hoveredCorridorId,
    hoverWallHandle,
    connectionDraft,
    onRoomPointerDown,
    onRoomPointerEnter,
    onRoomPointerLeave,
    onRoomContextMenu,
    onDoorPointerDown,
    onWaypointPointerDown,
    onWaypointContextMenu,
    onDoorContextMenu,
    onCorridorZonePointerMove,
    onCorridorZonePointerLeave,
    onJunctionContextMenu,
    onCorridorAddPointerDown,
    onCorridorAddContextMenu,
    onCorridorAddPointerLeave,
    onWallZonePointerMove,
    onWallZonePointerLeave,
    onWallZonePointerDown,
    onWallZoneContextMenu,
    onWallHandlePointerDown,
    onWallHandlePointerLeave,
    onMapAccessPointerDown,
    onMapAccessContextMenu,
  } = editorOptions;
  const wallConnectionZones = regions.flatMap((region) => getWallConnectionZones(region, regions, config.gridSize));
  const corridorInsertionZones = corridors.flatMap((corridor) => getCorridorInsertionZones(corridor, config.gridSize));
  const junctionByCell = new Map(getCorridorIntersectionCells(corridors).map((junction) => [junction.key, junction]));
  const endpointHandles = corridors.flatMap((corridor) => {
    if (corridor.isRoomLink && corridor.fromAnchor) {
      return [{ corridor, endpoint: "shared", anchor: corridor.fromAnchor }];
    }
    return [
      { corridor, endpoint: "from", anchor: corridor.fromAnchor },
      { corridor, endpoint: "to", anchor: corridor.toAnchor },
    ];
  }).filter((item) => item.anchor).map((item) => {
    const door = createDoorFromAnchor(item.anchor, config.gridSize, false);
    return {
      id: `${item.corridor.id}:${item.endpoint}`,
      corridor: item.corridor,
      endpoint: item.endpoint,
      x: (door.x1 + door.x2) / 2,
      y: (door.y1 + door.y2) / 2,
    };
  });
  const waypointHandles = corridors.flatMap((corridor) => {
    const manualPoints = Array.isArray(corridor.manualWaypoints) ? corridor.manualWaypoints.filter(isValidPoint) : [];
    return manualPoints.map((cell, index) => ({
      id: `${corridor.id}:manual-waypoint:${index}`,
      corridor,
      index,
      source: "manual",
      x: (cell.x + 0.5) * config.gridSize,
      y: (cell.y + 0.5) * config.gridSize,
    }));
  });
  const accessHandles = (generatedMap.dungeonMask.mapAccesses || generatedMap.mapAccesses || []).map((access) => ({
    access,
    id: access.id,
    regionId: access.regionId,
    x: (access.wallGap.x1 + access.wallGap.x2) / 2,
    y: (access.wallGap.y1 + access.wallGap.y2) / 2,
  }));
  const highlightedRegion = regions.find((region) => region.id === (draggingRegionId || hoveredRegionId));
  const activeCorridorId = draggingCorridorHandle?.split(":")[0] || editorOptions.hoverCorridorHandle?.corridor?.id || hoveredCorridorId;
  const highlightedCorridor = corridors.find((corridor) => corridor.id === activeCorridorId);
  return (
    <g className="editor-overlays">
      {renderRoomHoverHighlight(highlightedRegion, generatedMap)}
      {renderCorridorHoverHighlight(highlightedCorridor, config.gridSize)}
      {regions.map((region) => (
        <path
          key={`overlay-${region.id}`}
          className={draggingRegionId === region.id ? "room-drag-handle is-dragging" : "room-drag-handle"}
          d={buildRegionVisualFloorPath(region, config.gridSize, generatedMap)}
          fillRule="nonzero"
          onPointerDown={(event) => onRoomPointerDown?.(event, region)}
          onPointerEnter={(event) => onRoomPointerEnter?.(event, region)}
          onPointerLeave={(event) => onRoomPointerLeave?.(event, region)}
          onContextMenu={(event) => onRoomContextMenu?.(event, region)}
        />
      ))}
      {wallConnectionZones.map((zone) => (
        <line
          key={`wall-zone-${zone.id}`}
          className="wall-hover-zone"
          x1={zone.x1}
          y1={zone.y1}
          x2={zone.x2}
          y2={zone.y2}
          onPointerEnter={(event) => onWallZonePointerMove?.(event, zone)}
          onPointerMove={(event) => onWallZonePointerMove?.(event, zone)}
          onPointerLeave={(event) => onWallZonePointerLeave?.(event, zone)}
          onPointerDown={(event) => onWallZonePointerDown?.(event, zone)}
          onContextMenu={(event) => onWallZoneContextMenu?.(event, zone)}
        />
      ))}
      {corridorInsertionZones.map((zone) => (
        <rect
          key={`corridor-zone-${zone.id}`}
          className={junctionByCell.has(cellKey(zone.cell.x, zone.cell.y)) ? "corridor-hover-zone is-junction" : "corridor-hover-zone"}
          x={zone.x}
          y={zone.y}
          width={config.gridSize}
          height={config.gridSize}
          onPointerEnter={(event) => onCorridorZonePointerMove?.(event, zone)}
          onPointerMove={(event) => onCorridorZonePointerMove?.(event, zone)}
          onPointerLeave={(event) => onCorridorZonePointerLeave?.(event, zone)}
          onContextMenu={(event) => onCorridorAddContextMenu?.(event, zone)}
        />
      ))}
      {connectionDraft && (
        <g className="connection-preview-layer">
          <line className="connection-preview" x1={connectionDraft.start.x} y1={connectionDraft.start.y} x2={connectionDraft.current.x} y2={connectionDraft.current.y} />
          <circle className="connection-preview__endpoint" cx={connectionDraft.start.x} cy={connectionDraft.start.y} r={4} />
          <circle className="connection-preview__endpoint" cx={connectionDraft.current.x} cy={connectionDraft.current.y} r={4} />
        </g>
      )}
      {editorOptions.hoverCorridorHandle && !connectionDraft && (() => {
        const handle = editorOptions.hoverCorridorHandle;
        const junction = junctionByCell.get(cellKey(handle.cell.x, handle.cell.y));
        return (
          <circle
            key={`corridor-add-${handle.id}`}
            className={junction ? "corridor-add-handle is-junction" : "corridor-add-handle"}
            cx={handle.point.x}
            cy={handle.point.y}
            r={junction ? 6.5 : 5}
            onPointerDown={(event) => onCorridorAddPointerDown?.(event, handle)}
            onPointerLeave={(event) => onCorridorAddPointerLeave?.(event, handle)}
            onContextMenu={(event) => onCorridorAddContextMenu?.(event, handle)}
          />
        );
      })()}
      {hoverWallHandle && !connectionDraft && (
        <circle
          key={`wall-connect-${hoverWallHandle.regionId}-${hoverWallHandle.anchor.cell.x}-${hoverWallHandle.anchor.cell.y}-${hoverWallHandle.anchor.side}`}
          className="wall-connect-handle"
          cx={hoverWallHandle.point.x}
          cy={hoverWallHandle.point.y}
          r={6}
          onPointerDown={(event) => onWallHandlePointerDown?.(event, hoverWallHandle)}
          onPointerLeave={(event) => onWallHandlePointerLeave?.(event, hoverWallHandle)}
        />
      )}
      {accessHandles.map((handle) => (
        <g
          key={`map-access-handle-${handle.id}`}
          onPointerDown={(event) => onMapAccessPointerDown?.(event, handle)}
          onContextMenu={(event) => onMapAccessContextMenu?.(event, handle)}
        >
          <circle
            className={draggingMapAccessId === handle.id ? "map-access-handle is-dragging" : "map-access-handle"}
            cx={handle.x}
            cy={handle.y}
            r={6}
          />
          <path className="map-access-handle__icon" d={`M${handle.x - 2.5} ${handle.y}H${handle.x + 2.5}M${handle.x + 0.8} ${handle.y - 2.2}L${handle.x + 3.1} ${handle.y}L${handle.x + 0.8} ${handle.y + 2.2}`} />
        </g>
      ))}
      {endpointHandles.map((handle) => (
        <circle
          key={`endpoint-${handle.id}`}
          className={draggingCorridorHandle === handle.id ? "endpoint-handle is-dragging" : "endpoint-handle"}
          cx={handle.x}
          cy={handle.y}
          r={5}
          onPointerEnter={(event) => editorOptions.onCorridorHandlePointerEnter?.(event, handle)}
          onPointerLeave={(event) => editorOptions.onCorridorHandlePointerLeave?.(event, handle)}
          onPointerDown={(event) => onDoorPointerDown?.(event, handle)}
          onContextMenu={(event) => onDoorContextMenu?.(event, handle)}
        />
      ))}
      {waypointHandles.map((handle) => {
        const cell = { x: Math.floor(handle.x / config.gridSize), y: Math.floor(handle.y / config.gridSize) };
        const isJunction = junctionByCell.has(cellKey(cell.x, cell.y));
        const classes = ["waypoint-handle", isJunction ? "is-junction" : "", draggingCorridorHandle === handle.id ? "is-dragging" : ""].filter(Boolean).join(" ");
        return (
          <rect
            key={`waypoint-${handle.id}`}
            className={classes}
            x={handle.x - (isJunction ? 5 : 4)}
            y={handle.y - (isJunction ? 5 : 4)}
            width={isJunction ? 10 : 8}
            height={isJunction ? 10 : 8}
            onPointerEnter={(event) => editorOptions.onCorridorHandlePointerEnter?.(event, handle)}
            onPointerLeave={(event) => editorOptions.onCorridorHandlePointerLeave?.(event, handle)}
            onPointerDown={(event) => onWaypointPointerDown?.(event, handle)}
            onContextMenu={(event) => onWaypointContextMenu?.(event, handle)}
          />
        );
      })}
    </g>
  );
}

function generateMap(rawConfig, manualOverrides = {}) {
  const config = normalizeInput(applyManualOverridesToConfig(rawConfig, manualOverrides));
  const rng = createSeededRng(hashStringToSeed(config.seed, config.roomCount, config.context, config.biome));
  const generatedGraph = adaptGeneratedGraphForContext(config, buildCorridorGraph(config, rng));
  const graphConfig = {
    ...config,
    regions: annotateRegionsWithGraphMetadata(config.regions, generatedGraph),
  };
  const placedRegions = placeRegions(graphConfig, generatedGraph, rng);
  const positionedRegions = applyManualRoomPositions(placedRegions, graphConfig);
  const sizedRegions = applyRoomSizeOverrides(positionedRegions, graphConfig);
  const styledRegions = applyRoomStyleOverrides(sizedRegions, graphConfig);
  const shapedRegions = buildAllRoomMasks(styledRegions, graphConfig.seed, graphConfig.gridSize);
  const routingGraph = applyManualConnectionsToGraph(graphConfig, generatedGraph);
  const routedCorridors = routeCorridors(graphConfig, shapedRegions, routingGraph);
  const extensionRegions = applyCircleDoorRoomExtensions(shapedRegions, routedCorridors);
  const leveledMap = applyLevelMetadata(extensionRegions, routedCorridors, graphConfig);
  const routedRegions = leveledMap.regions;
  const corridors = leveledMap.corridors;
  const baseDungeonMask = buildDungeonMask(routedRegions, corridors, graphConfig.gridSize);
  const contentBounds = computeContentBounds(baseDungeonMask.floorCells, graphConfig.gridSize, { x: 0, y: 0, width: graphConfig.mapWidth, height: graphConfig.mapHeight });
  const provisionalMap = {
    seed: graphConfig.seed,
    config: graphConfig,
    graph: routingGraph,
    placementGraph: generatedGraph,
    bounds: { x: 0, y: 0, width: config.mapWidth, height: config.mapHeight },
    contentBounds,
    regions: routedRegions,
    corridors,
    dungeonMask: baseDungeonMask,
  };
  const mapAccesses = createMapAccesses(provisionalMap);
  const dungeonMask = { ...baseDungeonMask, mapAccesses };
  const props = createProps({ config: graphConfig, regions: routedRegions, corridors, dungeonMask });
  return {
    ...provisionalMap,
    dungeonMask,
    mapAccesses,
    props,
  };
}

function createMapSignature(generatedMap) {
  const regions = generatedMap.regions
    .map((region) => `${region.id}:${region.cellRect.x},${region.cellRect.y},${region.cellRect.w},${region.cellRect.h}`)
    .sort()
    .join("|");
  const corridors = generatedMap.corridors
    .map((corridor) => `${corridor.id}:${corridor.floorCells.map((cell) => cellKey(cell.x, cell.y)).join(";")}`)
    .sort()
    .join("|");
  const doors = generatedMap.dungeonMask.doorSegments
    .map(doorKey)
    .sort()
    .join("|");
  return `${regions}::${corridors}::${doors}`;
}

function countSolidCorridorBlocks(corridorFloorCells) {
  const cells = new Set(corridorFloorCells.map((cell) => cellKey(cell.x, cell.y)));
  let count = 0;
  cells.forEach((key) => {
    const cell = parseCellKey(key);
    if (
      cells.has(cellKey(cell.x + 1, cell.y)) &&
      cells.has(cellKey(cell.x, cell.y + 1)) &&
      cells.has(cellKey(cell.x + 1, cell.y + 1))
    ) {
      count += 1;
    }
  });
  return count;
}

function countUnwantedSolidCorridorBlocks(generatedMap) {
  const organicCells = getOrganicCorridorCellKeys(generatedMap);
  const structuredCells = (generatedMap.dungeonMask.corridorFloorCells || [])
    .filter((cell) => !organicCells.has(cellKey(cell.x, cell.y)));
  return countSolidCorridorBlocks(structuredCells);
}

function getRoomRectFillRatio(region) {
  const area = Math.max(1, region.cellRect.w * region.cellRect.h);
  return (region.floorCells?.length || 0) / area;
}

function hasCaveMaskIrregularity(region) {
  if (region.shape !== "cave") return true;
  const area = Math.max(1, region.cellRect.w * region.cellRect.h);
  const missingCells = area - (region.floorCells?.length || 0);
  const boundaryCount = getBoundaryCells(region).length;
  return missingCells >= Math.max(2, Math.floor(area * 0.08)) && boundaryCount >= Math.floor(Math.sqrt(area) * 4.2);
}

function getRoomCellOwnerMap(regions) {
  const owners = new Map();
  regions.forEach((region) => {
    region.floorCells.forEach((cell) => {
      const key = cellKey(cell.x, cell.y);
      if (!owners.has(key)) owners.set(key, []);
      owners.get(key).push(region.id);
    });
  });
  return owners;
}

function isAnchorOnRegionBoundary(region, anchor) {
  if (!anchor) return false;
  return getBoundaryCells(region).some((candidate) =>
    candidate.side === anchor.side &&
    candidate.cell.x === anchor.cell.x &&
    candidate.cell.y === anchor.cell.y &&
    candidate.outsideCell.x === anchor.outsideCell.x &&
    candidate.outsideCell.y === anchor.outsideCell.y
  );
}

function corridorContainsCell(corridor, cell) {
  return corridor.floorCells.some((corridorCell) => corridorCell.x === cell.x && corridorCell.y === cell.y);
}

function getExpectedLevelDeltaForStair(endpoint, stairTransition) {
  const transition = normalizeStairTransition(stairTransition, "none");
  if (transition === "none") return 0;
  if (endpoint === "to") return transition === "up" ? -1 : 1;
  return transition === "up" ? 1 : -1;
}

function parseStairTransitionOverrideKey(key) {
  const [corridorId, endpoint = "shared"] = String(key || "").split(":");
  return { corridorId, endpoint };
}

function getConfiguredStairOverrideEntries(generatedMap) {
  return Object.entries(generatedMap.config.manualStairTransitions || {})
    .map(([key, value]) => ({ ...parseStairTransitionOverrideKey(key), type: normalizeStairTransition(value, "none"), key }))
    .filter((entry) => entry.type !== "none");
}

function getRenderedStairDoorEntries(generatedMap) {
  const corridorById = new Map(generatedMap.corridors.map((corridor) => [corridor.id, corridor]));
  return (generatedMap.dungeonMask.doorSegments || [])
    .map((door) => ({
      door,
      corridor: corridorById.get(door.corridorId),
      type: normalizeStairTransition(door.stairTransition, "none"),
      endpoint: door.endpoint || "shared",
    }))
    .filter((entry) => entry.type !== "none");
}

function getCorridorEndpointCell(corridor, endpoint) {
  const topologyCells = getCorridorTopologyCells(corridor);
  if (!corridor || topologyCells.length === 0) return null;
  if (endpoint === "to") return topologyCells[topologyCells.length - 1];
  return topologyCells[0];
}

function cellsMatch(a, b) {
  return Boolean(a && b) && a.x === b.x && a.y === b.y;
}

function validateLevelSystem(generatedMap) {
  const corridorById = new Map(generatedMap.corridors.map((corridor) => [corridor.id, corridor]));
  const renderedStairs = getRenderedStairDoorEntries(generatedMap);
  const configuredStairs = getConfiguredStairOverrideEntries(generatedMap);
  const staleStairOverrides = configuredStairs.filter((entry) => !corridorById.has(entry.corridorId));
  const missingRenderedStairs = configuredStairs.filter((entry) => {
    const corridor = corridorById.get(entry.corridorId);
    if (!corridor) return false;
    return !renderedStairs.some((rendered) => rendered.door.corridorId === entry.corridorId && rendered.endpoint === entry.endpoint && rendered.type === entry.type);
  });

  const invalidStairCorridors = renderedStairs.filter(({ corridor, door, endpoint }) => {
    if (!corridor || corridor.isRoomLink) return true;
    if (!door.outsideCell || !Array.isArray(corridor.floorCells) || corridor.floorCells.length < 2) return true;
    return !corridorContainsCell(corridor, door.outsideCell) || !["from", "to"].includes(endpoint);
  });

  const stairsWithoutLevelDelta = renderedStairs.filter(({ corridor, type, endpoint }) => {
    if (!corridor) return true;
    const expectedDelta = getExpectedLevelDeltaForStair(endpoint, type);
    return corridor.toLevel - corridor.fromLevel !== expectedDelta || Math.abs(corridor.toLevel - corridor.fromLevel) !== 1;
  });

  const stairPlacementErrors = renderedStairs.filter(({ corridor, door, endpoint }) => {
    if (!corridor || !door.outsideCell || corridor.isRoomLink) return true;
    const endpointCell = getCorridorEndpointCell(corridor, endpoint);
    return !cellsMatch(endpointCell, door.outsideCell);
  });

  const inconsistentLevelConstraints = generatedMap.corridors.filter((corridor) => {
    if (!Number.isFinite(corridor.fromLevel) || !Number.isFinite(corridor.toLevel)) return true;
    const expectedDelta = getCorridorConfiguredLevelDelta(generatedMap.config, corridor);
    return corridor.toLevel - corridor.fromLevel !== expectedDelta;
  });

  const crossLevelJunctions = getCorridorIntersectionCells(generatedMap.corridors).filter((junction) => {
    const levels = new Set(junction.corridors.map((corridor) => getCorridorPlanarLevel(corridor)));
    return levels.size > 1;
  });

  return {
    configuredStairs,
    renderedStairs,
    staleStairOverrides,
    missingRenderedStairs,
    invalidStairCorridors,
    stairsWithoutLevelDelta,
    stairPlacementErrors,
    inconsistentLevelConstraints,
    crossLevelJunctions,
    crossLevelCrossings: getCrossLevelCorridorIntersectionCells(generatedMap.corridors),
  };
}

function validateExportSvgString(svgText) {
  const forbidden = ["editor-overlays", "room-drag-handle", "endpoint-handle", "waypoint-handle", "is-dragging"];
  return {
    passed: Boolean(svgText) && forbidden.every((token) => !svgText.includes(token)),
    missingSvg: !svgText,
    leakedTokens: forbidden.filter((token) => svgText?.includes(token)),
  };
}

function makeTestResult(id, label, passed, details = "") {
  return { id, label, passed: Boolean(passed), details };
}

function validateGeneratedMap(generatedMap, sourceConfig = generatedMap.config) {
  const tests = [];
  const errors = [];
  const warnings = [];
  const normalizedSource = normalizeInput(sourceConfig);
  const expectedRegionIds = new Set(normalizedSource.regions.map((region) => region.id));
  const generatedRegionIds = new Set(generatedMap.regions.map((region) => region.id));
  const regionById = new Map(generatedMap.regions.map((region) => [region.id, region]));
  const corridorById = new Map(generatedMap.corridors.map((corridor) => [corridor.id, corridor]));
  const roomOwners = getRoomCellOwnerMap(generatedMap.regions);
  const floorCells = new Set(generatedMap.dungeonMask.floorCells.map((cell) => cellKey(cell.x, cell.y)));

  const missingRegions = [...expectedRegionIds].filter((id) => !generatedRegionIds.has(id));
  const extraRegions = [...generatedRegionIds].filter((id) => !expectedRegionIds.has(id));
  tests.push(makeTestResult(
    "regions-exist",
    "Every requested region exists",
    missingRegions.length === 0 && extraRegions.length === 0 && generatedMap.regions.length === generatedMap.config.roomCount,
    missingRegions.length > 0 ? `Missing: ${missingRegions.join(", ")}` : extraRegions.length > 0 ? `Unexpected: ${extraRegions.join(", ")}` : `${generatedMap.regions.length} region(s)`
  ));

  const missingEdges = generatedMap.graph.filter((edge) => !corridorById.has(edge.id));
  tests.push(makeTestResult(
    "edges-have-corridors",
    "Every graph edge has a corridor",
    missingEdges.length === 0,
    missingEdges.length > 0 ? `Missing corridor(s): ${missingEdges.map((edge) => edge.id).join(", ")}` : `${generatedMap.corridors.length} corridor(s)`
  ));

  const criticalEdges = generatedMap.graph.filter((edge) => edge.kind === "critical");
  tests.push(makeTestResult(
    "critical-path-exists",
    "Graph has an intentional critical path",
    generatedMap.regions.length <= 1 || criticalEdges.length >= 1,
    criticalEdges.length > 0 ? `${criticalEdges.length} critical edge(s)` : "no critical edge"
  ));

  const finalRegions = generatedMap.regions.filter((region) => region.graphRole === "final");
  const deepestNonSecretDepth = Math.max(0, ...generatedMap.regions.filter((region) => region.graphRole !== "secret").map((region) => region.graphDepth || 0));
  const finalDepthOk = finalRegions.length === 0 || finalRegions.some((region) => (region.graphDepth || 0) >= deepestNonSecretDepth - 1);
  tests.push(makeTestResult(
    "final-room-is-deep",
    "Final/climax room is placed deep in the graph",
    finalDepthOk,
    finalRegions.length > 0 ? finalRegions.map((region) => `${region.name}: depth ${region.graphDepth}`).join("; ") : "no explicit final region"
  ));

  const secretRegions = generatedMap.regions.filter((region) => region.graphRole === "secret");
  const secretRegionIds = new Set(secretRegions.map((region) => region.id));
  const secretEdges = generatedMap.graph.filter((edge) => edge.secret || edge.kind === "secret");
  const connectedSecrets = new Set(secretEdges.flatMap((edge) => [edge.from, edge.to]).filter((id) => secretRegionIds.has(id)));
  tests.push(makeTestResult(
    "secret-branches",
    "Secret regions are connected through secret branches",
    secretRegions.every((region) => connectedSecrets.has(region.id)),
    secretRegions.length > 0 ? `${connectedSecrets.size}/${secretRegions.length} secret region(s) connected` : "no secret regions"
  ));

  const expectedLinks = normalizedSource.regions.flatMap((region) =>
    (region.links || []).map((rawLink, index) => ({ region, link: parseRegionLink(rawLink), index }))
  ).filter((item) => item.link?.to && expectedRegionIds.has(item.link.to));
  const missingLinks = expectedLinks.filter((item) => !generatedMap.graph.some((edge) =>
    (edge.from === item.region.id && edge.to === item.link.to) ||
    (edge.from === item.link.to && edge.to === item.region.id)
  ));
  tests.push(makeTestResult(
    "region-links-honored",
    "Explicit region.links are honored",
    missingLinks.length === 0,
    missingLinks.length > 0 ? `Missing: ${missingLinks.map((item) => `${item.region.id}->${item.link.to}`).join(", ")}` : `${expectedLinks.length} link(s)`
  ));

  const uniqueRoomShapes = new Set(generatedMap.regions.map((region) => region.shape || "rect"));
  tests.push(makeTestResult(
    "room-shape-diversity",
    "Room shape library is producing varied room masks",
    generatedMap.regions.length <= 2 || uniqueRoomShapes.size > 1,
    `${Array.from(uniqueRoomShapes).join(", ")}`
  ));

  const regionSurfaces = generatedMap.regions.map((region) => getRegionSurface(region, generatedMap, generatedMap.config.gridSize));
  const mapSurface = getMapSurface(generatedMap);
  const contextKey = getContextKey(generatedMap.config.context || generatedMap.config.biome);
  const caveRegions = generatedMap.regions.filter((region) => region.shape === "cave");
  const caveMapSurface = contextKey === "cave" ? getMapSurface(generatedMap) : null;
  tests.push(makeTestResult(
    "region-surfaces-exist",
    "Every region exposes a renderable surface abstraction",
    regionSurfaces.length === generatedMap.regions.length && regionSurfaces.every((surface) => surface.regionId && surface.visualFloorPath && Array.isArray(surface.floorCells) && Array.isArray(surface.wallSegments)),
    `${regionSurfaces.length} region surface(s)`
  ));

  tests.push(makeTestResult(
    "map-surface-exists",
    "Unified map surface exposes floor, walls, doors, and clipping paths",
    Boolean(mapSurface.visualFloorPath) && Array.isArray(mapSurface.floorCells) && Array.isArray(mapSurface.wallSegments) && Array.isArray(mapSurface.doorSegments),
    `${mapSurface.surfaceKind} · ${mapSurface.floorCells.length} floor cell(s)`
  ));

  tests.push(makeTestResult(
    "cave-context-uses-hex-map-surface",
    "Cave context renders through a unified hex-based cave surface",
    contextKey !== "cave" || Boolean(caveMapSurface?.visualFloorPath && caveMapSurface.geometryKind === "hex-cave-map"),
    contextKey === "cave" && caveMapSurface ? `${caveMapSurface.geometryKind} · ${caveMapSurface.floorCells.length} floor cell(s)` : "not cave context"
  ));

  tests.push(makeTestResult(
    "cave-editor-model-is-preserved",
    "Cave context preserves rooms, corridors, doors, and map accesses for editing",
    contextKey !== "cave" || (generatedMap.regions.length > 0 && (generatedMap.regions.length <= 1 || generatedMap.corridors.length > 0) && Array.isArray(caveMapSurface?.doorSegments)),
    contextKey === "cave" && caveMapSurface ? `${generatedMap.corridors.length} corridor(s), ${caveMapSurface.doorSegments.length} door segment(s)` : "not cave context"
  ));

  tests.push(makeTestResult(
    "cave-context-uses-cave-rooms",
    "Cave context still tags regions as cave rooms for content semantics",
    contextKey !== "cave" || caveRegions.length > 0,
    contextKey === "cave" ? `${caveRegions.length} cave room(s)` : "not cave context"
  ));

  tests.push(makeTestResult(
    "cave-masks-are-irregular",
    "Fallback cave room masks remain non-rectangular for editor semantics",
    caveRegions.every(hasCaveMaskIrregularity),
    caveRegions.length > 0
      ? caveRegions.map((region) => `${region.name}: ${(getRoomRectFillRatio(region) * 100).toFixed(0)}% fill`).join("; ")
      : "no cave rooms"
  ));

  const overlappingRoomCells = [];
  roomOwners.forEach((owners, key) => {
    if (owners.length > 1) overlappingRoomCells.push(`${key}->${owners.join("/")}`);
  });
  tests.push(makeTestResult(
    "no-room-overlap",
    "Rooms do not overlap each other",
    overlappingRoomCells.length === 0,
    overlappingRoomCells.slice(0, 4).join("; ")
  ));

  const corridorRoomIntrusions = [];
  generatedMap.corridors.forEach((corridor) => {
    corridor.floorCells.forEach((cell) => {
      const owners = roomOwners.get(cellKey(cell.x, cell.y));
      if (owners?.length) corridorRoomIntrusions.push(`${corridor.id}@${cell.x},${cell.y}->${owners.join("/")}`);
    });
  });
  tests.push(makeTestResult(
    "corridors-outside-rooms",
    "No corridor passes through room cells",
    corridorRoomIntrusions.length === 0,
    corridorRoomIntrusions.slice(0, 3).join("; ")
  ));

  const invalidAnchors = [];
  generatedMap.corridors.forEach((corridor) => {
    const fromRegion = regionById.get(corridor.from);
    const toRegion = regionById.get(corridor.to);
    if (!fromRegion || !isAnchorOnRegionBoundary(fromRegion, corridor.fromAnchor)) invalidAnchors.push(`${corridor.id}:from`);
    if (!toRegion || !isAnchorOnRegionBoundary(toRegion, corridor.toAnchor)) invalidAnchors.push(`${corridor.id}:to`);
  });
  tests.push(makeTestResult(
    "doors-on-boundaries",
    "Every door is on a room boundary",
    invalidAnchors.length === 0,
    invalidAnchors.slice(0, 4).join(", ")
  ));

  const doorsNotTouchingCorridors = [];
  generatedMap.corridors.forEach((corridor) => {
    if (!corridor.isRoomLink && corridor.fromAnchor && !corridorContainsCell(corridor, corridor.fromAnchor.outsideCell)) doorsNotTouchingCorridors.push(`${corridor.id}:from`);
    if (!corridor.isRoomLink && corridor.toAnchor && !corridorContainsCell(corridor, corridor.toAnchor.outsideCell)) doorsNotTouchingCorridors.push(`${corridor.id}:to`);
  });
  tests.push(makeTestResult(
    "doors-touch-corridors",
    "Every door touches its corridor",
    doorsNotTouchingCorridors.length === 0,
    doorsNotTouchingCorridors.slice(0, 4).join(", ")
  ));

  const invalidFloorCells = [];
  generatedMap.corridors.forEach((corridor) => {
    corridor.floorCells.forEach((cell) => {
      if (!floorCells.has(cellKey(cell.x, cell.y))) invalidFloorCells.push(`${corridor.id}@${cell.x},${cell.y}`);
    });
  });
  tests.push(makeTestResult(
    "corridor-cells-in-mask",
    "Every corridor cell exists in the dungeon mask",
    invalidFloorCells.length === 0,
    invalidFloorCells.slice(0, 4).join(", ")
  ));

  const solidCorridorBlocks = countUnwantedSolidCorridorBlocks(generatedMap);
  tests.push(makeTestResult(
    "no-solid-corridor-blocks",
    "No unwanted 2x2 structured corridor blocks",
    solidCorridorBlocks === 0,
    solidCorridorBlocks > 0 ? `${solidCorridorBlocks} block(s)` : "0 blocks"
  ));

  const explicitLevelModel = generatedMap.config.manualLevels || {};
  const explicitStairs = explicitLevelModel.stairs || {};
  const legacyStairs = generatedMap.config.manualStairTransitions || {};
  const stairMirrorKeys = Array.from(new Set([...Object.keys(explicitStairs), ...Object.keys(legacyStairs)]));
  const staleStairMirror = stairMirrorKeys.filter((key) => explicitStairs[key] !== legacyStairs[key]);
  tests.push(makeTestResult(
    "state-v2-explicit-level-model",
    "State v2 exposes explicit level containers",
    Boolean(explicitLevelModel.regions && explicitLevelModel.corridors && explicitLevelModel.stairs) && staleStairMirror.length === 0,
    staleStairMirror.length > 0 ? `Stale stair key(s): ${staleStairMirror.join(", ")}` : "levels.regions / levels.corridors / levels.stairs"
  ));

  const levelValidation = validateLevelSystem(generatedMap);
  tests.push(makeTestResult(
    "stair-overrides-render",
    "Every configured stair is attached to a rendered door",
    levelValidation.staleStairOverrides.length === 0 && levelValidation.missingRenderedStairs.length === 0,
    levelValidation.staleStairOverrides.length > 0
      ? `Stale: ${levelValidation.staleStairOverrides.map((entry) => entry.key).join(", ")}`
      : levelValidation.missingRenderedStairs.length > 0
        ? `Not rendered: ${levelValidation.missingRenderedStairs.map((entry) => entry.key).join(", ")}`
        : `${levelValidation.renderedStairs.length} stair door(s)`
  ));

  tests.push(makeTestResult(
    "stair-doors-have-corridors",
    "Every stair door belongs to a real corridor endpoint",
    levelValidation.invalidStairCorridors.length === 0,
    levelValidation.invalidStairCorridors.length > 0
      ? levelValidation.invalidStairCorridors.map((entry) => `${entry.door.corridorId || "missing"}:${entry.endpoint}`).join(", ")
      : `${levelValidation.renderedStairs.length} stair door(s) valid`
  ));

  tests.push(makeTestResult(
    "stairs-create-level-delta",
    "Every stair transition creates a matching level difference",
    levelValidation.stairsWithoutLevelDelta.length === 0,
    levelValidation.stairsWithoutLevelDelta.length > 0
      ? levelValidation.stairsWithoutLevelDelta.map((entry) => `${entry.door.corridorId}:${entry.endpoint} ${entry.type} -> Δ${entry.corridor ? entry.corridor.toLevel - entry.corridor.fromLevel : "?"}`).join(", ")
      : `${levelValidation.renderedStairs.length} transition(s)`
  ));

  tests.push(makeTestResult(
    "stair-symbol-first-corridor-cell",
    "Stair symbols are anchored to the first corridor square after the door",
    levelValidation.stairPlacementErrors.length === 0,
    levelValidation.stairPlacementErrors.length > 0
      ? levelValidation.stairPlacementErrors.map((entry) => `${entry.door.corridorId}:${entry.endpoint}`).join(", ")
      : `${levelValidation.renderedStairs.length} symbol anchor(s)`
  ));

  tests.push(makeTestResult(
    "level-constraints-consistent",
    "Rooms do not receive contradictory level constraints",
    levelValidation.inconsistentLevelConstraints.length === 0,
    levelValidation.inconsistentLevelConstraints.length > 0
      ? levelValidation.inconsistentLevelConstraints.map((corridor) => `${corridor.id}: ${corridor.fromLevel}->${corridor.toLevel}, expected Δ${getCorridorConfiguredLevelDelta(generatedMap.config, corridor)}`).join(", ")
      : `${getAvailableMapLevels(generatedMap).map(formatMapLevel).join(", ") || "0"}`
  ));

  tests.push(makeTestResult(
    "cross-level-corridors-not-junctions",
    "Cross-level corridor crossings are not treated as same-level junctions",
    levelValidation.crossLevelJunctions.length === 0,
    levelValidation.crossLevelJunctions.length > 0
      ? levelValidation.crossLevelJunctions.map((junction) => junction.key).join(", ")
      : `${levelValidation.crossLevelCrossings.length} cross-level crossing(s)`
  ));

  tests.forEach((test) => {
    if (!test.passed) errors.push(`${test.label}: ${test.details}`);
  });

  const expectedDoorCount = generatedMap.corridors.reduce((sum, corridor) => sum + (corridor.isRoomLink ? 1 : 2), 0);
  if (generatedMap.dungeonMask.doorSegments.length < expectedDoorCount) {
    warnings.push(`Expected up to ${expectedDoorCount} door cuts, found ${generatedMap.dungeonMask.doorSegments.length}. Some shared or overlapping doors may have been deduplicated.`);
  }

  return {
    passed: errors.length === 0,
    tests,
    errors,
    warnings,
    metrics: {
      regions: generatedMap.regions.length,
      corridors: generatedMap.corridors.length,
      graphEdges: generatedMap.graph.length,
      doors: generatedMap.dungeonMask.doorSegments.length,
      stairs: levelValidation.renderedStairs.length,
      stateVersion: MANUAL_OVERRIDE_SCHEMA_VERSION,
      levels: getAvailableMapLevels(generatedMap).length,
      crossLevelCrossings: levelValidation.crossLevelCrossings.length,
      floorCells: generatedMap.dungeonMask.floorCells.length,
      solidCorridorBlocks,
    },
  };
}

function runGoldenSeedChecks(baseConfig, manualOverrides = createEmptyManualOverrides()) {
  const sameA = generateMap({ ...baseConfig, seed: "golden-ossuary", roomCount: 7 }, manualOverrides);
  const sameB = generateMap({ ...baseConfig, seed: "golden-ossuary", roomCount: 7 }, manualOverrides);
  const differentSeed = generateMap({ ...baseConfig, seed: "golden-ossuary-alt", roomCount: 7 }, manualOverrides);
  const differentCount = generateMap({ ...baseConfig, seed: "golden-ossuary", roomCount: 5 }, manualOverrides);
  const differentContext = generateMap({ ...baseConfig, seed: "golden-ossuary", roomCount: 7, context: baseConfig.context === "Crypt" ? "Cave" : "Crypt" }, manualOverrides);
  const signatureA = createMapSignature(sameA);
  const tests = [
    makeTestResult("same-seed", "Same config + same seed = same output", signatureA === createMapSignature(sameB)),
    makeTestResult("different-seed", "Different seed = different output", signatureA !== createMapSignature(differentSeed)),
    makeTestResult("different-room-count", "Different room count = different topology", signatureA !== createMapSignature(differentCount)),
    makeTestResult("different-context", "Different context = different spatial composition", signatureA !== createMapSignature(differentContext)),
  ];
  return {
    passed: tests.every((test) => test.passed),
    tests,
    deterministic: tests[0].passed,
    seedVariation: tests[1].passed,
    roomCountVariation: tests[2].passed,
    contextVariation: tests[3].passed,
  };
}

function buildFullStructuralTestSuite(generatedMap, config, exportValidation) {
  const structural = validateGeneratedMap(generatedMap, config);
  const golden = runGoldenSeedChecks(config, createEmptyManualOverrides());
  const exportTest = makeTestResult(
    "export-clean",
    "Export SVG does not include editor overlays",
    exportValidation.passed,
    exportValidation.missingSvg ? "SVG not available yet" : exportValidation.leakedTokens.length > 0 ? `Leaked: ${exportValidation.leakedTokens.join(", ")}` : "clean export"
  );
  const tests = [...golden.tests, ...structural.tests, exportTest];
  return {
    passed: tests.every((test) => test.passed),
    tests,
    structural,
    golden,
    exportValidation,
  };
}

function serializeSvg(svgElement, options = {}) {
  if (!svgElement) return "";
  const clone = svgElement.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.querySelectorAll(".editor-overlays").forEach((node) => node.remove());
  if (options.removeLabels) clone.querySelectorAll(".labels").forEach((node) => node.remove());
  if (options.hideSecretDoors) {
    clone.querySelectorAll(".secret-door-opening, .door-symbol--secret").forEach((node) => node.remove());
  }
  if (options.printSafe) {
    clone.querySelectorAll(".paper-texture").forEach((node) => node.remove());
    clone.querySelectorAll(".map-grid").forEach((node) => node.remove());
  }
  return new XMLSerializer().serializeToString(clone);
}

function downloadSvgExport(mode = "current") {
  const svg = document.querySelector("#cruor-map-svg");
  const exportOptions = {
    current: {},
    gm: {},
    player: { hideSecretDoors: true, removeLabels: true },
    print: { printSafe: true },
  }[mode] || {};
  const data = serializeSvg(svg, exportOptions);
  if (!data) return;
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const suffix = mode === "current" ? "mvp" : mode;
  link.href = url;
  link.download = `cruor-map-${suffix}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadSvg() {
  downloadSvgExport("current");
}

function downloadGmSvg() {
  downloadSvgExport("gm");
}

function downloadPlayerSvg() {
  downloadSvgExport("player");
}

function downloadPrintSvg() {
  downloadSvgExport("print");
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createDerivedLevelSnapshot(generatedMap) {
  if (!generatedMap) return createEmptyLevelOverrides();
  const regions = Object.fromEntries((generatedMap.regions || []).map((region) => [
    region.id,
    {
      level: getRegionLevel(region),
    },
  ]));
  const corridors = Object.fromEntries((generatedMap.corridors || []).map((corridor) => [
    corridor.id,
    {
      level: getCorridorPlanarLevel(corridor),
      fromLevel: Number.isFinite(corridor.fromLevel) ? corridor.fromLevel : 0,
      toLevel: Number.isFinite(corridor.toLevel) ? corridor.toLevel : 0,
      levelDelta: Number.isFinite(corridor.levelDelta) ? corridor.levelDelta : 0,
      stairEndpoint: corridor.stairEndpoint || null,
      stairTransition: normalizeStairTransition(corridor.stairTransition, "none"),
      verticalTransition: Boolean(corridor.verticalTransition),
    },
  ]));
  return { regions, corridors, stairs: {} };
}

function buildExplicitLevelOverrides(manualOverrides, generatedMap = null) {
  const normalized = normalizeManualOverrides(manualOverrides);
  const derived = createDerivedLevelSnapshot(generatedMap);
  return {
    ...normalized,
    levels: {
      regions: {
        ...(normalized.levels.regions || {}),
        ...derived.regions,
      },
      corridors: {
        ...(normalized.levels.corridors || {}),
        ...derived.corridors,
      },
      stairs: {
        ...normalized.levels.stairs,
      },
    },
    stairTransitions: {
      ...normalized.levels.stairs,
    },
  };
}

function buildMapStatePayload(config, manualOverrides, uiState = {}, generatedMap = null) {
  return {
    schema: "cruor-map-generator-state",
    version: 2,
    stateModel: "explicit-levels",
    savedAt: new Date().toISOString(),
    config: {
      seed: config.seed,
      context: config.context,
      biome: config.biome,
      horror: config.horror || [],
      sourceAnchors: config.sourceAnchors || [],
      roomCount: config.roomCount,
      gridSize: config.gridSize,
      mapWidth: config.mapWidth,
      mapHeight: config.mapHeight,
      showGrid: Boolean(config.showGrid),
      mode: config.mode,
      visualStyle: config.visualStyle,
      regions: config.regions || [],
      connections: config.connections || [],
    },
    manualOverrides: buildExplicitLevelOverrides(manualOverrides, generatedMap),
    uiState,
  };
}

function parseMapStatePayload(text) {
  const payload = JSON.parse(text);
  if (!payload || typeof payload !== "object") throw new Error("Invalid state file");
  if (payload.schema !== "cruor-map-generator-state") throw new Error("Unsupported state schema");
  return {
    ...payload,
    version: Number(payload.version || 1),
    manualOverrides: normalizeManualOverrides(payload.manualOverrides || {}),
  };
}

function downloadMapState(config, manualOverrides, uiState = {}, generatedMap = null) {
  const safeSeed = String(config.seed || "cruor-map").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "cruor-map";
  downloadJson(`${safeSeed}-state.json`, buildMapStatePayload(config, manualOverrides, uiState, generatedMap));
}

function MapSvg({ generatedMap, showGrid, gridStyle, showEditor, showNames, showProps, levelView = LEVEL_VIEW_ALL, fadeOtherLevels = true, editorOptions = {}, viewportViewBox = null }) {
  const { config } = generatedMap;
  const viewBox = viewportViewBox || `0 0 ${config.mapWidth} ${config.mapHeight}`;
  const availableLevels = getAvailableMapLevels(generatedMap);
  const normalizedLevelView = normalizeLevelView(levelView, availableLevels);
  const isLevelFiltered = normalizedLevelView !== LEVEL_VIEW_ALL;
  const activeMap = isLevelFiltered ? createLevelFilteredMap(generatedMap, normalizedLevelView, "active") : generatedMap;
  const fadedMap = isLevelFiltered && fadeOtherLevels ? createLevelFilteredMap(generatedMap, normalizedLevelView, "inactive") : null;
  const layerGridStyle = isLevelFiltered ? "none" : showGrid ? gridStyle : "none";
  const activeEditorMap = hasRenderableGeometry(activeMap) ? activeMap : generatedMap;

  return (
    <svg
      id="cruor-map-svg"
      className="cruor-map-svg"
      viewBox={viewBox}
      role="img"
      aria-label="Generated Cruor location map"
      onPointerMove={editorOptions.onEditorPointerMove}
      onPointerUp={editorOptions.onEditorPointerUp}
      onPointerCancel={editorOptions.onEditorPointerUp}
    >
      <defs>
        <style>{SVG_STYLE}</style>
        <filter id="paperNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.06" />
          </feComponentTransfer>
        </filter>
        {renderRegionClipPaths(generatedMap)}
        {renderDungeonFloorClipPath(generatedMap)}
      </defs>
      <rect className="paper" x="0" y="0" width={config.mapWidth} height={config.mapHeight} />
      <rect className="paper-texture" x="0" y="0" width={config.mapWidth} height={config.mapHeight} filter="url(#paperNoise)" />
      {showGrid && renderGrid(config, gridStyle)}
      {fadedMap && hasRenderableGeometry(fadedMap) && (
        <g className="level-layer level-layer--faded">
          {renderUnifiedDungeonSurface(fadedMap, "none")}
          {showProps && renderProps(fadedMap.props)}
          {renderLabels(fadedMap, { showNames })}
        </g>
      )}
      <g className="level-layer level-layer--active">
        {renderUnifiedDungeonSurface(activeMap, layerGridStyle)}
        {showProps && renderProps(activeMap.props)}
        {renderLabels(activeMap, { showNames })}
      </g>
      {showEditor && renderEditorOverlays(activeEditorMap, editorOptions)}
    </svg>
  );
}

function MapViewport({ generatedMap, showGrid, gridStyle, showEditor, showNames, showProps, levelView = LEVEL_VIEW_ALL, fadeOtherLevels = true, availableLevels = [], manualOverrides, onRoomMove, onDoorMove, onDoorTypeChange, onDoorStairChange, onMapAccessMove, onMapAccessSet, onMapAccessRemove, onJunctionTypeChange, onWaypointMove, onWaypointInsert, onWaypointDelete, onConnectionDelete, onCreateConnection, onRoomStyleChange, onRoomStyleReset, onEditStart, onEditCommit, onUndo, onRedo, onNewSeed, onToggleGrid, onGridStyleChange, onToggleEditor, onToggleNames, onToggleProps, onLevelViewChange, onToggleFadeOtherLevels, onResetEdits, onExportSvg, onExportGmSvg, onExportPlayerSvg, onExportPrintSvg, onExportState, onImportState, viewResetKey }) {
  const viewportRef = useRef(null);
  const panRef = useRef(null);
  const roomDragRef = useRef(null);
  const corridorDragRef = useRef(null);
  const accessDragRef = useRef(null);
  const connectionDragRef = useRef(null);
  const contentBoundsRef = useRef(generatedMap.contentBounds);
  const lastViewResetKeyRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingRegionId, setDraggingRegionId] = useState(null);
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [draggingCorridorHandle, setDraggingCorridorHandle] = useState(null);
  const [draggingMapAccessId, setDraggingMapAccessId] = useState(null);
  const [hoverWallHandle, setHoverWallHandle] = useState(null);
  const [hoverCorridorHandle, setHoverCorridorHandle] = useState(null);
  const [hoveredCorridorId, setHoveredCorridorId] = useState(null);
  const [connectionDraft, setConnectionDraft] = useState(null);
  const [roomContextMenu, setRoomContextMenu] = useState(null);
  const [doorContextMenu, setDoorContextMenu] = useState(null);
  const [junctionContextMenu, setJunctionContextMenu] = useState(null);
  const [waypointContextMenu, setWaypointContextMenu] = useState(null);
  const [addWaypointContextMenu, setAddWaypointContextMenu] = useState(null);
  const [wallAccessContextMenu, setWallAccessContextMenu] = useState(null);
  const [mapContextMenu, setMapContextMenu] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [viewportSize, setViewportSize] = useState({ width: generatedMap.config.mapWidth, height: generatedMap.config.mapHeight });

  contentBoundsRef.current = generatedMap.contentBounds;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateSize = () => {
      const rect = viewport.getBoundingClientRect();
      setViewportSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const constrainView = useCallback((candidate) => {
    const viewport = viewportRef.current;
    if (!viewport) return candidate;
    const rect = viewport.getBoundingClientRect();
    const scaledWidth = generatedMap.config.mapWidth * candidate.scale;
    const scaledHeight = generatedMap.config.mapHeight * candidate.scale;
    const minX = Math.min(0, rect.width - scaledWidth);
    const minY = Math.min(0, rect.height - scaledHeight);
    return {
      ...candidate,
      x: scaledWidth <= rect.width ? (rect.width - scaledWidth) / 2 : clamp(candidate.x, minX, 0),
      y: scaledHeight <= rect.height ? (rect.height - scaledHeight) / 2 : clamp(candidate.y, minY, 0),
    };
  }, [generatedMap.config.mapWidth, generatedMap.config.mapHeight]);

  const fitView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const bounds = contentBoundsRef.current;
    const margin = 64;
    const availableWidth = Math.max(120, rect.width - margin * 2);
    const availableHeight = Math.max(120, rect.height - margin * 2);
    const nextScale = clamp(Math.min(availableWidth / bounds.width, availableHeight / bounds.height), 0.35, 1.45);
    setView(constrainView({
      scale: nextScale,
      x: (rect.width - bounds.width * nextScale) / 2 - bounds.x * nextScale,
      y: (rect.height - bounds.height * nextScale) / 2 - bounds.y * nextScale,
    }));
  }, [constrainView]);

  useEffect(() => {
    if (lastViewResetKeyRef.current === viewResetKey) return;
    if (roomDragRef.current) return;
    lastViewResetKeyRef.current = viewResetKey;
    const frame = window.requestAnimationFrame(fitView);
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, viewResetKey]);

  const zoomAtPoint = useCallback((clientX, clientY, factor) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    setView((current) => {
      const nextScale = clamp(current.scale * factor, 0.35, 4);
      const mapX = (px - current.x) / current.scale;
      const mapY = (py - current.y) / current.scale;
      return constrainView({
        scale: nextScale,
        x: px - mapX * nextScale,
        y: py - mapY * nextScale,
      });
    });
  }, [constrainView]);

  const zoomAtCenter = useCallback((factor) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }, [zoomAtPoint]);

  function clientToMapPoint(event) {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - view.x) / view.scale,
      y: (event.clientY - rect.top - view.y) / view.scale,
    };
  }

  function getViewportViewBox() {
    return `${-view.x / view.scale} ${-view.y / view.scale} ${viewportSize.width / view.scale} ${viewportSize.height / view.scale}`;
  }

  function handleWheel(event) {
    event.preventDefault();
    event.stopPropagation();
    if (roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    zoomAtPoint(event.clientX, event.clientY, event.deltaY > 0 ? 0.9 : 1.1);
  }

  function openMapContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    setRoomContextMenu(null);
    setDoorContextMenu(null);
    setJunctionContextMenu(null);
    setWaypointContextMenu(null);
    setAddWaypointContextMenu(null);
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    setMapContextMenu({
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 280)),
    });
  }

  function handleRoomContextMenu(event, region) {
    if (!showEditor) return;
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    setMapContextMenu(null);
    setDoorContextMenu(null);
    setJunctionContextMenu(null);
    setWaypointContextMenu(null);
    setAddWaypointContextMenu(null);
    setRoomContextMenu({
      regionId: region.id,
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 280)),
    });
  }

  function handleRoomPointerEnter(event, region) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    setHoverWallHandle(null);
    setHoverCorridorHandle(null);
    setHoveredCorridorId(null);
    setHoveredRegionId(region.id);
  }

  function handleRoomPointerLeave(event, region) {
    if (!showEditor || roomDragRef.current) return;
    event.stopPropagation();
    setHoveredRegionId((current) => current === region.id ? null : current);
  }

  function handleRoomPointerDown(event, region) {
    if (!showEditor) return;
    event.preventDefault();
    event.stopPropagation();
    setHoveredRegionId(region.id);
    onEditStart?.();
    const point = clientToMapPoint(event);
    if (!point) return;
    roomDragRef.current = {
      pointerId: event.pointerId,
      regionId: region.id,
      startX: point.x,
      startY: point.y,
      originX: region.cellRect.x,
      originY: region.cellRect.y,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setDraggingRegionId(region.id);
  }

  function handleWallZonePointerMove(event, zone) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    setHoveredRegionId(zone.regionId);
    setHoverCorridorHandle((current) => current ? null : current);
    setHoveredCorridorId((current) => current ? null : current);
    setHoverWallHandle((current) => {
      if (
        current?.regionId === zone.regionId &&
        current?.anchor?.side === zone.anchor.side &&
        current?.anchor?.cell?.x === zone.anchor.cell.x &&
        current?.anchor?.cell?.y === zone.anchor.cell.y
      ) return current;
      return {
        regionId: zone.regionId,
        adjacentRegionId: zone.adjacentRegionId,
        adjacentAnchor: zone.adjacentAnchor,
        anchor: zone.anchor,
        point: zone.point,
      };
    });
  }

  function eventRelatedTargetHasClass(event, className) {
    const target = event?.relatedTarget;
    if (!target || typeof target !== "object") return false;
    if (target.classList?.contains?.(className)) return true;
    return Boolean(target.closest?.(`.${className}`));
  }

  function isSameWallHoverHandle(current, zoneOrHandle) {
    return Boolean(
      current &&
      zoneOrHandle &&
      current.regionId === zoneOrHandle.regionId &&
      current.anchor?.side === zoneOrHandle.anchor?.side &&
      current.anchor?.cell?.x === zoneOrHandle.anchor?.cell?.x &&
      current.anchor?.cell?.y === zoneOrHandle.anchor?.cell?.y
    );
  }

  function handleWallZonePointerLeave(event, zone) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    if (eventRelatedTargetHasClass(event, "wall-connect-handle")) return;
    setHoverWallHandle((current) => isSameWallHoverHandle(current, zone) ? null : current);
    setHoveredRegionId((current) => current === zone.regionId ? null : current);
  }

  function handleWallHandlePointerLeave(event, handle) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    if (eventRelatedTargetHasClass(event, "wall-hover-zone")) return;
    setHoverWallHandle((current) => isSameWallHoverHandle(current, handle) ? null : current);
    setHoveredRegionId((current) => current === handle.regionId ? null : current);
  }

  function isExternalMapBoundaryZone(zone) {
    if (!zone?.anchor) return false;
    const floorSet = new Set(generatedMap.dungeonMask.floorCells.map((cell) => cellKey(cell.x, cell.y)));
    return !floorSet.has(cellKey(zone.anchor.outsideCell.x, zone.anchor.outsideCell.y));
  }

  function getMapAccessForRegion(regionId) {
    return (generatedMap.dungeonMask.mapAccesses || generatedMap.mapAccesses || []).find((access) => access.regionId === regionId) || null;
  }

  function mapAccessMatchesAnchor(access, anchor) {
    return Boolean(access && anchor) && access.side === anchor.side && access.cell?.x === anchor.cell?.x && access.cell?.y === anchor.cell?.y;
  }

  function openWallAccessContextMenu(event, zone) {
    if (!showEditor || !isExternalMapBoundaryZone(zone)) return false;
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) return true;
    const rect = viewport.getBoundingClientRect();
    const regionAccess = getMapAccessForRegion(zone.regionId);
    setRoomContextMenu(null);
    setDoorContextMenu(null);
    setJunctionContextMenu(null);
    setWaypointContextMenu(null);
    setAddWaypointContextMenu(null);
    setMapContextMenu(null);
    setWallAccessContextMenu({
      regionId: zone.regionId,
      anchor: serializeMapAccessAnchor(zone.anchor),
      hasRegionAccess: Boolean(regionAccess),
      hasAccessAtAnchor: mapAccessMatchesAnchor(regionAccess, zone.anchor),
      accessType: regionAccess?.type || "passage",
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 220)),
    });
    return true;
  }

  function handleWallZoneContextMenu(event, zone) {
    if (openWallAccessContextMenu(event, zone)) return;
  }

  function handleMapAccessContextMenu(event, handle) {
    if (!showEditor || !handle?.access) return;
    event.preventDefault();
    event.stopPropagation();
    const region = generatedMap.regions.find((item) => item.id === handle.regionId);
    if (!region) return;
    const anchor = resolveMapAccessAnchor(region, { side: handle.access.side, cell: handle.access.cell }, generatedMap);
    if (!anchor) return;
    const zone = { regionId: region.id, anchor };
    openWallAccessContextMenu(event, zone);
  }

  function handleMapAccessPointerDown(event, handle) {
    if (!showEditor || event.button !== 0 || !handle?.access) return;
    event.preventDefault();
    event.stopPropagation();
    onEditStart?.();
    accessDragRef.current = {
      pointerId: event.pointerId,
      id: handle.id,
      regionId: handle.regionId,
      accessType: handle.access.type,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setDraggingMapAccessId(handle.id);
  }

  function handleMapAccessPointerMove(event) {
    const drag = accessDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    const point = clientToMapPoint(event);
    if (!point) return true;
    const region = generatedMap.regions.find((item) => item.id === drag.regionId);
    if (!region) return true;
    const anchor = getClosestExternalBoundaryAnchorToPoint(region, point, generatedMap);
    if (!anchor) return true;
    onMapAccessMove?.(drag.regionId, anchor, drag.accessType);
    return true;
  }

  function endMapAccessDrag(event) {
    const drag = accessDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    accessDragRef.current = null;
    setDraggingMapAccessId(null);
    onEditCommit?.();
    return true;
  }

  function createDirectSharedRoomDoor(zone) {
    if (!zone?.adjacentRegionId || !zone?.adjacentAnchor) return false;
    onCreateConnection?.({
      fromRegionId: zone.regionId,
      fromAnchor: zone.anchor,
      toRegionId: zone.adjacentRegionId,
      toAnchor: zone.adjacentAnchor,
    });
    setHoverWallHandle(null);
    setHoverCorridorHandle(null);
    setConnectionDraft(null);
    return true;
  }

  function handleWallZonePointerDown(event, zone) {
    if (!showEditor) return;
    event.preventDefault();
    event.stopPropagation();
    if (createDirectSharedRoomDoor(zone)) return;
    connectionDragRef.current = {
      pointerId: event.pointerId,
      fromRegionId: zone.regionId,
      fromAnchor: zone.anchor,
      start: zone.point,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setConnectionDraft({ start: zone.point, current: zone.point });
  }

  function handleCorridorZonePointerMove(event, zone) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    setHoveredRegionId(null);
    setHoverWallHandle(null);
    setHoverCorridorHandle(zone);
    setHoveredCorridorId(zone.corridor.id);
  }

  function isSameCorridorHoverHandle(current, zoneOrHandle) {
    return Boolean(current && zoneOrHandle && current.id === zoneOrHandle.id);
  }

  function handleCorridorZonePointerLeave(event, zone) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    if (eventRelatedTargetHasClass(event, "corridor-add-handle")) return;
    setHoverCorridorHandle((current) => isSameCorridorHoverHandle(current, zone) ? null : current);
    setHoveredCorridorId((current) => current === zone.corridor.id ? null : current);
  }

  function handleCorridorAddPointerLeave(event, handle) {
    if (!showEditor || roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    if (eventRelatedTargetHasClass(event, "corridor-hover-zone")) return;
    setHoverCorridorHandle((current) => isSameCorridorHoverHandle(current, handle) ? null : current);
    setHoveredCorridorId((current) => current === handle.corridor.id ? null : current);
  }

  function handleCorridorHandlePointerEnter(event, handle) {
    if (!showEditor || roomDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    event.stopPropagation();
    setHoveredCorridorId(handle.corridor.id);
  }

  function handleCorridorHandlePointerLeave(event, handle) {
    if (!showEditor || corridorDragRef.current) return;
    event.stopPropagation();
    setHoveredCorridorId((current) => current === handle.corridor.id ? null : current);
  }

  function handleRoomPointerMove(event) {
    const drag = roomDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const point = clientToMapPoint(event);
    if (!point) return;
    const dx = Math.round((point.x - drag.startX) / generatedMap.config.gridSize);
    const dy = Math.round((point.y - drag.startY) / generatedMap.config.gridSize);
    onRoomMove?.(drag.regionId, { x: drag.originX + dx, y: drag.originY + dy });
  }

  function endRoomDrag(event) {
    const drag = roomDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    roomDragRef.current = null;
    setDraggingRegionId(null);
    setHoveredRegionId(null);
    onEditCommit?.();
    return true;
  }

  function handleWallHandlePointerDown(event, handle) {
    if (!showEditor) return;
    event.preventDefault();
    event.stopPropagation();
    if (createDirectSharedRoomDoor(handle)) return;
    connectionDragRef.current = {
      pointerId: event.pointerId,
      fromRegionId: handle.regionId,
      fromAnchor: handle.anchor,
      start: handle.point,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setConnectionDraft({ start: handle.point, current: handle.point });
  }

  function handleConnectionPointerMove(event) {
    const drag = connectionDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    const point = clientToMapPoint(event);
    if (!point) return true;
    const target = findClosestBoundaryAnchorAcrossRegions(generatedMap.regions, point, generatedMap.config.gridSize, drag.fromRegionId);
    setConnectionDraft({
      start: drag.start,
      current: target ? target.point : point,
      target,
    });
    return true;
  }

  function endConnectionDrag(event) {
    const drag = connectionDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    const point = clientToMapPoint(event);
    const target = point ? findClosestBoundaryAnchorAcrossRegions(generatedMap.regions, point, generatedMap.config.gridSize, drag.fromRegionId) : null;
    if (target) {
      onCreateConnection?.({
        fromRegionId: drag.fromRegionId,
        fromAnchor: drag.fromAnchor,
        toRegionId: target.region.id,
        toAnchor: target.anchor,
      });
    }
    connectionDragRef.current = null;
    setConnectionDraft(null);
    setHoverWallHandle(null);
    return true;
  }

  function handleDoorContextMenu(event, handle) {
    if (!showEditor) return;
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    setRoomContextMenu(null);
    setMapContextMenu(null);
    setJunctionContextMenu(null);
    setWaypointContextMenu(null);
    setAddWaypointContextMenu(null);
    setDoorContextMenu({
      corridorId: handle.corridor.id,
      endpoint: handle.endpoint,
      fallbackType: handle.corridor.secret ? "secret" : "default",
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 250)),
    });
    setHoverCorridorHandle(null);
    setHoverWallHandle(null);
  }

  function handleJunctionContextMenu(event, junction) {
    if (!showEditor || !junction) return;
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    setRoomContextMenu(null);
    setDoorContextMenu(null);
    setMapContextMenu(null);
    setWaypointContextMenu(null);
    setAddWaypointContextMenu(null);
    setJunctionContextMenu({
      key: junction.key,
      cell: junction.cell,
      corridorIds: junction.corridors.map((corridor) => corridor.id),
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 250)),
    });
    setHoverCorridorHandle(null);
    setHoverWallHandle(null);
  }

  function handleCorridorAddContextMenu(event, handle) {
    if (!showEditor || !handle) return;
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    setRoomContextMenu(null);
    setDoorContextMenu(null);
    setJunctionContextMenu(null);
    setWaypointContextMenu(null);
    setMapContextMenu(null);
    const junction = getCorridorIntersectionCells(generatedMap.corridors).find((item) => item.key === cellKey(handle.cell.x, handle.cell.y));
    setAddWaypointContextMenu({
      corridorId: handle.corridor.id,
      insertIndex: handle.insertIndex,
      point: handle.point,
      cell: handle.cell,
      junctionKey: junction?.key || null,
      junctionCorridorIds: junction?.corridors?.map((corridor) => corridor.id) || [],
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 220)),
    });
    setHoveredCorridorId(handle.corridor.id);
  }

  function handleWaypointContextMenu(event, handle) {
    if (!showEditor) return;
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const cell = {
      x: Math.floor(handle.x / generatedMap.config.gridSize),
      y: Math.floor(handle.y / generatedMap.config.gridSize),
    };
    const junction = getCorridorIntersectionCells(generatedMap.corridors).find((item) => item.key === cellKey(cell.x, cell.y));
    setRoomContextMenu(null);
    setDoorContextMenu(null);
    setJunctionContextMenu(null);
    setMapContextMenu(null);
    setAddWaypointContextMenu(null);
    setWaypointContextMenu({
      corridorId: handle.corridor.id,
      waypointIndex: handle.index,
      source: handle.source,
      cell,
      junctionKey: junction?.key || null,
      junctionCorridorIds: junction?.corridors?.map((corridor) => corridor.id) || [],
      x: clamp(event.clientX - rect.left, 8, Math.max(8, rect.width - 250)),
      y: clamp(event.clientY - rect.top, 8, Math.max(8, rect.height - 280)),
    });
    setHoverCorridorHandle(null);
    setHoveredCorridorId(handle.corridor.id);
  }

  function handleDoorPointerDown(event, handle) {
    if (!showEditor || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onEditStart?.();
    corridorDragRef.current = {
      type: "door",
      pointerId: event.pointerId,
      id: handle.id,
      corridorId: handle.corridor.id,
      endpoint: handle.endpoint,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setDraggingCorridorHandle(handle.id);
  }

  function handleCorridorAddPointerDown(event, handle) {
    if (!showEditor || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onEditStart?.();
    onWaypointInsert?.(handle.corridor.id, handle.insertIndex, handle.point);
    corridorDragRef.current = {
      type: "waypoint",
      pointerId: event.pointerId,
      id: `new-waypoint-${handle.corridor.id}-${handle.insertIndex}`,
      corridorId: handle.corridor.id,
      waypointIndex: handle.insertIndex,
      source: "manual",
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setDraggingCorridorHandle(`new-waypoint-${handle.corridor.id}-${handle.insertIndex}`);
    setHoverCorridorHandle(null);
  }

  function handleWaypointPointerDown(event, handle) {
    if (!showEditor || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onEditStart?.();
    corridorDragRef.current = {
      type: "waypoint",
      pointerId: event.pointerId,
      id: handle.id,
      corridorId: handle.corridor.id,
      waypointIndex: handle.index,
      source: handle.source,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setDraggingCorridorHandle(handle.id);
  }

  function handleCorridorPointerMove(event) {
    const drag = corridorDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    const point = clientToMapPoint(event);
    if (!point) return true;
    if (drag.type === "door") {
      onDoorMove?.(drag.corridorId, drag.endpoint, point);
      return true;
    }
    onWaypointMove?.(drag.corridorId, drag.waypointIndex, point, drag.source);
    return true;
  }

  function endCorridorDrag(event) {
    const drag = corridorDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    event.preventDefault();
    event.stopPropagation();
    corridorDragRef.current = null;
    setDraggingCorridorHandle(null);
    setHoverCorridorHandle(null);
    setHoveredCorridorId(null);
    onEditCommit?.();
    return true;
  }

  function handleEditorPointerMove(event) {
    if (handleConnectionPointerMove(event)) return;
    if (handleMapAccessPointerMove(event)) return;
    if (handleCorridorPointerMove(event)) return;
    handleRoomPointerMove(event);
  }

  function endEditorDrag(event) {
    if (endConnectionDrag(event)) return;
    if (endMapAccessDrag(event)) return;
    if (endCorridorDrag(event)) return;
    endRoomDrag(event);
  }

  function handlePointerDown(event) {
    if (roomDragRef.current || corridorDragRef.current || accessDragRef.current || connectionDragRef.current) return;
    if (event.button !== 0) return;
    setRoomContextMenu(null);
    setMapContextMenu(null);
    setDoorContextMenu(null);
    setJunctionContextMenu(null);
    setWaypointContextMenu(null);
    setAddWaypointContextMenu(null);
    setHoverWallHandle(null);
    setHoverCorridorHandle(null);
    setHoveredCorridorId(null);
    event.currentTarget.focus();
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }

  function handlePointerMove(event) {
    if (handleConnectionPointerMove(event)) return;
    if (handleMapAccessPointerMove(event)) return;
    if (handleCorridorPointerMove(event)) return;
    if (roomDragRef.current) return;
    if (!panRef.current || panRef.current.pointerId !== event.pointerId) return;
    const pan = panRef.current;
    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;
    const nextX = pan.originX + dx;
    const nextY = pan.originY + dy;
    setView((current) => constrainView({ ...current, x: nextX, y: nextY }));
  }

  function endPan(event) {
    if (endConnectionDrag(event)) return;
    if (endMapAccessDrag(event)) return;
    if (endCorridorDrag(event)) return;
    if (endRoomDrag(event)) return;
    if (!panRef.current || panRef.current.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    panRef.current = null;
    setIsPanning(false);
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z") {
      event.preventDefault();
      if (event.shiftKey) onRedo?.();
      else onUndo?.();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "y") {
      event.preventDefault();
      onRedo?.();
      return;
    }
    const panAmount = event.shiftKey ? 90 : 45;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAtCenter(1.12);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomAtCenter(0.88);
      return;
    }
    if (event.key === "0" || event.key === "Home") {
      event.preventDefault();
      fitView();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setView((current) => constrainView({ ...current, y: current.y + panAmount }));
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setView((current) => constrainView({ ...current, y: current.y - panAmount }));
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setView((current) => constrainView({ ...current, x: current.x + panAmount }));
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setView((current) => constrainView({ ...current, x: current.x - panAmount }));
    }
  }

  return (
    <>
      <div className="zoom-toolbar">
        <Button className="mvp-button zoom-button" onClick={() => zoomAtCenter(1.15)}><Plus size={15} /> Zoom</Button>
        <Button className="mvp-button zoom-button" onClick={() => zoomAtCenter(0.85)}><Minus size={15} /> Zoom</Button>
        <Button className="mvp-button zoom-button" onClick={fitView}><Maximize2 size={15} /> Fit</Button>
        <span className="zoom-scale">{Math.round(view.scale * 100)}%</span>
      </div>
      <div
        ref={viewportRef}
        className={`map-viewport ${isPanning ? "is-panning" : ""}`}
        tabIndex={0}
        onWheelCapture={handleWheel}
        onContextMenu={openMapContextMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onKeyDown={handleKeyDown}
      >
        <div
          className="map-pan-layer"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <MapSvg
            generatedMap={generatedMap}
            showGrid={showGrid}
            gridStyle={gridStyle}
            showEditor={showEditor}
            showNames={showNames}
            showProps={showProps}
            levelView={levelView}
            fadeOtherLevels={fadeOtherLevels}
            viewportViewBox={getViewportViewBox()}
            editorOptions={{
              draggingRegionId,
              hoveredRegionId,
              draggingCorridorHandle,
              draggingMapAccessId,
              hoverWallHandle,
              hoverCorridorHandle,
              hoveredCorridorId,
              connectionDraft,
              onRoomPointerDown: handleRoomPointerDown,
              onRoomPointerEnter: handleRoomPointerEnter,
              onRoomPointerLeave: handleRoomPointerLeave,
              onRoomContextMenu: handleRoomContextMenu,
              onEditorPointerMove: handleEditorPointerMove,
              onEditorPointerUp: endEditorDrag,
              onDoorPointerDown: handleDoorPointerDown,
              onMapAccessPointerDown: handleMapAccessPointerDown,
              onMapAccessContextMenu: handleMapAccessContextMenu,
              onWaypointPointerDown: handleWaypointPointerDown,
              onWaypointContextMenu: handleWaypointContextMenu,
              onDoorContextMenu: handleDoorContextMenu,
              onCorridorZonePointerMove: handleCorridorZonePointerMove,
              onCorridorZonePointerLeave: handleCorridorZonePointerLeave,
              onJunctionContextMenu: handleJunctionContextMenu,
              onCorridorHandlePointerEnter: handleCorridorHandlePointerEnter,
              onCorridorHandlePointerLeave: handleCorridorHandlePointerLeave,
              onCorridorAddPointerDown: handleCorridorAddPointerDown,
              onCorridorAddContextMenu: handleCorridorAddContextMenu,
              onCorridorAddPointerLeave: handleCorridorAddPointerLeave,
              onWallZonePointerMove: handleWallZonePointerMove,
              onWallZonePointerLeave: handleWallZonePointerLeave,
              onWallZonePointerDown: handleWallZonePointerDown,
              onWallZoneContextMenu: handleWallZoneContextMenu,
              onWallHandlePointerDown: handleWallHandlePointerDown,
              onWallHandlePointerLeave: handleWallHandlePointerLeave,
            }}
          />
        </div>
        <RoomStyleContextMenu
          menu={roomContextMenu}
          generatedMap={generatedMap}
          manualOverrides={manualOverrides || createEmptyManualOverrides()}
          onChange={onRoomStyleChange}
          onReset={onRoomStyleReset}
          onClose={() => setRoomContextMenu(null)}
        />
        <DoorContextMenu
          menu={doorContextMenu}
          manualOverrides={manualOverrides || createEmptyManualOverrides()}
          onTypeChange={onDoorTypeChange}
          onStairChange={onDoorStairChange}
          onDelete={onConnectionDelete}
          onClose={() => setDoorContextMenu(null)}
        />
        <CorridorJunctionContextMenu
          menu={junctionContextMenu}
          manualOverrides={manualOverrides || createEmptyManualOverrides()}
          onChange={onJunctionTypeChange}
          onClose={() => setJunctionContextMenu(null)}
        />
        <WaypointContextMenu
          menu={waypointContextMenu}
          manualOverrides={manualOverrides || createEmptyManualOverrides()}
          onDeleteWaypoint={onWaypointDelete}
          onDeleteConnection={onConnectionDelete}
          onJunctionChange={onJunctionTypeChange}
          onClose={() => setWaypointContextMenu(null)}
        />
        <AddWaypointContextMenu
          menu={addWaypointContextMenu}
          manualOverrides={manualOverrides || createEmptyManualOverrides()}
          onAddWaypoint={onWaypointInsert}
          onJunctionChange={onJunctionTypeChange}
          onClose={() => setAddWaypointContextMenu(null)}
        />
        <WallAccessContextMenu
          menu={wallAccessContextMenu}
          onSet={onMapAccessSet}
          onRemove={onMapAccessRemove}
          onClose={() => setWallAccessContextMenu(null)}
        />
        <MapActionContextMenu
          menu={mapContextMenu}
          showGrid={showGrid}
          showEditor={showEditor}
          showProps={showProps}
          levelView={levelView}
          availableLevels={availableLevels}
          fadeOtherLevels={fadeOtherLevels}
          gridStyle={gridStyle}
          onNewSeed={onNewSeed}
          onToggleGrid={onToggleGrid}
          onGridStyleChange={onGridStyleChange}
          onToggleEditor={onToggleEditor}
          onToggleProps={onToggleProps}
          onLevelViewChange={onLevelViewChange}
          onToggleFadeOtherLevels={onToggleFadeOtherLevels}
          onExportSvg={onExportSvg}
          onExportGmSvg={onExportGmSvg}
          onExportPlayerSvg={onExportPlayerSvg}
          onExportPrintSvg={onExportPrintSvg}
          onExportState={onExportState}
          onImportState={onImportState}
          onUndo={onUndo}
          onRedo={onRedo}
          onClose={() => setMapContextMenu(null)}
        />
      </div>
      <div className="zoom-hint">Wheel zooms. Click and drag pans. Arrow keys pan. + / - zoom. 0 or Home fits.</div>
    </>
  );
}

function getRoomStyleMenuOptions(contextKey) {
  const shapes = [
    { value: "rect", label: "Standard" },
    { value: "hall", label: "Hall" },
    { value: "l-shape", label: "L-Shape" },
    { value: "circle", label: "Circle" },
    { value: "shaft", label: "Shaft / Oval" },
    { value: "cave", label: "Cave" },
  ];
  const types = [
    { value: "none", label: "None" },
    { value: "archive", label: "Archive" },
    ...(contextKey === "crypt" ? [{ value: "alcove", label: "Crypt Alcoves" }] : []),
    ...(contextKey === "chapel" ? [{ value: "apse", label: "Apse" }] : []),
    ...(contextKey === "ruins" ? [{ value: "ruined", label: "Ruined Room" }] : []),
  ];
  return {
    shapes,
    types,
    sizes: Object.keys(ROOM_SIZE_MENU_PRESETS).map((value) => ({ value, label: value, dimensions: `${ROOM_SIZE_MENU_PRESETS[value].w}×${ROOM_SIZE_MENU_PRESETS[value].h}` })),
    toggles: [
      { key: "notch", label: "Notch" },
      { key: "ruined", label: "Ruined" },
    ],
  };
}

function inferGeneratedRoomType(region) {
  if (region.roomType && region.roomType !== "none") return region.roomType;
  if (region.shape === "archive") return "archive";
  if (region.shape === "alcove") return "alcove";
  if (region.shape === "apse") return "apse";
  if (region.shape === "ruined-rect" || region.shape === "broken") return "ruined";
  return "none";
}

function inferGeneratedRoomShape(region) {
  if (["archive", "alcove", "apse", "ruined-rect", "broken"].includes(region.shape)) return "rect";
  return region.shape || "rect";
}

function getRoomStyleForMenu(region, manualOverrides) {
  const manual = manualOverrides.roomStyles?.[region.id] || {};
  return {
    shape: manual.shape || inferGeneratedRoomShape(region),
    roomType: manual.roomType || inferGeneratedRoomType(region),
    sizePreset: manual.sizePreset || region.size || "Medium",
    notch: Boolean(manual.notch),
    ruined: Boolean(manual.ruined),
  };
}

function ConfirmingDeleteButton({ label = "Delete", confirmLabel = "Confirm Delete", onConfirm, onClose }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      className={armed ? "is-armed" : ""}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        onConfirm?.();
        onClose?.();
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

function RoomStyleContextMenu({ menu, generatedMap, manualOverrides, onChange, onReset, onClose }) {
  const [activeGroup, setActiveGroup] = useState("shape");
  if (!menu) return null;
  const region = generatedMap.regions.find((item) => item.id === menu.regionId);
  if (!region) return null;
  const contextKey = getContextKey(generatedMap.config.context || generatedMap.config.biome);
  const options = getRoomStyleMenuOptions(contextKey);
  const style = getRoomStyleForMenu(region, manualOverrides);
  const activeShape = options.shapes.find((shape) => shape.value === style.shape)?.label || style.shape;
  const activeType = options.types.find((type) => type.value === style.roomType)?.label || style.roomType || "None";
  const activeSize = options.sizes.find((size) => size.value === style.sizePreset)?.label || style.sizePreset;
  const activeModifiers = options.toggles.filter((toggle) => style[toggle.key]).map((toggle) => toggle.label);

  return (
    <div
      className="room-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="room-context-menu__header">
        <strong>{region.name}</strong>
        <span>{region.number} · {contextKey} · {region.cellRect.w}×{region.cellRect.h}</span>
      </div>
      <div className="room-context-menu__body">
        <div className="room-context-menu__item" onPointerEnter={() => setActiveGroup("shape")}>
          <button type="button" className="room-context-menu__trigger">
            <span>Shape</span>
            <span>{activeShape} ›</span>
          </button>
          {activeGroup === "shape" && (
            <div className="room-context-submenu">
              <div className="room-context-submenu__hint">Base footprint</div>
              {options.shapes.map((shape) => (
                <button
                  key={shape.value}
                  type="button"
                  className={style.shape === shape.value ? "is-active" : ""}
                  onClick={() => onChange(region.id, { shape: shape.value })}
                >
                  <span>{shape.label}</span>
                  <span>{style.shape === shape.value ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="room-context-menu__item" onPointerEnter={() => setActiveGroup("type")}>
          <button type="button" className="room-context-menu__trigger">
            <span>Type</span>
            <span>{activeType} ›</span>
          </button>
          {activeGroup === "type" && (
            <div className="room-context-submenu">
              <div className="room-context-submenu__hint">Room-specific structure</div>
              {options.types.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={style.roomType === type.value ? "is-active" : ""}
                  onClick={() => onChange(region.id, { roomType: type.value })}
                >
                  <span>{type.label}</span>
                  <span>{style.roomType === type.value ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="room-context-menu__item" onPointerEnter={() => setActiveGroup("size")}>
          <button type="button" className="room-context-menu__trigger">
            <span>Size</span>
            <span>{activeSize} ›</span>
          </button>
          {activeGroup === "size" && (
            <div className="room-context-submenu">
              <div className="room-context-submenu__hint">Room bounding box</div>
              {options.sizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  className={style.sizePreset === size.value ? "is-active" : ""}
                  onClick={() => onChange(region.id, { sizePreset: size.value })}
                >
                  <span>{size.label}</span>
                  <span>{size.dimensions}{style.sizePreset === size.value ? " ✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="room-context-menu__item" onPointerEnter={() => setActiveGroup("modifiers")}>
          <button type="button" className="room-context-menu__trigger">
            <span>Modifiers</span>
            <span>{activeModifiers.length > 0 ? activeModifiers.length : "None"} ›</span>
          </button>
          {activeGroup === "modifiers" && (
            <div className="room-context-submenu">
              <div className="room-context-submenu__hint">Extra cuts</div>
              {options.toggles.map((toggle) => (
                <button
                  key={toggle.key}
                  type="button"
                  className={style[toggle.key] ? "is-active" : ""}
                  onClick={() => onChange(region.id, { [toggle.key]: !style[toggle.key] })}
                >
                  <span>{toggle.label}</span>
                  <span>{style[toggle.key] ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="room-context-menu__actions">
        <button type="button" onClick={() => { onReset(region.id); onClose?.(); }}>Reset Room</button>
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function WallAccessContextMenu({ menu, onSet, onRemove, onClose }) {
  if (!menu) return null;
  const actionLabel = menu.hasAccessAtAnchor ? "Remove Passage" : menu.hasRegionAccess ? "Move Passage Here" : "Add Passage";
  return (
    <div
      className="room-context-menu wall-access-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="room-context-menu__header">
        <strong>Map Passage</strong>
        <span>{menu.regionId} · {menu.anchor?.side || "wall"}</span>
      </div>
      <div className="room-context-menu__body">
        <button
          type="button"
          className="room-context-menu__trigger"
          onClick={() => {
            if (menu.hasAccessAtAnchor) {
              onRemove?.(menu.regionId);
              return;
            }
            onSet?.(menu.regionId, menu.anchor, menu.accessType || "passage");
            if (!menu.hasRegionAccess) onClose?.();
          }}
        >
          <span><i className="fa-solid fa-route" aria-hidden="true" /> {actionLabel}</span>
          <span>›</span>
        </button>
      </div>
      <div className="room-context-menu__actions">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function AddWaypointContextMenu({ menu, manualOverrides, onAddWaypoint, onJunctionChange, onClose }) {
  if (!menu) return null;
  const hasJunction = Boolean(menu.junctionKey);
  const currentJunctionType = hasJunction
    ? getManualJunctionType(manualOverrides.corridorJunctions || {}, menu.junctionKey, "merge")
    : null;
  const junctionLabels = {
    merge: "Normal Merge",
    wall: "Wall",
    door: "Door",
  };
  return (
    <div
      className="room-context-menu add-waypoint-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="room-context-menu__header">
        <strong>{hasJunction ? "Corridor Junction Point" : "Corridor Point"}</strong>
        <span>{menu.corridorId} · Cell {menu.cell.x},{menu.cell.y}</span>
      </div>
      <div className="room-context-menu__body">
        <button
          type="button"
          className="room-context-menu__trigger"
          onClick={() => { onAddWaypoint?.(menu.corridorId, menu.insertIndex, menu.point); onClose?.(); }}
        >
          <span>Add Waypoint</span>
          <span>›</span>
        </button>
        {hasJunction && (
          <>
            <div className="room-context-menu__label">Junction</div>
            {JUNCTION_TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                className={currentJunctionType === type ? "room-context-menu__trigger is-active" : "room-context-menu__trigger"}
                onClick={() => { onJunctionChange?.(menu.junctionKey, type); }}
              >
                <span>{junctionLabels[type]}</span>
                <span>{currentJunctionType === type ? "✓" : ""}</span>
              </button>
            ))}
          </>
        )}
      </div>
      <div className="room-context-menu__actions">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function WaypointContextMenu({ menu, manualOverrides, onDeleteWaypoint, onDeleteConnection, onJunctionChange, onClose }) {
  if (!menu) return null;
  const hasJunction = Boolean(menu.junctionKey);
  const currentJunctionType = hasJunction
    ? getManualJunctionType(manualOverrides.corridorJunctions || {}, menu.junctionKey, "merge")
    : null;
  const junctionLabels = {
    merge: "Normal Merge",
    wall: "Wall",
    door: "Door",
  };
  return (
    <div
      className="room-context-menu waypoint-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="room-context-menu__header">
        <strong>{hasJunction ? "Corridor Junction Waypoint" : "Corridor Waypoint"}</strong>
        <span>{menu.corridorId} · Cell {menu.cell.x},{menu.cell.y}</span>
      </div>
      <div className="room-context-menu__body">
        <ConfirmingDeleteButton
          label="Delete Waypoint"
          confirmLabel="Confirm Delete Waypoint"
          onConfirm={() => onDeleteWaypoint?.(menu.corridorId, menu.waypointIndex, menu.source)}
          onClose={onClose}
        />
        {hasJunction && (
          <>
            <div className="room-context-menu__label">Junction</div>
            {JUNCTION_TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                className={currentJunctionType === type ? "room-context-menu__trigger is-active" : "room-context-menu__trigger"}
                onClick={() => { onJunctionChange?.(menu.junctionKey, type); }}
              >
                <span>{junctionLabels[type]}</span>
                <span>{currentJunctionType === type ? "✓" : ""}</span>
              </button>
            ))}
          </>
        )}
      </div>
      <div className="room-context-menu__actions">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function CorridorJunctionContextMenu({ menu, manualOverrides, onChange, onClose }) {
  if (!menu) return null;
  const currentType = getManualJunctionType(manualOverrides.corridorJunctions || {}, menu.key, "merge");
  const labels = {
    merge: "Normal Merge",
    wall: "Wall",
    door: "Door",
  };
  return (
    <div
      className="room-context-menu corridor-junction-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="room-context-menu__header">
        <strong>Corridor Junction</strong>
        <span>Cell {menu.cell.x},{menu.cell.y} · {menu.corridorIds.length} corridors</span>
      </div>
      <div className="room-context-menu__body">
        {JUNCTION_TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            className={currentType === type ? "room-context-menu__trigger is-active" : "room-context-menu__trigger"}
            onClick={() => { onChange?.(menu.key, type); }}
          >
            <span>{labels[type]}</span>
            <span>{currentType === type ? "✓" : ""}</span>
          </button>
        ))}
      </div>
      <div className="room-context-menu__actions">
        <button type="button" onClick={() => { onChange?.(menu.key, "merge"); }}>Reset</button>
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function DoorContextMenu({ menu, manualOverrides, onTypeChange, onStairChange, onDelete, onClose }) {
  if (!menu) return null;
  const currentType = getManualDoorType(manualOverrides.doorTypes || {}, menu.corridorId, menu.endpoint, menu.fallbackType || "default");
  const currentStair = getManualStairTransition(manualOverrides.stairTransitions || {}, menu.corridorId, menu.endpoint, "none");
  const labels = {
    default: "Default",
    secret: "Secret",
    locked: "Locked",
    open: "Open",
  };
  const stairLabels = {
    none: "No Stair",
    up: "Stairs Up (+1)",
    down: "Stairs Down (-1)",
  };
  return (
    <div
      className="room-context-menu door-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="room-context-menu__header">
        <strong>Door</strong>
        <span>{menu.corridorId} · {menu.endpoint}</span>
      </div>
      <div className="room-context-menu__body">
        {DOOR_TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            className={currentType === type ? "room-context-menu__trigger is-active" : "room-context-menu__trigger"}
            onClick={() => { onTypeChange?.(menu.corridorId, menu.endpoint, type); }}
          >
            <span>{labels[type]}</span>
            <span>{currentType === type ? "✓" : ""}</span>
          </button>
        ))}
        <div className="room-context-menu__label">Stair</div>
        {STAIR_TRANSITION_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            className={currentStair === type ? "room-context-menu__trigger is-active" : "room-context-menu__trigger"}
            onClick={() => { onStairChange?.(menu.corridorId, menu.endpoint, type); }}
          >
            <span>{stairLabels[type]}</span>
            <span>{currentStair === type ? "✓" : ""}</span>
          </button>
        ))}
      </div>
      <div className="room-context-menu__actions">
        <ConfirmingDeleteButton
          label="Delete"
          confirmLabel="Confirm Delete"
          onConfirm={() => onDelete?.(menu.corridorId)}
          onClose={onClose}
        />
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function MapActionContextMenu({ menu, showGrid, showEditor, showProps, levelView = LEVEL_VIEW_ALL, availableLevels = [], fadeOtherLevels = true, gridStyle, onNewSeed, onToggleGrid, onGridStyleChange, onToggleEditor, onToggleProps, onLevelViewChange, onToggleFadeOtherLevels, onExportSvg, onExportGmSvg, onExportPlayerSvg, onExportPrintSvg, onExportState, onImportState, onUndo, onRedo, onClose }) {
  if (!menu) return null;
  const gridLabels = {
    solid: "Solid",
    dotted: "Dotted",
    dashed: "Dashed",
    none: "None",
  };
  const run = (action) => {
    action?.();
  };
  const runAndClose = (action) => {
    action?.();
    onClose?.();
  };
  const normalizedLevelView = normalizeLevelView(levelView, availableLevels);
  const levelLabel = normalizedLevelView === LEVEL_VIEW_ALL ? "All Levels" : `Level ${formatMapLevel(normalizedLevelView)}`;
  const levelIconName = (level) => level > 0 ? "arrow-up" : level < 0 ? "arrow-down" : "minus";
  const setGridStyleOnly = (style) => {
    onGridStyleChange?.(style);
  };
  const icon = (name) => <i className={`fa-solid fa-${name}`} aria-hidden="true" />;

  return (
    <div
      className="room-context-menu map-action-menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="context-menu-toolbar" aria-label="Quick map actions">
        <button type="button" title="Undo" aria-label="Undo" onClick={() => run(onUndo)}>{icon("rotate-left")}</button>
        <button type="button" title="Redo" aria-label="Redo" onClick={() => run(onRedo)}>{icon("rotate-right")}</button>
        <span className="context-menu-toolbar__divider" />
        <button type="button" className={showGrid ? "is-active" : ""} title="Toggle Grid" aria-label="Toggle Grid" onClick={() => run(onToggleGrid)}>{icon("border-all")}</button>
        <button type="button" className={showEditor ? "is-active" : ""} title="Toggle Editor View" aria-label="Toggle Editor View" onClick={() => run(onToggleEditor)}>{icon("pen-ruler")}</button>
      </div>
      <div className="room-context-menu__header">
        <strong>Map Actions</strong>
        <span>Generator controls</span>
      </div>
      <div className="room-context-menu__body">
        <button type="button" className="room-context-menu__trigger" onClick={() => runAndClose(onNewSeed)}>
          <span>{icon("shuffle")} New Seed</span>
          <span>›</span>
        </button>
        <div className="room-context-menu__item">
          <button type="button" className="room-context-menu__trigger">
            <span>{icon("border-all")} Grid</span>
            <span>{gridLabels[normalizeGridStyle(gridStyle)]} ›</span>
          </button>
          <div className="room-context-submenu">
            <div className="room-context-submenu__hint">Grid rendering</div>
            {GRID_STYLE_OPTIONS.map((style) => (
              <button
                key={style}
                type="button"
                className={normalizeGridStyle(gridStyle) === style ? "is-active" : ""}
                onClick={() => setGridStyleOnly(style)}
              >
                <span>{icon(style === "solid" ? "table-cells" : style === "dotted" ? "braille" : style === "dashed" ? "grip-lines" : "eye-slash")} {gridLabels[style]}</span>
                <span>{normalizeGridStyle(gridStyle) === style ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </div>
        <button type="button" className={showProps ? "room-context-menu__trigger is-active" : "room-context-menu__trigger"} onClick={() => run(onToggleProps)}>
          <span>{icon("boxes-stacked")} Props</span>
          <span>{showProps ? "On" : "Off"}</span>
        </button>
        <div className="room-context-menu__item">
          <button type="button" className="room-context-menu__trigger">
            <span>{icon("layer-group")} Levels</span>
            <span>{levelLabel} ›</span>
          </button>
          <div className="room-context-submenu">
            <div className="room-context-submenu__hint">Level visibility</div>
            <button
              type="button"
              className={normalizedLevelView === LEVEL_VIEW_ALL ? "is-active" : ""}
              onClick={() => onLevelViewChange?.(LEVEL_VIEW_ALL)}
            >
              <span>{icon("layer-group")} All Levels</span>
              <span>{normalizedLevelView === LEVEL_VIEW_ALL ? "✓" : ""}</span>
            </button>
            {availableLevels.map((level) => (
              <button
                key={`level-${level}`}
                type="button"
                className={normalizedLevelView === level ? "is-active" : ""}
                onClick={() => onLevelViewChange?.(level)}
              >
                <span>{icon(levelIconName(level))} Level {formatMapLevel(level)}</span>
                <span>{normalizedLevelView === level ? "✓" : ""}</span>
              </button>
            ))}
            <button
              type="button"
              className={fadeOtherLevels ? "is-active" : ""}
              onClick={() => onToggleFadeOtherLevels?.()}
            >
              <span>{icon("circle-half-stroke")} Fade Other Levels</span>
              <span>{fadeOtherLevels ? "On" : "Off"}</span>
            </button>
          </div>
        </div>
        <div className="room-context-menu__item">
          <button type="button" className="room-context-menu__trigger">
            <span>{icon("file-export")} Export</span>
            <span>›</span>
          </button>
          <div className="room-context-submenu">
            <div className="room-context-submenu__hint">Output format</div>
            <button type="button" onClick={() => run(onExportSvg)}><span>{icon("vector-square")} Current SVG</span><span>›</span></button>
            <button type="button" onClick={() => run(onExportGmSvg)}><span>{icon("user-secret")} GM SVG</span><span>›</span></button>
            <button type="button" onClick={() => run(onExportPlayerSvg)}><span>{icon("users")} Player SVG</span><span>›</span></button>
            <button type="button" onClick={() => run(onExportPrintSvg)}><span>{icon("print")} Print SVG</span><span>›</span></button>
            <button type="button" onClick={() => run(onExportState)}><span>{icon("floppy-disk")} State JSON</span><span>›</span></button>
          </div>
        </div>
        <button type="button" className="room-context-menu__trigger" onClick={() => run(onImportState)}>
          <span>{icon("file-import")} Import State</span>
          <span>›</span>
        </button>
      </div>
    </div>
  );
}

function RoomKey({ generatedMap }) {
  return (
    <div className="room-key">
      {[...generatedMap.regions].sort((a, b) => a.number - b.number).map((region) => (
        <div key={region.id} className="room-key__item">
          <span className="room-key__number">{region.number}</span>
          <div>
            <div className="room-key__name">{region.name}</div>
            <div className="room-key__meta">{region.role} · {region.graphRole || "region"} · level {region.level ?? 0} · depth {region.graphDepth ?? "—"} · {region.placementProfile || "layout"} · surface {getRegionSurfaceKind(region, generatedMap)} · {region.shape || "rect"} · {region.roomType || region.shapeOptions?.roomType || "none"} · {region.cellRect.w}×{region.cellRect.h}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CruorMapGeneratorMvp() {
  const stateFileInputRef = useRef(null);
  const manualEditSnapshotRef = useRef(null);
  const [stateStatus, setStateStatus] = useState("");
  const [seed, setSeed] = useState(DEFAULT_CONFIG.seed);
  const [roomCount, setRoomCount] = useState(DEFAULT_CONFIG.roomCount);
  const [context, setContext] = useState(DEFAULT_CONFIG.context);
  const [gridStyle, setGridStyle] = useState(DEFAULT_CONFIG.gridStyle);
  const [levelView, setLevelView] = useState(LEVEL_VIEW_ALL);
  const [fadeOtherLevels, setFadeOtherLevels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [manualOverrides, setManualOverrides] = useState(createEmptyManualOverrides());
  const [manualHistory, setManualHistory] = useState({ past: [], future: [] });

  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    seed,
    context,
    roomCount,
    showGrid,
    gridStyle,
  }), [seed, context, roomCount, showGrid, gridStyle]);
  const generatedMap = useMemo(() => generateMap(config, manualOverrides), [config, manualOverrides]);
  const availableLevels = useMemo(() => getAvailableMapLevels(generatedMap), [generatedMap]);
  const availableLevelsKey = availableLevels.join(":");
  const [exportValidation, setExportValidation] = useState({ passed: false, missingSvg: true, leakedTokens: [] });

  useEffect(() => {
    setLevelView((current) => normalizeLevelView(current, availableLevels));
  }, [availableLevelsKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const svg = document.querySelector("#cruor-map-svg");
      setExportValidation(validateExportSvgString(serializeSvg(svg)));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [generatedMap, showEditor, showGrid, gridStyle, showNames, showProps]);

  const testSuite = useMemo(() => buildFullStructuralTestSuite(generatedMap, config, exportValidation), [generatedMap, config, exportValidation]);

  function clearManualHistory() {
    manualEditSnapshotRef.current = null;
    setManualHistory({ past: [], future: [] });
  }

  function pushManualHistorySnapshot(snapshot) {
    if (!snapshot) return;
    setManualHistory((history) => ({
      past: [...history.past.slice(-49), cloneManualOverrides(snapshot)],
      future: [],
    }));
  }

  function updateManualOverridesWithHistory(updater, status = "") {
    const previous = cloneManualOverrides(manualOverrides);
    const next = cloneManualOverrides(typeof updater === "function" ? updater(manualOverrides) : updater);
    if (areManualOverridesEqual(previous, next)) return;
    pushManualHistorySnapshot(previous);
    setManualOverrides(next);
    setStateStatus(status);
  }

  function beginManualEdit() {
    manualEditSnapshotRef.current = cloneManualOverrides(manualOverrides);
  }

  function commitManualEdit() {
    const snapshot = manualEditSnapshotRef.current;
    manualEditSnapshotRef.current = null;
    if (!snapshot || areManualOverridesEqual(snapshot, manualOverrides)) return;
    pushManualHistorySnapshot(snapshot);
    setStateStatus("");
  }

  function undoManualEdit() {
    setManualHistory((history) => {
      if (history.past.length === 0) return history;
      const previous = cloneManualOverrides(history.past[history.past.length - 1]);
      const current = cloneManualOverrides(manualOverrides);
      setManualOverrides(previous);
      setStateStatus("Undone.");
      return {
        past: history.past.slice(0, -1),
        future: [current, ...history.future.slice(0, 49)],
      };
    });
  }

  function redoManualEdit() {
    setManualHistory((history) => {
      if (history.future.length === 0) return history;
      const next = cloneManualOverrides(history.future[0]);
      const current = cloneManualOverrides(manualOverrides);
      setManualOverrides(next);
      setStateStatus("Redone.");
      return {
        past: [...history.past.slice(-49), current],
        future: history.future.slice(1),
      };
    });
  }

  function randomizeSeed() {
    const nextSeed = hashStringToSeed(seed, roomCount, context, "next-seed").toString(36);
    setSeed(`cruor-${nextSeed}`);
    setManualOverrides(resetManualOverrides());
    clearManualHistory();
    setStateStatus("");
  }

  function exportState() {
    downloadMapState(config, manualOverrides, { showEditor, showNames, showProps, gridStyle, levelView, fadeOtherLevels }, generatedMap);
    setStateStatus("State exported.");
  }

  function requestImportState() {
    stateFileInputRef.current?.click();
  }

  function importStateFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = parseMapStatePayload(String(reader.result || ""));
        const importedConfig = payload.config || {};
        setSeed(String(importedConfig.seed || DEFAULT_CONFIG.seed));
        setContext(String(importedConfig.context || DEFAULT_CONFIG.context));
        setRoomCount(normalizeRoomCount(importedConfig.roomCount, DEFAULT_CONFIG.roomCount));
        setShowGrid(Boolean(importedConfig.showGrid));
        if (payload.uiState && typeof payload.uiState === "object") {
          if (typeof payload.uiState.showEditor === "boolean") setShowEditor(payload.uiState.showEditor);
          if (typeof payload.uiState.showNames === "boolean") setShowNames(payload.uiState.showNames);
          if (typeof payload.uiState.showProps === "boolean") setShowProps(payload.uiState.showProps);
          if (typeof payload.uiState.gridStyle === "string") setGridStyle(normalizeGridStyle(payload.uiState.gridStyle));
          if (typeof payload.uiState.fadeOtherLevels === "boolean") setFadeOtherLevels(payload.uiState.fadeOtherLevels);
          if (typeof payload.uiState.levelView !== "undefined") setLevelView(normalizeLevelView(payload.uiState.levelView));
        }
        setManualOverrides(normalizeManualOverrides(payload.manualOverrides));
        clearManualHistory();
        setStateStatus("State imported.");
      } catch (error) {
        setStateStatus(error instanceof Error ? error.message : "Could not import state.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function moveRoom(regionId, position) {
    const target = generatedMap.regions.find((region) => region.id === regionId);
    if (!target) return;
    const gridW = Math.floor(generatedMap.config.mapWidth / generatedMap.config.gridSize);
    const gridH = Math.floor(generatedMap.config.mapHeight / generatedMap.config.gridSize);
    const candidate = {
      ...target.cellRect,
      x: clamp(Math.round(position.x), 1, Math.max(1, gridW - target.cellRect.w - 1)),
      y: clamp(Math.round(position.y), 1, Math.max(1, gridH - target.cellRect.h - 1)),
    };
    const dx = candidate.x - target.cellRect.x;
    const dy = candidate.y - target.cellRect.y;
    const occupiedCells = new Set();
    generatedMap.regions.forEach((region) => {
      if (region.id === regionId) return;
      region.floorCells.forEach((cell) => occupiedCells.add(cellKey(cell.x, cell.y)));
    });
    const overlaps = target.floorCells.some((cell) => occupiedCells.has(cellKey(cell.x + dx, cell.y + dy)));
    if (overlaps) return;
    setManualOverrides((current) => ({
      ...current,
      roomPositions: {
        ...current.roomPositions,
        [regionId]: { x: candidate.x, y: candidate.y },
      },
    }));
  }

  function areSerializedAnchorsEqual(a, b) {
    return Boolean(a && b) && a.side === b.side && a.cell?.x === b.cell?.x && a.cell?.y === b.cell?.y;
  }

  function moveDoor(corridorId, endpoint, point) {
    const corridor = generatedMap.corridors.find((item) => item.id === corridorId);
    if (!corridor) return;
    if (corridor.isRoomLink || endpoint === "shared") {
      const fromRegion = generatedMap.regions.find((item) => item.id === corridor.from);
      const toRegion = generatedMap.regions.find((item) => item.id === corridor.to);
      if (!fromRegion || !toRegion) return;
      const sharedConnection = getClosestSharedRoomConnectionToPoint(fromRegion, toRegion, point, generatedMap.config.gridSize);
      if (!sharedConnection) return;
      const nextFromAnchor = serializeManualAnchor(sharedConnection.fromAnchor);
      const nextToAnchor = serializeManualAnchor(sharedConnection.toAnchor);
      setManualOverrides((current) => {
        const fromKey = corridorEndpointKey(corridorId, "from");
        const toKey = corridorEndpointKey(corridorId, "to");
        if (areSerializedAnchorsEqual(current.doorAnchors?.[fromKey], nextFromAnchor) && areSerializedAnchorsEqual(current.doorAnchors?.[toKey], nextToAnchor)) return current;
        return {
          ...current,
          doorAnchors: {
            ...current.doorAnchors,
            [fromKey]: nextFromAnchor,
            [toKey]: nextToAnchor,
          },
        };
      });
      return;
    }
    const regionId = endpoint === "from" ? corridor.from : corridor.to;
    const region = generatedMap.regions.find((item) => item.id === regionId);
    if (!region) return;
    const anchor = getClosestBoundaryAnchorToPoint(region, point, generatedMap.config.gridSize);
    if (!anchor) return;
    const nextAnchor = serializeManualAnchor(anchor);
    setManualOverrides((current) => {
      const key = corridorEndpointKey(corridorId, endpoint);
      if (areSerializedAnchorsEqual(current.doorAnchors?.[key], nextAnchor)) return current;
      return {
        ...current,
        doorAnchors: {
          ...current.doorAnchors,
          [key]: nextAnchor,
        },
      };
    });
  }

  function moveWaypoint(corridorId, waypointIndex, point, source) {
    const corridor = generatedMap.corridors.find((item) => item.id === corridorId);
    if (!corridor) return;
    const gridW = Math.floor(generatedMap.config.mapWidth / generatedMap.config.gridSize);
    const gridH = Math.floor(generatedMap.config.mapHeight / generatedMap.config.gridSize);
    const cell = normalizeManualWaypoint(point, generatedMap.config.gridSize, gridW, gridH);
    if (!cell) return;
    const roomCells = getRoomCellSet(generatedMap.regions);
    if (roomCells.has(cellKey(cell.x, cell.y))) return;
    setManualOverrides((current) => {
      const currentWaypoints = current.corridorWaypoints || {};
      const currentManual = Array.isArray(currentWaypoints[corridorId])
        ? currentWaypoints[corridorId].filter(isValidPoint)
        : [];
      let nextWaypoints;
      if (source === "manual") {
        nextWaypoints = [...currentManual];
        const safeIndex = clamp(Number.isInteger(waypointIndex) ? waypointIndex : nextWaypoints.length, 0, nextWaypoints.length);
        nextWaypoints[safeIndex] = cell;
      } else {
        nextWaypoints = [cell];
      }
      return {
        ...current,
        corridorWaypoints: {
          ...currentWaypoints,
          [corridorId]: nextWaypoints.filter(isValidPoint),
        },
      };
    });
  }

  function insertWaypoint(corridorId, insertIndex, point) {
    const corridor = generatedMap.corridors.find((item) => item.id === corridorId);
    if (!corridor) return;
    const gridW = Math.floor(generatedMap.config.mapWidth / generatedMap.config.gridSize);
    const gridH = Math.floor(generatedMap.config.mapHeight / generatedMap.config.gridSize);
    const cell = normalizeManualWaypoint(point, generatedMap.config.gridSize, gridW, gridH);
    if (!cell) return;
    const roomCells = getRoomCellSet(generatedMap.regions);
    if (roomCells.has(cellKey(cell.x, cell.y))) return;
    setManualOverrides((current) => {
      const currentWaypoints = current.corridorWaypoints || {};
      const currentManual = Array.isArray(currentWaypoints[corridorId])
        ? currentWaypoints[corridorId].filter(isValidPoint)
        : [];
      const safeIndex = clamp(Number.isInteger(insertIndex) ? insertIndex : currentManual.length, 0, currentManual.length);
      const nextWaypoints = [...currentManual];
      nextWaypoints.splice(safeIndex, 0, cell);
      return {
        ...current,
        corridorWaypoints: {
          ...currentWaypoints,
          [corridorId]: nextWaypoints.filter(isValidPoint),
        },
      };
    });
  }

  function deleteWaypoint(corridorId, waypointIndex, source) {
    if (source !== "manual") return;
    updateManualOverridesWithHistory((current) => {
      const currentWaypoints = current.corridorWaypoints || {};
      const currentManual = Array.isArray(currentWaypoints[corridorId])
        ? currentWaypoints[corridorId].filter(isValidPoint)
        : [];
      const safeIndex = Number.isInteger(waypointIndex) ? waypointIndex : -1;
      if (safeIndex < 0 || safeIndex >= currentManual.length) return current;
      const nextWaypoints = currentManual.filter((_, index) => index !== safeIndex);
      return {
        ...current,
        corridorWaypoints: {
          ...currentWaypoints,
          [corridorId]: nextWaypoints,
        },
      };
    });
  }

  function deleteConnection(corridorId) {
    if (!corridorId) return;
    updateManualOverridesWithHistory((current) => {
      const normalized = normalizeManualOverrides(current);
      const deletedConnections = Array.isArray(normalized.deletedConnections) ? normalized.deletedConnections : [];
      const customConnections = Array.isArray(normalized.customConnections)
        ? normalized.customConnections.filter((connection) => connection.id !== corridorId)
        : [];
      const doorAnchors = { ...(normalized.doorAnchors || {}) };
      delete doorAnchors[corridorEndpointKey(corridorId, "from")];
      delete doorAnchors[corridorEndpointKey(corridorId, "to")];
      const doorTypes = { ...(normalized.doorTypes || {}) };
      delete doorTypes[doorTypeKey(corridorId, "from")];
      delete doorTypes[doorTypeKey(corridorId, "to")];
      delete doorTypes[doorTypeKey(corridorId, "shared")];
      const stairTransitions = { ...(normalized.levels.stairs || {}) };
      delete stairTransitions[stairTransitionKey(corridorId, "from")];
      delete stairTransitions[stairTransitionKey(corridorId, "to")];
      delete stairTransitions[stairTransitionKey(corridorId, "shared")];
      const levels = {
        ...normalized.levels,
        stairs: stairTransitions,
        corridors: { ...(normalized.levels.corridors || {}) },
      };
      delete levels.corridors[corridorId];
      const corridorWaypoints = { ...(normalized.corridorWaypoints || {}) };
      delete corridorWaypoints[corridorId];
      return {
        ...normalized,
        customConnections,
        doorAnchors,
        doorTypes,
        stairTransitions,
        levels,
        corridorWaypoints,
        deletedConnections: deletedConnections.includes(corridorId) ? deletedConnections : [...deletedConnections, corridorId],
      };
    });
  }

  function updateDoorType(corridorId, endpoint, doorType) {
    if (!corridorId || !endpoint) return;
    updateManualOverridesWithHistory((current) => ({
      ...current,
      doorTypes: {
        ...(current.doorTypes || {}),
        [doorTypeKey(corridorId, endpoint)]: normalizeDoorType(doorType),
      },
    }));
  }

  function updateDoorStair(corridorId, endpoint, stairTransition) {
    if (!corridorId || !endpoint) return;
    updateManualOverridesWithHistory((current) => {
      const normalized = normalizeManualOverrides(current);
      const stairTransitions = { ...(normalized.levels.stairs || {}) };
      const next = normalizeStairTransition(stairTransition, "none");
      const key = stairTransitionKey(corridorId, endpoint);
      if (next === "none") delete stairTransitions[key];
      else stairTransitions[key] = next;
      return {
        ...normalized,
        stairTransitions,
        levels: {
          ...normalized.levels,
          stairs: stairTransitions,
        },
      };
    });
  }

  function buildMapAccessOverride(regionId, anchor, accessType = null) {
    if (!regionId || !anchor) return null;
    const region = generatedMap.regions.find((item) => item.id === regionId);
    if (!region) return null;
    const existingAccess = (generatedMap.dungeonMask.mapAccesses || generatedMap.mapAccesses || []).find((access) => access.regionId === regionId);
    const fallbackIntent = getFallbackMapAccessIntent(region, generatedMap);
    const type = normalizeMapAccessType(accessType || existingAccess?.type || fallbackIntent.type, fallbackIntent.type || "passage");
    const serializedAnchor = serializeMapAccessAnchor(anchor);
    if (!serializedAnchor) return null;
    return {
      disabled: false,
      type,
      label: getMapAccessLabelForType(type),
      anchor: serializedAnchor,
    };
  }

  function setMapAccess(regionId, anchor, accessType = null) {
    const nextOverride = buildMapAccessOverride(regionId, anchor, accessType);
    if (!nextOverride) return;
    setManualOverrides((current) => {
      const mapAccesses = { ...(current.mapAccesses || {}) };
      const previous = mapAccesses[regionId];
      if (
        previous && !previous.disabled &&
        previous.type === nextOverride.type &&
        anchorsShareSideAndCell(previous.anchor, nextOverride.anchor)
      ) return current;
      mapAccesses[regionId] = nextOverride;
      return {
        ...current,
        mapAccesses,
      };
    });
  }

  function setMapAccessWithHistory(regionId, anchor, accessType = null) {
    const nextOverride = buildMapAccessOverride(regionId, anchor, accessType);
    if (!nextOverride) return;
    updateManualOverridesWithHistory((current) => {
      const mapAccesses = { ...(current.mapAccesses || {}) };
      const previous = mapAccesses[regionId];
      if (
        previous && !previous.disabled &&
        previous.type === nextOverride.type &&
        anchorsShareSideAndCell(previous.anchor, nextOverride.anchor)
      ) return current;
      mapAccesses[regionId] = nextOverride;
      return {
        ...current,
        mapAccesses,
      };
    });
  }

  function removeMapAccess(regionId) {
    if (!regionId) return;
    updateManualOverridesWithHistory((current) => ({
      ...current,
      mapAccesses: {
        ...(current.mapAccesses || {}),
        [regionId]: { disabled: true },
      },
    }));
  }

  function updateJunctionType(junctionKey, junctionType) {
    if (!junctionKey) return;
    updateManualOverridesWithHistory((current) => {
      const corridorJunctions = { ...(current.corridorJunctions || {}) };
      const previous = getManualJunctionOverride(corridorJunctions, junctionKey, "merge");
      const nextType = normalizeJunctionType(junctionType);
      if (nextType === "merge") delete corridorJunctions[junctionKey];
      else {
        const nextSideIndex = previous.type === nextType ? (previous.sideIndex + 1) % 4 : previous.sideIndex;
        corridorJunctions[junctionKey] = { type: nextType, sideIndex: nextSideIndex };
      }
      return {
        ...current,
        corridorJunctions,
      };
    });
  }

  function createConnectionFromWallDrag(connection) {
    if (!connection?.fromRegionId || !connection?.toRegionId || connection.fromRegionId === connection.toRegionId) return;
    const fromAnchor = serializeManualAnchor(connection.fromAnchor);
    const toAnchor = serializeManualAnchor(connection.toAnchor);
    if (!fromAnchor || !toAnchor) return;

    updateManualOverridesWithHistory((current) => {
      const normalized = normalizeManualOverrides(current);
      const customConnections = Array.isArray(normalized.customConnections) ? normalized.customConnections : [];
      const nextSequence = normalized.manualConnectionSequence + 1;
      const edgeId = `manual-edge-${connection.fromRegionId}-${connection.toRegionId}-${nextSequence.toString(36)}`;
      const deletedConnections = Array.isArray(normalized.deletedConnections)
        ? normalized.deletedConnections.filter((id) => id !== edgeId)
        : [];
      return {
        ...current,
        deletedConnections,
        manualConnectionSequence: nextSequence,
        customConnections: [...customConnections, { id: edgeId, from: connection.fromRegionId, to: connection.toRegionId, kind: "manual", locked: true }],
        doorAnchors: {
          ...normalized.doorAnchors,
          [corridorEndpointKey(edgeId, "from")]: fromAnchor,
          [corridorEndpointKey(edgeId, "to")]: toAnchor,
        },
      };
    });
  }

  function updateRoomStyle(regionId, patch) {
    updateManualOverridesWithHistory((current) => ({
      ...current,
      roomStyles: {
        ...current.roomStyles,
        [regionId]: {
          ...(current.roomStyles?.[regionId] || {}),
          ...patch,
        },
      },
    }));
  }

  function resetRoomStyle(regionId) {
    updateManualOverridesWithHistory((current) => {
      const nextStyles = { ...(current.roomStyles || {}) };
      delete nextStyles[regionId];
      return {
        ...current,
        roomStyles: nextStyles,
      };
    });
  }

  return (
    <div className="cruor-map-mvp" onContextMenu={(event) => event.preventDefault()}>
      <style>{`
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css");
        .cruor-map-mvp{min-height:100vh;background:#181512;color:#f3eee3;padding:24px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.mvp-shell{max-width:1440px;margin:0 auto;display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:18px}.panel{background:rgba(245,237,220,.075);border:1px solid rgba(245,237,220,.16);border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.28)}.control-panel{padding:18px;position:sticky;top:18px;align-self:start}.mvp-title{font-size:24px;line-height:1.1;font-weight:750;letter-spacing:-.03em;margin:0 0 8px}.mvp-subtitle{color:rgba(243,238,227,.68);font-size:13px;line-height:1.45;margin:0 0 18px}.control-group{display:grid;gap:8px;margin-bottom:14px}.control-label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(243,238,227,.58);font-weight:700}.control-input,.control-select{width:100%;height:38px;border-radius:10px;border:1px solid rgba(245,237,220,.2);background:rgba(0,0,0,.22);color:#f3eee3;padding:0 11px;outline:none}.control-input:focus,.control-select:focus{border-color:rgba(208,188,126,.8)}.button-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.mvp-button{border-radius:10px!important;border:1px solid rgba(245,237,220,.18)!important;background:rgba(245,237,220,.08)!important;color:#f3eee3!important;font-size:12px!important;height:38px!important}.mvp-button:hover{background:rgba(245,237,220,.13)!important}.mvp-button:disabled{opacity:.42;cursor:not-allowed!important}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:16px 0}.control-group .mvp-button{width:100%!important;justify-content:center!important}.stat{border:1px solid rgba(245,237,220,.12);border-radius:10px;padding:10px;background:rgba(0,0,0,.16)}.stat__value{font-size:20px;font-weight:750;line-height:1}.stat__label{font-size:11px;color:rgba(243,238,227,.55);margin-top:4px}.state-status{margin:10px 0 0;border:1px solid rgba(245,237,220,.12);border-radius:10px;padding:8px 10px;background:rgba(0,0,0,.16);font-size:11px;color:rgba(243,238,227,.68)}.test-report{border:1px solid rgba(245,237,220,.12);border-radius:10px;padding:10px;margin:0 0 14px;background:rgba(0,0,0,.16);font-size:11px;color:rgba(243,238,227,.66)}.test-report.is-passing{border-color:rgba(145,190,140,.28)}.test-report.is-failing{border-color:rgba(217,110,85,.5)}.test-report__title{font-weight:800;color:#f3eee3;margin-bottom:5px}.test-report__summary{margin-bottom:8px;color:rgba(243,238,227,.72)}.test-report__list{display:grid;gap:5px;max-height:230px;overflow:auto;padding-right:3px}.test-report__check{display:grid;grid-template-columns:1fr auto;gap:4px 8px;border:1px solid rgba(245,237,220,.1);border-radius:8px;padding:6px;background:rgba(0,0,0,.12)}.test-report__check strong{font-size:10px;text-transform:uppercase;letter-spacing:.08em}.test-report__check small{grid-column:1 / -1;color:rgba(243,238,227,.52);line-height:1.25}.test-report__check.is-passing strong{color:#9bcf91}.test-report__check.is-failing{border-color:rgba(217,110,85,.38)}.test-report__check.is-failing strong{color:#e38b76}.test-report__warning{margin-top:6px;color:#d6bc77}.test-report__error{margin-top:6px;color:#e38b76}.map-panel{overflow:hidden}.map-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;border-bottom:1px solid rgba(245,237,220,.13)}.map-toolbar__title{font-size:13px;color:rgba(243,238,227,.7)}.map-toolbar__actions{display:flex;gap:8px;flex-wrap:wrap}.map-stage{padding:16px;background:radial-gradient(circle at top,rgba(245,237,220,.08),transparent 42%),#11100e}.map-frame{background:#d9c8a5;border-radius:12px;padding:12px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22),0 20px 80px rgba(0,0,0,.42)}.zoom-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}.zoom-button{width:auto!important;padding:0 11px!important}.zoom-scale{margin-left:auto;color:#1d1915;background:rgba(255,255,255,.28);border:1px solid rgba(29,25,21,.18);border-radius:999px;font-size:12px;font-weight:800;padding:5px 9px}.map-viewport{height:min(68vh,720px);min-height:420px;overflow:hidden;border-radius:8px;background:#cdbb95;box-shadow:inset 0 0 0 1px rgba(29,25,21,.25);touch-action:none;overscroll-behavior:contain;outline:none;cursor:grab;position:relative}.map-viewport.is-panning{cursor:grabbing}.map-viewport:focus{box-shadow:inset 0 0 0 2px rgba(29,25,21,.58),inset 0 0 0 1px rgba(29,25,21,.25)}.map-pan-layer{position:absolute;inset:0;transform-origin:0 0}.zoom-hint{margin-top:8px;color:rgba(29,25,21,.68);font-size:11px;font-weight:700}.room-context-menu{position:absolute;z-index:20;width:238px;border:1px solid rgba(29,25,21,.28);border-radius:12px;background:#efe4ca;color:#1d1915;box-shadow:0 18px 48px rgba(0,0,0,.32);padding:10px;font-size:12px}.room-context-menu__header{display:grid;gap:2px;padding:4px 4px 8px;border-bottom:1px solid rgba(29,25,21,.14);margin-bottom:8px}.room-context-menu__header strong{font-size:13px;line-height:1.2}.room-context-menu__header span{font-size:11px;color:rgba(29,25,21,.62)}.room-context-menu__section{display:grid;gap:6px;margin-bottom:10px}.room-context-menu__label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:rgba(29,25,21,.58)}.room-context-menu__grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.room-context-menu button{border:1px solid rgba(29,25,21,.18);border-radius:8px;background:rgba(255,255,255,.28);color:#1d1915;font-size:11px;font-weight:750;padding:7px 8px;text-align:left;cursor:pointer}.room-context-menu button:hover{background:rgba(255,255,255,.48)}.room-context-menu button.is-active{background:#1d1915;color:#efe4ca;border-color:#1d1915}.room-context-menu button.is-armed{background:#7a241c;color:#fff0dc;border-color:#7a241c}.room-context-menu__actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;border-top:1px solid rgba(29,25,21,.14);padding-top:8px}.room-context-menu__body{display:grid;gap:4px;margin:8px 0}.room-context-menu__item{position:relative}.room-context-menu__item::after{content:"";position:absolute;left:100%;top:-8px;width:18px;height:calc(100% + 16px);pointer-events:auto}.room-context-menu__trigger{width:100%;display:flex!important;justify-content:space-between;align-items:center;text-align:left}.room-context-menu__trigger span:last-child{opacity:.62}.room-context-submenu{position:absolute;left:calc(100% + 8px);top:0;width:224px;border:1px solid rgba(29,25,21,.24);border-radius:12px;background:#efe4ca;box-shadow:0 18px 48px rgba(0,0,0,.28);padding:8px;display:none;gap:5px}.room-context-menu__item:hover>.room-context-submenu{display:grid}.room-context-submenu button{width:100%;display:flex;justify-content:space-between;align-items:center}.room-context-submenu__hint{font-size:10px;color:rgba(29,25,21,.58);padding:3px 5px 6px}.room-context-menu__active-value{font-size:10px;color:rgba(29,25,21,.58);font-weight:850}.map-action-menu{width:248px}.map-action-menu .room-context-menu__trigger i,.wall-access-context-menu .room-context-menu__trigger i,.room-context-submenu button i{width:15px;text-align:center;margin-right:7px;opacity:.82}.context-menu-toolbar{display:flex;align-items:center;gap:5px;border-bottom:1px solid rgba(29,25,21,.14);padding:0 0 8px;margin-bottom:8px}.context-menu-toolbar button{width:30px;height:30px;display:grid;place-items:center;padding:0!important;text-align:center!important}.context-menu-toolbar button.is-active{background:#1d1915;color:#efe4ca;border-color:#1d1915}.context-menu-toolbar__divider{width:1px;height:22px;background:rgba(29,25,21,.18);margin:0 2px}.map-action-menu .room-context-menu__body{margin-bottom:0}.map-action-menu .room-context-submenu{top:-8px}.cruor-map-svg{display:block;width:100%;height:100%;border-radius:7px;shape-rendering:geometricPrecision;text-rendering:geometricPrecision}.room-key{max-height:280px;overflow:auto;display:grid;gap:8px;padding-right:4px}.room-key__item{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:start;padding:8px;border:1px solid rgba(245,237,220,.11);border-radius:10px;background:rgba(0,0,0,.14)}.room-key__number{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:rgba(245,237,220,.14);font-size:12px;font-weight:800}.room-key__name{font-size:12px;font-weight:750}.room-key__meta{margin-top:2px;font-size:11px;color:rgba(243,238,227,.55)}@media(max-width:980px){.mvp-shell{grid-template-columns:1fr}.control-panel{position:static}}
      `}</style>
      <div className="mvp-shell">
        <Card className="panel control-panel">
          <CardContent className="p-0">
            <h1 className="mvp-title">Cruor Map Generator MVP</h1>
            <p className="mvp-subtitle">Configuration-led SVG map generation for Darken a Location. This MVP keeps geometry deterministic, grid-based, editable, and exportable.</p>
            <div className="control-group">
              <label className="control-label" htmlFor="seed">Seed</label>
              <input id="seed" className="control-input" value={seed} onChange={(event) => {
                setSeed(event.target.value);
                setManualOverrides(resetManualOverrides());
                clearManualHistory();
              }} />
            </div>
            <div className="control-group">
              <label className="control-label" htmlFor="room-count">Room / Region Count</label>
              <input id="room-count" className="control-input" type="number" min="1" max="16" value={roomCount} onChange={(event) => {
                setRoomCount(normalizeRoomCount(event.target.value, roomCount));
                setManualOverrides(resetManualOverrides());
                clearManualHistory();
              }} />
            </div>
            <div className="control-group">
              <label className="control-label" htmlFor="context">Context</label>
              <select id="context" className="control-select" value={context} onChange={(event) => {
                setContext(event.target.value);
                setManualOverrides(resetManualOverrides());
                clearManualHistory();
              }}> 
                <option>Crypt</option>
                <option>Chapel</option>
                <option>Cave</option>
                <option>Mine</option>
                <option>Noble House</option>
                <option>Ruins</option>
              </select>
            </div>
            <div className="control-group">
              <label className="control-label" htmlFor="grid-style">Grid Style</label>
              <select id="grid-style" className="control-select" value={gridStyle} onChange={(event) => setGridStyle(normalizeGridStyle(event.target.value))}>
                <option value="solid">Solid</option>
                <option value="dotted">Dotted</option>
                <option value="dashed">Dashed</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="control-group">
              <label className="control-label" htmlFor="level-view">Level View</label>
              <select id="level-view" className="control-select" value={String(normalizeLevelView(levelView, availableLevels))} onChange={(event) => setLevelView(normalizeLevelView(event.target.value, availableLevels))}>
                <option value={LEVEL_VIEW_ALL}>All Levels</option>
                {availableLevels.map((level) => <option key={`level-view-${level}`} value={String(level)}>Level {formatMapLevel(level)}</option>)}
              </select>
              <Button className="mvp-button" onClick={() => setFadeOtherLevels((value) => !value)}>{fadeOtherLevels ? "Fade Other Levels" : "Solo Active Level"}</Button>
            </div>
            <div className="button-row">
              <Button className="mvp-button" onClick={randomizeSeed}><RefreshCw size={15} /> New Seed</Button>
              <Button className="mvp-button" onClick={downloadSvg}><Download size={15} /> Export SVG</Button>
              <Button className="mvp-button" onClick={downloadGmSvg}>Export GM</Button>
              <Button className="mvp-button" onClick={downloadPlayerSvg}>Export Player</Button>
              <Button className="mvp-button" onClick={downloadPrintSvg}>Export Print</Button>
              <Button className="mvp-button" onClick={exportState}>Export State</Button>
              <Button className="mvp-button" onClick={requestImportState}>Import State</Button>
              <Button className="mvp-button" onClick={undoManualEdit} disabled={manualHistory.past.length === 0}>Undo</Button>
              <Button className="mvp-button" onClick={redoManualEdit} disabled={manualHistory.future.length === 0}>Redo</Button>
              <Button className="mvp-button" onClick={() => setShowGrid((value) => !value)}><Grid3X3 size={15} /> Grid</Button>
              <Button className="mvp-button" onClick={() => setShowEditor((value) => !value)}>{showEditor ? <EyeOff size={15} /> : <Eye size={15} />} Editor</Button>
              <Button className="mvp-button" onClick={() => setShowNames((value) => !value)}>Names</Button>
              <Button className="mvp-button" onClick={() => setShowProps((value) => !value)}>Props</Button>
              <Button className="mvp-button" onClick={() => updateManualOverridesWithHistory(resetManualOverrides(), "Edits reset.")}>Reset Edits</Button>
            </div>
            <input ref={stateFileInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={importStateFromFile} />
            {stateStatus && <div className="state-status">{stateStatus}</div>}
            <div className="stats">
              <div className="stat"><div className="stat__value">{generatedMap.regions.length}</div><div className="stat__label">Regions</div></div>
              <div className="stat"><div className="stat__value">{generatedMap.corridors.length}</div><div className="stat__label">Connections</div></div>
              <div className="stat"><div className="stat__value">{generatedMap.dungeonMask.floorCells.length}</div><div className="stat__label">Floor Cells</div></div>
              <div className="stat"><div className="stat__value">{generatedMap.dungeonMask.doorSegments.length}</div><div className="stat__label">Doors</div></div>
              <div className="stat"><div className="stat__value">{generatedMap.dungeonMask.mapAccesses?.length || 0}</div><div className="stat__label">Map Accesses</div></div>
              <div className="stat"><div className="stat__value">{availableLevels.length}</div><div className="stat__label">Levels</div></div>
            </div>
            <div className={testSuite.passed ? "test-report is-passing" : "test-report is-failing"}>
              <div className="test-report__title">Structural Test Suite</div>
              <div className="test-report__summary">
                {testSuite.tests.filter((test) => test.passed).length}/{testSuite.tests.length} checks passing
              </div>
              <div className="test-report__list">
                {testSuite.tests.map((test) => (
                  <div key={test.id} className={test.passed ? "test-report__check is-passing" : "test-report__check is-failing"}>
                    <span>{test.label}</span>
                    <strong>{test.passed ? "pass" : "fail"}</strong>
                    {test.details && <small>{test.details}</small>}
                  </div>
                ))}
              </div>
              {testSuite.structural.warnings.length > 0 && <div className="test-report__warning">{testSuite.structural.warnings[0]}</div>}
              {testSuite.structural.errors.length > 0 && <div className="test-report__error">{testSuite.structural.errors[0]}</div>}
            </div>
            <RoomKey generatedMap={generatedMap} />
          </CardContent>
        </Card>
        <Card className="panel map-panel">
          <CardContent className="p-0">
            <div className="map-toolbar">
              <div className="map-toolbar__title">{context} / {DEFAULT_CONFIG.biome} · {generatedMap.regions[0]?.placementProfile || "layout"} · {normalizeLevelView(levelView, availableLevels) === LEVEL_VIEW_ALL ? "all levels" : `level ${formatMapLevel(normalizeLevelView(levelView, availableLevels))}`} · {generatedMap.seed}</div>
              <div className="map-toolbar__actions"><span className="control-label">Editor geometry is separate from clean export layers</span></div>
            </div>
            <div className="map-stage">
              <div className="map-frame">
                <MapViewport
                  generatedMap={generatedMap}
                  showGrid={showGrid}
                  gridStyle={gridStyle}
                  showEditor={showEditor}
                  showNames={showNames}
                  showProps={showProps}
                  levelView={levelView}
                  fadeOtherLevels={fadeOtherLevels}
                  availableLevels={availableLevels}
                  onRoomMove={moveRoom}
                  onDoorMove={moveDoor}
                  onDoorTypeChange={updateDoorType}
                  onDoorStairChange={updateDoorStair}
                  onMapAccessMove={setMapAccess}
                  onMapAccessSet={setMapAccessWithHistory}
                  onMapAccessRemove={removeMapAccess}
                  onJunctionTypeChange={updateJunctionType}
                  onWaypointMove={moveWaypoint}
                  onWaypointInsert={insertWaypoint}
                  onWaypointDelete={deleteWaypoint}
                  onConnectionDelete={deleteConnection}
                  onCreateConnection={createConnectionFromWallDrag}
                  manualOverrides={manualOverrides}
                  onRoomStyleChange={updateRoomStyle}
                  onRoomStyleReset={resetRoomStyle}
                  onEditStart={beginManualEdit}
                  onEditCommit={commitManualEdit}
                  onUndo={undoManualEdit}
                  onRedo={redoManualEdit}
                  onNewSeed={randomizeSeed}
                  onToggleGrid={() => setShowGrid((value) => !value)}
                  onGridStyleChange={(value) => setGridStyle(normalizeGridStyle(value))}
                  onToggleEditor={() => setShowEditor((value) => !value)}
                  onToggleNames={() => setShowNames((value) => !value)}
                  onToggleProps={() => setShowProps((value) => !value)}
                  onLevelViewChange={(value) => setLevelView(normalizeLevelView(value, availableLevels))}
                  onToggleFadeOtherLevels={() => setFadeOtherLevels((value) => !value)}
                  onResetEdits={() => updateManualOverridesWithHistory(resetManualOverrides(), "Edits reset.")}
                  onExportSvg={downloadSvg}
                  onExportGmSvg={downloadGmSvg}
                  onExportPlayerSvg={downloadPlayerSvg}
                  onExportPrintSvg={downloadPrintSvg}
                  onExportState={exportState}
                  onImportState={requestImportState}
                  viewResetKey={`${seed}:${roomCount}:${context}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
