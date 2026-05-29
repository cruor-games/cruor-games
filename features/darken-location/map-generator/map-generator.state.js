function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const MANUAL_OVERRIDE_SCHEMA_VERSION = 2;

export function createEmptyLevelOverrides() {
  return {
    regions: {},
    corridors: {},
    stairs: {},
  };
}

export function normalizeLevelOverrides(
  levels = {},
  legacyStairTransitions = {},
) {
  const source = levels && typeof levels === "object" ? levels : {};
  return {
    regions:
      source.regions && typeof source.regions === "object"
        ? source.regions
        : {},
    corridors:
      source.corridors && typeof source.corridors === "object"
        ? source.corridors
        : {},
    stairs: {
      ...(legacyStairTransitions && typeof legacyStairTransitions === "object"
        ? legacyStairTransitions
        : {}),
      ...(source.stairs && typeof source.stairs === "object"
        ? source.stairs
        : {}),
    },
  };
}

export function getLegacyStairTransitionsFromOverrides(overrides = {}) {
  return overrides.stairTransitions || overrides.manualStairTransitions || {};
}

export function createEmptyManualOverrides() {
  return {
    schemaVersion: MANUAL_OVERRIDE_SCHEMA_VERSION,
    roomPositions: {},
    doorAnchors: {},
    doorTypes: {},
    stairTransitions: {},
    levels: createEmptyLevelOverrides(),
    mapAccesses: {},
    corridorJunctions: {},
    corridorWaypoints: {},
    customConnections: [],
    roomStyles: {},
    deletedConnections: [],
    manualConnectionSequence: 0,
  };
}

export function normalizeManualOverrides(overrides = {}) {
  const sequence = Number(
    overrides.manualConnectionSequence ?? overrides.connectionSequence ?? 0,
  );
  const levels = normalizeLevelOverrides(
    overrides.levels || overrides.manualLevels || {},
    getLegacyStairTransitionsFromOverrides(overrides),
  );
  return {
    schemaVersion: MANUAL_OVERRIDE_SCHEMA_VERSION,
    roomPositions:
      overrides.roomPositions || overrides.manualRoomPositions || {},
    doorAnchors: overrides.doorAnchors || overrides.manualDoorAnchors || {},
    doorTypes: overrides.doorTypes || overrides.manualDoorTypes || {},
    stairTransitions: levels.stairs,
    levels,
    mapAccesses: overrides.mapAccesses || overrides.manualMapAccesses || {},
    corridorJunctions:
      overrides.corridorJunctions || overrides.manualCorridorJunctions || {},
    corridorWaypoints:
      overrides.corridorWaypoints || overrides.manualCorridorWaypoints || {},
    customConnections: Array.isArray(
      overrides.customConnections || overrides.manualCustomConnections,
    )
      ? overrides.customConnections || overrides.manualCustomConnections
      : [],
    roomStyles: overrides.roomStyles || overrides.manualRoomStyles || {},
    deletedConnections: Array.isArray(
      overrides.deletedConnections || overrides.manualDeletedConnections,
    )
      ? overrides.deletedConnections || overrides.manualDeletedConnections
      : [],
    manualConnectionSequence: Number.isFinite(sequence)
      ? Math.max(0, Math.round(sequence))
      : 0,
  };
}

export function cloneManualOverrides(overrides = {}) {
  return normalizeManualOverrides(
    JSON.parse(JSON.stringify(normalizeManualOverrides(overrides))),
  );
}

export function areManualOverridesEqual(a, b) {
  return (
    JSON.stringify(cloneManualOverrides(a)) ===
    JSON.stringify(cloneManualOverrides(b))
  );
}

export function applyManualOverridesToConfig(config, manualOverrides = {}) {
  const normalizedOverrides = normalizeManualOverrides(manualOverrides);
  return {
    ...config,
    manualRoomPositions: normalizedOverrides.roomPositions,
    manualDoorAnchors: normalizedOverrides.doorAnchors,
    manualDoorTypes: normalizedOverrides.doorTypes,
    manualStairTransitions: normalizedOverrides.levels.stairs,
    manualLevels: normalizedOverrides.levels,
    manualMapAccesses: normalizedOverrides.mapAccesses,
    manualCorridorJunctions: normalizedOverrides.corridorJunctions,
    manualCorridorWaypoints: normalizedOverrides.corridorWaypoints,
    manualCustomConnections: normalizedOverrides.customConnections,
    manualRoomStyles: normalizedOverrides.roomStyles,
    manualDeletedConnections: normalizedOverrides.deletedConnections,
  };
}

export function resetManualOverrides() {
  return createEmptyManualOverrides();
}

export const GRID_STYLE_OPTIONS = ["solid", "dotted", "dashed", "none"];
export const DOOR_TYPE_OPTIONS = ["default", "secret", "locked", "open"];
export const STAIR_TRANSITION_OPTIONS = ["none", "up", "down"];
export const JUNCTION_TYPE_OPTIONS = ["merge", "wall", "door"];
export const LEVEL_VIEW_ALL = "all";

export function normalizeGridStyle(value) {
  return GRID_STYLE_OPTIONS.includes(value) ? value : "solid";
}

export function doorTypeKey(corridorId, endpoint) {
  return `${corridorId}:${endpoint || "shared"}`;
}

export function normalizeDoorType(value, fallback = "default") {
  return DOOR_TYPE_OPTIONS.includes(value) ? value : fallback;
}

export function stairTransitionKey(corridorId, endpoint) {
  return `${corridorId}:${endpoint || "shared"}`;
}

export function normalizeStairTransition(value, fallback = "none") {
  return STAIR_TRANSITION_OPTIONS.includes(value) ? value : fallback;
}

export function getManualStairTransition(
  stairTransitions,
  corridorId,
  endpoint,
  fallback = "none",
) {
  return normalizeStairTransition(
    stairTransitions?.[stairTransitionKey(corridorId, endpoint)],
    fallback,
  );
}

export function resolveStairTransition(
  config,
  corridorId,
  endpoint,
  fallback = "none",
) {
  return getManualStairTransition(
    config.manualStairTransitions || {},
    corridorId,
    endpoint,
    fallback,
  );
}

export function normalizeJunctionType(value, fallback = "merge") {
  return JUNCTION_TYPE_OPTIONS.includes(value) ? value : fallback;
}

export function normalizeJunctionOverride(value, fallback = "merge") {
  if (typeof value === "string")
    return { type: normalizeJunctionType(value, fallback), sideIndex: 0 };
  if (value && typeof value === "object") {
    return {
      type: normalizeJunctionType(value.type, fallback),
      sideIndex: Number.isFinite(value.sideIndex)
        ? clamp(Math.round(value.sideIndex), 0, 3)
        : 0,
    };
  }
  return { type: normalizeJunctionType(fallback, "merge"), sideIndex: 0 };
}

export function getManualJunctionOverride(junctions, key, fallback = "merge") {
  return normalizeJunctionOverride(junctions?.[key], fallback);
}

export function getManualJunctionType(junctions, key, fallback = "merge") {
  return getManualJunctionOverride(junctions, key, fallback).type;
}

export function getManualJunctionSideIndex(junctions, key, fallback = "merge") {
  return getManualJunctionOverride(junctions, key, fallback).sideIndex;
}

export function getManualDoorType(
  doorTypes,
  corridorId,
  endpoint,
  fallback = "default",
) {
  return normalizeDoorType(
    doorTypes?.[doorTypeKey(corridorId, endpoint)],
    fallback,
  );
}

export function resolveDoorType(
  config,
  corridorId,
  endpoint,
  fallbackSecret = false,
) {
  return getManualDoorType(
    config.manualDoorTypes || {},
    corridorId,
    endpoint,
    fallbackSecret ? "secret" : "default",
  );
}
