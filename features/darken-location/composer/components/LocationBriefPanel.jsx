import { toggleSetValue, toArray } from "../model/location-composer-state.js";
import { describeSourceAnchor } from "../model/location-composer-selectors.js";
import { SOURCE_ANCHORS } from "../../../crucible/crucible.sources-data.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const CONTEXT_OPTIONS = ["Crypt", "Chapel", "Cave", "Mine", "Ruins", "Noble House", "Village", "Forest"];
const HORROR_OPTIONS = ["Religious Horror", "Body Horror", "Gothic", "Folk Horror", "Psychological Horror", "Cosmic Horror", "Disease Horror"];
const INTRUSION_OPTIONS = ["Low", "Medium", "High"];

export function LocationBriefPanel({ state, setState, mapRequest }) {
  const selectedSources = toArray(state.sourceAnchors);
  const selectedHorrors = toArray(state.horrors);
  const visibleSources = SOURCE_ANCHORS.filter((source) => source !== "Any Source").slice(0, 8);

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--left" aria-label="Location frame">
      <section className="cruor-composer-panel location-panel">
        <p className="location-kicker">Location Frame</p>
        <h2>Darken the place before the party enters.</h2>
        <p>Start with context and source pressure. These choices filter the slots, regions, map request, and final output.</p>

        <div className="location-field">
          <span>Context</span>
          <div className="location-chip-grid" role="list" aria-label="Location contexts">
            {CONTEXT_OPTIONS.map((context) => (
              <button className={cx("cruor-composer-chip location-chip", state.context === context && "is-active")} key={context} type="button" onClick={() => setState((current) => ({ ...current, context }))}>
                {context}
              </button>
            ))}
          </div>
        </div>

        <div className="location-field">
          <span>Horror Direction</span>
          <div className="location-chip-grid" role="list" aria-label="Horror directions">
            {HORROR_OPTIONS.map((horror) => (
              <button
                className={cx("cruor-composer-chip location-chip", selectedHorrors.includes(horror) && "is-active")}
                key={horror}
                type="button"
                onClick={() => setState((current) => ({ ...current, horror, horrors: toggleSetValue(current.horrors, horror) }))}
              >
                {horror}
              </button>
            ))}
          </div>
        </div>

        <div className="location-field">
          <span>Source Anchors</span>
          <div className="location-source-stack" aria-label="Source anchors">
            {visibleSources.map((source) => (
              <button
                className={cx("cruor-composer-card location-source-card", selectedSources.includes(source) && "is-active")}
                key={source}
                type="button"
                onClick={() => setState((current) => ({ ...current, sourceAnchors: toggleSetValue(current.sourceAnchors, source) }))}
              >
                <strong>{source}</strong>
                <small>{describeSourceAnchor(source) || "This source steers component tone, region text, and map request metadata."}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="location-field">
          <span>Intrusion</span>
          <div className="location-segment-row" role="list" aria-label="Intrusion level">
            {INTRUSION_OPTIONS.map((intrusion) => (
              <button className={cx("cruor-composer-control location-segment", state.intrusion === intrusion && "is-active")} key={intrusion} type="button" onClick={() => setState((current) => ({ ...current, intrusion }))}>
                {intrusion}
              </button>
            ))}
          </div>
        </div>

        <div className="location-map-request-card">
          <span>Map Request</span>
          <strong>{mapRequest.mapType}</strong>
          <small>{mapRequest.requiredRegions.length || 0} required regions · {mapRequest.seed}</small>
        </div>
      </section>
    </aside>
  );
}
