const APP_MODE_OPTIONS = [
  { id: "simple", label: "Simple" },
  { id: "advanced", label: "Advanced" },
  { id: "debug", label: "Debug" },
];

const APP_SECTIONS = [
  {
    id: "home",
    label: "Home",
    icon: "fa-solid fa-house-chimney",
  },
  {
    id: "crucible",
    label: "Crucible",
    icon: "fa-solid fa-flask-vial",
  },
  {
    id: "inspirations",
    label: "Inspirations",
    icon: "fa-solid fa-book-skull",
  },
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
                  <i className={section.icon} aria-hidden="true" />
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>

            <div className="app-shell__right-rail">
              <label className="sr-only" htmlFor="appShellMode">
                Interface mode
              </label>
              <select
                id="appShellMode"
                className="app-shell__mode-select"
                value={activeUiMode}
                aria-label="Interface mode"
                onChange={(event) => onUiModeChange?.(event.target.value)}
              >
                {APP_MODE_OPTIONS.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>

              <button
                className="app-shell__patreon-login"
                type="button"
                aria-disabled="true"
                title="Patreon login placeholder"
              >
                <i className="fa-brands fa-patreon" aria-hidden="true" />
                <span>Patreon</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-shell__workspace">
        {activeSection === "home" ? <section aria-label="Home">{homeContent}</section> : null}

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
