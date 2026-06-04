import { useMemo, useState } from "react";
import {
  STATIC_CONTENT_PACK_PROVENANCE,
  STATIC_CONTENT_REGISTRY,
  getSourceAnchorId,
} from "../../shared/content/content.index.js";
import "./inspirations.styles.css";

const ANY_PACK = "Any Pack";
const MONSTER_COMPONENT_DISPLAY_LIMIT = 18;
const INSPIRATION_WORKFLOW_ID = "inspiration-archive";
const MONSTER_WORKFLOW_ID = "monster-composer";

const SORT_OPTIONS = [
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "chronology-asc", label: "Chronology ↑" },
  { value: "chronology-desc", label: "Chronology ↓" },
  { value: "components-desc", label: "Most Components" },
  { value: "components-asc", label: "Fewest Components" },
];

const SLOT_LABELS = {
  body: "Body",
  mind: "Mind",
  movement: "Movement",
  attack: "Attack",
  horror: "Horror",
  twist: "Twist",
  weakness: "Weakness / Tell",
  death: "Death",
  lair: "Lair / Scene",
};

function uniqueArray(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function titleCase(value) {
  return String(value || "")
    .split(/[\s_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPrimarySourceAnchorId(inspiration) {
  return getSourceAnchorId(inspiration?.sourceAnchors?.[0] || inspiration?.inspiration?.anchor || inspiration?.title);
}

function getSourceAnchorMeta(inspiration) {
  const sourceAnchorId = getPrimarySourceAnchorId(inspiration);
  return STATIC_CONTENT_REGISTRY.getSourceAnchor(sourceAnchorId);
}

function getSourceType(inspiration, sourceAnchor = null) {
  return (
    inspiration?.inspiration?.sourceType ||
    inspiration?.sourceTypes?.[0] ||
    sourceAnchor?.type ||
    sourceAnchor?.sourceTypes?.[0] ||
    "Inspiration"
  );
}

function getInspirationTitle(inspiration) {
  return inspiration?.title || inspiration?.label || inspiration?.legacyId || "Untitled Inspiration";
}

function getInspirationCaption(inspiration) {
  return inspiration?.caption || inspiration?.summary || inspiration?.narrative || "";
}

function getInspirationLogic(inspiration, sourceAnchor = null) {
  return (
    inspiration?.inspiration?.logic ||
    inspiration?.narrative ||
    sourceAnchor?.summary ||
    "This inspiration provides concrete images and pressures that can become playable horror components."
  );
}

function coerceChronologyValue(value) {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const directNumber = Number(trimmed);
    if (Number.isFinite(directNumber)) return directNumber;

    const yearMatch = trimmed.match(/-?\d{1,4}/);
    if (yearMatch) return Number(yearMatch[0]);

    const timestamp = Date.parse(trimmed);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  if (typeof value === "object") {
    return coerceChronologyValue(
      value.sort ??
        value.order ??
        value.year ??
        value.startYear ??
        value.date ??
        value.label ??
        value.value,
    );
  }

  return null;
}

function getChronologyValue(inspiration, sourceAnchor = null) {
  return coerceChronologyValue(
    inspiration?.chronology ??
      inspiration?.timeline ??
      inspiration?.year ??
      inspiration?.date ??
      inspiration?.metadata?.chronology ??
      inspiration?.metadata?.year ??
      inspiration?.metadata?.date ??
      inspiration?.inspiration?.chronology ??
      inspiration?.inspiration?.year ??
      inspiration?.inspiration?.date ??
      sourceAnchor?.chronology ??
      sourceAnchor?.timeline ??
      sourceAnchor?.year ??
      sourceAnchor?.date ??
      sourceAnchor?.metadata?.chronology ??
      sourceAnchor?.metadata?.year ??
      sourceAnchor?.metadata?.date,
  );
}

function compareByTitle(left, right, direction = 1) {
  return direction * getInspirationTitle(left).localeCompare(getInspirationTitle(right));
}

function compareByChronology(left, right, direction, sourceOrderById) {
  const leftChronology = getChronologyValue(left, getSourceAnchorMeta(left));
  const rightChronology = getChronologyValue(right, getSourceAnchorMeta(right));
  const leftFallback = sourceOrderById.get(left.id) ?? 0;
  const rightFallback = sourceOrderById.get(right.id) ?? 0;
  const leftValue = leftChronology ?? leftFallback;
  const rightValue = rightChronology ?? rightFallback;

  return direction * (leftValue - rightValue) || compareByTitle(left, right);
}

function compareByLinkedComponents(left, right, direction) {
  const leftCount = getLinkedRegistryComponents(left).length;
  const rightCount = getLinkedRegistryComponents(right).length;

  return direction * (leftCount - rightCount) || compareByTitle(left, right);
}

function compareInspirationCards(left, right, sortMode, sourceOrderById) {
  switch (sortMode) {
    case "za":
      return compareByTitle(left, right, -1);
    case "chronology-asc":
      return compareByChronology(left, right, 1, sourceOrderById);
    case "chronology-desc":
      return compareByChronology(left, right, -1, sourceOrderById);
    case "components-desc":
      return compareByLinkedComponents(left, right, -1);
    case "components-asc":
      return compareByLinkedComponents(left, right, 1);
    case "az":
    default:
      return compareByTitle(left, right);
  }
}

function getLinkedRegistryComponents(inspiration) {
  const sourceAnchorId = getPrimarySourceAnchorId(inspiration);
  if (!sourceAnchorId) return [];

  return STATIC_CONTENT_REGISTRY.getLinkedComponents(sourceAnchorId, {
    workflow: MONSTER_WORKFLOW_ID,
  })
    .filter((component) => component.contentType === "monster-graft")
    .sort((a, b) => {
      const leftSlot = a.monster?.slot || a.slots?.[0] || "";
      const rightSlot = b.monster?.slot || b.slots?.[0] || "";
      return (
        leftSlot.localeCompare(rightSlot) ||
        Number(a.monster?.cost || 0) - Number(b.monster?.cost || 0) ||
        a.title.localeCompare(b.title)
      );
    });
}

function groupComponentsBySlot(components) {
  return components.reduce((groups, component) => {
    const slotId = component.monster?.slot || component.slots?.[0] || "other";
    if (!groups[slotId]) groups[slotId] = [];
    groups[slotId].push(component);
    return groups;
  }, {});
}

function getContentPack(collectionName, entry) {
  return STATIC_CONTENT_PACK_PROVENANCE.getPrimaryPackForEntry(collectionName, entry);
}

function getContentPacks(collectionName, entry) {
  return STATIC_CONTENT_PACK_PROVENANCE.getPacksForEntry(collectionName, entry);
}

function getContentPackIds(collectionName, entry) {
  return STATIC_CONTENT_PACK_PROVENANCE.getPackIdsForEntry(collectionName, entry);
}

function getContentPackLabel(collectionName, entry) {
  return STATIC_CONTENT_PACK_PROVENANCE.getPackLabelForEntry(collectionName, entry);
}

function formatComponentMeta(component) {
  const cost = Number(component.monster?.cost || 0);
  const costText = cost > 0 ? `+${cost}` : String(cost);
  const packLabel = getContentPackLabel("components", component);
  return `Pressure ${costText} · Complexity ${component.monster?.complexity ?? 0} · ${packLabel}`;
}

function buildRegistryHaystack(inspiration, sourceAnchor, linkedComponents) {
  return [
    inspiration.id,
    inspiration.legacyId,
    inspiration.title,
    inspiration.label,
    inspiration.summary,
    inspiration.caption,
    inspiration.narrative,
    inspiration.inspiration?.logic,
    sourceAnchor?.label,
    sourceAnchor?.summary,
    sourceAnchor?.type,
    ...getContentPacks("inspirations", inspiration).map((pack) => pack.title),
    ...(inspiration.sourceTypes || []),
    ...(inspiration.themes || []),
    ...(inspiration.motifs || []),
    ...(inspiration.horror || []),
    ...(sourceAnchor?.sourceTypes || []),
    ...(sourceAnchor?.themes || []),
    ...(sourceAnchor?.motifs || []),
    ...(sourceAnchor?.horror || []),
    ...linkedComponents.map((component) => component.title),
    ...linkedComponents.map((component) => component.summary),
    ...linkedComponents.flatMap((component) => getContentPacks("components", component).map((pack) => pack.title)),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function InspirationImage({ inspiration }) {
  const [failed, setFailed] = useState(false);
  const icon = inspiration?.media?.icon || "fa-book-open";
  const imageUrl = inspiration?.media?.imageUrl || "";

  if (!imageUrl || failed) {
    return <i className={`fa-solid ${icon}`} aria-hidden="true" />;
  }

  return (
    <img
      src={imageUrl}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function ComponentGroup({ slotId, components }) {
  return (
    <article className="inspirations-page__component-group">
      <h4>
        <span>{SLOT_LABELS[slotId] || titleCase(slotId)}</span>
        <em>{components.length}</em>
      </h4>
      <div className="inspirations-page__linked">
        {components.slice(0, 6).map((component) => (
          <span key={component.id} title={component.summary}>
            <strong>{component.title}</strong>
            <small>{formatComponentMeta(component)}</small>
          </span>
        ))}
      </div>
    </article>
  );
}

export default function InspirationsPage({ onOpenMonsterComposer }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Any Type");
  const [themeFilter, setThemeFilter] = useState("Any Theme");
  const [packFilter, setPackFilter] = useState(ANY_PACK);
  const [sortMode, setSortMode] = useState("az");
  const [activeInspirationId, setActiveInspirationId] = useState("");

  const allInspirations = useMemo(() => {
    return STATIC_CONTENT_REGISTRY.getInspirations({ workflow: INSPIRATION_WORKFLOW_ID });
  }, []);

  const sourceOrderById = useMemo(() => {
    return new Map(allInspirations.map((inspiration, index) => [inspiration.id, index]));
  }, [allInspirations]);

  const packOptions = useMemo(() => {
    const inspirationPackIds = new Set(
      allInspirations.flatMap((inspiration) => getContentPackIds("inspirations", inspiration)),
    );

    return [
      { id: ANY_PACK, title: ANY_PACK },
      ...STATIC_CONTENT_PACK_PROVENANCE.packs
        .filter((pack) => inspirationPackIds.has(pack.id))
        .sort((a, b) => a.title.localeCompare(b.title)),
    ];
  }, [allInspirations]);

  const sourceTypes = useMemo(() => {
    return [
      "Any Type",
      ...uniqueArray(
        allInspirations.flatMap((inspiration) => {
          const sourceAnchor = getSourceAnchorMeta(inspiration);
          return [getSourceType(inspiration, sourceAnchor), ...(inspiration.sourceTypes || [])];
        }),
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [allInspirations]);

  const themes = useMemo(() => {
    return [
      "Any Theme",
      ...uniqueArray(
        allInspirations.flatMap((inspiration) => {
          const sourceAnchor = getSourceAnchorMeta(inspiration);
          return [...(inspiration.themes || []), ...(sourceAnchor?.themes || [])];
        }),
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [allInspirations]);

  const cards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allInspirations
      .filter((inspiration) => {
      const sourceAnchor = getSourceAnchorMeta(inspiration);
      const linkedComponents = getLinkedRegistryComponents(inspiration);
      const sourceType = getSourceType(inspiration, sourceAnchor);
      const themeValues = uniqueArray([...(inspiration.themes || []), ...(sourceAnchor?.themes || [])]);
      const packIds = getContentPackIds("inspirations", inspiration);

      if (packFilter !== ANY_PACK && !packIds.includes(packFilter)) {
        return false;
      }

      if (typeFilter !== "Any Type" && sourceType !== typeFilter && !inspiration.sourceTypes?.includes(typeFilter)) {
        return false;
      }

      if (themeFilter !== "Any Theme" && !themeValues.includes(themeFilter)) {
        return false;
      }

      if (!query) return true;

      return buildRegistryHaystack(inspiration, sourceAnchor, linkedComponents).includes(query);
    })
      .sort((left, right) => compareInspirationCards(left, right, sortMode, sourceOrderById));
  }, [allInspirations, search, typeFilter, themeFilter, packFilter, sortMode, sourceOrderById]);

  const activeInspiration =
    cards.find((item) => item.id === activeInspirationId) ||
    allInspirations.find((item) => item.id === activeInspirationId) ||
    cards[0] ||
    null;
  const activeSourceAnchor = activeInspiration ? getSourceAnchorMeta(activeInspiration) : null;
  const activeSourceAnchorId = activeInspiration ? getPrimarySourceAnchorId(activeInspiration) : "";
  const linkedComponents = activeInspiration ? getLinkedRegistryComponents(activeInspiration) : [];
  const groupedComponents = groupComponentsBySlot(linkedComponents);
  const displayedComponentCount = Math.min(linkedComponents.length, MONSTER_COMPONENT_DISPLAY_LIMIT);
  const activeThemes = activeInspiration
    ? uniqueArray([...(activeInspiration.themes || []), ...(activeSourceAnchor?.themes || [])])
    : [];
  const activeMotifs = activeInspiration
    ? uniqueArray([...(activeInspiration.motifs || []), ...(activeSourceAnchor?.motifs || [])])
    : [];
  const activeHorror = activeInspiration
    ? uniqueArray([...(activeInspiration.horror || []), ...(activeSourceAnchor?.horror || [])])
    : [];
  const activeContentPack = activeInspiration ? getContentPack("inspirations", activeInspiration) : null;
  const totalLinkedComponents = useMemo(() => {
    return allInspirations.reduce((total, inspiration) => total + getLinkedRegistryComponents(inspiration).length, 0);
  }, [allInspirations]);
  const activeFilterCount = [
    search.trim(),
    packFilter !== ANY_PACK,
    typeFilter !== "Any Type",
    themeFilter !== "Any Theme",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setPackFilter(ANY_PACK);
    setTypeFilter("Any Type");
    setThemeFilter("Any Theme");
  }

  function openMonsterComposerFrom(inspiration) {
    if (!inspiration || !onOpenMonsterComposer) return;
    const sourceAnchorId = getPrimarySourceAnchorId(inspiration);
    onOpenMonsterComposer({
      sourceAnchorId,
      inspirationId: inspiration.id,
      title: getInspirationTitle(inspiration),
    });
  }

  return (
    <section className="inspirations-page" aria-label="Inspirations archive">
      <header className="inspirations-page__hero inspirations-panel">
        <div className="inspirations-page__hero-copy">
          <p className="eyebrow">Source Atlas</p>
          <h1>Choose the Horror Source</h1>
          <p>
            Browse real images, rituals, places, and cultural fears as playable seeds for Cruor tools.
            Each source card works like a visual prompt, a lore dossier, and a bridge toward Monster Components.
          </p>
        </div>
        <div className="inspirations-page__stats" aria-label="Inspiration archive summary">
          <span>
            <strong>{allInspirations.length}</strong>
            <small>Sources</small>
          </span>
          <span>
            <strong>{cards.length}</strong>
            <small>Visible</small>
          </span>
          <span>
            <strong>{totalLinkedComponents}</strong>
            <small>Linked Components</small>
          </span>
        </div>
      </header>

      <div className="inspirations-page__workspace">
        <section className="inspirations-page__library" aria-label="Inspiration cards">
          <div className="inspirations-page__tools inspirations-panel" aria-label="Inspiration filters">
            <label className="inspirations-page__search">
              <span>Search the archive</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                placeholder="Search inspirations, themes, components..."
                aria-label="Search inspirations"
              />
            </label>
            <label>
              <span>Content Pack</span>
              <select
                value={packFilter}
                onChange={(event) => setPackFilter(event.target.value)}
                aria-label="Filter by content pack"
              >
                {packOptions.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Source Type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by source type"
              >
                {sourceTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Theme</span>
              <select
                value={themeFilter}
                onChange={(event) => setThemeFilter(event.target.value)}
                aria-label="Filter by theme"
              >
                {themes.map((theme) => (
                  <option key={theme}>{theme}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                aria-label="Sort inspirations"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inspirations-page__clear-btn"
              type="button"
              onClick={clearFilters}
              disabled={!activeFilterCount}
            >
              Clear {activeFilterCount ? `(${activeFilterCount})` : ""}
            </button>
          </div>
          <div className="inspirations-page__library-head">
            <div>
              <p className="eyebrow">Visual Source Cards</p>
              <h2>{cards.length ? `${cards.length} usable source${cards.length === 1 ? "" : "s"}` : "No matching sources"}</h2>
            </div>
            <span>{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : "All sources"}</span>
          </div>

          <div className="inspirations-page__grid">
            {cards.map((inspiration) => {
              const packLabel = getContentPackLabel("inspirations", inspiration);
              const isActive = activeInspiration?.id === inspiration.id;

              return (
                <article
                  key={inspiration.id}
                  className={`inspirations-page__card ${isActive ? "is-active" : ""}`}
                >
                  <button
                    className="inspirations-page__card-image"
                    type="button"
                    onClick={() => setActiveInspirationId(inspiration.id)}
                    aria-label={`Open ${getInspirationTitle(inspiration)} dossier`}
                  >
                    <span
                      className="inspirations-page__visual"
                      role="img"
                      aria-label={inspiration.media?.imageNote || getInspirationTitle(inspiration)}
                    >
                      <InspirationImage inspiration={inspiration} />
                    </span>
                    <span className="inspirations-page__card-type">{packLabel}</span>
                  </button>

                  <div className="inspirations-page__body">
                    <strong>{getInspirationTitle(inspiration)}</strong>
                    <span>{getInspirationCaption(inspiration)}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {!cards.length && <div className="empty">No inspirations match these filters.</div>}
        </section>

        <aside className="inspirations-page__dossier inspirations-panel" aria-label="Selected inspiration dossier">
          {activeInspiration ? (
            <div key={activeInspiration.id} className="inspirations-page__dossier-content">
              <div
                className="inspirations-page__detail-visual"
                role="img"
                aria-label={activeInspiration.media?.imageNote || getInspirationTitle(activeInspiration)}
              >
                <InspirationImage inspiration={activeInspiration} />
              </div>

              <div className="inspirations-page__dossier-head">
                <p className="eyebrow">Selected Source</p>
                <h2>{getInspirationTitle(activeInspiration)}</h2>
                <p>{getSourceType(activeInspiration, activeSourceAnchor)}</p>
                {activeContentPack && (
                  <span className="inspirations-page__pack-badge">
                    Content Pack · {activeContentPack.title}
                  </span>
                )}
              </div>

              <div className="inspirations-page__use-actions" aria-label="Use this inspiration">
                <button
                  className="inspirations-page__primary-action"
                  type="button"
                  onClick={() => openMonsterComposerFrom(activeInspiration)}
                  disabled={!onOpenMonsterComposer || !activeSourceAnchorId}
                >
                  Use as Monster Seed
                </button>
                <span>
                  {linkedComponents.length
                    ? `${linkedComponents.length} linked graft${linkedComponents.length === 1 ? "" : "s"}`
                    : "Awaiting linked grafts"}
                </span>
              </div>

              <div className="inspirations-page__detail-main">
                <section>
                  <h3>What It Is</h3>
                  <p>{getInspirationCaption(activeInspiration)}</p>
                </section>
                <section>
                  <h3>Why It Disturbs</h3>
                  <p>{getInspirationLogic(activeInspiration, activeSourceAnchor)}</p>
                </section>
                <section>
                  <h3>Cruor Themes</h3>
                  <div className="inspirations-page__chips">
                    {(activeThemes.length ? activeThemes : ["Unsorted"]).map((theme) => (
                      <span key={theme}>{theme}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>Cruor Motifs</h3>
                  <div className="inspirations-page__chips">
                    {(activeMotifs.length ? activeMotifs : ["Unsorted"]).map((motif) => (
                      <span key={motif}>{motif}</span>
                    ))}
                  </div>
                </section>
                {activeHorror.length ? (
                  <section>
                    <h3>Horror Texture</h3>
                    <div className="inspirations-page__chips">
                      {activeHorror.map((texture) => (
                        <span key={texture}>{texture}</span>
                      ))}
                    </div>
                  </section>
                ) : null}
                <section>
                  <div className="inspirations-page__section-head">
                    <h3>Linked Monster Components</h3>
                    <strong>
                      {linkedComponents.length
                        ? `${displayedComponentCount}/${linkedComponents.length}`
                        : "0"}
                    </strong>
                  </div>
                  {linkedComponents.length ? (
                    <div className="inspirations-page__component-groups">
                      {Object.entries(groupedComponents).map(([slotId, components]) => (
                        <ComponentGroup key={slotId} slotId={slotId} components={components} />
                      ))}
                    </div>
                  ) : (
                    <p>No shared Monster Components are linked to this Source Anchor yet.</p>
                  )}
                </section>
              </div>
            </div>
          ) : (
            <div className="inspirations-page__empty-dossier">
              <p className="eyebrow">No Source Selected</p>
              <h2>Choose a card to open its dossier.</h2>
              <p>Each source can become a monster seed, scene pressure, motif cluster, or reusable horror reference.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
