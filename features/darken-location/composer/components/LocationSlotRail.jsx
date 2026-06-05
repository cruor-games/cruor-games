import { useMemo } from "react";
import { AlertTriangle, Eye, Gem, RotateCcw, Search, Skull, Sparkles } from "lucide-react";
import {
  getAssignedComponentsForSlot,
  getLocationSlots,
  getSlotStatus,
} from "../model/location-composer-selectors.js";

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

export function LocationSlotRail({ state, setState, onFocusSlot }) {
  const slots = useMemo(() => getLocationSlots(), []);
  const activeSlotId = state.activeSlot || slots[0]?.id;

  const selectedBySlot = useMemo(() => {
    return slots.reduce((acc, slot) => {
      acc[slot.id] = getAssignedComponentsForSlot(state, slot.id);
      return acc;
    }, {});
  }, [slots, state]);

  function focusSlot(slotId) {
    setState((current) => ({ ...current, activeSlot: slotId }));
    onFocusSlot?.(slotId);
  }

  return (
    <aside
      className="cruor-composer-rail location-composer__rail location-composer__rail--left location-composer__rail--picker location-map-slot-rail"
      aria-label="Location slots"
    >
      <div className="location-slot-stack" aria-label="Location content slots">
        {slots.map((slot, index) => {
          const status = getSlotStatus(state, slot);
          const assigned = selectedBySlot[slot.id] || [];
          const active = activeSlotId === slot.id;
          const Icon = getSlotIcon(slot.id);
          return (
            <button
              className={cx(
                "cruor-composer-slot location-map-slot-card",
                index < 4 ? "is-right" : "is-left",
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
    </aside>
  );
}
