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

function getSlotIcon(slotId) {
  if (slotId === "horrorPremise") return "fa-skull";
  if (slotId === "sensoryLayer") return "fa-eye";
  if (slotId === "visibleAnomaly") return "fa-wand-sparkles";
  if (slotId === "hazard") return "fa-triangle-exclamation";
  if (slotId === "clue") return "fa-magnifying-glass";
  if (slotId === "encounterTwist") return "fa-arrows-spin";
  if (slotId === "reward") return "fa-gem";
  return "fa-diamond";
}

export function LocationSlotRail({ state, setState, onOpenMapGenerator, snapshot, generatedMapPreview }) {
  const slots = getLocationSlots();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const activeSlotId = state.activeSlot || slots[0]?.id;
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

  const focusSlot = useCallback((slotId) => {
    setState((current) => ({ ...current, activeSlot: slotId }));
    setDrawerOpen(true);
  }, [setState]);

  const addComponent = useCallback((component) => {
    if (!activeSlot) return;
    setState((current) => assignComponentToSlot(current, component, activeSlot, current.activeRegionId));
    setDrawerOpen(true);
  }, [activeSlot, setState]);

  const removeComponent = useCallback((componentId) => {
    if (!activeSlot) return;
    setState((current) => removeComponentFromSlot(current, componentId, activeSlot.id));
  }, [activeSlot, setState]);

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--left location-composer__rail--picker location-map-slot-rail" aria-label="Location slots and components">
      <section className="cruor-composer-panel location-panel location-slot-panel location-slot-panel--picker">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Build</p>
            <h2>Slots</h2>
          </div>
          <button className="cruor-composer-control location-icon-btn" type="button" onClick={() => onOpenMapGenerator?.(snapshot)} aria-label="Open Map Workspace">
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <div className="location-slot-stack" aria-label="Location content slots">
          {slots.map((slot) => {
            const status = getSlotStatus(state, slot);
            const assigned = selectedBySlot[slot.id] || [];
            const active = state.activeSlot === slot.id;
            return (
              <button
                className={cx(
                  "cruor-composer-slot location-map-slot-card",
                  active && "is-active",
                  status === "full" && "is-filled",
                  status === "partial" && "is-partial",
                )}
                key={slot.id}
                type="button"
                aria-pressed={active}
                onClick={() => focusSlot(slot.id)}
              >
                <span className="location-map-slot-card__head">
                  <span>
                    <i className={`fa-solid ${getSlotIcon(slot.id)}`} aria-hidden="true" />
                    {slot.label}
                  </span>
                  <strong>{getSlotCapacityLabel(state, slot)}</strong>
                </span>
                <span className="location-map-slot-card__body">
                  {assigned[0] ? (
                    <>
                      <strong>{assigned[0].title || assigned[0].name}</strong>
                      <em>{assigned[0].summary || assigned[0].description || "Assigned component"}</em>
                    </>
                  ) : (
                    <>
                      <strong>Empty Slot</strong>
                      <em>{slot.description || "Pick a component for this part of the location."}</em>
                    </>
                  )}
                </span>
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
        open={drawerOpen}
        regions={state.locationRegions || []}
        slot={activeSlot}
        onAddComponent={addComponent}
        onClose={() => setDrawerOpen(false)}
        onRemoveComponent={removeComponent}
        onSelectRegion={(regionId) => setState((current) => ({ ...current, activeRegionId: regionId }))}
      />
    </aside>
  );
}
