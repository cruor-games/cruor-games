import { lazy, Suspense, useCallback, useRef, useState } from "react";
import AppShell from "./AppShell.jsx";
import Crucible from "../features/crucible/index.js";
import InspirationsPage from "../features/inspirations/index.js";
import MonsterComposerPage from "../features/monster-composer/index.js";
import { createMapRequestFromDarkenLocationState } from "../features/darken-location/darken-location.map-request.js";

const CruorMapGeneratorMvp = lazy(
  () => import("../features/darken-location/map-generator/index.js")
);

export default function AppRouter() {
  const [activeSection, setActiveSection] = useState("darken");
  const [activeUiMode, setActiveUiMode] = useState("simple");
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
    setActiveDarkenTab("map-generator");
  }, [createMapRequestFromSnapshot, hasOpenedMapGenerator]);

  const openMapGenerator = useCallback(
    (snapshot) => {
      initializeMapRequest(snapshot);
      setHasOpenedMapGenerator(true);
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

      setActiveDarkenTab(tabId);
    },
    [hasOpenedMapGenerator, initializeMapRequest]
  );

  const darkenContent = (
    <section
      className={
        activeDarkenTab === "map-generator" ? "darken-workspace is-map-tab" : "darken-workspace"
      }
      aria-label="Darken a Location workspace"
    >
      <div className="darken-workspace__topbar">
        <header className="darken-topbar">
          <div className="darken-topbar__primary">
            <p className="darken-topbar__eyebrow">Crucible</p>

            <h1 className="darken-topbar__title">
              <span className="darken-topbar__title-prefix">I need to</span>
              <span id="needValue" className="darken-topbar__need-value">
                Darken a Location
              </span>
            </h1>

            <div className="darken-topbar__control-row">
              <div
                className="mode-switch darken-topbar__mode-switch"
                id="workflowButtons"
                aria-label="Choose what you need to do"
              />

              <div
                className="darken-workspace__tabs"
                role="tablist"
                aria-label="Darken a Location views"
              >
                <button
                  className={
                    activeDarkenTab === "composer"
                      ? "darken-workspace__tab is-active"
                      : "darken-workspace__tab"
                  }
                  type="button"
                  role="tab"
                  aria-selected={activeDarkenTab === "composer"}
                  aria-controls="darkenComposerPanel"
                  id="darkenComposerTab"
                  onClick={() => activateDarkenTab("composer")}
                >
                  Composer
                </button>

                <button
                  className={
                    activeDarkenTab === "map-generator"
                      ? "darken-workspace__tab is-active"
                      : "darken-workspace__tab"
                  }
                  type="button"
                  role="tab"
                  aria-selected={activeDarkenTab === "map-generator"}
                  aria-controls="darkenMapGeneratorPanel"
                  id="darkenMapGeneratorTab"
                  onClick={() => activateDarkenTab("map-generator")}
                >
                  Map
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div
        id="darkenComposerPanel"
        role="tabpanel"
        aria-labelledby="darkenComposerTab"
        hidden={activeDarkenTab !== "composer"}
      >
        <Crucible
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
    </section>
  );

  return (
    <AppShell
      activeSection={activeSection}
      activeUiMode={activeUiMode}
      onSectionChange={setActiveSection}
      onUiModeChange={setActiveUiMode}
      darkenContent={darkenContent}
      monsterComposerContent={<MonsterComposerPage />}
      inspirationsContent={<InspirationsPage />}
    />
  );
}
