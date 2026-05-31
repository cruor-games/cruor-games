import { useCallback } from "react";
import {
  assignComponentToSlot,
  removeComponentFromSlot,
} from "../model/location-composer-state.js";
import {
  getAssignedComponentsForSlot,
  getComponentsForSlot,
  getLocationSlots,
  getRegionById,
  getSlotCapacityLabel,
  getSlotFilledCount,
  getSlotStatus,
  isComponentAssignedToSlot,
} from "../model/location-composer-selectors.js";
import {
  getGeneratedRoomForRegion,
} from "../model/location-composer-map-preview.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function AssignedSlotStack({ state, slot, setState }) {
  const assigned = getAssignedComponentsForSlot(state, slot.id);

  if (!assigned.length) {
    return null;
  }

  return (
    <div className="location-assigned-stack location-assigned-stack--compact" aria-label="Assigned components">
      {assigned.map((component) => (
        <article className="location-assigned-card location-assigned-card--compact" key={`${slot.id}-${component.id}`}>
          <div>
            <span>{component.type}</span>
            <strong>{component.title}</strong>
            <small>{getRegionById(state, component.assignment.regionId)?.name || "No region linked"}</small>
          </div>
          <button
            className="cruor-composer-control location-component-card__action"
            type="button"
            onClick={() => setState((current) => removeComponentFromSlot(current, component.id, slot.id))}
          >
            Remove
          </button>
        </article>
      ))}
    </div>
  );
}

export function LocationSlotRail({ state, setState, onOpenMapGenerator, snapshot, generatedMapPreview }) {
  const slots = getLocationSlots();
  const activeSlot = slots.find((slot) => slot.id === state.activeSlot) || slots[0];
  const compatibleComponents = getComponentsForSlot(activeSlot?.id, state);
  const activeRegion = state.locationRegions?.find((region) => region.id === state.activeRegionId);
  const activeGeneratedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const activeSlotFilled = getSlotFilledCount(state, activeSlot?.id);
  const activeSlotIsFull = activeSlotFilled >= (activeSlot?.max || 1);
  const regionOptions = (state.locationRegions || []).slice(0, 4);

  const addComponent = useCallback((component) => {
    setState((current) => assignComponentToSlot(current, component, activeSlot, current.activeRegionId));
  }, [activeSlot, setState]);

  const removeComponent = useCallback((componentId) => {
    setState((current) => removeComponentFromSlot(current, componentId, activeSlot?.id));
  }, [activeSlot?.id, setState]);

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--right location-composer__rail--polished" aria-label="Location slots and components">
      <section className="cruor-composer-panel location-panel location-slot-panel location-slot-panel--polished">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Build</p>
            <h2>Slots</h2>
          </div>
          <button className="cruor-composer-control location-icon-btn" type="button" onClick={() => onOpenMapGenerator?.(snapshot)} aria-label="Open Map Workspace">
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <div className="location-slot-list location-slot-list--compact location-slot-list--polished">
          {slots.map((slot) => {
            const status = getSlotStatus(state, slot);
            return (
              <button
                className={cx("cruor-composer-slot location-slot", state.activeSlot === slot.id && "is-active", status === "full" && "is-filled", status === "partial" && "is-partial")}
                key={slot.id}
                type="button"
                onClick={() => setState((current) => ({ ...current, activeSlot: slot.id }))}
              >
                <span>{slot.label}</span>
                <strong>{getSlotCapacityLabel(state, slot)}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cruor-composer-panel location-panel location-active-slot-panel location-active-slot-panel--polished">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Slot</p>
            <h2>{activeSlot?.label || "Slot"}</h2>
          </div>
          <strong className="location-component-count">{activeSlotFilled}/{activeSlot?.max || 1}</strong>
        </div>

        <div className="location-slot-target-note location-slot-target-note--compact location-slot-target-note--polished">
          <span>Target</span>
          <strong>{activeRegion?.name || "No region selected"}</strong>
          {activeGeneratedRoom ? <small>Room {activeGeneratedRoom.number || "—"}</small> : null}
        </div>

        <div className="location-target-card__switcher location-target-card__switcher--compact" aria-label="Choose default target region">
          {regionOptions.map((region, index) => (
            <button
              className={cx("cruor-composer-control location-region-inline-btn", state.activeRegionId === region.id && "is-active")}
              key={region.id}
              type="button"
              title={`Set ${region.name} as default target`}
              onClick={() => setState((current) => ({ ...current, activeRegionId: region.id }))}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <AssignedSlotStack state={state} slot={activeSlot} setState={setState} />

        <div className="location-component-list location-component-list--compact location-component-list--polished">
          {compatibleComponents.length ? compatibleComponents.map((component) => {
            const selected = isComponentAssignedToSlot(state, component.id, activeSlot.id);
            return (
              <article className={cx("cruor-composer-card location-component-card", selected && "is-active")} key={component.id}>
                <div>
                  <div className="location-component-card__meta">
                    <span>{component.type}</span>
                    <em>{selected ? "Assigned" : activeSlotIsFull ? "Replace" : "Available"}</em>
                  </div>
                  <strong>{component.title}</strong>
                </div>

                <button
                  className="cruor-composer-control location-component-card__action"
                  type="button"
                  onClick={() => (selected ? removeComponent(component.id) : addComponent(component))}
                >
                  {selected ? "Remove" : activeSlotIsFull ? "Replace" : "Add"}
                </button>
              </article>
            );
          }) : <p className="location-empty location-empty--quiet">No compatible components.</p>}
        </div>
      </section>
    </aside>
  );
}
