import { useCallback } from "react";
import {
  assignComponentToSlot,
  moveAssignmentToRegion,
  removeComponentFromSlot,
} from "../model/location-composer-state.js";
import {
  getAssignedComponentsForRegion,
  getAssignedComponentsForSlot,
  getComponentAssignment,
  getComponentsForSlot,
  getLocationSlots,
  getRegionById,
  getRegionDetailRows,
  getRegionStageSummary,
  getRegionTemplatesForState,
  getSlotCapacityLabel,
  getSlotFilledCount,
  getSlotStatus,
  isComponentAssignedToSlot,
} from "../model/location-composer-selectors.js";
import {
  getGeneratedRoomForRegion,
  getGeneratedRoomForRegionIndex,
  getGeneratedRoomSurfaceLabel,
} from "../model/location-composer-map-preview.js";
import { LOCATION_REGION_TEMPLATES } from "../../../crucible/crucible.location-regions.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function AssignedSlotStack({ state, slot, setState }) {
  const assigned = getAssignedComponentsForSlot(state, slot.id);
  const regions = state.locationRegions || [];

  if (!assigned.length) {
    return <p className="location-empty location-empty--action">No component assigned to this slot yet. Pick a component below, then use Add to Target or a region chip.</p>;
  }

  return (
    <div className="location-assigned-stack" aria-label="Assigned components">
      {assigned.map((component) => (
        <article className="location-assigned-card" key={`${slot.id}-${component.id}`}>
          <div>
            <span>{component.type}</span>
            <strong>{component.title}</strong>
            <small>{getRegionById(state, component.assignment.regionId)?.name || "No region linked"}</small>
          </div>
          <div className="location-assigned-card__actions">
            <div className="location-region-mini-picker" aria-label={`Move ${component.title} to region`}>
              {regions.slice(0, 4).map((region, index) => (
                <button
                  className={cx(
                    "cruor-composer-control location-region-mini-btn",
                    component.assignment.regionId === region.id && "is-active",
                  )}
                  key={region.id}
                  type="button"
                  title={`Attach to ${region.name}`}
                  onClick={() => setState((current) => moveAssignmentToRegion(current, component.id, region.id))}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              className="cruor-composer-control location-component-card__action"
              type="button"
              onClick={() => setState((current) => removeComponentFromSlot(current, component.id, slot.id))}
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function RegionFocusPanel({ state, setState, generatedMapPreview }) {
  const activeRegion = getRegionById(state, state.activeRegionId);
  const generatedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const regionComponents = activeRegion ? getAssignedComponentsForRegion(state, activeRegion.id) : [];
  const detailRows = activeRegion ? getRegionDetailRows(activeRegion) : [];
  const summary = activeRegion ? getRegionStageSummary(state, activeRegion.id) : null;

  return (
    <section className="cruor-composer-panel location-panel location-region-panel">
      <div className="location-panel-head">
        <div>
          <p className="location-kicker">Region Focus</p>
          <h2>{activeRegion?.name || "No region selected"}</h2>
        </div>
        {summary ? <strong className="location-region-count">{summary.assignedCount}</strong> : null}
      </div>

      {activeRegion ? (
        <>
          <p>{activeRegion.role} · {activeRegion.size || "Variable"} · {activeRegion.shape || "open region"}</p>

          {generatedRoom ? (
            <div className="location-generated-room-card" aria-label="Generated room data">
              <div>
                <span>Generated Room → Session Insert</span>
                <strong>Room {generatedRoom.number || "—"}</strong>
                <small>{generatedRoom.name} · {generatedRoom.graphRole || generatedRoom.role}</small>
              </div>
              <div className="location-generated-room-metrics">
                <span>{generatedRoom.shape || "shape"}</span>
                <span>level {generatedRoom.level ?? 0}</span>
                <span>{getGeneratedRoomSurfaceLabel(generatedRoom)}</span>
              </div>
            </div>
          ) : (
            <div className="location-generated-room-card location-generated-room-card--fallback" aria-label="Region-only output data">
              <div>
                <span>Region → Session Insert</span>
                <strong>Region only</strong>
                <small>The output uses this region even without generated room geometry.</small>
              </div>
            </div>
          )}

          <div className="location-region-switcher" aria-label="Choose active region">
            {(state.locationRegions || []).map((region, index) => {
              const room = getGeneratedRoomForRegionIndex(generatedMapPreview, region.id, index);
              return (
                <button
                  className={cx("cruor-composer-control location-region-switch", state.activeRegionId === region.id && "is-active", room && "has-generated-room")}
                  key={region.id}
                  type="button"
                  onClick={() => setState((current) => ({ ...current, activeRegionId: region.id }))}
                >
                  <span>{room?.number ? String(room.number).padStart(2, "0") : String(index + 1).padStart(2, "0")}</span>
                  <strong>{region.name}</strong>
                </button>
              );
            })}
          </div>

          <div className="location-region-details">
            {detailRows.map((row) => (
              <article className="location-region-detail" key={row.label}>
                <span>{row.label}</span>
                <p>{row.value}</p>
              </article>
            ))}
          </div>

          <div className="location-region-components">
            <span>Attached Components</span>
            {regionComponents.length ? (
              regionComponents.map((component) => (
                <article className="location-region-component" key={`${component.assignment.slotId}-${component.id}`}>
                  <strong>{component.slot?.label || component.assignment.slotId}</strong>
                  <p>{component.title}</p>
                </article>
              ))
            ) : (
              <p className="location-empty location-empty--action">No components attached yet. Use the slot panel or a component region chip to send material here.</p>
            )}
          </div>
        </>
      ) : (
        <p className="location-empty location-empty--action">Choose a map region to inspect generated room data and decide where the next component should land.</p>
      )}
    </section>
  );
}

export function LocationSlotRail({ state, setState, selectedComponents, onOpenMapGenerator, snapshot, generatedMapPreview }) {
  const slots = getLocationSlots();
  const activeSlot = slots.find((slot) => slot.id === state.activeSlot) || slots[0];
  const compatibleComponents = getComponentsForSlot(activeSlot?.id, state);
  const activeRegion = state.locationRegions?.find((region) => region.id === state.activeRegionId);
  const activeGeneratedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const regionTemplates = getRegionTemplatesForState(state);
  const activeSlotFilled = getSlotFilledCount(state, activeSlot?.id);
  const activeSlotIsFull = activeSlotFilled >= (activeSlot?.max || 1);

  const addComponent = useCallback((component) => {
    setState((current) => assignComponentToSlot(current, component, activeSlot, current.activeRegionId));
  }, [activeSlot, setState]);

  const assignComponentToRegion = useCallback((component, regionId) => {
    setState((current) => {
      const alreadyAssigned = getComponentAssignment(current, component.id);
      if (alreadyAssigned?.slotId === activeSlot?.id) {
        return moveAssignmentToRegion(current, component.id, regionId);
      }
      return assignComponentToSlot({ ...current, activeRegionId: regionId }, component, activeSlot, regionId);
    });
  }, [activeSlot, setState]);

  const removeComponent = useCallback((componentId) => {
    setState((current) => removeComponentFromSlot(current, componentId, activeSlot?.id));
  }, [activeSlot?.id, setState]);

  const regenerateRegions = useCallback(() => {
    setState((current) => {
      const templates = getRegionTemplatesForState(current);
      const nextRegions = (templates.length ? templates : LOCATION_REGION_TEMPLATES).slice(0, 4).map((region, index) => ({ ...region, id: region.templateId || region.id || `location-region-${index + 1}` }));
      return { ...current, locationRegions: nextRegions, activeRegionId: nextRegions[0]?.id || "" };
    });
  }, [setState]);

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--right" aria-label="Location slots and components">
      <section className="cruor-composer-panel location-panel">
        <div className="location-panel-head">
          <div><p className="location-kicker">Location Slots</p><h2>Attach horror to the map.</h2></div>
          <button className="cruor-composer-control location-icon-btn" type="button" onClick={() => onOpenMapGenerator?.(snapshot)} aria-label="Open Map Workspace">
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <div className="location-slot-list">
          {slots.map((slot) => {
            const filledCount = getSlotFilledCount(state, slot.id);
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
                <small>{filledCount ? "Assigned to this build." : slot.description || "Choose a component for this part of the location."}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cruor-composer-panel location-panel">
        <p className="location-kicker">Active Slot</p>
        <h2>{activeSlot?.label || "Slot"}</h2>
        <p>{activeSlot?.description || "Select a slot to browse compatible components."}</p>
        <div className="location-slot-target-note">
          <span>Next assignment</span>
          <strong>{activeSlot?.label || "Slot"} → {activeRegion?.name || "No region selected"}</strong>
          <small>{activeSlotIsFull ? "This slot is full: adding a new component will replace the current one." : "Add to Target uses this region unless you choose a numbered region chip."}</small>
        </div>

        <AssignedSlotStack state={state} slot={activeSlot} setState={setState} />

        <div className="location-component-toolbar">
          <span>{activeSlotIsFull ? "Adding will replace the current choice" : "Compatible Components"}</span>
          <strong>{compatibleComponents.length}</strong>
        </div>

        <div className="location-component-list">
          {compatibleComponents.length ? compatibleComponents.map((component) => {
            const selected = isComponentAssignedToSlot(state, component.id, activeSlot.id);
            const assignment = getComponentAssignment(state, component.id);
            const selectedRegionId = assignment?.regionId || state.activeRegionId;
            return (
              <article className={cx("cruor-composer-card location-component-card", selected && "is-active")} key={component.id}>
                <div>
                  <div className="location-component-card__meta">
                    <span>{component.type}</span>
                    <em>{selected ? "Assigned" : activeSlotIsFull ? "Will replace" : "Available"}</em>
                  </div>
                  <strong>{component.title}</strong>
                  <p>{component.summary}</p>
                  <small>{assignment ? `Linked to ${getRegionById(state, assignment.regionId)?.name || "no region"} · ${assignment.slotId}` : `Default target: ${activeRegion?.name || "No region selected"}`}</small>
                </div>

                <div className="location-component-card__regions" aria-label={`Assign ${component.title} to a region`}>
                  <span>Assign Region</span>
                  <div>
                    {(state.locationRegions || []).slice(0, 4).map((region, index) => (
                      <button
                        className={cx("cruor-composer-control location-region-inline-btn", selectedRegionId === region.id && "is-active")}
                        key={region.id}
                        type="button"
                        title={selected ? `Move to ${region.name}` : `Add to ${region.name}`}
                        onClick={() => assignComponentToRegion(component, region.id)}
                      >
                        R{index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="cruor-composer-control location-component-card__action"
                  type="button"
                  onClick={() => (selected ? removeComponent(component.id) : addComponent(component))}
                >
                  {selected ? "Remove" : activeSlotIsFull ? "Replace Slot" : "Add to Target"}
                </button>
              </article>
            );
          }) : <p className="location-empty location-empty--action">No compatible components for this slot/source mix. Try another slot, source anchor, or horror direction.</p>}
        </div>

        <div className="location-active-region location-target-card">
          <span>Default Region Target</span>
          <strong>{activeRegion?.name || "No region selected"}</strong>
          <small>{activeGeneratedRoom ? `Add to Target sends the active slot to Room ${activeGeneratedRoom.number || "—"} · ${getGeneratedRoomSurfaceLabel(activeGeneratedRoom)}` : "Add to Target sends the active slot here by default."}</small>
          <div className="location-target-card__switcher" aria-label="Choose default target region">
            {(state.locationRegions || []).slice(0, 4).map((region, index) => (
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
          <button className="cruor-composer-control" type="button" onClick={regenerateRegions}>Regenerate Regions</button>
          <small>{regionTemplates.length} matching region templates available.</small>
        </div>
      </section>

      <RegionFocusPanel state={state} setState={setState} generatedMapPreview={generatedMapPreview} />
    </aside>
  );
}
