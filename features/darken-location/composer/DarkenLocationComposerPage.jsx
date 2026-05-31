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

export default function DarkenLocationComposerPage({ onOpenMapGenerator, onSnapshotProviderReady, uiMode = "simple" } = {}) {
  const [state, setState] = useState(() => createInitialLocationComposerState(LOCATION_REGION_TEMPLATES));
  const [draftStatus, setDraftStatus] = useState("");
  const [draftSummary, setDraftSummary] = useState(() => getStoredDraftSummary());
  const [savedDraftFingerprint, setSavedDraftFingerprint] = useState("");
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

    if (!result.ok) {
      setTransientDraftStatus(result.reason || "Draft save unavailable");
      return;
    }

    setDraftSummary(getStoredDraftSummary());
    setSavedDraftFingerprint(createDraftFingerprint(state));
    setTransientDraftStatus("Draft saved");
  }, [setTransientDraftStatus, state]);

  const loadDraft = useCallback(() => {
    const storedDraft = readStoredLocationDraft();
    if (!storedDraft) {
      setTransientDraftStatus("No draft found");
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Load the saved draft and discard current unsaved changes?");
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

    const confirmed = window.confirm("Clear the saved draft? The current composer will stay open.");
    if (!confirmed) return;

    const result = deleteStoredLocationDraftWithStatus();

    if (!result.ok) {
      setTransientDraftStatus(result.reason || "Unable to clear draft");
      return;
    }

    setDraftSummary(null);
    setSavedDraftFingerprint(createDraftFingerprint(state));
    setTransientDraftStatus("Draft cleared");
  }, [draftSummary, setTransientDraftStatus, state]);

  const resetComposer = useCallback(() => {
    const confirmed = window.confirm("Reset the current composer? Your saved draft will remain available.");
    if (!confirmed) return;

    const resetState = createInitialLocationComposerState(LOCATION_REGION_TEMPLATES);
    setState(resetState);
    setSavedDraftFingerprint(createDraftFingerprint(resetState));
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
    if (!onSnapshotProviderReady) return undefined;
    onSnapshotProviderReady(() => snapshot);
    return () => onSnapshotProviderReady(null);
  }, [onSnapshotProviderReady, snapshot]);

  return (
    <div className="cruor-composer-shell location-composer" data-cruor-ui-mode={uiMode} data-location-composer-ready="true">
      <div className="cruor-composer-workspace location-composer__workspace">
        <div className="cruor-composer-frame location-composer__frame">
          <LocationBriefPanel
            state={state}
            setState={setState}
            mapRequest={mapRequest}
            draftControls={
              <LocationDraftControls
                canLoadDraft={Boolean(draftSummary)}
                draftStatus={draftStatus}
                uiMode={uiMode}
                onClearDraft={clearSavedDraft}
                onLoadDraft={loadDraft}
                onResetComposer={resetComposer}
                onSaveDraft={saveDraft}
              />
            }
          />

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

          <LocationSlotRail
            state={state}
            setState={setState}
            selectedComponents={selectedComponents}
            onOpenMapGenerator={onOpenMapGenerator}
            snapshot={snapshot}
            generatedMapPreview={previewResult.generatedMap}
          />
        </div>
      </div>
    </div>
  );
}
