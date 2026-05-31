function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getIconClass(item, fallback = "fa-solid fa-circle") {
  return item?.icon || item?.iconClass || fallback;
}

function getTooltipTitle(item) {
  return item?.tooltip || item?.label || item?.shortLabel || "Open";
}

function getTooltipDescription(item) {
  return item?.tooltipDescription || item?.summary || item?.description || "";
}

export default function CrucibleTopbar({
  titlePrefix = "I need to",
  generators = [],
  activeGeneratorId,
  onGeneratorChange,
  views = [],
  activeViewId,
  onViewChange,
  legacyWorkflowSlot = null,
}) {
  const activeGenerator = generators.find((generator) => generator.id === activeGeneratorId);
  const currentGeneratorLabel = activeGenerator?.label || "Crucible";

  return (
    <div
      className="darken-workspace__topbar crucible-workspace__topbar crucible-topbar-shell"
      data-active-generator={activeGeneratorId || ""}
      data-active-view={activeViewId || ""}
    >
      <header className="darken-topbar crucible-topbar" aria-label="Crucible">
        <div className="darken-topbar__primary crucible-topbar__primary">
          <div className="crucible-topbar__heading">
            <h1 className="darken-topbar__title crucible-topbar__title">
              <span className="darken-topbar__title-prefix">{titlePrefix}</span>

              <label className="sr-only" htmlFor="crucibleGeneratorSelect">
                Crucible tool
              </label>
              <select
                id="crucibleGeneratorSelect"
                className="crucible-topbar__tool-select"
                value={activeGeneratorId || ""}
                aria-label="Crucible tool"
                onChange={(event) => onGeneratorChange?.(event.target.value)}
              >
                {generators.map((generator) => (
                  <option key={generator.id} value={generator.id}>
                    {generator.label || generator.shortLabel || generator.id}
                  </option>
                ))}
              </select>
            </h1>
          </div>

          {legacyWorkflowSlot ? (
            <div className="crucible-topbar__legacy-workflow-slot" hidden aria-hidden="true">
              {legacyWorkflowSlot}
            </div>
          ) : null}

          {views.length ? (
            <div className="darken-topbar__control-row crucible-topbar__control-row">
              <div className="crucible-topbar__control-group crucible-topbar__control-group--views">
                <div
                  className="darken-workspace__tabs crucible-workspace__tabs crucible-view-tabs"
                  role="tablist"
                  aria-label={`${currentGeneratorLabel} views`}
                  data-crucible-control="view-tabs"
                >
                  {views.map((view) => {
                    const isActive = activeViewId === view.id;
                    const label = view.label || view.id;
                    const tooltipTitle = getTooltipTitle(view);
                    const tooltipDescription = getTooltipDescription(view);

                    return (
                      <button
                        key={view.id}
                        className={cx(
                          "darken-workspace__tab crucible-view-tabs__btn",
                          isActive && "is-active",
                        )}
                        type="button"
                        role="tab"
                        aria-label={label}
                        aria-selected={isActive}
                        aria-controls={view.panelId}
                        id={`crucibleViewTab-${activeGeneratorId}-${view.id}`}
                        title={tooltipTitle}
                        data-tooltip={tooltipTitle}
                        data-tooltip-description={tooltipDescription}
                        data-crucible-view={view.id}
                        onClick={() => onViewChange?.(view.id)}
                      >
                        <i className={getIconClass(view, "fa-solid fa-circle-dot")} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </div>
  );
}
