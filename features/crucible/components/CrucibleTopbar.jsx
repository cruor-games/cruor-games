function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CRUCIBLE_TOOL_COPY = {
  darken: {
    label: "Darken a Location",
    icon: "fa-solid fa-location-dot",
  },
  monster: {
    label: "Build a Monster",
    icon: "fa-solid fa-skull",
  },
};

function getIconClass(item, fallback = "fa-solid fa-circle") {
  return item?.icon || item?.iconClass || fallback;
}

function getTooltipTitle(item) {
  return item?.tooltip || item?.label || item?.shortLabel || "Open";
}

function getTooltipDescription(item) {
  return item?.tooltipDescription || item?.summary || item?.description || "";
}

function getActiveTool(activeGeneratorId, generators = []) {
  const configuredTool = generators.find((generator) => generator.id === activeGeneratorId);
  const fallbackTool = CRUCIBLE_TOOL_COPY[activeGeneratorId] || {};

  return {
    id: activeGeneratorId || configuredTool?.id || "crucible",
    label: configuredTool?.label || configuredTool?.shortLabel || fallbackTool.label || "Crucible",
    icon: getIconClass(configuredTool || fallbackTool, "fa-solid fa-flask-vial"),
  };
}


export default function CrucibleTopbar({
  generators = [],
  activeGeneratorId,
  views = [],
  activeViewId,
  onViewChange,
}) {
  const currentTool = getActiveTool(activeGeneratorId, generators);
  const shouldShowViewTabs = views.length > 1;
  const singleView = views.length === 1 ? views[0] : null;

  return (
    <div
      className="darken-workspace__topbar crucible-workspace__topbar crucible-topbar-shell"
      data-active-generator={activeGeneratorId || ""}
      data-active-view={activeViewId || ""}
    >
      <header className="darken-topbar crucible-topbar" aria-label={currentTool.label}>
        <div className="darken-topbar__primary crucible-topbar__primary">
          <div className="crucible-topbar__heading">
            <h1 className="darken-topbar__title crucible-topbar__title">
              <span className="crucible-topbar__tool-icon" aria-hidden="true">
                <i className={currentTool.icon} />
              </span>

              <span className="crucible-topbar__tool-label">
                <span className="crucible-topbar__tool-label-prefix">I need to</span>
                <span className="crucible-topbar__tool-switch">{currentTool.label}</span>
              </span>
            </h1>

            {singleView ? (
              <span id={`crucibleViewTab-${activeGeneratorId}-${singleView.id}`} className="sr-only">
                {currentTool.label} {singleView.label || singleView.id}
              </span>
            ) : null}
          </div>

          {shouldShowViewTabs ? (
            <div className="darken-topbar__control-row crucible-topbar__control-row">
              <div className="crucible-topbar__control-group crucible-topbar__control-group--views">
                <div
                  className="darken-workspace__tabs crucible-workspace__tabs crucible-view-tabs"
                  role="tablist"
                  aria-label={`${currentTool.label} views`}
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
