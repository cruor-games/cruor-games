import { useMemo, useState } from "react";
import {
  STATIC_CONTENT_PACK_PROVENANCE,
  STATIC_CONTENT_REGISTRY,
  getSourceAnchorId,
} from "../../shared/content/index.js";
import "./styles.css";

const MONSTER_COMPONENT_DISPLAY_LIMIT = 18;
const INSPIRATION_WORKFLOW_ID = "inspiration-archive";
const MONSTER_WORKFLOW_ID = "monster-composer";

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

export default function InspirationsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Any Type");
  const [themeFilter, setThemeFilter] = useState("Any Theme");
  const [activeInspirationId, setActiveInspirationId] = useState("");

  const allInspirations = useMemo(() => {
    return STATIC_CONTENT_REGISTRY.getInspirations({ workflow: INSPIRATION_WORKFLOW_ID }).sort((a, b) =>
      getInspirationTitle(a).localeCompare(getInspirationTitle(b)),
    );
  }, []);

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

    return allInspirations.filter((inspiration) => {
      const sourceAnchor = getSourceAnchorMeta(inspiration);
      const linkedComponents = getLinkedRegistryComponents(inspiration);
      const sourceType = getSourceType(inspiration, sourceAnchor);
      const themeValues = uniqueArray([...(inspiration.themes || []), ...(sourceAnchor?.themes || [])]);

      if (typeFilter !== "Any Type" && sourceType !== typeFilter && !inspiration.sourceTypes?.includes(typeFilter)) {
        return false;
      }

      if (themeFilter !== "Any Theme" && !themeValues.includes(themeFilter)) {
        return false;
      }

      if (!query) return true;

      return buildRegistryHaystack(inspiration, sourceAnchor, linkedComponents).includes(query);
    });
  }, [allInspirations, search, typeFilter, themeFilter]);

  const activeInspiration = allInspirations.find((item) => item.id === activeInspirationId) || null;
  const activeSourceAnchor = activeInspiration ? getSourceAnchorMeta(activeInspiration) : null;
  const linkedComponents = activeInspiration ? getLinkedRegistryComponents(activeInspiration) : [];
  const groupedComponents = groupComponentsBySlot(linkedComponents);
  const displayedComponentCount = Math.min(
    linkedComponents.length,
    MONSTER_COMPONENT_DISPLAY_LIMIT,
  );
  const activeThemes = activeInspiration
    ? uniqueArray([...(activeInspiration.themes || []), ...(activeSourceAnchor?.themes || [])])
    : [];
  const activeMotifs = activeInspiration
    ? uniqueArray([...(activeInspiration.motifs || []), ...(activeSourceAnchor?.motifs || [])])
    : [];
  const activeContentPack = activeInspiration ? getContentPack("inspirations", activeInspiration) : null;

  return (
    <section className="inspirations-page" aria-label="Inspirations archive">
      <header className="inspirations-page__head">
        <div>
          <p className="eyebrow">Public Archive</p>
          <h1>Inspirations</h1>
          <p>
            Real-world processes, rituals, images, and horror premises that feed Cruor
            components.
          </p>
        </div>
        <p className="inspirations-page__note">
          This archive now uses the shared Cruor registry as its content source.
          Existing Composer, Crucible, and Monster data remain unchanged.
        </p>
      </header>

      <div className="inspirations-page__tools" aria-label="Inspiration filters">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          type="search"
          placeholder="Search inspirations, themes, motifs, components..."
          aria-label="Search inspirations"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filter by source type"
        >
          {sourceTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select
          value={themeFilter}
          onChange={(event) => setThemeFilter(event.target.value)}
          aria-label="Filter by theme"
        >
          {themes.map((theme) => (
            <option key={theme}>{theme}</option>
          ))}
        </select>
      </div>

      <div className="inspirations-page__grid">
        {cards.map((inspiration) => {
          const sourceAnchor = getSourceAnchorMeta(inspiration);
          const linkedCount = getLinkedRegistryComponents(inspiration).length;
          const motifs = uniqueArray([...(inspiration.motifs || []), ...(sourceAnchor?.motifs || [])]);
          const packLabel = getContentPackLabel("inspirations", inspiration);

          return (
            <button
              key={inspiration.id}
              className="inspirations-page__card"
              type="button"
              onClick={() => setActiveInspirationId(inspiration.id)}
            >
              <span
                className="inspirations-page__visual"
                role="img"
                aria-label={inspiration.media?.imageNote || getInspirationTitle(inspiration)}
              >
                <InspirationImage inspiration={inspiration} />
              </span>
              <span className="inspirations-page__body">
                <strong>{getInspirationTitle(inspiration)}</strong>
                <span>{getInspirationCaption(inspiration)}</span>
                <em>{motifs.slice(0, 3).join(" / ") || "source anchor"}</em>
                <small>
                  {packLabel} · {linkedCount
                    ? `${linkedCount} registry component${linkedCount === 1 ? "" : "s"}`
                    : "No registry components yet"}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      {!cards.length && <div className="empty">No inspirations match these filters.</div>}

      {activeInspiration && (
        <div
          className="inspirations-page__backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveInspirationId("");
          }}
        >
          <section
            className="inspirations-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspirationPageDetailTitle"
          >
            <header className="inspirations-page__modal-head">
              <div>
                <p className="eyebrow">Inspiration Archive</p>
                <h2 id="inspirationPageDetailTitle">{getInspirationTitle(activeInspiration)}</h2>
                <p>{getSourceType(activeInspiration, activeSourceAnchor)}</p>
                {activeContentPack && (
                  <span className="inspirations-page__pack-badge">
                    Content Pack · {activeContentPack.title}
                  </span>
                )}
              </div>
              <button
                className="icon-btn"
                type="button"
                title="Close"
                aria-label="Close inspiration detail"
                onClick={() => setActiveInspirationId("")}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </header>
            <div className="inspirations-page__modal-body">
              <div
                className="inspirations-page__detail-visual"
                role="img"
                aria-label={activeInspiration.media?.imageNote || getInspirationTitle(activeInspiration)}
              >
                <InspirationImage inspiration={activeInspiration} />
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
                    {activeThemes.map((theme) => (
                      <span key={theme}>{theme}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>Cruor Motifs</h3>
                  <div className="inspirations-page__chips">
                    {activeMotifs.map((motif) => (
                      <span key={motif}>{motif}</span>
                    ))}
                  </div>
                </section>
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
                        <article key={slotId} className="inspirations-page__component-group">
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
                      ))}
                    </div>
                  ) : (
                    <p>No shared Monster Components are linked to this Source Anchor yet.</p>
                  )}
                </section>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
