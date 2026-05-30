import { motion } from "framer-motion";
import { Plus, SlidersHorizontal, X } from "lucide-react";

import { ALL_MONSTER_SOURCES as SOURCES } from "../data/monster-content-pack-feed.js";
import { SLOTS } from "../monster-composer.workflow.js";
import { getSelectedIdsForSlot } from "../model/selection.js";
import {
  formatFeatureImpactPreview,
  formatToken,
  getCompatibilityStatus,
  getFeatureCompatibility,
} from "../model/compatibility.js";
import {
  getFeatureMechanicProfile,
  getFeatureSection,
} from "../model/balance.js";
import {
  getSectionLabel,
  normalizeMonsterReferences,
} from "../model/export.js";

function titleCase(value) {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getContentPackId(entry) {
  return entry?.contentPack?.id || "core-cruor";
}

function getContentPackTitle(entry) {
  return entry?.contentPack?.title || "Core Monster Composer";
}

function getSourcePackTitle(source) {
  return source?.contentPack?.title || "Core Monster Composer";
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>;
}

export function ComponentNavigatorModal({
  open,
  mode,
  activeSlot,
  navigatorSlotFilter,
  setNavigatorSlotFilter,
  navigatorPackFilter = "all",
  setNavigatorPackFilter,
  contentPackOptions = [],
  setActiveSlot,
  onClose,
  visibleFeatures,
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  computed,
  sourceId,
  setSourceId,
  setActivePresetId,
  navigatorSearch,
  setNavigatorSearch,
  navigatorFiltersOpen,
  setNavigatorFiltersOpen,
  advancedMode,
  slotCaps,
  addFeature,
  setDraggedFeatureId,
  getSlotCap,
  buildSmartSlotPicks,
  buildFeatureDecisionProfile,
  buildFeatureImpactPreview,
}) {
  if (!open) return null;

  const slotData = SLOTS.find((slot) => slot.id === activeSlot) || SLOTS[0];
  const filteredSlotData = SLOTS.find((slot) => slot.id === navigatorSlotFilter);
  const modalTitle =
    mode === "global"
      ? navigatorSlotFilter === "all"
        ? "Global Component Navigator"
        : `${filteredSlotData?.label || "Filtered"} Components`
      : `Choose ${slotData.label} Graft`;
  const smartPickSlotId = mode === "global" ? navigatorSlotFilter : activeSlot;
  const smartPicks = buildSmartSlotPicks({
    slotId: smartPickSlotId,
    candidates: visibleFeatures,
    selected,
    selectedFeatures,
    typeId,
    category,
    roleId,
    tacticalRoleId: computed.tacticalRole.id,
    monsterTierId: computed.monsterTier.id,
  });
  const packOptions = [
    { id: "all", title: "All Content Packs" },
    ...contentPackOptions.filter((pack) => pack.id !== "all"),
  ];
  const currentSource = SOURCES.find((source) => source.id === sourceId) || null;
  const sourceFilterOptions =
    navigatorPackFilter === "all"
      ? SOURCES
      : SOURCES.filter((source) => getContentPackId(source) === navigatorPackFilter);

  function selectContentPackFilter(packId) {
    setNavigatorPackFilter?.(packId);
    if (packId === "all") return;
    if (getContentPackId(currentSource) === packId) return;

    const nextSource = SOURCES.find((source) => getContentPackId(source) === packId);
    if (!nextSource) return;
    setSourceId(nextSource.id);
    setActivePresetId("");
  }

  return (
    <div
      className="component-navigator-modal"
      data-navigator-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
    >
      <button
        className="component-navigator-modal__scrim"
        type="button"
        aria-label="Close Component Navigator"
        onClick={onClose}
      />
      <aside
        className="panel navigator monster-navigator component-navigator-modal__panel"
        aria-label="Component Navigator"
      >
        <div className="component-navigator-modal__head">
          <div>
            <h2>{modalTitle}</h2>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Close Component Navigator"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="navigator-tools monster-navigator-tools">
          <div className="navigator-search-row">
            <div className="search-wrap monster-search-wrap">
              <input
                type="search"
                value={navigatorSearch}
                placeholder="Search components…"
                aria-label="Search components"
                onChange={(event) => setNavigatorSearch(event.target.value)}
              />
            </div>
            <button
              className={`icon-btn navigator-filter-btn ${navigatorFiltersOpen ? "active" : ""}`}
              type="button"
              aria-label="Filter components"
              aria-expanded={navigatorFiltersOpen}
              data-active-count={
                navigatorSearch.trim() ||
                sourceId !== "decomposition" ||
                navigatorPackFilter !== "all" ||
                (mode === "global" && navigatorSlotFilter !== "all")
                  ? 1
                  : 0
              }
              onClick={() => setNavigatorFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal aria-hidden="true" />
            </button>
            <div className="navigator-count" aria-label="Visible component count">
              {visibleFeatures.length}
            </div>
          </div>

          {navigatorFiltersOpen && (
            <div className="tag-filter-row monster-source-grid-open" aria-label="Filter components">
              <div className="tag-filter-row__head">
                <span>Component Filters</span>
                <button
                  className="tag-clear-btn"
                  type="button"
                  onClick={() => {
                    setNavigatorSearch("");
                    setNavigatorSlotFilter(mode === "global" ? "all" : activeSlot);
                    setNavigatorPackFilter?.("all");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="navigator-filter-panel">
                <section className="navigator-filter-section">
                  <strong>Source Anchor</strong>
                  <div className="filter-chip-grid source-filter">
                    {sourceFilterOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`navigator-filter-chip navigator-filter-chip--stacked ${item.id === sourceId ? "active" : ""}`}
                        aria-pressed={item.id === sourceId}
                        onClick={() => {
                          setSourceId(item.id);
                          setActivePresetId("");
                        }}
                      >
                        <span className="navigator-filter-chip__main">{item.label}</span>
                        <span className="navigator-filter-chip__meta">{getSourcePackTitle(item)}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="navigator-filter-section">
                  <strong>Content Pack</strong>
                  <div className="filter-chip-grid source-filter">
                    {packOptions.map((pack) => (
                      <button
                        key={pack.id}
                        type="button"
                        className={`navigator-filter-chip ${pack.id === navigatorPackFilter ? "active" : ""}`}
                        aria-pressed={pack.id === navigatorPackFilter}
                        onClick={() => selectContentPackFilter(pack.id)}
                      >
                        {pack.title}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        {mode === "global" && (
          <div className="source-modal__tools monster-slot-tabs component-navigator-modal__slot-tabs">
            <button
              type="button"
              className={`navigator-filter-chip ${navigatorSlotFilter === "all" ? "active" : ""}`}
              onClick={() => setNavigatorSlotFilter("all")}
            >
              All
            </button>
            {SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`navigator-filter-chip ${slot.id === navigatorSlotFilter ? "active" : ""}`}
                onClick={() => {
                  setNavigatorSlotFilter(slot.id);
                  setActiveSlot(slot.id);
                }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}

        {smartPickSlotId !== "all" && smartPicks.length > 0 && (
          <SmartSlotPicks
            slotId={smartPickSlotId}
            picks={smartPicks}
            selected={selected}
            selectedFeatures={selectedFeatures}
            typeId={typeId}
            category={category}
            advancedMode={advancedMode}
            slotCaps={slotCaps}
            computed={computed}
            onAdd={addFeature}
            getSlotCap={getSlotCap}
            buildFeatureImpactPreview={buildFeatureImpactPreview}
          />
        )}

        <div className="component-list monster-component-list component-navigator-modal__list">
          {visibleFeatures.length === 0 ? (
            <EmptyState text="No compatible components for this source/type/role/filter combination in the MVP dataset." />
          ) : (
            visibleFeatures.map((feature) => {
              const featureSlotIds = getSelectedIdsForSlot(selected, feature.slot);
              const featureSlotCap = advancedMode ? getSlotCap(slotCaps, feature.slot) : 1;
              const selectedInSlot = featureSlotIds.includes(feature.id);
              const slotFull =
                featureSlotCap > 1 && featureSlotIds.length >= featureSlotCap && !selectedInSlot;
              const compatibility = getCompatibilityStatus(
                feature,
                selectedFeatures,
                typeId,
                category
              );
              const decisionProfile = buildFeatureDecisionProfile(feature, {
                status: compatibility,
                selected,
                selectedFeatures,
                typeId,
                category,
                roleId,
                tacticalRoleId: computed.tacticalRole.id,
                monsterTierId: computed.monsterTier.id,
                currentSlot: mode === "global" ? navigatorSlotFilter : activeSlot,
                selectedInSlot,
              });
              return (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  selected={selectedInSlot}
                  slotFull={slotFull}
                  compatibility={compatibility}
                  decisionProfile={decisionProfile}
                  selectedBuild={selected}
                  selectedFeatures={selectedFeatures}
                  typeId={typeId}
                  category={category}
                  computed={computed}
                  onAdd={() => addFeature(feature)}
                  onDragStart={() => setDraggedFeatureId(feature.id)}
                  onDragEnd={() => setDraggedFeatureId(null)}
                  buildFeatureImpactPreview={buildFeatureImpactPreview}
                />
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}

function SmartSlotPicks({
  slotId,
  picks,
  selected,
  selectedFeatures,
  typeId,
  category,
  advancedMode,
  slotCaps,
  computed,
  onAdd,
  getSlotCap,
  buildFeatureImpactPreview,
}) {
  const slot = SLOTS.find((item) => item.id === slotId) || SLOTS[0];
  if (!picks.length) return null;

  return (
    <section className="smart-slot-picks" aria-label={`Best picks for ${slot.label}`}>
      <div className="smart-slot-picks__head">
        <strong>Best Picks</strong>
        <span>{slot.label}</span>
      </div>
      <div className="smart-slot-picks__grid">
        {picks.map((pick) => {
          const feature = pick.feature;
          const featureSlotIds = getSelectedIdsForSlot(selected, feature.slot);
          const featureSlotCap = advancedMode ? getSlotCap(slotCaps, feature.slot) : 1;
          const selectedInSlot = featureSlotIds.includes(feature.id);
          const slotFull =
            featureSlotCap > 1 && featureSlotIds.length >= featureSlotCap && !selectedInSlot;
          const compatibility = getCompatibilityStatus(feature, selectedFeatures, typeId, category);
          const impact = buildFeatureImpactPreview({
            feature,
            selected,
            selectedFeatures,
            typeId,
            category,
            computed,
          });
          const disabled =
            selectedInSlot || slotFull || ["missing", "incompatible"].includes(compatibility.kind);
          return (
            <article key={`${pick.id}-${feature.id}`} className={`smart-pick-card is-${pick.id}`}>
              <div className="smart-pick-card__top">
                <span>{pick.label}</span>
                <button type="button" disabled={disabled} onClick={() => onAdd?.(feature)}>
                  {selectedInSlot ? "Added" : slotFull ? "Full" : "Add"}
                </button>
              </div>
              <h3>{feature.title}</h3>
              <span className="component-pack-badge">{getContentPackTitle(feature)}</span>
              <p>{normalizeMonsterReferences(feature.summary, computed)}</p>
              <em>{formatFeatureImpactPreview(impact)}</em>
              {compatibility.kind !== "compatible" && <small>{compatibility.message}</small>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  selected,
  slotFull,
  compatibility,
  decisionProfile,
  selectedBuild,
  selectedFeatures,
  typeId,
  category,
  computed,
  onAdd,
  onDragStart,
  onDragEnd,
  buildFeatureImpactPreview,
}) {
  const source = SOURCES.find((item) => item.id === feature.source);
  const packTitle = getContentPackTitle(feature);
  const sourcePackTitle = getSourcePackTitle(source);
  const rules = getFeatureCompatibility(feature);
  const mechanicProfile = getFeatureMechanicProfile(feature);
  const hasCompatibilityBadge = compatibility?.kind && compatibility.kind !== "compatible";
  const profile = decisionProfile || { tier: "safe" };
  const actionLabel = selected ? "Added" : slotFull ? "Full" : "Add";
  const impact = buildFeatureImpactPreview({
    feature,
    selected: selectedBuild || {},
    selectedFeatures: selectedFeatures || [],
    typeId,
    category,
    computed,
  });
  return (
    <motion.article
      layout
      draggable={!selected && !slotFull}
      onDragStart={(event) => {
        if (selected || slotFull) {
          event.preventDefault();
          return;
        }
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      className={`component-card ${selected ? "in-build" : ""} ${slotFull ? "slot-full" : ""} ${hasCompatibilityBadge ? `compatibility-${compatibility.kind}` : ""}`}
      data-decision-tier={profile.tier}
    >
      <button
        className="component-toggle-btn"
        type="button"
        onClick={onAdd}
        aria-label={
          selected
            ? `${feature.title} already installed`
            : slotFull
              ? `${titleCase(feature.slot)} slot is full`
              : `Add ${feature.title}`
        }
        disabled={selected || slotFull}
      >
        <Plus aria-hidden="true" />
        <span>{actionLabel}</span>
      </button>

      <div className="card-top">
        <div className="component-title-stack">
          <h3>{feature.title}</h3>
          <span className="component-pack-badge">{packTitle}</span>
        </div>
        {hasCompatibilityBadge && (
          <span className={`compatibility-badge ${compatibility.kind}`}>{compatibility.label}</span>
        )}
      </div>

      <p className="summary">{normalizeMonsterReferences(feature.summary, computed)}</p>
      <p className="component-impact-line">{formatFeatureImpactPreview(impact)}</p>

      {hasCompatibilityBadge && <p className="compatibility-note">{compatibility.message}</p>}
      {slotFull && (
        <p className="compatibility-note">
          This slot is full. Raise its cap or remove a graft first.
        </p>
      )}
      <details className="component-details">
        <summary>Details</summary>
        <div className="meta-list" aria-label="Component metadata">
          <div className="meta-row">
            <span className="meta-label">Source</span>
            <span className="meta-values">
              <span className="meta-value source-chip">{source?.label}</span>
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Content Pack</span>
            <span className="meta-values">
              <span className="meta-value pack-chip">{packTitle}</span>
              {sourcePackTitle !== packTitle && (
                <span className="meta-value">Source: {sourcePackTitle}</span>
              )}
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Slot</span>
            <span className="meta-values">
              <span className="meta-value strong-chip">{titleCase(feature.slot)}</span>
              <span className="meta-value">{getSectionLabel(getFeatureSection(feature))}</span>
            </span>
          </div>
          {mechanicProfile.mechanicTags.length > 0 && (
            <div className="meta-row">
              <span className="meta-label">Tags</span>
              <span className="meta-values">
                {mechanicProfile.mechanicTags.slice(0, 5).map((tag) => (
                  <span key={tag} className="meta-value">
                    {formatToken(tag)}
                  </span>
                ))}
              </span>
            </div>
          )}
          {rules.grants.length > 0 && (
            <div className="meta-row">
              <span className="meta-label">Grants</span>
              <span className="meta-values">
                {rules.grants.map((token) => (
                  <span key={token} className="meta-value">
                    {formatToken(token)}
                  </span>
                ))}
              </span>
            </div>
          )}
          {(rules.requires.length > 0 ||
            rules.softRequires.length > 0 ||
            rules.incompatibleWith.length > 0) && (
            <div className="meta-row">
              <span className="meta-label">Locks</span>
              <span className="meta-values">
                {rules.requires.map((token) => (
                  <span key={`requires-${token}`} className="meta-value strong-chip">
                    Requires {formatToken(token)}
                  </span>
                ))}
                {rules.softRequires.map((token) => (
                  <span key={`soft-${token}`} className="meta-value">
                    Wants {formatToken(token)}
                  </span>
                ))}
                {rules.incompatibleWith.map((token) => (
                  <span key={`blocks-${token}`} className="meta-value danger-chip">
                    Blocks {formatToken(token)}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </details>
    </motion.article>
  );
}

