import { lazy, Suspense, useCallback, useRef, useState } from "react";
import AppShell from "./AppShell.jsx";
import DarkenLocationComposerPage from "../features/darken-location/composer/index.js";
import InspirationsPage from "../features/inspirations/index.js";
import MonsterComposerPage from "../features/monster-composer/index.js";
import { createMapRequestFromDarkenLocationState } from "../features/darken-location/darken-location.map-request.js";

const CruorMapGeneratorMvp = lazy(
  () => import("../features/darken-location/map-generator/index.js")
);

export default function AppRouter() {
  const [activeSection, setActiveSection] = useState("crucible");
  const [activeUiMode, setActiveUiMode] = useState("simple");
  const [activeCrucibleGenerator, setActiveCrucibleGenerator] = useState("darken");
  const [activeDarkenTab, setActiveDarkenTab] = useState("composer");
  const [hasOpenedMapGenerator, setHasOpenedMapGenerator] = useState(false);
  const [mapRequest, setMapRequest] = useState(null);
  const [mapRequestRevision, setMapRequestRevision] = useState(0);
  const darkenSnapshotProviderRef = useRef(null);

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
    setActiveDarkenTab("map-generator");
  }, [createMapRequestFromSnapshot, hasOpenedMapGenerator]);

  const openMapGenerator = useCallback(
    (snapshot) => {
      initializeMapRequest(snapshot);
      setHasOpenedMapGenerator(true);
      setActiveCrucibleGenerator("darken");
      setActiveDarkenTab("map-generator");
    },
    [initializeMapRequest]
  );

  const setDarkenSnapshotProvider = useCallback((provider) => {
    darkenSnapshotProviderRef.current = provider;
  }, []);

  const activateDarkenTab = useCallback(
    (tabId) => {
      if (tabId === "map-generator" && !hasOpenedMapGenerator) {
        const snapshot = darkenSnapshotProviderRef.current?.();
        initializeMapRequest(snapshot);
        setHasOpenedMapGenerator(true);
      }

      setActiveCrucibleGenerator("darken");
      setActiveDarkenTab(tabId);
    },
    [hasOpenedMapGenerator, initializeMapRequest]
  );

  const activateCrucibleGenerator = useCallback((generatorId) => {
    setActiveSection("crucible");
    setActiveCrucibleGenerator(generatorId);

    if (generatorId === "darken") {
      setActiveDarkenTab((currentTab) => currentTab || "composer");
    }
  }, []);

  const homeContent = (
    <section className="app-shell__home" aria-label="Cruor Games home">
      <div className="app-shell__home-panel panel">
        <p className="app-shell__home-eyebrow">Cruor Games</p>
        <h1>Drop-in horror workbenches for tabletop prep.</h1>
        <p>
          Build monsters, darken locations, browse inspiration packs, and turn horror
          components into material you can use directly at the table.
        </p>

        <div className="app-shell__home-actions">
          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => activateCrucibleGenerator("darken")}
          >
            <span>Crucible</span>
            <strong>Darken a Location</strong>
            <small>Open the new location composer shell and haunted map board.</small>
          </button>

          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => activateCrucibleGenerator("monster")}
          >
            <span>Crucible</span>
            <strong>Build a Monster</strong>
            <small>Open the monster composer with the current compatible root.</small>
          </button>

          <button
            className="app-shell__home-action"
            type="button"
            onClick={() => setActiveSection("inspirations")}
          >
            <span>Library</span>
            <strong>Inspirations</strong>
            <small>Browse the source anchors and horror packs used by the tools.</small>
          </button>
        </div>
      </div>
    </section>
  );

  const crucibleContent = (
    <section
      className={
        activeCrucibleGenerator === "darken" && activeDarkenTab === "map-generator"
          ? "darken-workspace crucible-workspace is-map-tab"
          : "darken-workspace crucible-workspace"
      }
      aria-label="Crucible workspace"
      data-active-generator={activeCrucibleGenerator}
    >
      <div className="darken-workspace__topbar">
        <header className="darken-topbar crucible-topbar-shell" data-active-generator={activeCrucibleGenerator}>
          <div className="darken-topbar__primary crucible-topbar__primary">
            <p className="darken-topbar__eyebrow crucible-topbar__eyebrow">Crucible</p>

            <h1 className="darken-topbar__title">
              <span className="darken-topbar__title-prefix">I need to</span>
              <span id="needValue" className="darken-topbar__need-value">
                {activeCrucibleGenerator === "monster" ? "Build a Monster" : "Darken a Location"}
              </span>
            </h1>

            <div className="darken-topbar__control-row crucible-topbar__control-row">
              <div
                className="mode-switch darken-topbar__mode-switch crucible-generator-switch crucible-topbar__generator-switch"
                aria-label="Choose Crucible tool"
              >
                <button
                  className={
                    activeCrucibleGenerator === "darken"
                      ? "mode-btn crucible-topbar__generator-btn active"
                      : "mode-btn crucible-topbar__generator-btn"
                  }
                  type="button"
                  aria-pressed={activeCrucibleGenerator === "darken"}
                  onClick={() => activateCrucibleGenerator("darken")}
                  title="Darken a Location"
                >
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  <span>Location</span>
                </button>

                <button
                  className={
                    activeCrucibleGenerator === "monster"
                      ? "mode-btn crucible-topbar__generator-btn active"
                      : "mode-btn crucible-topbar__generator-btn"
                  }
                  type="button"
                  aria-pressed={activeCrucibleGenerator === "monster"}
                  onClick={() => activateCrucibleGenerator("monster")}
                  title="Build a Monster"
                >
                  <i className="fa-solid fa-skull" aria-hidden="true" />
                  <span>Monster</span>
                </button>
              </div>

              {activeCrucibleGenerator === "darken" ? (
                <div
                  className="darken-workspace__tabs crucible-workspace__tabs crucible-view-tabs"
                  role="tablist"
                  aria-label="Darken a Location views"
                >
                  <button
                    className={
                      activeDarkenTab === "composer"
                        ? "darken-workspace__tab crucible-view-tabs__btn is-active"
                        : "darken-workspace__tab crucible-view-tabs__btn"
                    }
                    type="button"
                    role="tab"
                    aria-selected={activeDarkenTab === "composer"}
                    aria-controls="darkenComposerPanel"
                    id="darkenComposerTab"
                    onClick={() => activateDarkenTab("composer")}
                    title="Composer"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
                    <span>Composer</span>
                  </button>

                  <button
                    className={
                      activeDarkenTab === "map-generator"
                        ? "darken-workspace__tab crucible-view-tabs__btn is-active"
                        : "darken-workspace__tab crucible-view-tabs__btn"
                    }
                    type="button"
                    role="tab"
                    aria-selected={activeDarkenTab === "map-generator"}
                    aria-controls="darkenMapGeneratorPanel"
                    id="darkenMapGeneratorTab"
                    onClick={() => activateDarkenTab("map-generator")}
                    title="Map"
                  >
                    <i className="fa-solid fa-map" aria-hidden="true" />
                    <span>Map</span>
                  </button>
                </div>
              ) : (
                <div className="darken-workspace__tabs crucible-workspace__tabs crucible-view-tabs" aria-label="Build a Monster views">
                  <button
                    className="darken-workspace__tab crucible-view-tabs__btn is-active"
                    type="button"
                    aria-current="page"
                    title="Composer"
                  >
                    <i className="fa-solid fa-dna" aria-hidden="true" />
                    <span>Composer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      {activeCrucibleGenerator === "darken" ? (
        <>
          <div
            id="darkenComposerPanel"
            role="tabpanel"
            aria-labelledby="darkenComposerTab"
            hidden={activeDarkenTab !== "composer"}
          >
            <DarkenLocationComposerPage
              uiMode={activeUiMode}
              onOpenMapGenerator={openMapGenerator}
              onSnapshotProviderReady={setDarkenSnapshotProvider}
            />
          </div>

          {hasOpenedMapGenerator ? (
            <section
              id="darkenMapGeneratorPanel"
              className="map-generator-view"
              role="tabpanel"
              aria-labelledby="darkenMapGeneratorTab"
              hidden={activeDarkenTab !== "map-generator"}
            >
              <Suspense fallback={<div className="status">Loading map generator...</div>}>
                <CruorMapGeneratorMvp
                  key={mapRequestRevision}
                  initialRequest={mapRequest}
                  onRefreshFromComposer={refreshMapFromComposer}
                />
              </Suspense>
            </section>
          ) : null}
        </>
      ) : (
        <section
          id="monsterComposerPanel"
          role="tabpanel"
          aria-label="Build a Monster composer"
        >
          <MonsterComposerPage uiMode={activeUiMode} />
        </section>
      )}
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
