function cx(...parts) {
  return parts.filter(Boolean).join(" ");
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

  return (
    <div
      className="darken-workspace__topbar crucible-workspace__topbar crucible-topbar-shell"
      data-active-generator={activeGeneratorId || ""}
      data-active-view={activeViewId || ""}
    >
      <header className="darken-topbar crucible-topbar">
        <div className="darken-topbar__primary crucible-topbar__primary">
          <p className="darken-topbar__eyebrow crucible-topbar__eyebrow">{eyebrow}</p>

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
              <strong>{activeGenerator?.label || title || "Crucible"}</strong>
              <span>View</span>
              <strong>{activeView?.label || activeViewLabel || "Workspace"}</strong>
            </p>
          </div>

          <div className="darken-topbar__control-row crucible-topbar__control-row">
            <div className="crucible-topbar__control-group crucible-topbar__control-group--generators">
              <span className="crucible-topbar__control-label">Generator</span>

              <div
                className="mode-switch darken-topbar__mode-switch crucible-generator-switch crucible-topbar__generator-switch"
                role="group"
                aria-label="Choose Crucible generator"
                data-crucible-control="generator-switch"
              >
                {generators.map((generator) => {
                  const isActive = activeGeneratorId === generator.id;

                  return (
                    <button
                      key={generator.id}
                      className={cx(
                        "mode-btn crucible-generator-switch__btn crucible-topbar__generator-btn",
                        isActive && "active",
                      )}
                      type="button"
                      aria-pressed={isActive}
                      data-crucible-generator={generator.id}
                      onClick={() => onGeneratorChange?.(generator.id)}
                    >
                      <span className="crucible-generator-switch__label">
                        {generator.shortLabel || generator.label}
                      </span>
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
              <span className="crucible-topbar__control-label">View</span>

              <div
                className="darken-workspace__tabs crucible-workspace__tabs crucible-view-tabs"
                role="tablist"
                aria-label={`${title || "Crucible"} views`}
                data-crucible-control="view-tabs"
              >
                {views.map((view) => {
                  const isActive = activeViewId === view.id;

                  return (
                    <button
                      key={view.id}
                      className={cx(
                        "darken-workspace__tab crucible-view-tabs__btn",
                        isActive && "is-active",
                      )}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={view.panelId}
                      id={`crucibleViewTab-${view.id}`}
                      data-crucible-view={view.id}
                      onClick={() => onViewChange?.(view.id)}
                    >
                      {view.label}
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
