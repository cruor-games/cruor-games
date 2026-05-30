const APP_MODE_OPTIONS = [
  {
    id: "simple",
    label: "Simple",
    icon: "fa-solid fa-feather",
    description: "Focused table-ready controls",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: "fa-solid fa-sliders",
    description: "Expanded composition controls",
  },
  {
    id: "debug",
    label: "Debug",
    icon: "fa-solid fa-code",
    description: "Development and inspection mode",
  },
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
              <span className="app-shell__eyebrow">Drop-in horror workbench</span>
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
                      aria-label={mode.description}
                      title={mode.description}
                      onClick={() => onUiModeChange?.(mode.id)}
                    >
                      <i className={mode.icon} aria-hidden="true" />
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="app-shell__patreon-login"
                type="button"
                aria-disabled="true"
                title="Patreon login placeholder"
              >
                <i className="fa-brands fa-patreon" aria-hidden="true" />
                <span>Patreon</span>
                <strong>Sign in</strong>
              </button>
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
