import { useEffect, useMemo, useRef, useState } from "react";
import { SOURCE_ANCHORS } from "../../../crucible/crucible.sources-data.js";

const CONTEXT_OPTIONS = ["Crypt", "Chapel", "Cave", "Mine", "Ruins", "Noble House", "Village", "Forest"];
const HORROR_OPTIONS = ["Religious Horror", "Body Horror", "Gothic", "Folk Horror", "Psychological Horror", "Cosmic Horror", "Disease Horror"];
const INTRUSION_OPTIONS = ["Low", "Medium", "High"];

const CONTEXT_SUMMARY = {
  Crypt: "Tombs, thresholds, ossuaries.",
  Chapel: "Rites, relics, profaned altars.",
  Cave: "Depth, pressure, organic darkness.",
  Mine: "Industry, collapse, buried labor.",
  Ruins: "Broken history and unsafe memory.",
  "Noble House": "Domestic rot, inheritance, etiquette.",
  Village: "Community pressure and folk dread.",
  Forest: "Paths, predators, and old beliefs.",
};

const HORROR_SUMMARY = {
  "Religious Horror": "Sacred language turned invasive.",
  "Body Horror": "Matter, flesh, mutation, violation.",
  Gothic: "Decay, guilt, bloodlines, obsession.",
  "Folk Horror": "Customs, isolation, local law.",
  "Psychological Horror": "Memory, identity, perception.",
  "Cosmic Horror": "Scale, insignificance, revelation.",
  "Disease Horror": "Contagion, corruption, symptoms.",
};

const INTRUSION_SUMMARY = {
  Low: "Mostly atmospheric.",
  Medium: "Strong table pressure.",
  High: "Aggressive supernatural intrusion.",
};

function getSourceOptions() {
  return SOURCE_ANCHORS.filter((source) => source !== "Any Source").slice(0, 12);
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function optionSummary(option, summaries) {
  return summaries?.[option] || "Cruor source option.";
}

export function LocationSelectMenu({
  label,
  value,
  options = [],
  summaries = {},
  icon = "fa-solid fa-diamond",
  labels = {},
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const activeValue = value || options[0] || "";
  const getLabel = (option) => labels?.[option] || option;

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="location-field location-field--menu" ref={rootRef}>
      <span>{label}</span>
      <button
        className="location-frame-select-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <i className={icon} aria-hidden="true" />
        <span>
          <strong>{getLabel(activeValue)}</strong>
          <small>{optionSummary(activeValue, summaries)}</small>
        </span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>

      {open ? (
        <div className="location-frame-select-menu" role="listbox" aria-label={label}>
          {options.map((option) => {
            const active = option === activeValue;
            return (
              <button
                className={cx("location-frame-select-option", active && "is-active")}
                key={option}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange?.(option);
                  setOpen(false);
                }}
              >
                <i className={icon} aria-hidden="true" />
                <span>
                  <strong>{getLabel(option)}</strong>
                  <small>{optionSummary(option, summaries)}</small>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function LocationBriefPanel({ state, setState, mapRequest, draftControls, onContinue }) {
  const sourceOptions = useMemo(() => getSourceOptions(), []);
  const selectedSource = Array.isArray(state.sourceAnchors) ? state.sourceAnchors[0] || "" : state.sourceAnchors || "";
  const selectedHorror = Array.isArray(state.horrors) ? state.horrors[0] || state.horror || "" : state.horror || "";
  const regionCount = mapRequest?.requiredRegions?.length || 0;

  return (
    <section className="cruor-composer-panel location-panel location-brief-panel" aria-label="Location frame">
      <div className="location-panel-head location-panel-head--compact location-brief-panel__head">
        <div>
          <p className="location-kicker">Frame</p>
          <h2>Setup</h2>
        </div>
        <strong className="location-brief-panel__meta">{regionCount}</strong>
      </div>

      <div className="location-brief-panel__fields">
        <LocationSelectMenu
          label="Context"
          value={state.context || ""}
          options={CONTEXT_OPTIONS}
          summaries={CONTEXT_SUMMARY}
          icon="fa-solid fa-map-location-dot"
          onChange={(context) => setState((current) => ({ ...current, context }))}
        />

        <LocationSelectMenu
          label="Horror"
          value={selectedHorror}
          options={HORROR_OPTIONS}
          summaries={HORROR_SUMMARY}
          icon="fa-solid fa-skull"
          onChange={(horror) =>
            setState((current) => ({
              ...current,
              horror,
              horrors: new Set([horror]),
            }))
          }
        />

        <LocationSelectMenu
          label="Source"
          value={selectedSource}
          options={sourceOptions}
          icon="fa-solid fa-book-skull"
          onChange={(sourceAnchor) =>
            setState((current) => ({
              ...current,
              sourceAnchors: new Set([sourceAnchor]),
            }))
          }
        />
      </div>

      <details className="location-brief-panel__advanced">
        <summary>Advanced Setup</summary>
        <div className="location-field">
          <span>Intrusion</span>
          <div className="location-segment-row" role="group" aria-label="Intrusion level">
            {INTRUSION_OPTIONS.map((intrusion) => (
              <button
                className={cx("location-segment", state.intrusion === intrusion && "is-active")}
                key={intrusion}
                type="button"
                title={INTRUSION_SUMMARY[intrusion]}
                onClick={() => setState((current) => ({ ...current, intrusion }))}
              >
                {intrusion}
              </button>
            ))}
          </div>
        </div>

        <div className="location-map-request-card location-map-request-card--compact">
          <span>Map</span>
          <strong>{mapRequest?.mapType || state.context || "Location"}</strong>
          <small>{regionCount} regions</small>
        </div>

        {draftControls}
      </details>

      <button className="location-primary-action location-primary-action--wide" type="button" onClick={onContinue}>
        Compose Location
      </button>
    </section>
  );
}
