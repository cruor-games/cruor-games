import { lazy, Suspense, useCallback, useRef, useState } from "react";
import AppShell from "./AppShell.jsx";
import Crucible from "../features/crucible/index.js";
import CrucibleTopbar from "../features/crucible/components/CrucibleTopbar.jsx";
import InspirationsPage from "../features/inspirations/index.js";
import MonsterComposerPage from "../features/monster-composer/index.js";
import { createMapRequestFromDarkenLocationState } from "../features/darken-location/darken-location.map-request.js";

const CruorMapGeneratorMvp = lazy(
  () => import("../features/darken-location/map-generator/index.js")
);

const CRUCIBLE_GENERATORS = [
  {
    id: "darken",
    label: "Darken a Location",
    shortLabel: "Location",
    title: "Darken a Location",
    summary: "Build regions, hazards, clues, atmosphere, and a map-ready horror layer.",
  },
  {
    id: "monster",
    label: "Build a Monster",
    shortLabel: "Monster",
    title: "Build a Monster",
    summary: "Compose anatomy, pressure, mechanics, and table-ready creature behavior.",
  },
];

const CRUCIBLE_VIEWS = {
  darken: [
    {
      id: "location",
      label: "Location",
      panelId: "darkenComposerPanel",
    },
    {
      id: "map",
      label: "Map",
      panelId: "darkenMapGeneratorPanel",
    },
  ],
  monster: [
    {
      id: "composer",
      label: "Composer",
      panelId: "monsterComposerPanel",
    },
    {
      id: "balance",
      label: "Balance",
      panelId: "monsterComposerPanel",
    },
    {
      id: "run",
      label: "Run",
      panelId: "monsterComposerPanel",
    },
    {
      id: "export",
      label: "Export",
      panelId: "monsterComposerPanel",
    },
  ],
};

export default function AppRouter() {
  const [activeSection, setActiveSection] = useState("home");
  const [activeUiMode, setActiveUiMode] = useState("simple");
  const [activeCrucibleGenerator, setActiveCrucibleGenerator] = useState("darken");
  const [activeDarkenView, setActiveDarkenView] = useState("location");
  const [activeMonsterView, setActiveMonsterView] = useState("composer");
  const [hasOpenedMapGenerator, setHasOpenedMapGenerator] = useState(false);
  const [mapRequest, setMapRequest] = useState(null);
  const [mapRequestRevision, setMapRequestRevision] = useState(0);
  const darkenSnapshotProviderRef = useRef(null);

  const activeGeneratorMeta =
    CRUCIBLE_GENERATORS.find((generator) => generator.id === activeCrucibleGenerator) ||
    CRUCIBLE_GENERATORS[0];

  const activeViews = CRUCIBLE_VIEWS[activeCrucibleGenerator] || [];
  const activeViewId = activeCrucibleGenerator === "monster" ? activeMonsterView : activeDarkenView;
  const activeViewMeta = activeViews.find((view) => view.id === activeViewId) || activeViews[0];

  const createMapRequestFromSnapshot = useCallback(
    (snapshot) => createMapRequestFromDarkenLocationState(snapshot),
    []
  );

  const initializeMapRequest = useCallback(
    (snapshot) => {
      setMapRequest((currentRequest) => currentRequest || createMapRequestFromSnapshot(snapshot));
    },
    [createMapRequestFromSnapshot]
  );

  const openDarkenMapView = useCallback(() => {
    if (!hasOpenedMapGenerator) {
      const snapshot = darkenSnapshotProviderRef.current?.();
      initializeMapRequest(snapshot);
      setHasOpenedMapGenerator(true);
    }

    setActiveCrucibleGenerator("darken");
    setActiveDarkenView("map");
  }, [hasOpenedMapGenerator, initializeMapRequest]);

  const openCrucibleGenerator = useCallback((generatorId) => {
    if (!CRUCIBLE_GENERATORS.some((generator) => generator.id === generatorId)) return;
    setActiveCrucibleGenerator(generatorId);
  }, []);

  const openCrucibleFromHome = useCallback(
    (generatorId) => {
      setActiveSection("crucible");
      openCrucibleGenerator(generatorId);
    },
    [openCrucibleGenerator]
  );

  const handleCrucibleViewChange = useCallback(
    (viewId) => {
      if (activeCrucibleGenerator === "darken") {
        if (viewId === "map") {
          openDarkenMapView();
          return;
        }

        setActiveDarkenView(viewId);
        return;
      }

      setActiveMonsterView(viewId);
    },
    [activeCrucibleGenerator, openDarkenMapView]
  );

  const refreshMapFromComposer = useCallback(() => {
    if (hasOpenedMapGenerator) {
      const confirmed = window.confirm(
        "Refresh the map from the current Composer regions? This will replace the current generated map."
      );
      if (!confirmed) return;
    }

    const snapshot = darkenSnapshotProviderRef.current?.();
    setMapRequest(createMapRequestFromSnapshot(snapshot));
    setMapRequestRevision((value) => value + 1);
    setHasOpenedMapGenerator(true);
    setActiveCrucibleGenerator("darken");
    setActiveDarkenView("map");
  }, [createMapRequestFromSnapshot, hasOpenedMapGenerator]);

  const openMapGenerator = useCallback(
    (snapshot) => {
      initializeMapRequest(snapshot);
      setHasOpenedMapGenerator(true);
      setActiveCrucibleGenerator("darken");
      setActiveDarkenView("map");
    },
    [initializeMapRequest]
  );

  const setDarkenSnapshotProvider = useCallback((provider) => {
    darkenSnapshotProviderRef.current = provider;
  }, []);

  const homeContent = (
    <section className="app-shell__home" aria-label="Cruor Games home">
      <div className="app-shell__home-panel panel">
        <h1>Build drop-in horror for the session you already prepared.</h1>
        <p>
          Compose haunted locations, disturbing monsters, and source-inspired horror material
          inside one dark fantasy workbench.
        </p>

        <div className="app-shell__home-actions" aria-label="Primary actions">
          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => openCrucibleFromHome("darken")}
          >
            <strong>Darken a Location</strong>
            <small>Build regions, hazards, clues, atmosphere, and a map-ready structure.</small>
          </button>

          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => openCrucibleFromHome("monster")}
          >
            <strong>Build a Monster</strong>
            <small>Compose anatomy, pressure, mechanics, and table-ready creature behavior.</small>
          </button>

          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => setActiveSection("inspirations")}
          >
            <strong>Browse Inspirations</strong>
            <small>Explore the real-world and folkloric roots behind Cruor components.</small>
          </button>
        </div>
      </div>
    </section>
  );

  const crucibleContent = (
    <section
      className={
        activeCrucibleGenerator === "darken" && activeDarkenView === "map"
          ? "darken-workspace crucible-workspace is-map-tab"
          : "darken-workspace crucible-workspace"
      }
      aria-label="Crucible workspace"
      data-crucible-generator={activeCrucibleGenerator}
      data-crucible-view={activeViewId}
    >
      <CrucibleTopbar
        eyebrow="Crucible"
        titlePrefix="I need to"
        title={activeGeneratorMeta.title}
        summary={activeGeneratorMeta.summary}
        generators={CRUCIBLE_GENERATORS}
        activeGeneratorId={activeCrucibleGenerator}
        onGeneratorChange={openCrucibleGenerator}
        views={activeViews}
        activeViewId={activeViewId}
        activeViewLabel={activeViewMeta?.label}
        onViewChange={handleCrucibleViewChange}
        legacyWorkflowSlot={
          <div
            id="workflowButtons"
            hidden
            aria-hidden="true"
          />
        }
      />

      <div
        id="darkenComposerPanel"
        role="tabpanel"
        aria-labelledby="crucibleViewTab-location"
        hidden={activeCrucibleGenerator !== "darken" || activeDarkenView !== "location"}
      >
        <Crucible
          uiMode={activeUiMode}
          onOpenMapGenerator={openMapGenerator}
          onSnapshotProviderReady={setDarkenSnapshotProvider}
        />
      </div>

      <section
        id="monsterComposerPanel"
        role="tabpanel"
        aria-labelledby={`crucibleViewTab-${activeMonsterView}`}
        hidden={activeCrucibleGenerator !== "monster"}
      >
        <MonsterComposerPage
          viewMode={activeMonsterView}
          onViewModeChange={setActiveMonsterView}
          showInternalTopbar={false}
        />
      </section>

      <section
        id="darkenMapGeneratorPanel"
        className="map-generator-view"
        role="tabpanel"
        aria-labelledby="crucibleViewTab-map"
        hidden={activeCrucibleGenerator !== "darken" || activeDarkenView !== "map"}
      >
        {hasOpenedMapGenerator ? (
          <Suspense fallback={<div className="status">Loading map generator...</div>}>
            <CruorMapGeneratorMvp
              key={mapRequestRevision}
              initialRequest={mapRequest}
              onRefreshFromComposer={refreshMapFromComposer}
            />
          </Suspense>
        ) : (
          <div className="crucible-workspace__empty-map panel">
            <h2>No map has been opened yet.</h2>
            <p>Generate a map from the current Darken a Location build.</p>
            <button
              className="app-shell__home-action crucible-workspace__empty-map-action"
              type="button"
              onClick={openDarkenMapView}
            >
              <span>Map</span>
              <strong>Open Map Workspace</strong>
              <small>Use the current Darken regions as the starting configuration.</small>
            </button>
          </div>
        )}
      </section>
    </section>
  );

  return (
    <AppShell
      activeSection={activeSection}
      activeUiMode={activeUiMode}
      onSectionChange={setActiveSection}
      onUiModeChange={setActiveUiMode}
      homeContent={homeContent}
      crucibleContent={crucibleContent}
      inspirationsContent={<InspirationsPage />}
    />
  );
}
