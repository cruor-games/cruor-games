import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertTriangle,
  Gauge,
  Skull,
  Sparkles,
  Sword,
  X,
} from "lucide-react";

import {
  CREATURE_TYPES,
  DANGERS,
  MONSTER_TIERS,
  ROLES,
  TACTICAL_ROLES,
  TEMPO_PROFILES,
  isCreatureCategoryUnavailable,
  isCreatureTypeUnavailable,
} from "../monster-composer.taxonomies.js";

const FRAME_STEPS = [
  {
    id: "chassis",
    number: "01",
    title: "Chassis",
    kicker: "Creature Body",
    summary: "Choose the monster family and variant.",
  },
  {
    id: "role",
    number: "02",
    title: "Combat Role",
    kicker: "Encounter Job",
    summary: "Set footprint and battlefield behavior.",
  },
  {
    id: "challenge",
    number: "03",
    title: "Challenge",
    kicker: "Difficulty Profile",
    summary: "Tune CR, tier, tempo, danger, and budget.",
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <label className="monster-field game-frame-number-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value || min), min, max))}
      />
    </label>
  );
}

function FrameKpi({ icon: Icon, label, value, tone = "" }) {
  return (
    <span className={`game-frame-kpi ${tone ? `is-${tone}` : ""}`.trim()}>
      <Icon aria-hidden="true" />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </span>
  );
}

function FrameStepNav({ activeStep, setActiveStep }) {
  return (
    <nav className="game-frame-stepper" aria-label="Monster Frame steps">
      {FRAME_STEPS.map((step) => (
        <button
          key={step.id}
          type="button"
          className={`game-frame-step ${step.id === activeStep ? "is-active" : ""}`}
          aria-current={step.id === activeStep ? "step" : undefined}
          onClick={() => setActiveStep(step.id)}
        >
          <span>{step.number}</span>
          <strong>{step.title}</strong>
          <small>{step.summary}</small>
        </button>
      ))}
    </nav>
  );
}

function FrameSummaryRow({ label, value }) {
  return (
    <span className="game-frame-summary-row">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function FrameSummary({
  creatureType,
  category,
  role,
  targetCr,
  tacticalRole,
  monsterTier,
  tempoProfile,
  danger,
  computed,
  pressureOverBudget,
  complexityOverBudget,
}) {
  return (
    <aside className="game-frame-summary" aria-label="Current Monster Frame summary">
      <div className="game-frame-summary__head">
        <span>Current Frame</span>
        <strong>{computed.name}</strong>
      </div>
      <div className="game-frame-summary__grid">
        <FrameSummaryRow label="Type" value={creatureType.label} />
        <FrameSummaryRow label="Variant" value={category} />
        <FrameSummaryRow label="Role" value={role.label} />
        <FrameSummaryRow label="Tactic" value={tacticalRole.label} />
        <FrameSummaryRow label="Tier" value={monsterTier.label} />
        <FrameSummaryRow label="Tempo" value={tempoProfile.label} />
        <FrameSummaryRow label="Danger" value={danger?.label || "Standard"} />
        <FrameSummaryRow label="CR" value={targetCr} />
      </div>
      <div className="game-frame-summary__meters">
        <CompactMeter
          label="Pressure"
          value={computed.pressure}
          max={computed.budget}
          over={pressureOverBudget}
        />
        <CompactMeter
          label="Complexity"
          value={computed.complexity}
          max={computed.complexityCap}
          over={complexityOverBudget}
        />
      </div>
    </aside>
  );
}

function CompactMeter({ label, value, max, over }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`game-frame-compact-meter ${over ? "is-over" : ""}`}>
      <span>
        <small>{label}</small>
        <strong>
          {value} / {max}
        </strong>
      </span>
      <i>
        <b style={{ width: `${percent}%` }} />
      </i>
    </div>
  );
}

function StepHeader({ step }) {
  return (
    <div className="game-frame-stage__head">
      <span>{step.kicker}</span>
      <h3>{step.title}</h3>
      <p>{step.summary}</p>
    </div>
  );
}

function ChassisStep({
  typeId,
  creatureType,
  category,
  selectType,
  setCategory,
  setActivePresetId,
}) {
  return (
    <div className="game-frame-stage__content game-frame-stage__content--chassis">
      <section className="game-frame-control-zone">
        <div className="game-frame-control-zone__head">
          <span>Family</span>
          <strong>{creatureType.label}</strong>
        </div>
        <div className="game-frame-choice-grid game-frame-choice-grid--types">
          {CREATURE_TYPES.map((type) => {
            const Icon = type.icon;
            const active = type.id === typeId;
            const unavailable = isCreatureTypeUnavailable(type.id);
            return (
              <button
                key={type.id}
                type="button"
                disabled={unavailable}
                aria-disabled={unavailable}
                className={`game-frame-choice game-frame-choice--type ${active ? "is-active" : ""} ${unavailable ? "is-disabled" : ""}`}
                onClick={() => selectType(type.id)}
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{type.label}</strong>
                  <small>{unavailable ? "Unavailable" : `${type.categories.length} variants`}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="game-frame-control-zone is-compact">
        <div className="game-frame-control-zone__head">
          <span>Variant</span>
          <strong>{category}</strong>
        </div>
        <div className="game-frame-pill-row" role="radiogroup" aria-label="Creature category">
          {creatureType.categories.map((item) => {
            const unavailable = isCreatureCategoryUnavailable(typeId, item);
            return (
              <button
                key={item}
                type="button"
                role="radio"
                disabled={unavailable}
                aria-disabled={unavailable}
                aria-checked={item === category}
                className={`game-frame-pill ${item === category ? "is-active" : ""} ${unavailable ? "is-disabled" : ""}`}
                onClick={() => {
                  if (unavailable) return;
                  setCategory(item);
                  setActivePresetId("");
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RoleStep({
  roleId,
  tacticalRoleId,
  tacticalRole,
  setRoleId,
  setTacticalRoleId,
  setActivePresetId,
}) {
  return (
    <div className="game-frame-stage__content game-frame-stage__content--role">
      <section className="game-frame-control-zone">
        <div className="game-frame-control-zone__head">
          <span>Encounter Footprint</span>
          <strong>{ROLES.find((item) => item.id === roleId)?.label || "Standard"}</strong>
        </div>
        <div className="game-frame-choice-grid game-frame-choice-grid--roles">
          {ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`game-frame-choice game-frame-choice--role ${item.id === roleId ? "is-active" : ""}`}
              onClick={() => {
                setRoleId(item.id);
                setActivePresetId("");
              }}
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.summary}</small>
              </span>
              <em>
                HP {Math.round(item.hpMult * 100)}% · DPR {Math.round(item.dprMult * 100)}%
              </em>
            </button>
          ))}
        </div>
      </section>

      <section className="game-frame-control-zone is-compact">
        <div className="game-frame-control-zone__head">
          <span>Battlefield Job</span>
          <strong>{tacticalRole.label}</strong>
        </div>
        <div className="game-frame-pill-row" role="radiogroup" aria-label="Tactical role">
          {TACTICAL_ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === tacticalRoleId}
              className={`game-frame-pill ${item.id === tacticalRoleId ? "is-active" : ""}`}
              onClick={() => {
                setTacticalRoleId(item.id);
                setActivePresetId("");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChallengeStep({
  targetCr,
  monsterTier,
  monsterTierId,
  tempoProfile,
  tempoProfileId,
  dangerId,
  danger,
  computed,
  pressurePercent,
  complexityPercent,
  pressureOverBudget,
  complexityOverBudget,
  setTargetCr,
  setMonsterTierId,
  setTempoProfileId,
  setDangerId,
  setActivePresetId,
}) {
  return (
    <div className="game-frame-stage__content game-frame-stage__content--challenge">
      <section className="game-frame-control-zone game-frame-control-zone--challenge-main">
        <div className="game-frame-control-zone__head">
          <span>Challenge Rating</span>
          <strong>CR {targetCr}</strong>
        </div>
        <NumberField
          label="Target CR"
          value={targetCr}
          min={0}
          max={30}
          onChange={(value) => {
            setTargetCr(value);
            setActivePresetId("");
          }}
        />
      </section>

      <section className="game-frame-control-zone">
        <div className="game-frame-control-zone__head">
          <span>Monster Tier</span>
          <strong>{monsterTier.label}</strong>
        </div>
        <div className="game-frame-pill-row" role="radiogroup" aria-label="Monster tier">
          {MONSTER_TIERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === monsterTierId}
              className={`game-frame-pill ${item.id === monsterTierId ? "is-active" : ""}`}
              onClick={() => {
                setMonsterTierId(item.id);
                setActivePresetId("");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="game-frame-control-zone">
        <div className="game-frame-control-zone__head">
          <span>Tempo</span>
          <strong>{tempoProfile.label}</strong>
        </div>
        <div className="game-frame-pill-row" role="radiogroup" aria-label="Tempo profile">
          {TEMPO_PROFILES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === tempoProfileId}
              className={`game-frame-pill ${item.id === tempoProfileId ? "is-active" : ""}`}
              onClick={() => {
                setTempoProfileId(item.id);
                setActivePresetId("");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="game-frame-control-zone game-frame-control-zone--danger">
        <div className="game-frame-control-zone__head">
          <span>Danger</span>
          <strong>{danger?.label || "Standard"}</strong>
        </div>
        <div className="game-frame-danger-row" role="radiogroup" aria-label="Monster danger">
          {DANGERS.map((item, index) => (
            <button
              key={item.id}
              className={`game-frame-danger ${item.id === dangerId ? "is-active" : ""}`}
              type="button"
              role="radio"
              aria-checked={item.id === dangerId}
              onClick={() => {
                setDangerId(item.id);
                setActivePresetId("");
              }}
            >
              <span>0{index + 1}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="game-frame-control-zone game-frame-control-zone--budget">
        <div className="game-frame-control-zone__head">
          <span>Budget</span>
          <strong>{pressureOverBudget || complexityOverBudget ? "Over Limit" : "Stable"}</strong>
        </div>
        <div className="game-frame-budget-grid">
          <BudgetMeter
            label="Pressure"
            value={computed.pressure}
            max={computed.budget}
            percent={pressurePercent}
            over={pressureOverBudget}
          />
          <BudgetMeter
            label="Complexity"
            value={computed.complexity}
            max={computed.complexityCap}
            percent={complexityPercent}
            over={complexityOverBudget}
          />
        </div>
      </section>
    </div>
  );
}

function BudgetMeter({ label, value, max, percent, over }) {
  return (
    <div className={`game-frame-budget-meter ${over ? "is-over" : ""}`}>
      <span>
        <small>{label}</small>
        <strong>
          {value} / {max}
        </strong>
      </span>
      <i>
        <b className={over ? "is-over" : ""} style={{ width: `${Math.min(percent, 100)}%` }} />
      </i>
    </div>
  );
}

export function MonsterFrameModal({
  open,
  onClose,
  computed,
  creatureType,
  category,
  role,
  targetCr,
  tacticalRole,
  monsterTier,
  tempoProfile,
  typeId,
  roleId,
  tacticalRoleId,
  monsterTierId,
  tempoProfileId,
  dangerId,
  pressurePercent,
  complexityPercent,
  selectType,
  setCategory,
  setActivePresetId,
  setRoleId,
  setTargetCr,
  setTacticalRoleId,
  setMonsterTierId,
  setTempoProfileId,
  setDangerId,
}) {
  const [activeStep, setActiveStep] = useState("chassis");

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const activeIndex = FRAME_STEPS.findIndex((step) => step.id === activeStep);
  const activeStepData = FRAME_STEPS[activeIndex] || FRAME_STEPS[0];
  const pressureOverBudget = computed.pressure > computed.budget;
  const complexityOverBudget = computed.complexity > computed.complexityCap;
  const danger = useMemo(
    () => DANGERS.find((item) => item.id === dangerId) || DANGERS[0],
    [dangerId]
  );

  if (!open) return null;

  function goPrevious() {
    setActiveStep(FRAME_STEPS[Math.max(activeIndex - 1, 0)].id);
  }

  function goNext() {
    setActiveStep(FRAME_STEPS[Math.min(activeIndex + 1, FRAME_STEPS.length - 1)].id);
  }

  const modal = (
    <div
      className="monster-shell monster-frame-modal-portal"
      data-monster-frame-modal-portal=""
    >
      <div
        className="monster-frame-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Monster Frame"
      >
        <button
          className="monster-frame-modal__scrim monster-frame-scrim is-open"
          type="button"
          aria-label="Close Monster Frame"
          onClick={onClose}
        />

        <aside
          className="panel navigator monster-frame-drawer game-frame-drawer game-frame-drawer--fullscreen game-frame-drawer--guided is-open"
          aria-label="Monster Frame"
          aria-hidden="false"
        >
          <header className="game-frame__hero">
            <div className="game-frame__title-copy">
              <p className="eyebrow">Monster Frame</p>
              <h2>{computed.name}</h2>
              <p>Build the baseline before choosing grafts.</p>
            </div>

            <div className="game-frame__hud-stats" aria-label="Current frame budget">
              <FrameKpi icon={Gauge} label="CR" value={targetCr} />
              <FrameKpi
                icon={AlertTriangle}
                label="Pressure"
                value={`${computed.pressure}/${computed.budget}`}
                tone={pressureOverBudget ? "danger" : "stable"}
              />
              <FrameKpi
                icon={Activity}
                label="Complexity"
                value={`${computed.complexity}/${computed.complexityCap}`}
                tone={complexityOverBudget ? "danger" : "stable"}
              />
            </div>

            <button
              className="icon-btn game-frame-modal__close"
              type="button"
              aria-label="Close Monster Frame"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="game-frame-guided-layout">
            <FrameStepNav activeStep={activeStep} setActiveStep={setActiveStep} />

            <main className="game-frame-stage" aria-live="polite">
              <StepHeader step={activeStepData} />

              {activeStep === "chassis" && (
                <ChassisStep
                  typeId={typeId}
                  creatureType={creatureType}
                  category={category}
                  selectType={selectType}
                  setCategory={setCategory}
                  setActivePresetId={setActivePresetId}
                />
              )}

              {activeStep === "role" && (
                <RoleStep
                  roleId={roleId}
                  tacticalRoleId={tacticalRoleId}
                  tacticalRole={tacticalRole}
                  setRoleId={setRoleId}
                  setTacticalRoleId={setTacticalRoleId}
                  setActivePresetId={setActivePresetId}
                />
              )}

              {activeStep === "challenge" && (
                <ChallengeStep
                  targetCr={targetCr}
                  monsterTier={monsterTier}
                  monsterTierId={monsterTierId}
                  tempoProfile={tempoProfile}
                  tempoProfileId={tempoProfileId}
                  dangerId={dangerId}
                  danger={danger}
                  computed={computed}
                  pressurePercent={pressurePercent}
                  complexityPercent={complexityPercent}
                  pressureOverBudget={pressureOverBudget}
                  complexityOverBudget={complexityOverBudget}
                  setTargetCr={setTargetCr}
                  setMonsterTierId={setMonsterTierId}
                  setTempoProfileId={setTempoProfileId}
                  setDangerId={setDangerId}
                  setActivePresetId={setActivePresetId}
                />
              )}
            </main>

            <FrameSummary
              creatureType={creatureType}
              category={category}
              role={role}
              targetCr={targetCr}
              tacticalRole={tacticalRole}
              monsterTier={monsterTier}
              tempoProfile={tempoProfile}
              danger={danger}
              computed={computed}
              pressureOverBudget={pressureOverBudget}
              complexityOverBudget={complexityOverBudget}
            />
          </div>

          <footer className="game-frame-footer">
            <button
              type="button"
              className="game-frame-footer__btn"
              disabled={activeIndex === 0}
              onClick={goPrevious}
            >
              Previous
            </button>
            <span>
              Step {activeIndex + 1} / {FRAME_STEPS.length}
            </span>
            {activeIndex < FRAME_STEPS.length - 1 ? (
              <button type="button" className="game-frame-footer__btn is-primary" onClick={goNext}>
                Next
              </button>
            ) : (
              <button type="button" className="game-frame-footer__btn is-primary" onClick={onClose}>
                Done
              </button>
            )}
          </footer>
        </aside>
      </div>
    </div>
  );

  if (typeof document === "undefined" || !document.body) {
    return modal;
  }

  return createPortal(modal, document.body);
}
