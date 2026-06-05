import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Eye, Gem, RotateCcw, Search, Skull, Sparkles } from "lucide-react";
import {
  assignComponentToSlot,
  removeComponentFromSlot,
} from "../model/location-composer-state.js";
import {
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

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getSlotIcon(slotId) {
  if (slotId === "horrorPremise") return Skull;
  if (slotId === "sensoryLayer") return Eye;
  if (slotId === "visibleAnomaly") return Sparkles;
  if (slotId === "hazard") return AlertTriangle;
  if (slotId === "clue") return Search;
  if (slotId === "encounterTwist") return RotateCcw;
  if (slotId === "reward") return Gem;
  return Sparkles;
}

export function LocationSlotRail({ state, setState, generatedMapPreview }) {
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
      <div className="location-slot-stack" aria-label="Location content slots">
        {slots.map((slot) => {
          const status = getSlotStatus(state, slot);
          const assigned = selectedBySlot[slot.id] || [];
          const active = state.activeSlot === slot.id;
          const Icon = getSlotIcon(slot.id);
          return (
            <button
              className={cx(
                "cruor-composer-slot location-map-slot-card",
                assigned.length > 0 ? "is-filled" : "is-empty",
                active && "is-active",
                status === "partial" && "is-partial",
              )}
              key={slot.id}
              type="button"
              aria-label={`Focus ${slot.label}`}
              aria-pressed={active}
              onClick={() => focusSlot(slot.id)}
            >
              <span className="location-map-slot-card__head">
                <span>
                  <Icon aria-hidden="true" />
                  {slot.label}
                </span>
                <strong>{assigned.length || "—"}</strong>
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
