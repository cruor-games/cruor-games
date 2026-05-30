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
  eyebrow = "Crucible",
  titlePrefix = "I need to",
  title,
  summary,
  generators = [],
  activeGeneratorId,
  onGeneratorChange,
  views = [],
  activeViewId,
  activeViewLabel,
  onViewChange,
  legacyWorkflowSlot = null,
}) {
  const activeGenerator = generators.find((generator) => generator.id === activeGeneratorId);
  const activeView = views.find((view) => view.id === activeViewId);
  const currentGeneratorLabel = activeGenerator?.label || title || eyebrow || "Crucible";
  const currentViewLabel = activeView?.label || activeViewLabel || "Workspace";

  return (
    <div
      className="darken-workspace__topbar crucible-workspace__topbar crucible-topbar-shell"
      data-active-generator={activeGeneratorId || ""}
      data-active-view={activeViewId || ""}
    >
      <header
        className="darken-topbar crucible-topbar"
        aria-label={`${currentGeneratorLabel}: ${currentViewLabel}`}
      >
        <div className="darken-topbar__primary crucible-topbar__primary">
          <div className="crucible-topbar__heading">
            <h1 className="darken-topbar__title crucible-topbar__title">
              <span className="darken-topbar__title-prefix">{titlePrefix}</span>
              <span id="needValue" className="darken-topbar__need-value">
                {title}
              </span>
            </h1>

            {summary ? <p className="crucible-topbar__summary">{summary}</p> : null}

            <p className="crucible-topbar__state" aria-live="polite">
              <span>Generator</span>
              <strong>{currentGeneratorLabel}</strong>
              <span>View</span>
              <strong>{currentViewLabel}</strong>
            </p>
          </div>

          <div className="darken-topbar__control-row crucible-topbar__control-row">
            <div className="crucible-topbar__control-group crucible-topbar__control-group--generators">
              <div
                className="mode-switch darken-topbar__mode-switch crucible-generator-switch crucible-topbar__generator-switch"
                role="group"
                aria-label="Choose Crucible generator"
                data-crucible-control="generator-switch"
              >
                {generators.map((generator) => {
                  const isActive = activeGeneratorId === generator.id;
                  const label = generator.label || generator.shortLabel || generator.id;
                  const tooltipTitle = getTooltipTitle(generator);
                  const tooltipDescription = getTooltipDescription(generator);

                  return (
                    <button
                      key={generator.id}
                      className={cx(
                        "mode-btn crucible-generator-switch__btn crucible-topbar__generator-btn",
                        isActive && "active",
                      )}
                      type="button"
                      aria-label={label}
                      aria-pressed={isActive}
                      title={tooltipTitle}
                      data-tooltip={tooltipTitle}
                      data-tooltip-description={tooltipDescription}
                      data-crucible-generator={generator.id}
                      onClick={() => onGeneratorChange?.(generator.id)}
                    >
                      <i className={getIconClass(generator, "fa-solid fa-flask-vial")} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>

            {legacyWorkflowSlot ? (
              <div className="crucible-topbar__legacy-workflow-slot" hidden aria-hidden="true">
                {legacyWorkflowSlot}
              </div>
            ) : null}

            <div className="crucible-topbar__control-group crucible-topbar__control-group--views">
              <div
                className="darken-workspace__tabs crucible-workspace__tabs crucible-view-tabs"
                role="tablist"
                aria-label={`${title || "Crucible"} views`}
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
                      id={`crucibleViewTab-${view.id}`}
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
        </div>
      </header>
    </div>
  );
}
