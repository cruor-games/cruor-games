import { useMemo } from "react";
import { LocationCompilePreview } from "./LocationCompilePreview.jsx";
import { LocationRoomRecapCard } from "./LocationRoomRecapCard.jsx";
import { MapViewport } from "../../map-generator/map-generator.page.jsx";
import { LEVEL_VIEW_ALL } from "../../map-generator/map-generator.state.js";
import { toArray } from "../model/location-composer-state.js";
import {
  getAssignedComponentsForRegion,
  getRegionById,
} from "../model/location-composer-selectors.js";
import {
  getGeneratedRoomForRegion,
  getGeneratedRoomForRegionIndex,
  getGeneratedRoomPositionStyle,
  getGeneratedRoomSurfaceLabel,
} from "../model/location-composer-map-preview.js";
import { getMapSyncStatus } from "../model/location-composer-output.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function LocationMapPreview({ generatedMap, error, viewResetKey, mapRequest }) {
  const previewManualOverrides = useMemo(
    () => ({
      rooms: {},
      corridors: {},
      props: {},
      labels: {},
    }),
    [],
  );

  if (!generatedMap) {
    const fallbackRegions = mapRequest?.requiredRegions?.length
      ? mapRequest.requiredRegions
      : Array.from({ length: Math.max(4, mapRequest?.roomCount || 4) }, (_, index) => ({
          id: `fallback-${index + 1}`,
          label: `Region ${index + 1}`,
        }));

    return (
      <div className="location-map-preview location-map-preview--fallback location-map-preview--schematic" aria-label="Generated map schematic fallback">
        <svg className="location-map-schematic" viewBox="0 0 100 64" role="img" aria-label={error ? `Schematic preview. ${error}` : "Schematic preview"}>
          <defs>
            <filter id="location-map-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {fallbackRegions.slice(0, 8).map((region, index) => {
            const x = 14 + (index % 4) * 23;
            const y = 18 + Math.floor(index / 4) * 27;
            const nextIndex = index + 1;
            if (nextIndex >= fallbackRegions.length || nextIndex >= 8) return null;
            const x2 = 14 + (nextIndex % 4) * 23;
            const y2 = 18 + Math.floor(nextIndex / 4) * 27;
            return <line className="location-map-schematic__corridor" key={`line-${region.id || index}`} x1={x} y1={y} x2={x2} y2={y2} />;
          })}
          {fallbackRegions.slice(0, 8).map((region, index) => {
            const x = 14 + (index % 4) * 23;
            const y = 18 + Math.floor(index / 4) * 27;
            const width = index % 3 === 0 ? 15 : 13;
            const height = index % 2 === 0 ? 10 : 12;
            return (
              <g className="location-map-schematic__room" key={region.id || region.label || index} filter="url(#location-map-glow)">
                <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx="0.6" />
                <text x={x} y={y + 1.2}>{index + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div
      className="location-map-preview location-map-preview--live cruor-map-mvp cruor-map-workspace"
      aria-label="Generated map preview"
      onContextMenuCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <MapViewport
        generatedMap={generatedMap}
        showGrid={false}
        gridStyle="none"
        showEditor={false}
        showNames={false}
        showProps={false}
        levelView={LEVEL_VIEW_ALL}
        fadeOtherLevels={true}
        availableLevels={[]}
        manualOverrides={previewManualOverrides}
        viewResetKey={viewResetKey}
        embeddedPreview={true}
        showViewportChrome={false}
        enableViewportInteractions={false}
      />
    </div>
  );
}

export function LocationMapStage({
  state,
  setState,
  mapRequest,
  digest,
  generatedMapPreview,
  previewError,
  previewResetKey,
  uiMode = "simple",
}) {
  const isSimpleMode = uiMode === "simple";
  const showStageDetails = !isSimpleMode;
  const regions = state.locationRegions || [];
  const selectedSources = toArray(state.sourceAnchors);
  const selectedHorrors = toArray(state.horrors);
  const activeRegion = getRegionById(state, state.activeRegionId);
  const activeRegionComponents = getAssignedComponentsForRegion(state, state.activeRegionId);
  const activeGeneratedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const mapSyncStatus = getMapSyncStatus(mapRequest, generatedMapPreview, regions);
  const activeSurfaceLabel = activeGeneratedRoom ? getGeneratedRoomSurfaceLabel(activeGeneratedRoom) : "";
  const locationSummary = [state.context, selectedHorrors[0], selectedSources[0]].filter(Boolean).join(" · ");

  return (
    <main className="cruor-composer-stage location-composer__stage" aria-label="Location map stage">
      <section
        className={cx(
          "location-map-stage",
          generatedMapPreview && "has-live-preview",
          isSimpleMode && "is-simple-surface",
          `is-map-${mapSyncStatus.mode}`,
        )}
      >
        <div className="location-map-stage__backdrop" aria-hidden="true">
          <span className="location-map-stage__ring location-map-stage__ring--outer" />
          <span className="location-map-stage__ring location-map-stage__ring--middle" />
          <span className="location-map-stage__ring location-map-stage__ring--inner" />
          <span className="location-map-stage__vein location-map-stage__vein--one" />
          <span className="location-map-stage__vein location-map-stage__vein--two" />
          <span className="location-map-stage__vein location-map-stage__vein--three" />
        </div>

        <LocationMapPreview
          generatedMap={generatedMapPreview}
          error={previewError}
          viewResetKey={previewResetKey}
          mapRequest={mapRequest}
        />

        <div className="location-stage-title-card" aria-label="Location summary">
          <span>Darken</span>
          <strong>{state.title || "Cursed Location"}</strong>
          {locationSummary ? <em>{locationSummary}</em> : null}
        </div>

        <div className="location-room-recap-anchor">
          <LocationRoomRecapCard
            activeRegion={activeRegion}
            assignedComponents={activeRegionComponents}
            generatedRoom={activeGeneratedRoom}
            surfaceLabel={activeSurfaceLabel}
          />
        </div>

        {showStageDetails ? (
          <div className="location-map-stage__head location-map-stage__head--compact">
            <p className="location-kicker">Map</p>
            <h2>{state.title || "Cursed Location"}</h2>
            <p>{locationSummary}</p>
          </div>
        ) : null}

        <div className="location-region-board" aria-label="Generated location regions">
          {regions.map((region, index) => {
            const active = state.activeRegionId === region.id;
            const regionComponents = getAssignedComponentsForRegion(state, region.id);
            const generatedRoom = getGeneratedRoomForRegionIndex(generatedMapPreview, region.id, index);
            return (
              <button
                className={cx(
                  "location-region-node",
                  active && "is-active",
                  active && "is-target-region",
                  regionComponents.length > 0 && "has-components",
                  generatedRoom && "is-synced-to-room",
                )}
                key={region.id}
                type="button"
                aria-label={`Use ${region.name} as the active region target`}
                style={getGeneratedRoomPositionStyle(generatedMapPreview, generatedRoom, index)}
                onClick={() => setState((current) => ({ ...current, activeRegionId: region.id }))}
              >
                <span>{generatedRoom?.number ? String(generatedRoom.number).padStart(2, "0") : String(index + 1).padStart(2, "0")}</span>
                <strong>{region.name}</strong>
                {showStageDetails || active ? (
                  <em className="location-region-node__target">{active ? "Target" : generatedRoom ? "Synced" : "Region"}</em>
                ) : null}
              </button>
            );
          })}
        </div>

        {showStageDetails && activeRegionComponents.length ? (
          <div className="location-region-attachment-strip" aria-label="Active region attachments">
            {activeRegionComponents.slice(0, 3).map((component) => (
              <span key={`${component.assignment.slotId}-${component.id}`}>
                <i className="fa-solid fa-diamond" aria-hidden="true" />
                {component.title}
              </span>
            ))}
          </div>
        ) : null}

        {showStageDetails ? (
          <div className="location-stage-footer location-stage-footer--compact">
            <div><span>Slots</span><strong>{digest.filledSlots}/{digest.totalSlots}</strong></div>
            <div><span>Map</span><strong>{mapSyncStatus.mode === "synced" ? "Synced" : mapSyncStatus.label}</strong></div>
            <div><span>Room</span><strong>{activeGeneratedRoom ? `Room ${activeGeneratedRoom.number || "—"}` : "Region"}</strong></div>
          </div>
        ) : null}
      </section>

      <details className="location-output-drawer">
        <summary>
          <span>Preview Output</span>
          <strong>{digest.filledSlots}/{digest.totalSlots}</strong>
        </summary>
        <LocationCompilePreview
          state={state}
          digest={digest}
          mapRequest={mapRequest}
          generatedMapPreview={generatedMapPreview}
        />
      </details>
    </main>
  );
}
