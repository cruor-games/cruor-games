import { toArray } from "../model/location-composer-state.js";
import { getLocationSlots, getRegionById } from "../model/location-composer-selectors.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function LocationWorkflowGuide({ state, digest, mapRequest }) {
  const slots = getLocationSlots();
  const activeSlot = slots.find((slot) => slot.id === state.activeSlot) || slots[0];
  const activeRegion = getRegionById(state, state.activeRegionId);
  const selectedSources = toArray(state.sourceAnchors);
  const selectedHorrors = toArray(state.horrors);
  const steps = [
    {
      id: "source",
      label: "Source",
      value: selectedSources[0] || selectedHorrors[0] || "Choose source pressure",
      status: selectedSources.length || selectedHorrors.length ? "set" : "open",
    },
    {
      id: "slot",
      label: "Slot",
      value: activeSlot?.label || "Choose a slot",
      status: state.activeSlot ? "set" : "open",
    },
    {
      id: "region",
      label: "Region",
      value: activeRegion?.name || "Choose target region",
      status: activeRegion ? "set" : "open",
    },
    {
      id: "map",
      label: "Map",
      value: `${mapRequest.requiredRegions.length || 0} rooms · ${digest.filledSlots}/${digest.totalSlots} slots`,
      status: mapRequest.requiredRegions.length ? "set" : "open",
    },
  ];

  return (
    <section className="location-workflow-guide" aria-label="Composer workflow">
      {steps.map((step, index) => (
        <article className={cx("location-workflow-step", `is-${step.status}`)} key={step.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{step.label}</strong>
            <small>{step.value}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
