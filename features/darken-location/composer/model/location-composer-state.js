import { createInitialCrucibleState } from "../../../crucible/crucible.state.js";

const DEFAULT_SELECTED_SOURCE = "Sedlec Ossuary";
const DEFAULT_SELECTED_HORROR = "Religious Horror";
const DEFAULT_CONTEXT = "Crypt";
const DEFAULT_INTRUSION = "Medium";

export const DEFAULT_LOCATION_SLOT_IDS = [
  "horrorPremise",
  "sensoryLayer",
  "visibleAnomaly",
  "hazard",
  "clue",
  "encounterTwist",
  "reward",
];

export function createInitialLocationComposerState(regionTemplates = []) {
  const legacyState = createInitialCrucibleState();
  const initialRegions = Array.isArray(regionTemplates)
    ? regionTemplates.slice(0, 4).map((region, index) => ({
        ...region,
        id: region.templateId || region.id || `location-region-${index + 1}`,
      }))
    : [];

  return {
    ...legacyState,
    workflow: "location",
    title: "Cursed Location Build",
    context: DEFAULT_CONTEXT,
    horror: DEFAULT_SELECTED_HORROR,
    sourceAnchors: new Set([DEFAULT_SELECTED_SOURCE]),
    horrors: new Set([DEFAULT_SELECTED_HORROR]),
    intrusion: DEFAULT_INTRUSION,
    activeSlot: "horrorPremise",
    activeRegionId: initialRegions[0]?.id || "",
    selectedComponentIds: new Set(),
    slotAssignments: {},
    locationRegions: initialRegions,
  };
}

export function toArray(value) {
  if (value instanceof Set) return Array.from(value);
  if (Array.isArray(value)) return value;
  return [];
}

export function normalizeSlotAssignments(assignments = {}) {
  return Object.fromEntries(
    Object.entries(assignments || {}).map(([slotId, items]) => [
      slotId,
      Array.isArray(items)
        ? items
            .filter((item) => item && item.componentId)
            .map((item) => ({
              componentId: item.componentId,
              slotId: item.slotId || slotId,
              regionId: item.regionId || "",
              addedAt: item.addedAt || 0,
            }))
        : [],
    ]),
  );
}

export function deriveSelectedComponentIds(slotAssignments = {}) {
  return new Set(
    Object.values(slotAssignments)
      .flat()
      .map((assignment) => assignment.componentId)
      .filter(Boolean),
  );
}

export function assignComponentToSlot(state, component, slot, regionId) {
  if (!component?.id || !slot?.id) return state;

  const slotId = slot.id;
  const max = Number.isFinite(slot.max) ? Math.max(1, slot.max) : 1;
  const normalizedAssignments = normalizeSlotAssignments(state.slotAssignments);

  const cleanedAssignments = Object.fromEntries(
    Object.entries(normalizedAssignments).map(([currentSlotId, assignments]) => [
      currentSlotId,
      assignments.filter((assignment) => assignment.componentId !== component.id),
    ]),
  );

  const currentSlotAssignments = cleanedAssignments[slotId] || [];
  const nextAssignment = {
    componentId: component.id,
    slotId,
    regionId: regionId || state.activeRegionId || "",
    addedAt: Date.now(),
  };
  const nextSlotAssignments = [...currentSlotAssignments, nextAssignment].slice(-max);
  const nextSlotAssignmentsMap = {
    ...cleanedAssignments,
    [slotId]: nextSlotAssignments,
  };

  return {
    ...state,
    activeSlot: slotId,
    activeRegionId: nextAssignment.regionId || state.activeRegionId,
    slotAssignments: nextSlotAssignmentsMap,
    selectedComponentIds: deriveSelectedComponentIds(nextSlotAssignmentsMap),
  };
}

export function removeComponentFromSlot(state, componentId, slotId = "") {
  const normalizedAssignments = normalizeSlotAssignments(state.slotAssignments);
  const nextSlotAssignmentsMap = Object.fromEntries(
    Object.entries(normalizedAssignments).map(([currentSlotId, assignments]) => [
      currentSlotId,
      assignments.filter((assignment) => {
        if (slotId && currentSlotId !== slotId) return true;
        return assignment.componentId !== componentId;
      }),
    ]),
  );

  return {
    ...state,
    slotAssignments: nextSlotAssignmentsMap,
    selectedComponentIds: deriveSelectedComponentIds(nextSlotAssignmentsMap),
  };
}

export function moveAssignmentToRegion(state, componentId, regionId) {
  const normalizedAssignments = normalizeSlotAssignments(state.slotAssignments);
  const nextSlotAssignmentsMap = Object.fromEntries(
    Object.entries(normalizedAssignments).map(([slotId, assignments]) => [
      slotId,
      assignments.map((assignment) =>
        assignment.componentId === componentId
          ? { ...assignment, regionId: regionId || "" }
          : assignment,
      ),
    ]),
  );

  return {
    ...state,
    activeRegionId: regionId || state.activeRegionId,
    slotAssignments: nextSlotAssignmentsMap,
    selectedComponentIds: deriveSelectedComponentIds(nextSlotAssignmentsMap),
  };
}

export function createLocationComposerSnapshot(state, selectedComponents = []) {
  const slotAssignments = normalizeSlotAssignments(state.slotAssignments);

  return {
    workflow: state.workflow || "location",
    title: state.title || "Cursed Location Build",
    context: state.context || DEFAULT_CONTEXT,
    horror: state.horror || DEFAULT_SELECTED_HORROR,
    horrors: toArray(state.horrors),
    sourceAnchors: toArray(state.sourceAnchors),
    intrusion: state.intrusion || DEFAULT_INTRUSION,
    activeSlot: state.activeSlot || "horrorPremise",
    activeRegionId: state.activeRegionId || "",
    selectedComponentIds: Array.from(deriveSelectedComponentIds(slotAssignments)),
    slotAssignments,
    selectedComponents,
    locationRegions: Array.isArray(state.locationRegions) ? state.locationRegions : [],
  };
}

export function toggleSetValue(sourceSet, value) {
  const next = new Set(sourceSet || []);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
