import { COMPONENTS } from "../../../crucible/crucible.components-data.js";
import { LOCATION_REGION_TEMPLATES } from "../../../crucible/crucible.location-regions.js";
import { SOURCE_DETAILS } from "../../../crucible/crucible.sources-data.js";
import { WORKFLOWS, SLOT_DESCRIPTIONS } from "../../../crucible/crucible.workflows.js";
import {
  DEFAULT_LOCATION_SLOT_IDS,
  normalizeSlotAssignments,
  toArray,
} from "./location-composer-state.js";

export function getLocationWorkflow() {
  return WORKFLOWS.location || Object.values(WORKFLOWS).find((workflow) =>
    workflow?.slots?.some((slot) => DEFAULT_LOCATION_SLOT_IDS.includes(slot.id)),
  );
}

export function getLocationSlots() {
  const workflow = getLocationWorkflow();
  const slots = Array.isArray(workflow?.slots) && workflow.slots.length
    ? workflow.slots
    : DEFAULT_LOCATION_SLOT_IDS.map((id) => ({
        id,
        label: id.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
        max: 1,
      }));

  return slots.map((slot) => ({
    ...slot,
    max: Number.isFinite(slot.max) ? Math.max(1, slot.max) : 1,
    description: SLOT_DESCRIPTIONS[slot.id] || "",
  }));
}

export function getSlotById(slotId) {
  return getLocationSlots().find((slot) => slot.id === slotId) || getLocationSlots()[0];
}

export function getLocationComponents() {
  return COMPONENTS.filter((component) => component?.workflows?.includes("location"));
}

export function getComponentById(componentId) {
  return getLocationComponents().find((component) => component.id === componentId);
}

export function getSlotAssignments(state, slotId = "") {
  const assignments = normalizeSlotAssignments(state?.slotAssignments);
  if (slotId) return assignments[slotId] || [];
  return assignments;
}

export function getSelectedComponents(state) {
  const assignments = normalizeSlotAssignments(state?.slotAssignments);
  const selectedIds = Object.values(assignments)
    .flat()
    .map((assignment) => assignment.componentId)
    .filter(Boolean);

  return selectedIds
    .map((componentId) => getComponentById(componentId))
    .filter(Boolean);
}

export function getAssignedComponentsForSlot(state, slotId) {
  return getSlotAssignments(state, slotId)
    .map((assignment) => {
      const component = getComponentById(assignment.componentId);
      return component ? { ...component, assignment } : null;
    })
    .filter(Boolean);
}

export function getAssignedComponentsForRegion(state, regionId) {
  const assignments = Object.values(getSlotAssignments(state))
    .flat()
    .filter((assignment) => assignment.regionId === regionId);

  return assignments
    .map((assignment) => {
      const component = getComponentById(assignment.componentId);
      const slot = getSlotById(assignment.slotId);
      return component ? { ...component, assignment, slot } : null;
    })
    .filter(Boolean);
}

export function getComponentAssignment(state, componentId) {
  return Object.values(getSlotAssignments(state))
    .flat()
    .find((assignment) => assignment.componentId === componentId);
}

export function isComponentAssignedToSlot(state, componentId, slotId) {
  return getSlotAssignments(state, slotId).some((assignment) => assignment.componentId === componentId);
}

export function getSlotFilledCount(state, slotId) {
  return getSlotAssignments(state, slotId).length;
}

export function getSlotCapacityLabel(state, slot) {
  const filledCount = getSlotFilledCount(state, slot.id);
  return `${filledCount}/${slot.max || 1}`;
}

export function getSlotStatus(state, slot) {
  const filledCount = getSlotFilledCount(state, slot.id);
  if (filledCount <= 0) return "empty";
  if (filledCount >= (slot.max || 1)) return "full";
  return "partial";
}

export function getComponentsForSlot(slotId, state) {
  const sourceAnchors = toArray(state?.sourceAnchors).filter((source) => source !== "Any Source");
  const horrors = toArray(state?.horrors);
  const context = state?.context;
  const intrusion = state?.intrusion;

  return getLocationComponents()
    .filter((component) => component?.slots?.includes(slotId))
    .filter((component) => !context || context === "Any" || component.contexts?.includes("Any") || component.contexts?.includes(context))
    .filter((component) => !intrusion || intrusion === "Any" || component.intrusion === intrusion || component.intrusion === "Any")
    .filter((component) => !sourceAnchors.length || sourceAnchors.some((anchor) => component.sourceAnchors?.includes(anchor)))
    .filter((component) => !horrors.length || horrors.some((horror) => component.horror?.includes(horror)))
    .slice(0, 16);
}

export function getRegionTemplatesForState(state) {
  const sourceAnchors = toArray(state?.sourceAnchors).filter((source) => source !== "Any Source");
  const context = state?.context;
  const horrors = toArray(state?.horrors);

  return LOCATION_REGION_TEMPLATES.filter((region) => {
    const matchesContext = !context || context === "Any" || region.contexts?.includes("Any") || region.contexts?.includes(context);
    const matchesSource = !sourceAnchors.length || sourceAnchors.some((anchor) => region.sourceAnchors?.includes(anchor));
    const matchesHorror = !horrors.length || horrors.some((horror) => region.horror?.includes(horror));
    return matchesContext && matchesSource && matchesHorror;
  }).slice(0, 8);
}

export function describeSourceAnchor(anchor) {
  return SOURCE_DETAILS[anchor]?.logic || "";
}

export function getPrimaryPremise(state) {
  return getAssignedComponentsForSlot(state, "horrorPremise")[0] || null;
}

export function getComposerDigest(state) {
  const slots = getLocationSlots();
  const assignedBySlot = slots.map((slot) => ({
    slot,
    components: getAssignedComponentsForSlot(state, slot.id),
  }));
  const activeRegion = state.locationRegions?.find((region) => region.id === state.activeRegionId);
  const premise = getPrimaryPremise(state);

  return {
    activeRegion,
    premise,
    assignedBySlot,
    filledSlots: assignedBySlot.filter((entry) => entry.components.length > 0).length,
    totalSlots: slots.length,
  };
}

export function getRegionById(state, regionId) {
  return (state?.locationRegions || []).find((region) => region.id === regionId);
}

export function getRegionDetailRows(region) {
  if (!region) return [];

  return [
    { label: "Feature", value: region.feature },
    { label: "Interaction", value: region.interaction || region.interact },
    { label: "Danger", value: region.danger },
    { label: "Secret", value: region.secret },
    { label: "Reward", value: region.reward },
    {
      label: "Read-Aloud",
      value:
        typeof region.readAloud === "string"
          ? region.readAloud
          : region.readAloud?.compact || region.readAloud?.extended,
    },
  ].filter((row) => row.value);
}

export function getRegionStageSummary(state, regionId) {
  const region = getRegionById(state, regionId);
  if (!region) return null;

  const assigned = getAssignedComponentsForRegion(state, regionId);
  const detailRows = getRegionDetailRows(region);
  const firstDetail = detailRows[0]?.value || region.role || "Location Region";

  return {
    region,
    assigned,
    assignedCount: assigned.length,
    shortRole: region.role || region.shape || "Location Region",
    firstDetail,
    hasDanger: Boolean(region.danger),
    hasSecret: Boolean(region.secret),
    hasReward: Boolean(region.reward),
  };
}

export function getRegionAttachmentSummary(state) {
  return (state?.locationRegions || []).map((region) => getRegionStageSummary(state, region.id)).filter(Boolean);
}
