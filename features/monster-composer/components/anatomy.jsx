import {
  SLOTS,
  SILHOUETTE_SLOT_CARDS,
  ANATOMY_LEFT_SLOT_IDS,
  ANATOMY_RIGHT_SLOT_IDS,
  ANATOMY_BOTTOM_SLOT_IDS,
} from "../monster-composer.workflow.js";
import { MONSTER_GRAFTS as FEATURES } from "../data/monster-grafts.js";
import { getSelectedIdsForSlot, hasSelectedSlot } from "../model/selection.js";
import { normalizeMonsterReferences } from "../model/export.js";
import { getSilhouetteAnchor, getSilhouetteId, getSilhouetteProfile } from "../model/anatomy.js";
import { MonsterStartScreen } from "./start-flow.jsx";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function AnatomyMeter({ label, value, max, percent }) {
  const over = value > max;
  return (
    <div className="monster-meter">
      <div className="monster-meter__head">
        <span>{label}</span>
        <strong className={over ? "is-over" : ""}>
          {value} / {max}
        </strong>
      </div>
      <div className="monster-meter__track">
        <div className={over ? "is-over" : ""} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

export function MonsterSilhouetteMap({
  typeId,
  category,
  activePreset,
  selected,
  activeSlot,
  guidedSlotId,
  computed,
  started,
  startMode,
  presetsCount,
  onPickTemplate,
  onBuildFromScratch,
  onOpenFrame,
  onFocusSlot,
}) {
  const silhouetteId = getSilhouetteId(typeId, category, activePreset);
  const profile = getSilhouetteProfile(typeId, category, activePreset);
  const filledCount = SLOTS.filter((slot) => hasSelectedSlot(selected, slot.id)).length;

  function openFrameFromSilhouette(event) {
    event.stopPropagation();
    onOpenFrame?.();
  }

  function handleSilhouetteKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenFrame?.();
    }
  }

  function getSlotCardData(slotId) {
    const slot = SLOTS.find((item) => item.id === slotId) || SLOTS[0];
    const Icon = slot.icon;
    const card = SILHOUETTE_SLOT_CARDS[slot.id] || { side: "center" };
    const slotFeatures = getSelectedIdsForSlot(selected, slot.id)
      .map((id) => FEATURES.find((feature) => feature.id === id))
      .filter(Boolean);
    const feature = slotFeatures[0] || null;
    const filled = slotFeatures.length > 0;
    const active = activeSlot === slot.id;
    const guided = guidedSlotId === slot.id;

    return { slot, Icon, card, slotFeatures, feature, filled, active, guided };
  }

  function renderSlotCard(slotId) {
    const { slot, Icon, card, slotFeatures, feature, filled, active, guided } =
      getSlotCardData(slotId);

    return (
      <button
        key={slot.id}
        type="button"
        className={`monster-silhouette-slot-card is-${card.side} ${filled ? "is-filled" : "is-empty"} ${active ? "is-active" : ""} ${guided ? "is-guided" : ""}`}
        aria-label={`Focus ${slot.label}`}
        aria-pressed={active}
        onClick={(event) => {
          event.stopPropagation();
          onFocusSlot(slot.id);
        }}
      >
        <span className="monster-silhouette-slot-card__head">
          <span>
            <Icon aria-hidden="true" /> {slot.label}
          </span>
          <strong>{slotFeatures.length || "—"}</strong>
        </span>
        <span className="monster-silhouette-slot-card__body">
          {feature ? (
            <>
              <strong>{feature.title}</strong>
              <em>{normalizeMonsterReferences(feature.summary, computed)}</em>
            </>
          ) : (
            <>
              <strong>Empty Slot</strong>
              <em>{slot.hint}</em>
            </>
          )}
        </span>
      </button>
    );
  }

  return (
    <section className="monster-anatomy-composer" aria-label="Monster anatomy composer">
      {!started ? (
        <MonsterStartScreen
          onPickTemplate={onPickTemplate}
          onBuildFromScratch={onBuildFromScratch}
          presetsCount={presetsCount}
        />
      ) : (
        <>
          {startMode === "scratch" && filledCount === 0 && (
            <div className="monster-scratch-hint" aria-label="Scratch build hint">
              <strong>Empty Anatomy Frame</strong>
              <span>
                Click Body, Attack Pattern, or Weakness / Tell to install the first graft.
              </span>
            </div>
          )}
          <div
            className="monster-silhouette-stage anatomy-stage"
            data-active-slot={activeSlot}
            data-start-mode={startMode || "manual"}
          >
            <div className="anatomy-stage__grid">
              <aside
                className="anatomy-stage__column anatomy-stage__column--left"
                aria-label="Left anatomy slots"
              >
                <article className="silhouette-metric-card is-pressure">
                  <AnatomyMeter
                    label="Pressure"
                    value={computed.pressure}
                    max={computed.budget}
                    percent={clamp((computed.pressure / computed.budget) * 100, 0, 160)}
                  />
                </article>
                <div className="anatomy-stage__slot-stack">
                  {ANATOMY_LEFT_SLOT_IDS.map(renderSlotCard)}
                </div>
              </aside>

              <div className="anatomy-stage__center" aria-label="Interactive monster silhouette">
                <div className="anatomy-stage__silhouette-layer">
                  <svg
                    className="monster-silhouette-connectors"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {SLOTS.map((slot) => {
                      const anchor = getSilhouetteAnchor(profile, slot.id);
                      const card = SILHOUETTE_SLOT_CARDS[slot.id] || { x: anchor.x, y: anchor.y };
                      const filled = hasSelectedSlot(selected, slot.id);
                      const active = activeSlot === slot.id;
                      const guided = guidedSlotId === slot.id;
                      return (
                        <line
                          key={slot.id}
                          className={`monster-silhouette-connector ${filled ? "is-filled" : ""} ${active ? "is-active" : ""} ${guided ? "is-guided" : ""}`}
                          x1={card.x * 100}
                          y1={card.y * 100}
                          x2={anchor.x * 100}
                          y2={anchor.y * 100}
                        />
                      );
                    })}
                  </svg>

                  {profile.assetUrl ? (
                    <button
                      className={`monster-silhouette-svg monster-silhouette-asset monster-silhouette-svg--${silhouetteId}`}
                      type="button"
                      aria-label={`${profile.label}. Open Monster Frame`}
                      onClick={openFrameFromSilhouette}
                      onKeyDown={handleSilhouetteKeyDown}
                    >
                      <img
                        className="monster-silhouette-asset__image"
                        src={profile.assetUrl}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                      />
                    </button>
                  ) : (
                    <svg
                      className={`monster-silhouette-svg monster-silhouette-svg--${silhouetteId}`}
                      viewBox={profile.viewBox}
                      role="button"
                      tabIndex={0}
                      aria-label={`${profile.label}. Open Monster Frame`}
                      onClick={openFrameFromSilhouette}
                      onKeyDown={handleSilhouetteKeyDown}
                    >
                      <g className="monster-silhouette-aura">
                        {profile.layers
                          .filter((layer) => layer.id === "aura")
                          .map((layer) => (
                            <path key={layer.id} d={layer.d} />
                          ))}
                      </g>
                      <g className="monster-silhouette-body">
                        {profile.layers
                          .filter((layer) => layer.id !== "aura")
                          .map((layer) => (
                            <path
                              key={layer.id}
                              className={`silhouette-layer silhouette-layer--${layer.id}`}
                              d={layer.d}
                            />
                          ))}
                      </g>
                    </svg>
                  )}

                  {SLOTS.map((slot) => {
                    const Icon = slot.icon;
                    const anchor = getSilhouetteAnchor(profile, slot.id);
                    const filled = hasSelectedSlot(selected, slot.id);
                    const active = activeSlot === slot.id;
                    const guided = guidedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        className={`monster-silhouette-node ${filled ? "is-filled" : ""} ${active ? "is-active" : ""} ${guided ? "is-guided" : ""}`}
                        style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
                        aria-label={`Focus ${slot.label}`}
                        aria-pressed={active}
                        onClick={(event) => {
                          event.stopPropagation();
                          onFocusSlot(slot.id);
                        }}
                      >
                        <Icon aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <aside
                className="anatomy-stage__column anatomy-stage__column--right"
                aria-label="Right anatomy slots"
              >
                <article className="silhouette-metric-card is-complexity">
                  <AnatomyMeter
                    label="Complexity"
                    value={computed.complexity}
                    max={computed.complexityCap}
                    percent={clamp((computed.complexity / computed.complexityCap) * 100, 0, 160)}
                  />
                </article>
                <div className="anatomy-stage__slot-stack">
                  {ANATOMY_RIGHT_SLOT_IDS.map(renderSlotCard)}
                </div>
              </aside>

              <div className="anatomy-stage__lair" aria-label="Bottom anatomy slot">
                {ANATOMY_BOTTOM_SLOT_IDS.map(renderSlotCard)}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
