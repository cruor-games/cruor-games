export function LocationDraftControls({
  canLoadDraft,
  draftStatus,
  onClearDraft,
  onLoadDraft,
  onResetComposer,
  onSaveDraft,
  uiMode = "simple",
}) {
  const isSimpleMode = uiMode === "simple";

  return (
    <section className="location-draft-strip" aria-label="Draft controls">
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

        {!isSimpleMode ? (
          <>
            <button
              className="cruor-composer-control location-draft-btn location-draft-btn--ghost"
              type="button"
              onClick={onClearDraft}
              disabled={!canLoadDraft}
            >
              Clear Saved
            </button>

            <button
              className="cruor-composer-control location-draft-btn location-draft-btn--danger"
              type="button"
              onClick={onResetComposer}
            >
              Reset Current
            </button>
          </>
        ) : null}
      </div>

      {!isSimpleMode && draftStatus ? (
        <p className="location-draft-strip__feedback" aria-live="polite">
          {draftStatus}
        </p>
      ) : null}
    </section>
  );
}
