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

export function LocationSlotRail({ state, setState, onOpenMapGenerator, snapshot, generatedMapPreview }) {
  const slots = getLocationSlots();
  const [pickerSlotId, setPickerSlotId] = useState("");

  const activeSlotId = pickerSlotId || state.activeSlot || slots[0]?.id;
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

  const openSlotPicker = useCallback((slotId) => {
    setState((current) => ({ ...current, activeSlot: slotId }));
    setPickerSlotId(slotId);
  }, [setState]);

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
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--right location-composer__rail--picker" aria-label="Location slots and components">
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

        <div className="location-slot-list location-slot-list--picker">
          {slots.map((slot) => {
            const status = getSlotStatus(state, slot);
            const assigned = selectedBySlot[slot.id] || [];
            return (
              <button
                className={cx("cruor-composer-slot location-slot location-slot-picker-trigger", state.activeSlot === slot.id && "is-active", status === "full" && "is-filled", status === "partial" && "is-partial")}
                key={slot.id}
                type="button"
                onClick={() => openSlotPicker(slot.id)}
              >
                <span>{slot.label}</span>
                <strong>{getSlotCapacityLabel(state, slot)}</strong>
                {assigned[0] ? <em>{assigned[0].title || assigned[0].name}</em> : <em>Pick option</em>}
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
