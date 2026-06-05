import { useCallback, useMemo, useState } from "react";
import {
  assignComponentToSlot,
  removeComponentFromSlot,
} from "../model/location-composer-state.js";
import {
  getAssignedComponentsForRegion,
  getAssignedComponentsForSlot,
  getComponentsForSlot,
  getLocationSlots,
  getSlotFilledCount,
  getSlotStatus,
} from "../model/location-composer-selectors.js";
import {
  getGeneratedRoomForRegion,
} from "../model/location-composer-map-preview.js";
import { LocationComponentPickerModal } from "./LocationComponentPickerModal.jsx";
import { LocationSelectMenu } from "./LocationBriefPanel.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getComponentTitle(component) {
  return component?.title || component?.name || "Untitled Component";
}

function getComponentSummary(component) {
  return component?.summary || component?.description || component?.text || component?.effect || "";
}

function getSlotSummaries(slots) {
  return slots.reduce((acc, slot) => {
    acc[slot.id] = slot.description || `${slot.label} component.`;
    return acc;
  }, {});
}

function formatSlotCount(state, slot) {
  return `${getSlotFilledCount(state, slot.id)}/${slot.max || 1}`;
}

export function LocationSlotRail({ state, setState, onOpenMapGenerator, snapshot, generatedMapPreview, onEditSetup }) {
  const slots = getLocationSlots();
  const [pickerSlotId, setPickerSlotId] = useState("");

  const activeSlotId = state.activeSlot || slots[0]?.id || "";
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) || slots[0];
  const compatibleComponents = activeSlot ? getComponentsForSlot(activeSlot.id, state) : [];
  const assignedComponents = activeSlot ? getAssignedComponentsForSlot(state, activeSlot.id) : [];
  const activeRegion = state.locationRegions?.find((region) => region.id === state.activeRegionId);
  const activeGeneratedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const activeSlotFilled = getSlotFilledCount(state, activeSlot?.id);
  const activeSlotIsFull = activeSlotFilled >= (activeSlot?.max || 1);
  const slotSummaries = useMemo(() => getSlotSummaries(slots), [slots]);
  const slotLabels = useMemo(() => slots.reduce((acc, slot) => ({ ...acc, [slot.id]: slot.label }), {}), [slots]);

  const chooseSlot = useCallback((slotId) => {
    setState((current) => ({ ...current, activeSlot: slotId }));
  }, [setState]);

  const openSlotPicker = useCallback((slotId = activeSlotId) => {
    chooseSlot(slotId);
    setPickerSlotId(slotId);
  }, [activeSlotId, chooseSlot]);

  const closeSlotPicker = useCallback(() => setPickerSlotId(""), []);

  const addComponent = useCallback((component) => {
    if (!activeSlot) return;
    setState((current) => assignComponentToSlot(current, component, activeSlot, current.activeRegionId));
  }, [activeSlot, setState]);

  const removeComponent = useCallback((componentId) => {
    if (!activeSlot) return;
    setState((current) => removeComponentFromSlot(current, componentId, activeSlot.id));
  }, [activeSlot, setState]);

  return (
    <>
      <section className="cruor-composer-panel location-panel location-current-slot-panel" aria-label="Current location slot">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Components</p>
            <h2>{activeSlot?.label || "Slot"}</h2>
          </div>
          <strong className="location-component-count">{formatSlotCount(state, activeSlot)}</strong>
        </div>

        <LocationSelectMenu
          label="Slot"
          value={activeSlot?.id || ""}
          options={slots.map((slot) => slot.id)}
          summaries={slotSummaries}
          labels={slotLabels}
          icon="fa-solid fa-puzzle-piece"
          onChange={chooseSlot}
        />

        <div className="location-current-slot-panel__target">
          <span>Target Region</span>
          <strong>{activeRegion?.name || "No region selected"}</strong>
          {activeGeneratedRoom ? <small>Room {activeGeneratedRoom.number || "—"}</small> : null}
        </div>

        <div className="location-current-slot-panel__content" aria-label="Selected slot components">
          {assignedComponents.length ? assignedComponents.map((component) => (
            <article className="location-assigned-card" key={`${activeSlot?.id}-${component.id || component.title}`}>
              <div>
                <span>{component.type || "Component"}</span>
                <strong>{getComponentTitle(component)}</strong>
                {getComponentSummary(component) ? <p>{getComponentSummary(component)}</p> : null}
              </div>
              <button
                className="location-icon-btn location-icon-btn--subtle"
                type="button"
                aria-label={`Remove ${getComponentTitle(component)}`}
                onClick={() => removeComponent(component.id)}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </article>
          )) : (
            <div className="location-empty location-empty--quiet">
              <strong>No component selected.</strong>
              <span>Choose one option for the active region.</span>
            </div>
          )}
        </div>

        <div className="location-current-slot-panel__actions">
          <button
            className="location-primary-action location-primary-action--wide"
            type="button"
            onClick={() => openSlotPicker(activeSlot?.id)}
          >
            {assignedComponents.length ? "Change Component" : "Choose Component"}
          </button>
          <button className="location-icon-btn" type="button" onClick={() => onOpenMapGenerator?.(snapshot)} aria-label="Open Map Workspace">
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <button className="location-ghost-action" type="button" onClick={onEditSetup}>
          Edit Setup
        </button>
      </section>

      <LocationComponentPickerModal
        activeRegion={activeRegion}
        assignedComponents={assignedComponents}
        components={compatibleComponents}
        generatedRoom={activeGeneratedRoom}
        isSlotFull={activeSlotIsFull}
        open={Boolean(pickerSlotId)}
        regions={state.locationRegions || []}
        slot={activeSlot}
        onAddComponent={addComponent}
        onClose={closeSlotPicker}
        onRemoveComponent={removeComponent}
        onSelectRegion={(regionId) => setState((current) => ({ ...current, activeRegionId: regionId }))}
      />
    </>
  );
}

export function LocationRecapRail({ state, digest, generatedMapPreview }) {
  const slots = getLocationSlots();
  const regions = state.locationRegions || [];
  const activeRegion = regions.find((region) => region.id === state.activeRegionId);
  const activeRegionComponents = activeRegion ? getAssignedComponentsForRegion(state, activeRegion.id) : [];

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--right location-composer__rail--recap" aria-label="Location recap">
      <section className="cruor-composer-panel location-panel location-recap-panel">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Recap</p>
            <h2>Build</h2>
          </div>
          <strong className="location-component-count">{digest.filledSlots}/{digest.totalSlots}</strong>
        </div>

        <div className="location-recap-frame">
          <span>{state.context || "Context"}</span>
          <strong>{state.horror || "Horror"}</strong>
          <small>{Array.from(state.sourceAnchors || [])[0] || "Source"}</small>
        </div>

        <div className="location-recap-stack" aria-label="Slot recap">
          {slots.map((slot) => {
            const assigned = getAssignedComponentsForSlot(state, slot.id);
            const status = getSlotStatus(state, slot);
            return (
              <article className={cx("location-recap-slot", status !== "empty" && "is-filled")} key={slot.id}>
                <span>{slot.label}</span>
                <strong>{assigned[0] ? getComponentTitle(assigned[0]) : "Empty"}</strong>
              </article>
            );
          })}
        </div>

        <div className="location-recap-region">
          <span>Active Region</span>
          <strong>{activeRegion?.name || "No region selected"}</strong>
          <small>{activeRegionComponents.length} linked components · {generatedMapPreview?.regions?.length || regions.length} map regions</small>
        </div>
      </section>
    </aside>
  );
}
