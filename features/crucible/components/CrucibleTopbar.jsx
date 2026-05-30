export default function CrucibleTopbar({
  eyebrow = "Crucible",
  titlePrefix = "I need to",
  title,
  summary,
  tools = [],
  activeToolId,
  onToolChange,
  workflowSlot = null,
}) {
  return (
    <div className="darken-workspace__topbar crucible-workspace__topbar">
      <header className="darken-topbar crucible-topbar">
        <div className="darken-topbar__primary crucible-topbar__primary">
          <p className="darken-topbar__eyebrow">{eyebrow}</p>

          <div className="crucible-topbar__heading">
            <h1 className="darken-topbar__title">
              <span className="darken-topbar__title-prefix">{titlePrefix}</span>
              <span id="needValue" className="darken-topbar__need-value">
                {title}
              </span>
            </h1>

            {summary ? <p className="crucible-topbar__summary">{summary}</p> : null}
          </div>

          <div className="darken-topbar__control-row crucible-topbar__control-row">
            {workflowSlot}

            <div
              className="darken-workspace__tabs crucible-workspace__tabs"
              role="tablist"
              aria-label="Crucible tools"
            >
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className={
                    activeToolId === tool.id
                      ? "darken-workspace__tab is-active"
                      : "darken-workspace__tab"
                  }
                  type="button"
                  role="tab"
                  aria-selected={activeToolId === tool.id}
                  aria-controls={tool.panelId}
                  id={`crucibleToolTab-${tool.id}`}
                  onClick={() => onToolChange?.(tool.id)}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
