import SiteTopbar from "./navigation/SiteTopbar.jsx";

export default function AppShell({
  activeSection = "home",
  activeUiMode = "simple",
  activeCrucibleGenerator = "darken",
  onSectionChange,
  onUiModeChange,
  onOpenCrucibleTool,
  homeContent,
  crucibleContent,
  inspirationsContent,
}) {
  return (
    <div className="app-shell" data-ui-mode={activeUiMode}>
      <SiteTopbar
        activeSection={activeSection}
        activeUiMode={activeUiMode}
        activeCrucibleGenerator={activeCrucibleGenerator}
        onSectionChange={onSectionChange}
        onUiModeChange={onUiModeChange}
        onOpenCrucibleTool={onOpenCrucibleTool}
      />

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
