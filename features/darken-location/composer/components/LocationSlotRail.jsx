import { useCallback, useMemo, useState } from "react";
import {
  assignComponentToSlot,
  removeComponentFromSlot,
} from "../model/location-composer-state.js";
import {
  getAssignedComponentsForSlot,
  getComponentsForSlot,
  getLocationSlots,
  getSlotCapacityLabel,
  getSlotFilledCount,
  getSlotStatus,
} from "../model/location-composer-selectors.js";
import {
  getGeneratedRoomForRegion,
} from "../model/location-composer-map-preview.js";
import { LocationComponentPickerModal } from "./LocationComponentPickerModal.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getComponentTitle(component) {
  return component?.title || component?.name || "Untitled Component";
}

function getComponentSummary(component) {
  return component?.summary || component?.description || component?.text || component?.effect || "";
}

export function LocationSlotRail({ state, setState, onOpenMapGenerator, snapshot, generatedMapPreview }) {
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

  const selectedBySlot = useMemo(() => {
    return slots.reduce((acc, slot) => {
      acc[slot.id] = getAssignedComponentsForSlot(state, slot.id);
      return acc;
    }, {});
  }, [slots, state]);

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
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--right location-composer__rail--current" aria-label="Current location slot">
      <section className="cruor-composer-panel location-panel location-current-slot-panel">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Current Slot</p>
            <h2>{activeSlot?.label || "Slot"}</h2>
          </div>
          <strong className="location-component-count">{activeSlotFilled}/{activeSlot?.max || 1}</strong>
        </div>

        <label className="location-field location-field--select location-slot-switcher">
          <span>Slot</span>
          <select
            className="cruor-composer-control location-select"
            value={activeSlot?.id || ""}
            onChange={(event) => chooseSlot(event.target.value)}
          >
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>

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
                className="cruor-composer-control location-icon-btn location-icon-btn--subtle"
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
            className="cruor-composer-control location-primary-action"
            type="button"
            onClick={() => openSlotPicker(activeSlot?.id)}
          >
            {assignedComponents.length ? "Change" : "Choose"}
          </button>
          <button className="cruor-composer-control location-icon-btn" type="button" onClick={() => onOpenMapGenerator?.(snapshot)} aria-label="Open Map Workspace">
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <div className="location-slot-progress" aria-label="Slot progress">
          {slots.map((slot) => {
            const status = getSlotStatus(state, slot);
            const assigned = selectedBySlot[slot.id] || [];
            return (
              <button
                className={cx(
                  "location-slot-progress__item",
                  activeSlot?.id === slot.id && "is-active",
                  status === "full" && "is-filled",
                  status === "partial" && "is-partial",
                )}
                key={slot.id}
                type="button"
                title={`${slot.label}: ${getSlotCapacityLabel(state, slot)}`}
                onClick={() => chooseSlot(slot.id)}
              >
                <span>{slot.label}</span>
                <strong>{assigned.length}</strong>
              </button>
            );
          })}
        </div>
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
    </aside>
  );
}
