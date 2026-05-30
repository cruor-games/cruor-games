const APP_MODE_OPTIONS = [
  { id: "simple", label: "Simple" },
  { id: "advanced", label: "Advanced" },
  { id: "debug", label: "Debug" },
];

const APP_SECTIONS = [
  { id: "darken", label: "Darken a Location" },
  { id: "monster-composer", label: "Monster Composer" },
  { id: "inspirations", label: "Inspirations" },
];

export default function AppShell({
  activeSection,
  activeUiMode = "simple",
  onSectionChange,
  onUiModeChange,
  darkenContent,
  monsterComposerContent,
  inspirationsContent,
}) {
  return (
    <div className="app-shell" data-ui-mode={activeUiMode}>
      <header className="app-shell__bar">
        <div className="app-shell__brand">
          <span className="app-shell__eyebrow">Cruor Games</span>
          <strong>Cruor Games</strong>
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
                onClick={() => onSectionChange(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

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
      </header>

      <main className="app-shell__workspace">
        {activeSection === "darken" ? (
          <section aria-label="Darken a Location workspace">{darkenContent}</section>
        ) : null}

        {activeSection === "monster-composer" ? (
          <section aria-label="Monster Composer workspace">{monsterComposerContent}</section>
        ) : null}

        {activeSection === "inspirations" ? (
          <section aria-label="Inspirations">{inspirationsContent}</section>
        ) : null}
      </main>
    </div>
  );
}
