import { useEffect, useMemo, useRef, useState } from "react";
import { SOURCE_ANCHORS } from "../../../crucible/crucible.sources-data.js";

const CONTEXT_OPTIONS = ["Crypt", "Chapel", "Cave", "Mine", "Ruins", "Noble House", "Village", "Forest"];
const HORROR_OPTIONS = ["Religious Horror", "Body Horror", "Gothic", "Folk Horror", "Psychological Horror", "Cosmic Horror", "Disease Horror"];
const INTRUSION_OPTIONS = ["Low", "Medium", "High"];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toChoiceArray(value) {
  if (value instanceof Set) return Array.from(value);
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

function getOptionValue(option) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option) {
  return typeof option === "string" ? option : option.label || option.value;
}

function LocationChoiceField({ icon = "fa-circle-dot", label, meta, onChange, options, placeholder = "Choose option", value }) {
  const [open, setOpen] = useState(false);
  const fieldRef = useRef(null);
  const selectedOption = useMemo(
    () => options.find((option) => String(getOptionValue(option)) === String(value)),
    [options, value],
  );
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : placeholder;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!fieldRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="location-field location-choice-field" ref={fieldRef}>
      <span>{label}</span>
      <button
        className="cruor-composer-control location-choice-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
        <strong>{selectedLabel}</strong>
        {meta ? <small>{meta}</small> : null}
      </button>
      {open ? (
        <div className="location-choice-menu" role="listbox" aria-label={label}>
          {options.map((option) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            const active = String(optionValue) === String(value);
            return (
              <button
                className={cx("location-choice-option", active && "is-active")}
                key={optionValue}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(optionValue);
                  setOpen(false);
                }}
              >
                <i className={`fa-solid ${icon}`} aria-hidden="true" />
                <span>
                  <strong>{optionLabel}</strong>
                  {typeof option !== "string" && option.description ? <small>{option.description}</small> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function LocationBriefPanel({ state, setState, mapRequest, draftControls }) {
  const sourceOptions = SOURCE_ANCHORS.filter((source) => source !== "Any Source").slice(0, 12);
  const selectedSource = toChoiceArray(state.sourceAnchors)[0] || "";
  const selectedHorror = toChoiceArray(state.horrors)[0] || state.horror || "";

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--left location-map-frame-rail" aria-label="Location frame">
      <section className="cruor-composer-panel location-panel location-brief-panel">
        <div className="location-panel-head location-panel-head--compact location-brief-panel__head">
          <div>
            <p className="location-kicker">Frame</p>
            <h2>Location</h2>
          </div>
          <strong className="location-brief-panel__meta">{mapRequest.requiredRegions.length || 0} regions</strong>
        </div>

        {draftControls ? (
          <div className="location-brief-panel__draft">
            {draftControls}
          </div>
        ) : null}

        <div className="location-brief-panel__fields">
          <LocationChoiceField
            icon="fa-dungeon"
            label="Context"
            value={state.context || ""}
            options={CONTEXT_OPTIONS}
            onChange={(context) => setState((current) => ({ ...current, context }))}
          />

          <LocationChoiceField
            icon="fa-skull"
            label="Horror"
            value={selectedHorror}
            placeholder="Choose horror direction"
            options={HORROR_OPTIONS}
            onChange={(horror) =>
              setState((current) => ({
                ...current,
                horror,
                horrors: horror ? [horror] : [],
              }))
            }
          />

          <LocationChoiceField
            icon="fa-book-dead"
            label="Source"
            value={selectedSource}
            placeholder="Choose source anchor"
            options={sourceOptions}
            onChange={(source) =>
              setState((current) => ({
                ...current,
                sourceAnchors: source ? [source] : [],
              }))
            }
          />
        </div>

        <div className="location-field">
          <span>Intrusion</span>
          <div className="location-segment-row" role="list" aria-label="Intrusion level">
            {INTRUSION_OPTIONS.map((intrusion) => (
              <button
                className={`cruor-composer-control location-segment${state.intrusion === intrusion ? " is-active" : ""}`}
                key={intrusion}
                type="button"
                onClick={() => setState((current) => ({ ...current, intrusion }))}
              >
                {intrusion}
              </button>
            ))}
          </div>
        </div>

        <div className="location-map-request-card location-map-request-card--compact">
          <span>Map</span>
          <strong>{mapRequest.mapType}</strong>
        </div>
      </section>
    </aside>
  );
}
