import { useMemo, useState } from "react";
import {
  INSPIRATION_CARDS,
  SOURCE_DETAILS,
  SOURCE_TYPES,
  THEMES,
} from "../crucible/crucible.sources-data.js";
import {
  STATIC_CONTENT_REGISTRY,
  getSourceAnchorId,
} from "../../shared/content/index.js";
import "./styles.css";

const MONSTER_COMPONENT_DISPLAY_LIMIT = 18;

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

function getSourceAnchorMeta(anchor) {
  return STATIC_CONTENT_REGISTRY.getSourceAnchor(getSourceAnchorId(anchor));
}

function getRegistryInspiration(anchor) {
  const sourceAnchorId = getSourceAnchorId(anchor);
  return (
    STATIC_CONTENT_REGISTRY.getLinkedInspirations(sourceAnchorId).find(
      (item) => item.sourceAnchors?.includes(sourceAnchorId),
    ) || null
  );
}

function getLinkedRegistryComponents(anchor) {
  const sourceAnchorId = getSourceAnchorId(anchor);
  return STATIC_CONTENT_REGISTRY.getLinkedComponents(sourceAnchorId, {
    workflow: "monster-composer",
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

function formatComponentMeta(component) {
  const cost = Number(component.monster?.cost || 0);
  const costText = cost > 0 ? `+${cost}` : String(cost);
  return `Pressure ${costText} · Complexity ${component.monster?.complexity ?? 0}`;
}

function InspirationImage({ card }) {
  const [failed, setFailed] = useState(false);
  if (!card.imageUrl || failed) {
    return <i className={`fa-solid ${card.icon}`} aria-hidden="true" />;
  }
  return (
    <img
      src={card.imageUrl}
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
  const [activeAnchor, setActiveAnchor] = useState("");

  const cards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return INSPIRATION_CARDS.filter((card) => {
      const details = SOURCE_DETAILS[card.anchor] || {
        sourceType: "",
        themes: [],
        motifs: [],
      };
      if (typeFilter !== "Any Type" && details.sourceType !== typeFilter)
        return false;
      if (
        themeFilter !== "Any Theme" &&
        !(details.themes || []).includes(themeFilter)
      )
        return false;
      if (!query) return true;
      const sourceAnchor = getSourceAnchorMeta(card.anchor);
      const registryInspiration = getRegistryInspiration(card.anchor);
      const linkedComponents = getLinkedRegistryComponents(card.anchor);
      const haystack = [
        card.anchor,
        card.caption,
        details.sourceType,
        details.logic,
        sourceAnchor?.summary,
        registryInspiration?.summary,
        ...(details.themes || []),
        ...(details.motifs || []),
        ...(sourceAnchor?.themes || []),
        ...(sourceAnchor?.motifs || []),
        ...linkedComponents.map((component) => component.title),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, typeFilter, themeFilter]);

  const activeCard = INSPIRATION_CARDS.find(
    (card) => card.anchor === activeAnchor,
  );
  const activeDetails = activeAnchor ? SOURCE_DETAILS[activeAnchor] || {} : null;
  const activeSourceAnchor = activeAnchor ? getSourceAnchorMeta(activeAnchor) : null;
  const activeRegistryInspiration = activeAnchor
    ? getRegistryInspiration(activeAnchor)
    : null;
  const linkedComponents = activeAnchor
    ? getLinkedRegistryComponents(activeAnchor)
    : [];
  const groupedComponents = groupComponentsBySlot(linkedComponents);
  const displayedComponentCount = Math.min(
    linkedComponents.length,
    MONSTER_COMPONENT_DISPLAY_LIMIT,
  );

  return (
    <section className="inspirations-page" aria-label="Inspirations archive">
      <header className="inspirations-page__head">
        <div>
          <p className="eyebrow">Public Archive</p>
          <h1>Inspirations</h1>
          <p>
            Real-world processes, rituals, images, and horror premises that feed
            Cruor components.
          </p>
        </div>
        <p className="inspirations-page__note">
          This archive now reads linked content from the shared Cruor registry.
          Existing Composer, Crucible, and Monster data remain unchanged.
        </p>
      </header>

      <div
        className="inspirations-page__tools"
        aria-label="Inspiration filters"
      >
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
          {SOURCE_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select
          value={themeFilter}
          onChange={(event) => setThemeFilter(event.target.value)}
          aria-label="Filter by theme"
        >
          {["Any Theme", ...THEMES].map((theme) => (
            <option key={theme}>{theme}</option>
          ))}
        </select>
      </div>

      <div className="inspirations-page__grid">
        {cards.map((card) => {
          const details = SOURCE_DETAILS[card.anchor] || { motifs: [] };
          const sourceAnchor = getSourceAnchorMeta(card.anchor);
          const count = getLinkedRegistryComponents(card.anchor).length;
          return (
            <button
              key={card.anchor}
              className="inspirations-page__card"
              type="button"
              onClick={() => setActiveAnchor(card.anchor)}
            >
              <span
                className="inspirations-page__visual"
                role="img"
                aria-label={card.imageNote}
              >
                <InspirationImage card={card} />
              </span>
              <span className="inspirations-page__body">
                <strong>{card.anchor}</strong>
                <span>{card.caption}</span>
                <em>
                  {(details.motifs || sourceAnchor?.motifs || [])
                    .slice(0, 3)
                    .join(" / ") || "source anchor"}
                </em>
                <small>
                  {count
                    ? `${count} registry component${count === 1 ? "" : "s"}`
                    : "No registry components yet"}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      {!cards.length && (
        <div className="empty">No inspirations match these filters.</div>
      )}

      {activeCard && activeDetails && (
        <div
          className="inspirations-page__backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveAnchor("");
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
                <h2 id="inspirationPageDetailTitle">{activeCard.anchor}</h2>
                <p>
                  {activeSourceAnchor?.type ||
                    activeDetails.sourceType ||
                    "Inspiration"}
                </p>
              </div>
              <button
                className="icon-btn"
                type="button"
                title="Close"
                aria-label="Close inspiration detail"
                onClick={() => setActiveAnchor("")}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </header>
            <div className="inspirations-page__modal-body">
              <div
                className="inspirations-page__detail-visual"
                role="img"
                aria-label={activeCard.imageNote}
              >
                <InspirationImage card={activeCard} />
              </div>
              <div className="inspirations-page__detail-main">
                <section>
                  <h3>What It Is</h3>
                  <p>{activeRegistryInspiration?.summary || activeCard.caption}</p>
                </section>
                <section>
                  <h3>Why It Disturbs</h3>
                  <p>
                    {activeDetails.logic ||
                      activeSourceAnchor?.summary ||
                      "This inspiration provides concrete images and pressures that can become playable horror components."}
                  </p>
                </section>
                <section>
                  <h3>Cruor Themes</h3>
                  <div className="inspirations-page__chips">
                    {[
                      ...new Set([
                        ...(activeDetails.themes || []),
                        ...(activeSourceAnchor?.themes || []),
                      ]),
                    ].map((theme) => (
                      <span key={theme}>{theme}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>Cruor Motifs</h3>
                  <div className="inspirations-page__chips">
                    {[
                      ...new Set([
                        ...(activeDetails.motifs || []),
                        ...(activeSourceAnchor?.motifs || []),
                      ]),
                    ].map((motif) => (
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
                        <article
                          key={slotId}
                          className="inspirations-page__component-group"
                        >
                          <h4>
                            <span>{SLOT_LABELS[slotId] || slotId}</span>
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
                    <p>
                      No shared Monster Components are linked to this Source
                      Anchor yet.
                    </p>
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
