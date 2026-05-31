import { SOURCE_ANCHORS } from "../../../crucible/crucible.sources-data.js";

const CONTEXT_OPTIONS = ["Crypt", "Chapel", "Cave", "Mine", "Ruins", "Noble House", "Village", "Forest"];
const HORROR_OPTIONS = ["Religious Horror", "Body Horror", "Gothic", "Folk Horror", "Psychological Horror", "Cosmic Horror", "Disease Horror"];
const INTRUSION_OPTIONS = ["Low", "Medium", "High"];

export function LocationBriefPanel({ state, setState, mapRequest, draftControls }) {
  const sourceOptions = SOURCE_ANCHORS.filter((source) => source !== "Any Source").slice(0, 12);
  const selectedSource = Array.isArray(state.sourceAnchors) ? state.sourceAnchors[0] || "" : state.sourceAnchors || "";
  const selectedHorror = Array.isArray(state.horrors) ? state.horrors[0] || state.horror || "" : state.horror || "";

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--left" aria-label="Location frame">
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

        <label className="location-field location-field--select">
          <span>Context</span>
          <select
            className="cruor-composer-control location-select"
            value={state.context || ""}
            onChange={(event) => setState((current) => ({ ...current, context: event.target.value }))}
          >
            {CONTEXT_OPTIONS.map((context) => (
              <option key={context} value={context}>
                {context}
              </option>
            ))}
          </select>
        </label>

        <label className="location-field location-field--select">
          <span>Horror</span>
          <select
            className="cruor-composer-control location-select"
            value={selectedHorror}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                horror: event.target.value,
                horrors: event.target.value ? [event.target.value] : [],
              }))
            }
          >
            <option value="">Choose horror direction</option>
            {HORROR_OPTIONS.map((horror) => (
              <option key={horror} value={horror}>
                {horror}
              </option>
            ))}
          </select>
        </label>

        <label className="location-field location-field--select">
          <span>Source</span>
          <select
            className="cruor-composer-control location-select"
            value={selectedSource}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                sourceAnchors: event.target.value ? [event.target.value] : [],
              }))
            }
          >
            <option value="">Choose source anchor</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

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
