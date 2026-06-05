import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../map-generator/map-generator.styles.css";
import {
  createInitialLocationComposerState,
  createLocationComposerSnapshot,
} from "./model/location-composer-state.js";
import {
  getComposerDigest,
  getSelectedComponents,
} from "./model/location-composer-selectors.js";
import { LOCATION_REGION_TEMPLATES } from "../../crucible/crucible.location-regions.js";
import {
  createDraftFingerprint,
  deleteStoredLocationDraftWithStatus,
  getLocalDraftStorageStatus,
  getStoredDraftSummary,
  readStoredLocationDraft,
  restoreLocationDraftState,
  saveLocationDraftWithStatus,
} from "./model/location-composer-draft.js";
import { createLocationPreviewModel, getLocationPreviewResetKey } from "./model/location-composer-preview.js";
import { LocationBriefPanel } from "./components/LocationBriefPanel.jsx";
import { LocationDraftControls } from "./components/LocationDraftControls.jsx";
import { LocationMapStage } from "./components/LocationMapStage.jsx";
import { LocationSlotRail } from "./components/LocationSlotRail.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function LocationRecapPanel({
  builderMode,
  digest,
  generatedMapPreview,
  mapRequest,
  onOpenMapGenerator,
  setBuilderMode,
  snapshot,
  state,
}) {
  const assignedBySlot = digest.assignedBySlot || [];
  const activeRegion = digest.activeRegion;
  const activeRoom = generatedMapPreview?.regions?.find(
    (room) =>
      room.sourceRegionId === state.activeRegionId ||
      room.requestMetadata?.sourceRegionId === state.activeRegionId ||
      room.id === state.activeRegionId,
  );

  return (
    <aside
      className="cruor-composer-rail location-composer__rail location-composer__rail--right location-map-recap-rail"
      aria-label="Location build recap"
    >
      <section className="cruor-composer-panel location-panel location-map-recap-panel">
        <div className="location-panel-head location-panel-head--compact">
          <div>
            <p className="location-kicker">Recap</p>
            <h2>Current Build</h2>
          </div>
          <button
            className="cruor-composer-control location-icon-btn"
            type="button"
            onClick={() => onOpenMapGenerator?.(snapshot)}
            aria-label="Open Map Workspace"
          >
            <i className="fa-solid fa-map" aria-hidden="true" />
          </button>
        </div>

        <div className="location-map-mode-switch" role="group" aria-label="Composer mode">
          <button
            className={cx("location-map-mode-button", builderMode === "frame" && "is-active")}
            type="button"
            aria-pressed={builderMode === "frame"}
            onClick={() => setBuilderMode("frame")}
          >
            Frame
          </button>
          <button
            className={cx("location-map-mode-button", builderMode === "slots" && "is-active")}
            type="button"
            aria-pressed={builderMode === "slots"}
            onClick={() => setBuilderMode("slots")}
          >
            Slots
          </button>
        </div>

        <div className="location-recap-stack">
          <article className="location-recap-frame">
            <span>Frame</span>
            <strong>{state.context || "Context"}</strong>
            <small>{state.horror || "Horror"} · {state.intrusion || "Intrusion"}</small>
          </article>

          <article className="location-recap-region">
            <span>Target Region</span>
            <strong>{activeRegion?.name || "No region selected"}</strong>
            <small>{activeRoom ? `Room ${activeRoom.number || "—"}` : `${mapRequest.requiredRegions.length || 0} regions`}</small>
          </article>

          <article className="location-recap-frame">
            <span>Progress</span>
            <strong>{digest.filledSlots}/{digest.totalSlots} slots</strong>
            <small>{generatedMapPreview ? "Preview generated" : "Preview pending"}</small>
          </article>
        </div>

        <div className="location-recap-slot-list" aria-label="Slot progress">
          {assignedBySlot.map(({ slot, components }) => (
            <button
              className={cx("location-recap-slot", components.length > 0 && "is-filled", state.activeSlot === slot.id && "is-active")}
              key={slot.id}
              type="button"
              onClick={() => setBuilderMode("slots")}
            >
              <span>{slot.label}</span>
              <strong>{components[0]?.title || components[0]?.name || "Empty"}</strong>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

export default function DarkenLocationComposerPage({ onOpenMapGenerator, onSnapshotProviderReady, uiMode = "simple" } = {}) {
  const [state, setState] = useState(() => createInitialLocationComposerState(LOCATION_REGION_TEMPLATES));
  const [draftStatus, setDraftStatus] = useState("");
  const [draftSummary, setDraftSummary] = useState(() => getStoredDraftSummary());
  const [draftStorageStatus, setDraftStorageStatus] = useState(() => getLocalDraftStorageStatus());
  const [savedDraftFingerprint, setSavedDraftFingerprint] = useState("");
  const [builderMode, setBuilderMode] = useState("slots");
  const draftStatusTimeoutRef = useRef(null);

  const selectedComponents = useMemo(() => getSelectedComponents(state), [state]);
  const snapshot = useMemo(() => createLocationComposerSnapshot(state, selectedComponents), [state, selectedComponents]);
  const previewModel = useMemo(() => createLocationPreviewModel(snapshot), [snapshot]);
  const { mapRequest, previewResult } = previewModel;
  const digest = useMemo(() => getComposerDigest(state), [state]);
  const draftFingerprint = useMemo(() => createDraftFingerprint(state), [state]);
  const hasUnsavedChanges = Boolean(savedDraftFingerprint) && draftFingerprint !== savedDraftFingerprint;
  const previewResetKey = useMemo(() => getLocationPreviewResetKey(mapRequest, digest), [digest, mapRequest]);

  const setTransientDraftStatus = useCallback((message) => {
    setDraftStatus(message);
    window.clearTimeout(draftStatusTimeoutRef.current);
    draftStatusTimeoutRef.current = window.setTimeout(() => setDraftStatus(""), 2200);
  }, []);

  const saveDraft = useCallback(() => {
    const result = saveLocationDraftWithStatus(state);
    setDraftStorageStatus(getLocalDraftStorageStatus());

    if (!result.ok) {
      setTransientDraftStatus(result.reason || "Save unavailable");
      return;
    }

    setDraftSummary(getStoredDraftSummary());
    setSavedDraftFingerprint(createDraftFingerprint(state));
    setTransientDraftStatus("Draft saved");
  }, [setTransientDraftStatus, state]);

  const loadDraft = useCallback(() => {
    setDraftStorageStatus(getLocalDraftStorageStatus());
    const storedDraft = readStoredLocationDraft();
    if (!storedDraft) {
      setTransientDraftStatus("No draft found");
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Load saved draft and discard current changes?");
      if (!confirmed) return;
    }

    const fallbackState = createInitialLocationComposerState(LOCATION_REGION_TEMPLATES);
    const restoredState = restoreLocationDraftState(storedDraft, fallbackState);
    setState(restoredState);
    setSavedDraftFingerprint(createDraftFingerprint(restoredState));
    setDraftSummary(getStoredDraftSummary());
    setTransientDraftStatus("Draft loaded");
  }, [hasUnsavedChanges, setTransientDraftStatus]);

  const clearSavedDraft = useCallback(() => {
    if (!draftSummary) {
      setTransientDraftStatus("No draft saved");
      return;
    }

    const confirmed = window.confirm("Clear saved draft?");
    if (!confirmed) return;

    const result = deleteStoredLocationDraftWithStatus();
    setDraftStorageStatus(getLocalDraftStorageStatus());

    if (!result.ok) {
      setTransientDraftStatus(result.reason || "Unable to clear draft");
      return;
    }

    setDraftSummary(null);
    setSavedDraftFingerprint(createDraftFingerprint(state));
    setTransientDraftStatus("Draft cleared");
  }, [draftSummary, setTransientDraftStatus, state]);

  const resetComposer = useCallback(() => {
    const confirmed = window.confirm("Reset current composer?");
    if (!confirmed) return;

    const resetState = createInitialLocationComposerState(LOCATION_REGION_TEMPLATES);
    setState(resetState);
    setSavedDraftFingerprint(createDraftFingerprint(resetState));
    setBuilderMode("frame");
    setTransientDraftStatus("Composer reset");
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
    <div
      className="cruor-composer-shell location-composer"
      data-cruor-ui-mode={uiMode}
      data-location-builder-mode={builderMode}
      data-location-composer-ready="true"
    >
      <div className="cruor-composer-workspace location-composer__workspace">
        <div className="cruor-composer-frame location-composer__frame location-map-workbench">
          {builderMode === "frame" ? (
            <LocationBriefPanel
              state={state}
              setState={setState}
              mapRequest={mapRequest}
              draftControls={
                <LocationDraftControls
                  canLoadDraft={Boolean(draftSummary)}
                  draftStorageStatus={draftStorageStatus}
                  draftSummary={draftSummary}
                  draftStatus={draftStatus}
                  hasUnsavedChanges={hasUnsavedChanges}
                  uiMode={uiMode}
                  onClearDraft={clearSavedDraft}
                  onLoadDraft={loadDraft}
                  onResetComposer={resetComposer}
                  onSaveDraft={saveDraft}
                />
              }
            />
          ) : (
            <LocationSlotRail
              state={state}
              setState={setState}
              selectedComponents={selectedComponents}
              onOpenMapGenerator={onOpenMapGenerator}
              snapshot={snapshot}
              generatedMapPreview={previewResult.generatedMap}
            />
          )}

          <LocationMapStage
            state={state}
            setState={setState}
            mapRequest={mapRequest}
            digest={digest}
            generatedMapPreview={previewResult.generatedMap}
            previewError={previewResult.error}
            previewResetKey={previewResetKey}
            uiMode={uiMode}
          />

          <LocationRecapPanel
            builderMode={builderMode}
            digest={digest}
            generatedMapPreview={previewResult.generatedMap}
            mapRequest={mapRequest}
            onOpenMapGenerator={onOpenMapGenerator}
            setBuilderMode={setBuilderMode}
            snapshot={snapshot}
            state={state}
          />
        </div>
      </div>
    </div>
  );
}
