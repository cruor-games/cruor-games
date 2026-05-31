import { useMemo } from "react";
import { LocationCompilePreview } from "./LocationCompilePreview.jsx";
import { MapViewport } from "../../map-generator/map-generator.page.jsx";
import { LEVEL_VIEW_ALL } from "../../map-generator/map-generator.state.js";
import { toArray } from "../model/location-composer-state.js";
import { getAssignedComponentsForRegion, getRegionStageSummary } from "../model/location-composer-selectors.js";
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

function LocationMapSyncStatus({ activeGeneratedRoom, syncStatus }) {
  const syncRatio = `${syncStatus.synced}/${syncStatus.requested || syncStatus.generated || "—"}`;

  return (
    <details
      className={cx("location-map-sync-status", `is-${syncStatus.mode}`)}
      aria-label="Map and output synchronization status"
      open={syncStatus.mode !== "synced"}
    >
      <summary>
        <span>
          <p className="location-kicker">Map Sync</p>
          <strong>{syncStatus.label}</strong>
        </span>
        <em>{syncRatio}</em>
      </summary>
      <small>{syncStatus.description}</small>
      <dl>
        <div><dt>Requested</dt><dd>{syncStatus.requested}</dd></div>
        <div><dt>Generated</dt><dd>{syncStatus.generated || "—"}</dd></div>
        <div><dt>Synced</dt><dd>{syncStatus.synced}</dd></div>
      </dl>
      <span>{activeGeneratedRoom ? `Output room #${activeGeneratedRoom.number || "—"}` : "Region metadata only"}</span>
    </details>
  );
}

function LocationMapPreview({ generatedMap, error, viewResetKey }) {
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
    return (
      <div className="location-map-preview location-map-preview--fallback" aria-label="Map preview fallback">
        <div className="location-map-preview__fallback-card">
          <p className="location-kicker">Map Preview</p>
          <strong>{error ? "Preview unavailable" : "Fallback preview active"}</strong>
          <small>{error || "Region nodes and output remain usable while generated geometry is unavailable."}</small>
        </div>
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
      />
    </div>
  );
}

export function LocationMapStage({ state, setState, mapRequest, digest, generatedMapPreview, previewError, previewResetKey }) {
  const regions = state.locationRegions || [];
  const selectedSources = toArray(state.sourceAnchors);
  const selectedHorrors = toArray(state.horrors);
  const activeRegionComponents = getAssignedComponentsForRegion(state, state.activeRegionId);
  const activeGeneratedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const mapSyncStatus = getMapSyncStatus(mapRequest, generatedMapPreview, regions);

  return (
    <main className="cruor-composer-stage location-composer__stage" aria-label="Location map stage">
      <section className={cx("location-map-stage", generatedMapPreview && "has-live-preview", `is-map-${mapSyncStatus.mode}`)}>
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
        />

        <div className="location-map-stage__head">
          <p className="location-kicker">Haunted Map Board</p>
          <h2>{state.title || "Cursed Location Build"}</h2>
          <p>{state.context} · {selectedHorrors[0] || "Unspecified horror"} · {selectedSources[0] || "No source anchor"}</p>
        </div>

        <LocationMapSyncStatus activeGeneratedRoom={activeGeneratedRoom} syncStatus={mapSyncStatus} />

        <div className="location-stage-digest" aria-label="Current location build digest">
          <p className="location-kicker">Current Build</p>
          <strong>{digest.premise?.title || "No premise assigned yet"}</strong>
          <span>{digest.filledSlots}/{digest.totalSlots} slots filled</span>
          <small>{activeGeneratedRoom ? `Active room ${activeGeneratedRoom.number || "—"} · ${getGeneratedRoomSurfaceLabel(activeGeneratedRoom)}` : digest.premise?.summary || "Assign a premise and attach details to make the map stage react to the composer."}</small>
        </div>

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
                <small>{regionComponents.length ? `${regionComponents.length} attached · ${generatedRoom ? `room ${generatedRoom.number || index + 1}` : "region-only"}` : generatedRoom ? `Room ${generatedRoom.number || index + 1} · ${getGeneratedRoomSurfaceLabel(generatedRoom)}` : getRegionStageSummary(state, region.id)?.shortRole || region.role}</small>
                <em className="location-region-node__target">{active ? "Target" : generatedRoom ? "Synced" : "Region"}</em>
              </button>
            );
          })}
        </div>

        {activeRegionComponents.length ? (
          <div className="location-region-attachment-strip" aria-label="Active region attachments">
            {activeRegionComponents.slice(0, 4).map((component) => (
              <span key={`${component.assignment.slotId}-${component.id}`}>
                <i className="fa-solid fa-diamond" aria-hidden="true" />
                {component.slot?.label}: {component.title}
              </span>
            ))}
          </div>
        ) : null}

        <div className="location-stage-footer">
          <div><span>Map Request</span><strong>{mapSyncStatus.requested} regions</strong></div>
          <div><span>Preview</span><strong>{mapSyncStatus.mode === "synced" ? "Synced" : mapSyncStatus.label}</strong></div>
          <div><span>Synced Rooms</span><strong>{mapSyncStatus.synced}/{mapSyncStatus.requested || mapSyncStatus.generated || "—"}</strong></div>
          <div><span>Active Room</span><strong>{activeGeneratedRoom ? `#${activeGeneratedRoom.number || "—"} · ${activeGeneratedRoom.graphRole || activeGeneratedRoom.role}` : "Region Only"}</strong></div>
        </div>
      </section>

      <LocationCompilePreview
        state={state}
        digest={digest}
        mapRequest={mapRequest}
        generatedMapPreview={generatedMapPreview}
      />
    </main>
  );
}
