import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMapRequestFromDarkenLocationState } from "../darken-location.map-request.js";
import "../map-generator/map-generator.styles.css";
import { MapViewport } from "../map-generator/map-generator.page.jsx";
import { DEFAULT_CONFIG, createConfigFromNormalizedMapRequest } from "../map-generator/map-generator.input.js";
import { generateMap } from "../map-generator/map-generator.pipeline.js";
import { createEmptyManualOverrides, LEVEL_VIEW_ALL } from "../map-generator/map-generator.state.js";
import {
  assignComponentToSlot,
  createInitialLocationComposerState,
  createLocationComposerSnapshot,
  moveAssignmentToRegion,
  removeComponentFromSlot,
  toggleSetValue,
  toArray,
} from "./model/location-composer-state.js";
import {
  describeSourceAnchor,
  getAssignedComponentsForRegion,
  getAssignedComponentsForSlot,
  getComponentAssignment,
  getComponentsForSlot,
  getComposerDigest,
  getLocationSlots,
  getRegionById,
  getRegionDetailRows,
  getRegionStageSummary,
  getRegionTemplatesForState,
  getSelectedComponents,
  getSlotCapacityLabel,
  getSlotFilledCount,
  getSlotStatus,
  isComponentAssignedToSlot,
} from "./model/location-composer-selectors.js";
import { SOURCE_ANCHORS } from "../../crucible/crucible.sources-data.js";
import { LOCATION_REGION_TEMPLATES } from "../../crucible/crucible.location-regions.js";
import {
  getGeneratedRoomForRegion,
  getGeneratedRoomForRegionIndex,
  getGeneratedRoomPositionStyle,
  getGeneratedRoomSurfaceLabel,
} from "./model/location-composer-map-preview.js";
import {
  createDraftFingerprint,
  deleteStoredLocationDraftWithStatus,
  formatDraftTimestamp,
  getLocalDraftStorageStatus,
  getStoredDraftSummary,
  readStoredLocationDraft,
  restoreLocationDraftState,
  saveLocationDraftWithStatus,
} from "./model/location-composer-draft.js";
import {
  copyTextToClipboard,
  createJsonExportPayload,
  getClipboardStatusMessage,
  getCompilePreview,
  getComponentRulesText,
  getMapSyncStatus,
  getRegionSummaryText,
} from "./model/location-composer-output.js";

const CONTEXT_OPTIONS = ["Crypt", "Chapel", "Cave", "Mine", "Ruins", "Noble House", "Village", "Forest"];
const HORROR_OPTIONS = ["Religious Horror", "Body Horror", "Gothic", "Folk Horror", "Psychological Horror", "Cosmic Horror", "Disease Horror"];
const INTRUSION_OPTIONS = ["Low", "Medium", "High"];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}


function LocationCompilePreview({ state, digest, mapRequest, generatedMapPreview }) {
  const [copyState, setCopyState] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const compilePreview = useMemo(
    () => getCompilePreview(state, digest, mapRequest, generatedMapPreview),
    [state, digest, mapRequest, generatedMapPreview],
  );
  const regionSummaryText = useMemo(
    () => getRegionSummaryText(compilePreview),
    [compilePreview],
  );
  const jsonSnapshotText = useMemo(
    () =>
      JSON.stringify(
        createJsonExportPayload(state, digest, mapRequest, generatedMapPreview, compilePreview),
        null,
        2,
      ),
    [state, digest, mapRequest, generatedMapPreview, compilePreview],
  );

  const handleCopy = useCallback(async (label, text) => {
    try {
      const result = await copyTextToClipboard(text);
      setCopyState(getClipboardStatusMessage(label, result));
    } catch (error) {
      setCopyState(`${label}: copy failed`);
    }

    window.clearTimeout(handleCopy.timeoutId);
    handleCopy.timeoutId = window.setTimeout(() => setCopyState(""), 2200);
  }, []);

  return (
    <section
      className={cx("cruor-composer-panel location-panel location-compile-preview", !isPreviewOpen && "is-collapsed")}
      aria-label="Compiled location preview"
    >
      <div className="location-compile-preview__header">
        <button
          className="location-compile-preview__summary"
          type="button"
          onClick={() => setIsPreviewOpen((current) => !current)}
          aria-expanded={isPreviewOpen}
        >
          <span>
            <p className="location-kicker">Compile Preview</p>
            <h2>{compilePreview.title}</h2>
            <small>{compilePreview.contextLine} · {compilePreview.mapSyncStatus.description}</small>
          </span>
          <strong>{isPreviewOpen ? "Collapse" : "Expand"}</strong>
        </button>
        <div className="location-compile-preview__actions" aria-label="Compile actions">
          <div className="location-compile-preview__metrics" aria-label="Compile metrics">
            <span>Session Insert</span>
            <span>Export</span>
            <span>{compilePreview.filledSlots}/{compilePreview.totalSlots} slots</span>
            <span>{compilePreview.regionCount} regions</span>
          </div>

          <div className="location-compile-preview__buttons">
            <button
              className="cruor-composer-control location-copy-btn"
              type="button"
              onClick={() => handleCopy("Session Insert", compilePreview.sessionInsertText)}
              title="Copy the DM-facing session insert"
            >
              Copy Insert
            </button>
            <button
              className="cruor-composer-control location-copy-btn"
              type="button"
              onClick={() => handleCopy("Table Text", compilePreview.tableReadyText)}
              title="Copy the table-ready text"
            >
              Copy Table
            </button>
            <button
              className="cruor-composer-control location-copy-btn"
              type="button"
              onClick={() => handleCopy("Region Summary", regionSummaryText)}
              title="Copy region summary text"
            >
              Copy Regions
            </button>
            <button
              className="cruor-composer-control location-copy-btn"
              type="button"
              onClick={() => handleCopy("JSON Snapshot", jsonSnapshotText)}
              title="Copy JSON snapshot"
            >
              Copy JSON
            </button>
          </div>

          <span className={copyState ? "location-copy-status is-visible" : "location-copy-status"} aria-live="polite">
            {copyState || "Ready"}
          </span>
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="location-compile-preview__body">
          <div className="location-compile-preview__grid location-compile-preview__grid--quality">
            <article className="location-compile-preview__card location-session-insert-card">
              <span>Session Insert</span>
              <div className="location-session-insert">
                <strong>{compilePreview.premiseSection.title}</strong>
                <p>{compilePreview.premiseSection.context} · {compilePreview.premiseSection.horrorLine} · {compilePreview.premiseSection.sourceLine}</p>
                <pre>{compilePreview.sessionInsertText}</pre>
              </div>
            </article>

            <article className="location-compile-preview__card">
              <span>Rooms</span>
              <div className="location-compile-preview__stack">
                {compilePreview.roomSections.map((section) => (
                  <div className="location-compile-region" key={section.region.id}>
                    <strong>{section.heading}</strong>
                    <small className="location-compile-sync-label">{section.syncLabel}</small>
                    <p><b>Role.</b> {section.role}</p>
                    {section.readAloud ? <p><b>Read-Aloud.</b> {section.readAloud}</p> : null}
                    <p><b>Feature.</b> {section.feature || "—"}</p>
                    <p><b>Danger.</b> {section.danger || "—"}</p>
                    <p><b>Secret.</b> {section.secret || "—"}</p>
                    <p><b>Reward.</b> {section.reward || "—"}</p>
                    {section.components.length ? (
                      <small>{section.components.map((component) => `${component.slotLabel}: ${component.title}`).join(" · ")}</small>
                    ) : (
                      <small>No attached components.</small>
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="location-compile-preview__card">
              <span>Components</span>
              <div className="location-compile-preview__stack">
                {compilePreview.componentSections.length ? (
                  compilePreview.componentSections.map((component) => (
                    <div className="location-compile-slot" key={`${component.slotId}-${component.id}`}>
                      <strong>{component.reference}</strong>
                      <p>{component.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="location-empty location-empty--action">No components assigned yet. Add components to slots and regions to build the session insert.</p>
                )}
              </div>
            </article>

            <article className="location-compile-preview__card">
              <span>Map Notes</span>
              <div className="location-map-notes-output">
                {compilePreview.mapNotes.map((note) => <p key={note}>{note}</p>)}
              </div>
            </article>
          </div>

          <div className="location-compile-preview__table" aria-label="Table ready text preview">
        <span>Table-Ready Text</span>
        <pre>{compilePreview.tableReadyText}</pre>
      </div>

          <div className="location-compile-preview__table location-compile-preview__table--json" aria-label="JSON snapshot preview">
            <span>JSON Snapshot</span>
            <pre>{jsonSnapshotText}</pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}


function LocationDraftControls({
  canLoadDraft,
  draftStorageStatus,
  draftSummary,
  draftStatus,
  hasUnsavedChanges,
  onClearDraft,
  onLoadDraft,
  onResetComposer,
  onSaveDraft,
}) {
  const lastSavedLabel = draftSummary ? formatDraftTimestamp(draftSummary.savedAt) : "No browser draft saved";

  return (
    <section className="location-draft-strip" aria-label="Browser-local draft controls">
      <div className="location-draft-strip__main">
        <p className="location-kicker">Browser Draft</p>
        <strong>{draftSummary?.title || "Unsaved Build"}</strong>
        <small>
          {draftSummary
            ? `${draftSummary.context} · ${draftSummary.regionCount} regions · Last saved ${lastSavedLabel}`
            : "Browser-local recovery only. Project/backend save comes later."}
        </small>
      </div>

      <div className="location-draft-strip__scope">
        <span>Draft Locale</span>
        <small>{draftStorageStatus?.ok ? "Browser only · not project save" : draftStorageStatus?.reason || "Storage unavailable"}</small>
      </div>

      <div className="location-draft-strip__status">
        <span className={hasUnsavedChanges ? "is-dirty" : "is-clean"}>
          {hasUnsavedChanges ? "Unsaved changes" : canLoadDraft ? "Matches saved draft" : "No saved draft"}
        </span>
        {draftStatus ? <small aria-live="polite">{draftStatus}</small> : <small>{lastSavedLabel}</small>}
      </div>

      <div className="location-draft-strip__actions">
        <button className="cruor-composer-control location-draft-btn" type="button" onClick={onSaveDraft}>
          Save Draft
        </button>
        <button
          className="cruor-composer-control location-draft-btn"
          type="button"
          onClick={onLoadDraft}
          disabled={!canLoadDraft}
        >
          Load Draft
        </button>
        <button
          className="cruor-composer-control location-draft-btn location-draft-btn--ghost"
          type="button"
          onClick={onClearDraft}
          disabled={!canLoadDraft}
        >
          Clear Saved
        </button>
        <button className="cruor-composer-control location-draft-btn location-draft-btn--danger" type="button" onClick={onResetComposer}>
          Reset Current
        </button>
      </div>
    </section>
  );
}


function LocationWorkflowGuide({ state, digest, mapRequest }) {
  const slots = getLocationSlots();
  const activeSlot = slots.find((slot) => slot.id === state.activeSlot) || slots[0];
  const activeRegion = getRegionById(state, state.activeRegionId);
  const selectedSources = toArray(state.sourceAnchors);
  const selectedHorrors = toArray(state.horrors);
  const steps = [
    {
      id: "source",
      label: "Source",
      value: selectedSources[0] || selectedHorrors[0] || "Choose source pressure",
      status: selectedSources.length || selectedHorrors.length ? "set" : "open",
    },
    {
      id: "slot",
      label: "Slot",
      value: activeSlot?.label || "Choose a slot",
      status: state.activeSlot ? "set" : "open",
    },
    {
      id: "region",
      label: "Region",
      value: activeRegion?.name || "Choose target region",
      status: activeRegion ? "set" : "open",
    },
    {
      id: "map",
      label: "Map",
      value: `${mapRequest.requiredRegions.length || 0} rooms · ${digest.filledSlots}/${digest.totalSlots} slots`,
      status: mapRequest.requiredRegions.length ? "set" : "open",
    },
  ];

  return (
    <section className="location-workflow-guide" aria-label="Composer workflow">
      {steps.map((step, index) => (
        <article className={cx("location-workflow-step", `is-${step.status}`)} key={step.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{step.label}</strong>
            <small>{step.value}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function LocationBriefPanel({ state, setState, mapRequest }) {
  const selectedSources = toArray(state.sourceAnchors);
  const selectedHorrors = toArray(state.horrors);
  const visibleSources = SOURCE_ANCHORS.filter((source) => source !== "Any Source").slice(0, 8);

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--left" aria-label="Location frame">
      <section className="cruor-composer-panel location-panel">
        <p className="location-kicker">Location Frame</p>
        <h2>Darken the place before the party enters.</h2>
        <p>Start with context and source pressure. These choices filter the slots, regions, map request, and final output.</p>

        <div className="location-field">
          <span>Context</span>
          <div className="location-chip-grid" role="list" aria-label="Location contexts">
            {CONTEXT_OPTIONS.map((context) => (
              <button className={cx("cruor-composer-chip location-chip", state.context === context && "is-active")} key={context} type="button" onClick={() => setState((current) => ({ ...current, context }))}>
                {context}
              </button>
            ))}
          </div>
        </div>

        <div className="location-field">
          <span>Horror Direction</span>
          <div className="location-chip-grid" role="list" aria-label="Horror directions">
            {HORROR_OPTIONS.map((horror) => (
              <button
                className={cx("cruor-composer-chip location-chip", selectedHorrors.includes(horror) && "is-active")}
                key={horror}
                type="button"
                onClick={() => setState((current) => ({ ...current, horror, horrors: toggleSetValue(current.horrors, horror) }))}
              >
                {horror}
              </button>
            ))}
          </div>
        </div>

        <div className="location-field">
          <span>Source Anchors</span>
          <div className="location-source-stack" aria-label="Source anchors">
            {visibleSources.map((source) => (
              <button
                className={cx("cruor-composer-card location-source-card", selectedSources.includes(source) && "is-active")}
                key={source}
                type="button"
                onClick={() => setState((current) => ({ ...current, sourceAnchors: toggleSetValue(current.sourceAnchors, source) }))}
              >
                <strong>{source}</strong>
                <small>{describeSourceAnchor(source) || "This source steers component tone, region text, and map request metadata."}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="location-field">
          <span>Intrusion</span>
          <div className="location-segment-row" role="list" aria-label="Intrusion level">
            {INTRUSION_OPTIONS.map((intrusion) => (
              <button className={cx("cruor-composer-control location-segment", state.intrusion === intrusion && "is-active")} key={intrusion} type="button" onClick={() => setState((current) => ({ ...current, intrusion }))}>
                {intrusion}
              </button>
            ))}
          </div>
        </div>

        <div className="location-map-request-card">
          <span>Map Request</span>
          <strong>{mapRequest.mapType}</strong>
          <small>{mapRequest.requiredRegions.length || 0} required regions · {mapRequest.seed}</small>
        </div>
      </section>
    </aside>
  );
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
  const previewManualOverrides = useMemo(() => createEmptyManualOverrides(), []);

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

function LocationStage({ state, setState, mapRequest, digest, generatedMapPreview, previewError, previewResetKey }) {
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

function AssignedSlotStack({ state, slot, setState }) {
  const assigned = getAssignedComponentsForSlot(state, slot.id);
  const regions = state.locationRegions || [];

  if (!assigned.length) {
    return <p className="location-empty location-empty--action">No component assigned to this slot yet. Pick a component below, then use Add to Target or a region chip.</p>;
  }

  return (
    <div className="location-assigned-stack" aria-label="Assigned components">
      {assigned.map((component) => (
        <article className="location-assigned-card" key={`${slot.id}-${component.id}`}>
          <div>
            <span>{component.type}</span>
            <strong>{component.title}</strong>
            <small>{getRegionById(state, component.assignment.regionId)?.name || "No region linked"}</small>
          </div>
          <div className="location-assigned-card__actions">
            <div className="location-region-mini-picker" aria-label={`Move ${component.title} to region`}>
              {regions.slice(0, 4).map((region, index) => (
                <button
                  className={cx(
                    "cruor-composer-control location-region-mini-btn",
                    component.assignment.regionId === region.id && "is-active",
                  )}
                  key={region.id}
                  type="button"
                  title={`Attach to ${region.name}`}
                  onClick={() => setState((current) => moveAssignmentToRegion(current, component.id, region.id))}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              className="cruor-composer-control location-component-card__action"
              type="button"
              onClick={() => setState((current) => removeComponentFromSlot(current, component.id, slot.id))}
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function RegionFocusPanel({ state, setState, generatedMapPreview }) {
  const activeRegion = getRegionById(state, state.activeRegionId);
  const generatedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const regionComponents = activeRegion ? getAssignedComponentsForRegion(state, activeRegion.id) : [];
  const detailRows = activeRegion ? getRegionDetailRows(activeRegion) : [];
  const summary = activeRegion ? getRegionStageSummary(state, activeRegion.id) : null;

  return (
    <section className="cruor-composer-panel location-panel location-region-panel">
      <div className="location-panel-head">
        <div>
          <p className="location-kicker">Region Focus</p>
          <h2>{activeRegion?.name || "No region selected"}</h2>
        </div>
        {summary ? <strong className="location-region-count">{summary.assignedCount}</strong> : null}
      </div>

      {activeRegion ? (
        <>
          <p>{activeRegion.role} · {activeRegion.size || "Variable"} · {activeRegion.shape || "open region"}</p>

          {generatedRoom ? (
            <div className="location-generated-room-card" aria-label="Generated room data">
              <div>
                <span>Generated Room → Session Insert</span>
                <strong>Room {generatedRoom.number || "—"}</strong>
                <small>{generatedRoom.name} · {generatedRoom.graphRole || generatedRoom.role}</small>
              </div>
              <div className="location-generated-room-metrics">
                <span>{generatedRoom.shape || "shape"}</span>
                <span>level {generatedRoom.level ?? 0}</span>
                <span>{getGeneratedRoomSurfaceLabel(generatedRoom)}</span>
              </div>
            </div>
          ) : (
            <div className="location-generated-room-card location-generated-room-card--fallback" aria-label="Region-only output data">
              <div>
                <span>Region → Session Insert</span>
                <strong>Region only</strong>
                <small>The output uses this region even without generated room geometry.</small>
              </div>
            </div>
          )}

          <div className="location-region-switcher" aria-label="Choose active region">
            {(state.locationRegions || []).map((region, index) => {
              const room = getGeneratedRoomForRegionIndex(generatedMapPreview, region.id, index);
              return (
                <button
                  className={cx("cruor-composer-control location-region-switch", state.activeRegionId === region.id && "is-active", room && "has-generated-room")}
                  key={region.id}
                  type="button"
                  onClick={() => setState((current) => ({ ...current, activeRegionId: region.id }))}
                >
                  <span>{room?.number ? String(room.number).padStart(2, "0") : String(index + 1).padStart(2, "0")}</span>
                  <strong>{region.name}</strong>
                </button>
              );
            })}
          </div>

          <div className="location-region-details">
            {detailRows.map((row) => (
              <article className="location-region-detail" key={row.label}>
                <span>{row.label}</span>
                <p>{row.value}</p>
              </article>
            ))}
          </div>

          <div className="location-region-components">
            <span>Attached Components</span>
            {regionComponents.length ? (
              regionComponents.map((component) => (
                <article className="location-region-component" key={`${component.assignment.slotId}-${component.id}`}>
                  <strong>{component.slot?.label || component.assignment.slotId}</strong>
                  <p>{component.title}</p>
                </article>
              ))
            ) : (
              <p className="location-empty location-empty--action">No components attached yet. Use the slot panel or a component region chip to send material here.</p>
            )}
          </div>
        </>
      ) : (
        <p className="location-empty location-empty--action">Choose a map region to inspect generated room data and decide where the next component should land.</p>
      )}
    </section>
  );
}

function LocationSlotRail({ state, setState, selectedComponents, onOpenMapGenerator, snapshot, generatedMapPreview }) {
  const slots = getLocationSlots();
  const activeSlot = slots.find((slot) => slot.id === state.activeSlot) || slots[0];
  const compatibleComponents = getComponentsForSlot(activeSlot?.id, state);
  const activeRegion = state.locationRegions?.find((region) => region.id === state.activeRegionId);
  const activeGeneratedRoom = getGeneratedRoomForRegion(generatedMapPreview, state.activeRegionId);
  const regionTemplates = getRegionTemplatesForState(state);
  const activeSlotFilled = getSlotFilledCount(state, activeSlot?.id);
  const activeSlotIsFull = activeSlotFilled >= (activeSlot?.max || 1);

  const addComponent = useCallback((component) => {
    setState((current) => assignComponentToSlot(current, component, activeSlot, current.activeRegionId));
  }, [activeSlot, setState]);

  const assignComponentToRegion = useCallback((component, regionId) => {
    setState((current) => {
      const alreadyAssigned = getComponentAssignment(current, component.id);
      if (alreadyAssigned?.slotId === activeSlot?.id) {
        return moveAssignmentToRegion(current, component.id, regionId);
      }
      return assignComponentToSlot({ ...current, activeRegionId: regionId }, component, activeSlot, regionId);
    });
  }, [activeSlot, setState]);

  const removeComponent = useCallback((componentId) => {
    setState((current) => removeComponentFromSlot(current, componentId, activeSlot?.id));
  }, [activeSlot?.id, setState]);

  const regenerateRegions = useCallback(() => {
    setState((current) => {
      const templates = getRegionTemplatesForState(current);
      const nextRegions = (templates.length ? templates : LOCATION_REGION_TEMPLATES).slice(0, 4).map((region, index) => ({ ...region, id: region.templateId || region.id || `location-region-${index + 1}` }));
      return { ...current, locationRegions: nextRegions, activeRegionId: nextRegions[0]?.id || "" };
    });
  }, [setState]);

  return (
    <aside className="cruor-composer-rail location-composer__rail location-composer__rail--right" aria-label="Location slots and components">
      <section className="cruor-composer-panel location-panel">
        <div className="location-panel-head">
          <div><p className="location-kicker">Location Slots</p><h2>Attach horror to the map.</h2></div>
          <button className="cruor-composer-control location-icon-btn" type="button" onClick={() => onOpenMapGenerator?.(snapshot)} aria-label="Open Map Workspace">
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <div className="location-slot-list">
          {slots.map((slot) => {
            const filledCount = getSlotFilledCount(state, slot.id);
            const status = getSlotStatus(state, slot);
            return (
              <button
                className={cx("cruor-composer-slot location-slot", state.activeSlot === slot.id && "is-active", status === "full" && "is-filled", status === "partial" && "is-partial")}
                key={slot.id}
                type="button"
                onClick={() => setState((current) => ({ ...current, activeSlot: slot.id }))}
              >
                <span>{slot.label}</span>
                <strong>{getSlotCapacityLabel(state, slot)}</strong>
                <small>{filledCount ? "Assigned to this build." : slot.description || "Choose a component for this part of the location."}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cruor-composer-panel location-panel">
        <p className="location-kicker">Active Slot</p>
        <h2>{activeSlot?.label || "Slot"}</h2>
        <p>{activeSlot?.description || "Select a slot to browse compatible components."}</p>
        <div className="location-slot-target-note">
          <span>Next assignment</span>
          <strong>{activeSlot?.label || "Slot"} → {activeRegion?.name || "No region selected"}</strong>
          <small>{activeSlotIsFull ? "This slot is full: adding a new component will replace the current one." : "Add to Target uses this region unless you choose a numbered region chip."}</small>
        </div>

        <AssignedSlotStack state={state} slot={activeSlot} setState={setState} />

        <div className="location-component-toolbar">
          <span>{activeSlotIsFull ? "Adding will replace the current choice" : "Compatible Components"}</span>
          <strong>{compatibleComponents.length}</strong>
        </div>

        <div className="location-component-list">
          {compatibleComponents.length ? compatibleComponents.map((component) => {
            const selected = isComponentAssignedToSlot(state, component.id, activeSlot.id);
            const assignment = getComponentAssignment(state, component.id);
            const selectedRegionId = assignment?.regionId || state.activeRegionId;
            return (
              <article className={cx("cruor-composer-card location-component-card", selected && "is-active")} key={component.id}>
                <div>
                  <div className="location-component-card__meta">
                    <span>{component.type}</span>
                    <em>{selected ? "Assigned" : activeSlotIsFull ? "Will replace" : "Available"}</em>
                  </div>
                  <strong>{component.title}</strong>
                  <p>{component.summary}</p>
                  <small>{assignment ? `Linked to ${getRegionById(state, assignment.regionId)?.name || "no region"} · ${assignment.slotId}` : `Default target: ${activeRegion?.name || "No region selected"}`}</small>
                </div>

                <div className="location-component-card__regions" aria-label={`Assign ${component.title} to a region`}>
                  <span>Assign Region</span>
                  <div>
                    {(state.locationRegions || []).slice(0, 4).map((region, index) => (
                      <button
                        className={cx("cruor-composer-control location-region-inline-btn", selectedRegionId === region.id && "is-active")}
                        key={region.id}
                        type="button"
                        title={selected ? `Move to ${region.name}` : `Add to ${region.name}`}
                        onClick={() => assignComponentToRegion(component, region.id)}
                      >
                        R{index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="cruor-composer-control location-component-card__action"
                  type="button"
                  onClick={() => (selected ? removeComponent(component.id) : addComponent(component))}
                >
                  {selected ? "Remove" : activeSlotIsFull ? "Replace Slot" : "Add to Target"}
                </button>
              </article>
            );
          }) : <p className="location-empty location-empty--action">No compatible components for this slot/source mix. Try another slot, source anchor, or horror direction.</p>}
        </div>

        <div className="location-active-region location-target-card">
          <span>Default Region Target</span>
          <strong>{activeRegion?.name || "No region selected"}</strong>
          <small>{activeGeneratedRoom ? `Add to Target sends the active slot to Room ${activeGeneratedRoom.number || "—"} · ${getGeneratedRoomSurfaceLabel(activeGeneratedRoom)}` : "Add to Target sends the active slot here by default."}</small>
          <div className="location-target-card__switcher" aria-label="Choose default target region">
            {(state.locationRegions || []).slice(0, 4).map((region, index) => (
              <button
                className={cx("cruor-composer-control location-region-inline-btn", state.activeRegionId === region.id && "is-active")}
                key={region.id}
                type="button"
                title={`Set ${region.name} as default target`}
                onClick={() => setState((current) => ({ ...current, activeRegionId: region.id }))}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button className="cruor-composer-control" type="button" onClick={regenerateRegions}>Regenerate Regions</button>
          <small>{regionTemplates.length} matching region templates available.</small>
        </div>
      </section>

      <RegionFocusPanel state={state} setState={setState} generatedMapPreview={generatedMapPreview} />
    </aside>
  );
}

export default function DarkenLocationComposerPage({ onOpenMapGenerator, onSnapshotProviderReady, uiMode = "simple" } = {}) {
  const [state, setState] = useState(() => createInitialLocationComposerState(LOCATION_REGION_TEMPLATES));
  const [draftStatus, setDraftStatus] = useState("");
  const [draftSummary, setDraftSummary] = useState(() => getStoredDraftSummary());
  const [draftStorageStatus, setDraftStorageStatus] = useState(() => getLocalDraftStorageStatus());
  const [savedDraftFingerprint, setSavedDraftFingerprint] = useState("");
  const draftStatusTimeoutRef = useRef(null);
  const selectedComponents = useMemo(() => getSelectedComponents(state), [state]);
  const snapshot = useMemo(() => createLocationComposerSnapshot(state, selectedComponents), [state, selectedComponents]);
  const mapRequest = useMemo(() => createMapRequestFromDarkenLocationState(snapshot), [snapshot]);
  const previewConfig = useMemo(
    () => createConfigFromNormalizedMapRequest(mapRequest, DEFAULT_CONFIG),
    [mapRequest],
  );
  const previewResult = useMemo(() => {
    try {
      return { generatedMap: generateMap(previewConfig, createEmptyManualOverrides()), error: "" };
    } catch (error) {
      return { generatedMap: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [previewConfig]);
  const digest = useMemo(() => getComposerDigest(state), [state]);
  const draftFingerprint = useMemo(() => createDraftFingerprint(state), [state]);
  const hasUnsavedChanges = Boolean(savedDraftFingerprint) && draftFingerprint !== savedDraftFingerprint;
  const previewResetKey = `${mapRequest.seed}:${mapRequest.requiredRegions.length}:${digest.filledSlots}`;

  const setTransientDraftStatus = useCallback((message) => {
    setDraftStatus(message);
    window.clearTimeout(draftStatusTimeoutRef.current);
    draftStatusTimeoutRef.current = window.setTimeout(() => setDraftStatus(""), 2200);
  }, []);

  const saveDraft = useCallback(() => {
    const result = saveLocationDraftWithStatus(state);
    setDraftStorageStatus(getLocalDraftStorageStatus());

    if (!result.ok) {
      setTransientDraftStatus(result.reason || "Local draft save unavailable");
      return;
    }

    setDraftSummary(getStoredDraftSummary());
    setSavedDraftFingerprint(createDraftFingerprint(state));
    setTransientDraftStatus("Local draft saved");
  }, [setTransientDraftStatus, state]);

  const loadDraft = useCallback(() => {
    setDraftStorageStatus(getLocalDraftStorageStatus());
    const storedDraft = readStoredLocationDraft();
    if (!storedDraft) {
      setTransientDraftStatus("No local draft found");
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Load the saved local draft and discard current unsaved changes?");
      if (!confirmed) return;
    }

    const fallbackState = createInitialLocationComposerState(LOCATION_REGION_TEMPLATES);
    const restoredState = restoreLocationDraftState(storedDraft, fallbackState);
    setState(restoredState);
    setSavedDraftFingerprint(createDraftFingerprint(restoredState));
    setDraftSummary(getStoredDraftSummary());
    setTransientDraftStatus("Local draft loaded");
  }, [hasUnsavedChanges, setTransientDraftStatus]);

  const clearSavedDraft = useCallback(() => {
    if (!draftSummary) {
      setTransientDraftStatus("No local draft saved");
      return;
    }

    const confirmed = window.confirm("Clear the saved browser-local draft? The current composer will stay open.");
    if (!confirmed) return;

    const result = deleteStoredLocationDraftWithStatus();
    setDraftStorageStatus(getLocalDraftStorageStatus());

    if (!result.ok) {
      setTransientDraftStatus(result.reason || "Unable to clear local draft");
      return;
    }

    setDraftSummary(null);
    setSavedDraftFingerprint(createDraftFingerprint(state));
    setTransientDraftStatus("Local draft cleared");
  }, [draftSummary, setTransientDraftStatus, state]);


  const resetComposer = useCallback(() => {
    const confirmed = window.confirm("Reset the current composer? Your saved browser-local draft will remain available.");
    if (!confirmed) return;

    const resetState = createInitialLocationComposerState(LOCATION_REGION_TEMPLATES);
    setState(resetState);
    setSavedDraftFingerprint(createDraftFingerprint(resetState));
    setTransientDraftStatus("Current composer reset; saved draft untouched");
  }, [setTransientDraftStatus]);

  useEffect(() => {
    if (!savedDraftFingerprint) {
      setSavedDraftFingerprint(draftFingerprint);
    }
  }, [draftFingerprint, savedDraftFingerprint]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    return () => window.clearTimeout(draftStatusTimeoutRef.current);
  }, []);

  useEffect(() => {
    setDraftStorageStatus(getLocalDraftStorageStatus());
  }, []);

  useEffect(() => {
    if (!onSnapshotProviderReady) return undefined;
    onSnapshotProviderReady(() => snapshot);
    return () => onSnapshotProviderReady(null);
  }, [onSnapshotProviderReady, snapshot]);

  return (
    <div className="cruor-composer-shell location-composer" data-cruor-ui-mode={uiMode} data-location-composer-ready="true">
      <div className="cruor-composer-workspace location-composer__workspace">
        <header className="location-composer__intro">
          <div><p className="location-kicker">Darken a Location 2.0</p><h1>Haunted map board prototype</h1></div>
          <p>Compose from source pressure into a slot, attach it to a region, then watch the map and output update together.</p>
        </header>

        <LocationDraftControls
          canLoadDraft={Boolean(draftSummary)}
          draftStorageStatus={draftStorageStatus}
          draftSummary={draftSummary}
          draftStatus={draftStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          onClearDraft={clearSavedDraft}
          onLoadDraft={loadDraft}
          onResetComposer={resetComposer}
          onSaveDraft={saveDraft}
        />

        <LocationWorkflowGuide state={state} digest={digest} mapRequest={mapRequest} />

        <section className="location-audit-strip" aria-label="Composer readiness audit">
          <span className={hasUnsavedChanges ? "is-warning" : "is-ok"}>{hasUnsavedChanges ? "Draft unsaved" : "Draft stable"}</span>
          <span className={mapRequest.requiredRegions.length ? "is-ok" : "is-warning"}>{mapRequest.requiredRegions.length || 0} map regions</span>
          <span className={digest.filledSlots ? "is-ok" : "is-warning"}>{digest.filledSlots}/{digest.totalSlots} slots filled</span>
        </section>

        <section className="location-system-legend" aria-label="Composer output scopes">
          <span><strong>Draft</strong> browser recovery</span>
          <span><strong>Insert</strong> DM-facing text</span>
          <span><strong>Export</strong> copy-ready data</span>
        </section>

        <div className="cruor-composer-frame location-composer__frame">
          <LocationBriefPanel state={state} setState={setState} mapRequest={mapRequest} />
          <LocationStage state={state} setState={setState} mapRequest={mapRequest} digest={digest} generatedMapPreview={previewResult.generatedMap} previewError={previewResult.error} previewResetKey={previewResetKey} />
          <LocationSlotRail state={state} setState={setState} selectedComponents={selectedComponents} onOpenMapGenerator={onOpenMapGenerator} snapshot={snapshot} generatedMapPreview={previewResult.generatedMap} />
        </div>
      </div>
    </div>
  );
}
