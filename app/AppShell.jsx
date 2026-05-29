const APP_SECTIONS = [
  { id: "darken", label: "Darken a Location" },
  { id: "monster-composer", label: "Monster Composer" },
  { id: "inspirations", label: "Inspirations" },
];

export default function AppShell({
  activeSection,
  onSectionChange,
  darkenContent,
  monsterComposerContent,
  inspirationsContent,
}) {
  return (
    <div className="app-shell">
      <header className="app-shell__bar">
        <div className="app-shell__brand">
          <span className="app-shell__eyebrow">Cruor Games</span>
          <strong>Cruor Games</strong>
        </div>
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
