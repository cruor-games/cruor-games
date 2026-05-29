import { BookOpen, Plus, X } from "lucide-react";

export function GuidedFlowPanel({
  guidedFlow,
  onOpenStart,
  onFocusSlot,
  onOpenBalance,
  onOpenExport,
}) {
  function handleStepClick(step) {
    if (step.disabled) return;
    if (step.action === "start") {
      onOpenStart?.();
      return;
    }
    if (step.action === "slot" && step.slotId) {
      onFocusSlot?.(step.slotId);
      return;
    }
    if (step.action === "review") {
      onOpenBalance?.();
      return;
    }
    if (step.action === "export") {
      if (guidedFlow.exportReady) onOpenExport?.();
      else onOpenBalance?.();
    }
  }

  function handleNextAction() {
    const action = guidedFlow.nextAction;
    if (!action) return;
    if (action.kind === "start") onOpenStart?.();
    if (action.kind === "slot" && action.slotId) onFocusSlot?.(action.slotId);
    if (action.kind === "review") onOpenBalance?.();
    if (action.kind === "export") onOpenExport?.();
  }

  return (
    <section className="guided-flow-panel is-wizard" aria-label="Build flow">
      <div className="guided-flow-next" data-next-kind={guidedFlow.nextAction?.kind || "start"}>
        <div className="guided-flow-next__copy">
          <strong>{guidedFlow.nextAction?.title || "Choose how to begin"}</strong>
          <p>{guidedFlow.nextAction?.detail || "Start from a template or an empty frame."}</p>
        </div>
        <button type="button" onClick={handleNextAction}>
          {guidedFlow.nextAction?.cta || "Start"}
        </button>
      </div>

      <nav
        className="brief-wizard__progress monster-flow-progress"
        aria-label="Monster build progress"
        style={{ "--brief-progress": String(guidedFlow.progress) }}
      >
        {guidedFlow.steps.map((step) => (
          <button
            key={step.id}
            className={`brief-step-btn ${step.reached ? "reached" : ""} ${step.active ? "active" : ""}`}
            type="button"
            data-brief-step={step.number - 1}
            disabled={step.disabled}
            aria-current={step.active ? "step" : "false"}
            title={step.detail}
            onClick={() => handleStepClick(step)}
          >
            <span className="brief-step-number">{step.number}</span>
            <span className="brief-step-label">{step.label}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}

export function MonsterStartScreen({ onPickTemplate, onBuildFromScratch }) {
  return (
    <div className="monster-start-screen" aria-label="Choose how to begin">
      <div className="monster-start-screen__intro">
        <h3>Choose how to begin</h3>
        <p>Start from a ready horror family or build an empty anatomy frame slot by slot.</p>
      </div>

      <div className="monster-start-grid">
        <button
          type="button"
          className="monster-start-card monster-start-card--template"
          onClick={onPickTemplate}
        >
          <span className="monster-start-card__icon">
            <BookOpen aria-hidden="true" />
          </span>
          <span className="monster-start-card__body">
            <strong>Pick a Template</strong>
            <em>Load a complete horror monster family, then customize its anatomy.</em>
          </span>
        </button>

        <button
          type="button"
          className="monster-start-card monster-start-card--scratch"
          onClick={onBuildFromScratch}
        >
          <span className="monster-start-card__icon">
            <Plus aria-hidden="true" />
          </span>
          <span className="monster-start-card__body">
            <strong>Build from Scratch</strong>
            <em>Start empty and install grafts slot by slot.</em>
          </span>
        </button>
      </div>
    </div>
  );
}

export function TemplatePickerModal({ open, presets, activePresetId, onApply, onClose }) {
  if (!open) return null;

  return (
    <div
      className="template-picker-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Pick a monster template"
    >
      <button
        className="template-picker-modal__scrim"
        type="button"
        aria-label="Close Template Picker"
        onClick={onClose}
      />
      <aside className="panel template-picker-modal__panel" aria-label="Monster templates">
        <div className="template-picker-modal__head">
          <div>
            <h2>Pick a Template</h2>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Close Template Picker"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="template-picker-grid">
          {presets.map((preset) => {
            const active = preset.id === activePresetId;
            return (
              <article key={preset.id} className={`template-choice-card ${active ? "active" : ""}`}>
                <button
                  type="button"
                  className="template-choice-card__button"
                  onClick={() => onApply(preset)}
                >
                  <span className="template-choice-card__title-row">
                    <strong>{preset.label}</strong>
                    <em>{active ? "Loaded" : "Load Template"}</em>
                  </span>
                  <span className="template-choice-card__summary">{preset.summary}</span>
                </button>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
