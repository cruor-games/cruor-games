const APP_MODE_OPTIONS = [
  { id: "simple", label: "Simple" },
  { id: "advanced", label: "Advanced" },
  { id: "debug", label: "Debug" },
];

const APP_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "crucible", label: "Crucible" },
  { id: "inspirations", label: "Inspirations" },
];

export default function AppShell({
  activeSection = "home",
  activeUiMode = "simple",
  onSectionChange,
  onUiModeChange,
  homeContent,
  crucibleContent,
  inspirationsContent,
}) {
  return (
    <div className="app-shell" data-ui-mode={activeUiMode}>
      <header className="app-shell__bar">
        <div className="app-shell__bar-inner">
          <div className="app-shell__brand" aria-label="Cruor Games">
            <span className="app-shell__logo-mark" aria-hidden="true">
              <span className="app-shell__logo-letter">C</span>
            </span>
            <div className="app-shell__brand-copy">
              <strong>Cruor Games</strong>
              <span className="app-shell__eyebrow">Dark Fantasy Workbench</span>
            </div>
          </div>

          <div className="app-shell__bar-actions">
            <nav className="app-shell__nav" aria-label="Primary sections">
              {APP_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  className={
                    activeSection === section.id
                      ? "app-shell__nav-item is-active"
                      : "app-shell__nav-item"
                  }
                  type="button"
                  aria-current={activeSection === section.id ? "page" : undefined}
                  onClick={() => onSectionChange?.(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </nav>

            <div className="app-shell__mode-cluster">
              <span className="app-shell__mode-label">Mode</span>
              <div className="app-shell__mode-switch" role="group" aria-label="Interface mode">
                {APP_MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    className={
                      activeUiMode === mode.id
                        ? "app-shell__mode-item is-active"
                        : "app-shell__mode-item"
                    }
                    type="button"
                    aria-pressed={activeUiMode === mode.id}
                    onClick={() => onUiModeChange?.(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-shell__workspace">
        {activeSection === "home" ? (
          <section aria-label="Home">{homeContent}</section>
        ) : null}

        {activeSection === "crucible" ? (
          <section aria-label="Crucible workspace">{crucibleContent}</section>
        ) : null}

        {activeSection === "inspirations" ? (
          <section aria-label="Inspirations">{inspirationsContent}</section>
        ) : null}
      </main>
    </div>
  );
}
