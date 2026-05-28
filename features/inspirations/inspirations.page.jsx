import { useMemo, useState } from "react";
import { COMPONENTS } from "../crucible/crucible.components-data.js";
import { INSPIRATION_CARDS, SOURCE_DETAILS, SOURCE_TYPES, THEMES } from "../crucible/crucible.sources-data.js";
import "./styles.css";

function getLinkedComponents(anchor) {
  return COMPONENTS.filter((component) => component.sourceAnchors.includes(anchor));
}

function InspirationImage({ card }) {
  const [failed, setFailed] = useState(false);
  if (!card.imageUrl || failed) {
    return <i className={`fa-solid ${card.icon}`} aria-hidden="true" />;
  }
  return <img src={card.imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

export default function InspirationsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Any Type");
  const [themeFilter, setThemeFilter] = useState("Any Theme");
  const [activeAnchor, setActiveAnchor] = useState("");

  const cards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return INSPIRATION_CARDS.filter((card) => {
      const details = SOURCE_DETAILS[card.anchor] || { sourceType: "", themes: [], motifs: [] };
      if (typeFilter !== "Any Type" && details.sourceType !== typeFilter) return false;
      if (themeFilter !== "Any Theme" && !(details.themes || []).includes(themeFilter)) return false;
      if (!query) return true;
      const haystack = [card.anchor, card.caption, details.sourceType, ...(details.themes || []), ...(details.motifs || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [search, typeFilter, themeFilter]);

  const activeCard = INSPIRATION_CARDS.find((card) => card.anchor === activeAnchor);
  const activeDetails = activeAnchor ? SOURCE_DETAILS[activeAnchor] : null;
  const linkedComponents = activeAnchor ? getLinkedComponents(activeAnchor) : [];

  return (
    <section className="inspirations-page" aria-label="Inspirations archive">
      <header className="inspirations-page__head">
        <div>
          <p className="eyebrow">Public Archive</p>
          <h1>Inspirations</h1>
          <p>Real-world processes, rituals, images, and horror premises that feed Cruor components.</p>
        </div>
        <p className="inspirations-page__note">This page is read-only for now. The Crucible Draw From picker still controls active build inspirations.</p>
      </header>

      <div className="inspirations-page__tools" aria-label="Inspiration filters">
        <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search inspirations, themes, motifs..." aria-label="Search inspirations" />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by source type">
          {SOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value)} aria-label="Filter by theme">
          {["Any Theme", ...THEMES].map((theme) => <option key={theme}>{theme}</option>)}
        </select>
      </div>

      <div className="inspirations-page__grid">
        {cards.map((card) => {
          const details = SOURCE_DETAILS[card.anchor] || { motifs: [] };
          const count = getLinkedComponents(card.anchor).length;
          return (
            <button key={card.anchor} className="inspirations-page__card" type="button" onClick={() => setActiveAnchor(card.anchor)}>
              <span className="inspirations-page__visual" role="img" aria-label={card.imageNote}>
                <InspirationImage card={card} />
              </span>
              <span className="inspirations-page__body">
                <strong>{card.anchor}</strong>
                <span>{card.caption}</span>
                <em>{(details.motifs || []).slice(0, 3).join(" / ") || "source anchor"}</em>
                <small>{count} linked components</small>
              </span>
            </button>
          );
        })}
      </div>

      {!cards.length && <div className="empty">No inspirations match these filters.</div>}

      {activeCard && activeDetails && (
        <div className="inspirations-page__backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveAnchor("");
        }}>
          <section className="inspirations-page__modal" role="dialog" aria-modal="true" aria-labelledby="inspirationPageDetailTitle">
            <header className="inspirations-page__modal-head">
              <div>
                <p className="eyebrow">Inspiration Archive</p>
                <h2 id="inspirationPageDetailTitle">{activeCard.anchor}</h2>
                <p>{activeDetails.sourceType || "Inspiration"}</p>
              </div>
              <button className="icon-btn" type="button" title="Close" aria-label="Close inspiration detail" onClick={() => setActiveAnchor("")}>
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </header>
            <div className="inspirations-page__modal-body">
              <div className="inspirations-page__detail-visual" role="img" aria-label={activeCard.imageNote}>
                <InspirationImage card={activeCard} />
              </div>
              <div className="inspirations-page__detail-main">
                <section><h3>What It Is</h3><p>{activeCard.caption}</p></section>
                <section><h3>Why It Disturbs</h3><p>{activeDetails.logic || "This inspiration provides concrete images and pressures that can become playable horror components."}</p></section>
                <section><h3>Cruor Themes</h3><div className="inspirations-page__chips">{(activeDetails.themes || []).map((theme) => <span key={theme}>{theme}</span>)}</div></section>
                <section><h3>Cruor Motifs</h3><div className="inspirations-page__chips">{(activeDetails.motifs || []).map((motif) => <span key={motif}>{motif}</span>)}</div></section>
                <section><h3>Linked Components</h3><div className="inspirations-page__linked">{linkedComponents.map((component) => <span key={component.id}>{component.title}</span>)}</div></section>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
