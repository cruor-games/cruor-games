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

const CRUCIBLE_TOOLS = [
  {
    id: "darken",
    label: "Darken",
    title: "Darken a Location",
    summary: "Build regions, hazards, clues, atmosphere, and a map-ready horror layer.",
    panelId: "darkenComposerPanel",
  },
  {
    id: "monster",
    label: "Monster",
    title: "Build a Monster",
    summary: "Compose anatomy, pressure, mechanics, and table-ready creature behavior.",
    panelId: "monsterComposerPanel",
  },
  {
    id: "map",
    label: "Map",
    title: "Map a Location",
    summary: "Turn Darken regions into an explorable map workspace.",
    panelId: "darkenMapGeneratorPanel",
  },
];

export default function AppRouter() {
  const [activeSection, setActiveSection] = useState("home");
  const [activeUiMode, setActiveUiMode] = useState("simple");
  const [activeCrucibleTool, setActiveCrucibleTool] = useState("darken");
  const [hasOpenedMapGenerator, setHasOpenedMapGenerator] = useState(false);
  const [mapRequest, setMapRequest] = useState(null);
  const [mapRequestRevision, setMapRequestRevision] = useState(0);
  const darkenSnapshotProviderRef = useRef(null);

  const activeCrucibleToolMeta =
    CRUCIBLE_TOOLS.find((tool) => tool.id === activeCrucibleTool) || CRUCIBLE_TOOLS[0];

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

  const openCrucibleTool = useCallback(
    (toolId) => {
      if (toolId === "map" && !hasOpenedMapGenerator) {
        const snapshot = darkenSnapshotProviderRef.current?.();
        initializeMapRequest(snapshot);
        setHasOpenedMapGenerator(true);
      }

      setActiveCrucibleTool(toolId);
    },
    [hasOpenedMapGenerator, initializeMapRequest]
  );

  const openCrucibleFromHome = useCallback(
    (toolId) => {
      setActiveSection("crucible");
      openCrucibleTool(toolId);
    },
    [openCrucibleTool]
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
    setActiveCrucibleTool("map");
  }, [createMapRequestFromSnapshot, hasOpenedMapGenerator]);

  const openMapGenerator = useCallback(
    (snapshot) => {
      initializeMapRequest(snapshot);
      setHasOpenedMapGenerator(true);
      setActiveCrucibleTool("map");
    },
    [initializeMapRequest]
  );

  const setDarkenSnapshotProvider = useCallback((provider) => {
    darkenSnapshotProviderRef.current = provider;
  }, []);

  const homeContent = (
    <section className="app-shell__home" aria-label="Cruor Games home">
      <div className="app-shell__home-panel panel">
        <p className="app-shell__home-eyebrow">Cruor Games</p>
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
            <span>Place</span>
            <strong>Darken a Location</strong>
            <small>Build regions, hazards, clues, atmosphere, and a map-ready structure.</small>
          </button>

          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => openCrucibleFromHome("monster")}
          >
            <span>Threat</span>
            <strong>Build a Monster</strong>
            <small>Compose anatomy, pressure, mechanics, and table-ready creature behavior.</small>
          </button>

          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => setActiveSection("inspirations")}
          >
            <span>Sources</span>
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
        activeCrucibleTool === "map"
          ? "darken-workspace crucible-workspace is-map-tab"
          : "darken-workspace crucible-workspace"
      }
      aria-label="Crucible workspace"
    >
      <CrucibleTopbar
        eyebrow="Crucible"
        titlePrefix="I need to"
        title={activeCrucibleToolMeta.title}
        summary={activeCrucibleToolMeta.summary}
        tools={CRUCIBLE_TOOLS}
        activeToolId={activeCrucibleTool}
        onToolChange={openCrucibleTool}
        workflowSlot={
          <div
            className="mode-switch darken-topbar__mode-switch"
            id="workflowButtons"
            aria-label="Choose what you need to do"
            hidden={activeCrucibleTool !== "darken"}
          />
        }
      />

      <div
        id="darkenComposerPanel"
        role="tabpanel"
        aria-labelledby="crucibleToolTab-darken"
        hidden={activeCrucibleTool !== "darken"}
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
        aria-labelledby="crucibleToolTab-monster"
        hidden={activeCrucibleTool !== "monster"}
      >
        <MonsterComposerPage />
      </section>

      <section
        id="darkenMapGeneratorPanel"
        className="map-generator-view"
        role="tabpanel"
        aria-labelledby="crucibleToolTab-map"
        hidden={activeCrucibleTool !== "map"}
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
            <p className="app-shell__home-eyebrow">Map Workspace</p>
            <h2>No map has been opened yet.</h2>
            <p>Generate a map from the current Darken a Location build.</p>
            <button
              className="app-shell__home-action crucible-workspace__empty-map-action"
              type="button"
              onClick={() => openCrucibleTool("map")}
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
