function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pickText(...values) {
  return values.map(normalizeText).find(Boolean) || "";
}

function getAssignedText(components, matcher) {
  const component = components.find((item) => matcher([item.type, item.title, item.name, item.summary, item.description].filter(Boolean).join(" ").toLowerCase()));
  return pickText(component?.summary, component?.description, component?.text, component?.effect, component?.title, component?.name);
}

function getRoomIcon(region, generatedRoom) {
  const text = [region?.role, generatedRoom?.role, generatedRoom?.kind, generatedRoom?.type, generatedRoom?.shape, region?.name, generatedRoom?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("corridor") || text.includes("connector")) return "fa-route";
  if (text.includes("entrance") || text.includes("threshold")) return "fa-door-open";
  if (text.includes("clue")) return "fa-magnifying-glass";
  if (text.includes("hazard") || text.includes("danger")) return "fa-triangle-exclamation";
  if (text.includes("shaft") || text.includes("vertical")) return "fa-arrow-down-up-across-line";
  return "fa-dungeon";
}

function Fact({ label, value }) {
  if (!value) return null;

  return (
    <div className="region-fact-list__item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function LocationRoomRecapCard({ activeRegion, assignedComponents = [], generatedRoom, surfaceLabel }) {
  if (!activeRegion && !generatedRoom) return null;

  const title = pickText(generatedRoom?.name, activeRegion?.name, "Selected Region");
  const meta = [
    activeRegion?.role || generatedRoom?.role || "Region",
    generatedRoom ? "generated room" : "location region",
    activeRegion?.size || generatedRoom?.size || "",
    surfaceLabel || "",
  ].filter(Boolean).join(" · ");

  const read = pickText(
    generatedRoom?.readAloud,
    generatedRoom?.read,
    generatedRoom?.description,
    activeRegion?.readAloud,
    activeRegion?.summary,
    activeRegion?.description,
    assignedComponents[0]?.summary,
    assignedComponents[0]?.description,
    assignedComponents[0]?.title,
    "Select a slot option to define what the party notices here.",
  );

  const feature = pickText(
    generatedRoom?.feature,
    activeRegion?.feature,
    getAssignedText(assignedComponents, (text) => text.includes("premise") || text.includes("feature") || text.includes("anomaly")),
  );
  const interact = pickText(
    generatedRoom?.interaction,
    generatedRoom?.interact,
    activeRegion?.interaction,
    activeRegion?.interact,
    getAssignedText(assignedComponents, (text) => text.includes("sensory") || text.includes("interactive") || text.includes("detail")),
  );
  const danger = pickText(
    generatedRoom?.danger,
    activeRegion?.danger,
    getAssignedText(assignedComponents, (text) => text.includes("danger") || text.includes("hazard") || text.includes("pressure")),
  );
  const secret = pickText(
    generatedRoom?.secret,
    activeRegion?.secret,
    getAssignedText(assignedComponents, (text) => text.includes("secret") || text.includes("hidden") || text.includes("reveal")),
  );

  return (
    <article className="cruor-tooltip cruor-tooltip--room region-card cruor-tooltip-region-card location-room-recap-card" aria-label="Selected room recap">
      <div className="region-card__top">
        <div className="region-card__title">
          <i className={`fa-solid ${getRoomIcon(activeRegion, generatedRoom)}`} aria-hidden="true" />
          <div>
            <h3>{title}</h3>
            <div className="region-card__meta">{meta}</div>
          </div>
        </div>
      </div>

      {read ? <p className="region-card__read">{read}</p> : null}

      {(feature || interact || danger || secret) ? (
        <dl className="region-fact-list">
          <Fact label="Feature" value={feature} />
          <Fact label="Interact" value={interact} />
          <Fact label="Danger" value={danger} />
          <Fact label="Secret" value={secret} />
        </dl>
      ) : null}
    </article>
  );
}
