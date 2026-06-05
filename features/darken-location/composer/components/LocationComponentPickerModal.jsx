import { useMemo, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getComponentKey(component) {
  return component?.id || component?.title || component?.name || "component";
}

function getComponentTitle(component) {
  return component?.title || component?.name || "Untitled Component";
}

function getComponentSummary(component) {
  return component?.summary || component?.description || component?.text || component?.effect || "";
}

export function LocationComponentPickerModal({
  activeRegion,
  assignedComponents = [],
  components = [],
  generatedRoom,
  isSlotFull,
  onAddComponent,
  onClose,
  onRemoveComponent,
  onSelectRegion,
  open,
  regions = [],
  slot,
}) {
  const [search, setSearch] = useState("");

  const assignedIds = useMemo(
    () => new Set(assignedComponents.map((component) => component.id).filter(Boolean)),
    [assignedComponents],
  );

  const visibleComponents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return components;

    return components.filter((component) => {
      const haystack = [
        component.title,
        component.name,
        component.type,
        component.summary,
        component.description,
        component.text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [components, search]);

  if (!open || !slot) return null;

  return (
    <div className="location-component-drawer" role="region" aria-label={`Choose ${slot.label}`}>
      <aside className="location-component-drawer__panel" aria-label="Location Component Picker">
        <div className="location-component-drawer__head">
          <div>
            <p className="location-kicker">Choose Slot Content</p>
            <h2>{slot.label}</h2>
          </div>
          <button
            className="cruor-composer-control location-icon-btn location-component-drawer__close"
            type="button"
            aria-label="Close Location Component Picker"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="location-component-drawer__target">
          <div>
            <span>Target Region</span>
            <strong>{activeRegion?.name || "No region selected"}</strong>
            {generatedRoom ? <small>Room {generatedRoom.number || "—"}</small> : null}
          </div>

          <div className="location-component-drawer__region-grid" aria-label="Choose target region">
            {regions.slice(0, 8).map((region, index) => (
              <button
                className={cx("cruor-composer-control location-region-inline-btn", activeRegion?.id === region.id && "is-active")}
                key={region.id}
                type="button"
                title={`Set ${region.name} as target`}
                onClick={() => onSelectRegion?.(region.id)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="location-component-drawer__tools">
          <div className="location-component-search-row">
            <div className="location-component-search">
              <input
                type="search"
                value={search}
                placeholder="Search options…"
                aria-label="Search location components"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="location-component-count" aria-label="Visible option count">
              {visibleComponents.length}
            </div>
          </div>
        </div>

        {assignedComponents.length ? (
          <div className="location-component-drawer__assigned" aria-label="Assigned components">
            <span>Assigned</span>
            <div>
              {assignedComponents.map((component) => (
                <button
                  className="cruor-composer-control location-component-drawer__assigned-pill"
                  key={`assigned-${getComponentKey(component)}`}
                  type="button"
                  onClick={() => onRemoveComponent?.(component.id)}
                >
                  {getComponentTitle(component)}
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="location-component-list">
          {visibleComponents.length ? visibleComponents.map((component) => {
            const componentKey = getComponentKey(component);
            const selected = assignedIds.has(component.id);
            return (
              <article
                className={cx("cruor-composer-card location-component-option", selected && "is-active")}
                key={componentKey}
              >
                <div>
                  <div className="location-component-option__meta">
                    <span>{component.type || "Component"}</span>
                    <em>{selected ? "Assigned" : isSlotFull ? "Replace" : "Available"}</em>
                  </div>
                  <h3>{getComponentTitle(component)}</h3>
                  {getComponentSummary(component) ? <p>{getComponentSummary(component)}</p> : null}
                </div>

                <button
                  className="cruor-composer-control location-component-option__action"
                  type="button"
                  onClick={() => (selected ? onRemoveComponent?.(component.id) : onAddComponent?.(component))}
                >
                  {selected ? "Remove" : isSlotFull ? "Replace" : "Add"}
                </button>
              </article>
            );
          }) : (
            <p className="location-empty location-empty--quiet">No compatible options.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
