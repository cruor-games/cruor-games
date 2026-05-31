import { formatDraftTimestamp } from "../model/location-composer-draft.js";

export function LocationDraftControls({
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
