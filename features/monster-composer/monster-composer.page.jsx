import { useMemo, useState } from "react";
import "./styles.css";
import { motion } from "framer-motion";
import {
  Skull,
  Shield,
  Sword,
  Gauge,
  AlertTriangle,
  RotateCcw,
  Plus,
  X,
  Flame,
  BookOpen,
  Activity,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

import {
  CREATURE_TYPES,
  ROLES,
  DANGERS,
  TACTICAL_ROLES,
  MONSTER_TIERS,
  TEMPO_PROFILES,
  getDefaultCreatureCategory,
  isCreatureCategoryUnavailable,
  isCreatureTypeUnavailable,
} from "./monster-composer.taxonomies.js";

import {
  SLOTS,
  DEFAULT_SLOT_CAPS,
  SILHOUETTE_SLOT_CARDS,
  ANATOMY_LEFT_SLOT_IDS,
  ANATOMY_RIGHT_SLOT_IDS,
  ANATOMY_BOTTOM_SLOT_IDS,
} from "./monster-composer.workflow.js";

import { MONSTER_SOURCES as SOURCES } from "./data/monster-sources.js";
import { MONSTER_GRAFTS as FEATURES, FEATURE_MECHANIC_OVERRIDES } from "./data/monster-grafts.js";

import { MONSTER_FAMILY_PRESETS } from "./data/monster-presets.js";
import { BASE_SILHOUETTE_ANCHORS, MONSTER_SILHOUETTES } from "./data/monster-silhouettes.js";
import {
  asArray,
  collapseSelectedToSingle,
  getFeaturesFromSelection as getFeaturesFromSelectionModel,
  getSelectedIdsForSlot,
  hasSelectedSlot,
  trimSelectedToCaps as trimSelectedToCapsModel,
  uniqueArray,
} from "./model/selection.js";
import {
  buildCompatibilityWarning,
  buildFeatureDecisionProfile as buildFeatureDecisionProfileModel,
  buildFeatureImpactPreview as buildFeatureImpactPreviewModel,
  buildSmartSlotPicks as buildSmartSlotPicksModel,
  canShowFeatureForMode,
  formatFeatureImpactPreview,
  formatToken,
  getCompatibilityRank,
  getCompatibilityStatus,
  getComposerMode,
  getFeatureCompatibility,
  getFeatureDecisionRank,
  getFeatureSafetyScore as getFeatureSafetyScoreModel,
  getFeatureSpiceScore as getFeatureSpiceScoreModel,
  hasFeatureCompatibilityOverride,
} from "./model/compatibility.js";

const FEATURE_SCHEMA_VERSION = "monster-graft-v0.8";
const EXPORT_SCHEMA_VERSION = "monster-crucible-export-v0.8";
const DATA_MODEL_MIGRATION_STAGE = "structured-layer-with-override-fallbacks";

const SLOT_SECTION_FALLBACK = {
  body: "trait",
  mind: "trait",
  movement: "trait",
  attack: "action",
  horror: "trait",
  twist: "trait",
  weakness: "trait",
  death: "death",
  lair: "lairAction",
};

const STAT_BLOCK_SECTION_LABELS = {
  trait: "Traits",
  action: "Actions",
  bonusAction: "Bonus Actions",
  reaction: "Reactions",
  legendaryAction: "Legendary Actions",
  lairAction: "Lair Actions",
  death: "Death Effects",
};


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function titleCase(value) {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTier(level) {
  if (level <= 4) return 1;
  if (level <= 10) return 2;
  if (level <= 16) return 3;
  return 4;
}

function getProf(level) {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

function averageDamageText(value) {
  if (value <= 5) return "1d6 + 1";
  if (value <= 8) return "1d8 + 3";
  if (value <= 12) return "2d8 + 3";
  if (value <= 18) return "3d8 + 4";
  if (value <= 26) return "4d10 + 4";
  return "6d10 + 5";
}

function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function modText(value) {
  return value >= 0 ? `+${value}` : `−${Math.abs(value)}`;
}

function xpForCr(cr) {
  const table = {
    0: 10,
    1: 200,
    2: 450,
    3: 700,
    4: 1100,
    5: 1800,
    6: 2300,
    7: 2900,
    8: 3900,
    9: 5000,
    10: 5900,
    11: 7200,
    12: 8400,
    13: 10000,
    14: 11500,
    15: 13000,
    16: 15000,
    17: 18000,
    18: 20000,
    19: 22000,
    20: 25000,
    21: 33000,
    22: 41000,
    23: 50000,
    24: 62000,
    25: 75000,
    26: 90000,
    27: 105000,
    28: 120000,
    29: 135000,
    30: 155000,
  };
  return table[clamp(cr, 0, 30)] || 0;
}

function getProfForCr(cr) {
  if (cr <= 4) return 2;
  if (cr <= 8) return 3;
  if (cr <= 12) return 4;
  if (cr <= 16) return 5;
  if (cr <= 20) return 6;
  if (cr <= 24) return 7;
  if (cr <= 28) return 8;
  return 9;
}

function getExpectedAttackBonus(cr) {
  return Math.round(3.5 + cr / 2);
}

function getExpectedSaveDc(cr) {
  return Math.round(11.5 + cr / 2);
}

function getExpectedAc(cr) {
  return Math.round(13 + cr / 3);
}

function getExpectedHp(cr, tierId = "normal") {
  const base = cr < 20 ? 16 + 16 * cr : 368 + 48 * (cr - 20);
  const tier = MONSTER_TIERS.find((item) => item.id === tierId) || MONSTER_TIERS[0];
  return Math.max(1, Math.round(base * tier.hpMult));
}

function getExpectedDpr(cr, tierId = "normal") {
  const legendaryLike = tierId === "legendary" || tierId === "boss" || tierId === "setpiece";
  const base =
    cr < 20
      ? legendaryLike
        ? 7.5 + 7.5 * cr
        : 6 + 6 * cr
      : legendaryLike
        ? 165 + 15 * (cr - 20)
        : 132 + 12 * (cr - 20);
  const tier = MONSTER_TIERS.find((item) => item.id === tierId) || MONSTER_TIERS[0];
  return Math.max(1, Math.round(base * (legendaryLike ? 1 : tier.dprMult)));
}

function getBaselineProfile(cr, tierId) {
  return {
    ac: getExpectedAc(cr),
    hp: getExpectedHp(cr, tierId),
    dpr: getExpectedDpr(cr, tierId),
    attackBonus: getExpectedAttackBonus(cr),
    saveDc: getExpectedSaveDc(cr),
  };
}

function buildProfileDeltas(printedStats, effectiveProfile, baseline) {
  return {
    acDelta: printedStats.ac - baseline.ac,
    hpDelta: printedStats.hp - baseline.hp,
    dprDelta: printedStats.dpr - baseline.dpr,
    effectiveDprDelta: effectiveProfile.effectiveDpr3Round - baseline.dpr,
    attackDelta: printedStats.attackBonus - baseline.attackBonus,
    dcDelta: printedStats.saveDc - baseline.saveDc,
  };
}

function buildAbilityProfile(typeId, category, roleId, selectedFeatures, prof) {
  const bases = {
    undead: { str: 14, dex: 8, con: 16, int: 5, wis: 10, cha: 8 },
    beast: { str: 12, dex: 16, con: 12, int: 3, wis: 14, cha: 6 },
    aberration: { str: 14, dex: 12, con: 14, int: 12, wis: 14, cha: 10 },
  };

  const scores = { ...(bases[typeId] || bases.undead) };
  const categoryAdjustments = {
    Zombie: { dex: -2, con: 2 },
    Skeleton: { dex: 2, con: -2 },
    Spirit: { str: -2, dex: 4, cha: 2 },
    Spider: { str: -2, dex: 2 },
    Wolf: { str: 2, wis: 1 },
    Bird: { dex: 3, wis: 1 },
    "Flesh Mass": { dex: -2, con: 4 },
    "Eye Horror": { dex: 1, int: 2, wis: 2 },
    Parasite: { dex: 3, con: -1 },
    "Psychic Predator": { int: 3, wis: 2, cha: 2 },
  };

  Object.entries(categoryAdjustments[category] || {}).forEach(([ability, value]) => {
    scores[ability] += value;
  });

  if (roleId === "boss") {
    scores.str += 2;
    scores.con += 2;
    scores.wis += 2;
  }

  if (roleId === "minion") {
    scores.con -= 2;
  }

  selectedFeatures.forEach((feature) => {
    if ((feature.stats?.hp || 0) >= 12) scores.con += 1;
    if ((feature.stats?.mobility || 0) >= 1) scores.dex += 1;
    if ((feature.stats?.control || 0) >= 2) scores.wis += 1;
  });

  const proficientSaves = new Set(["con", "wis"]);
  if (typeId === "beast") proficientSaves.add("dex");
  if (typeId === "aberration") proficientSaves.add("int");
  if (roleId === "boss") {
    proficientSaves.add("str");
    proficientSaves.add("dex");
  }

  function row(key, label) {
    const score = clamp(scores[key], 1, 30);
    const mod = abilityMod(score);
    const save = mod + (proficientSaves.has(key) ? prof : 0);
    return { key, label, score, mod, save };
  }

  return {
    physical: [row("str", "Str"), row("dex", "Dex"), row("con", "Con")],
    mental: [row("int", "Int"), row("wis", "Wis"), row("cha", "Cha")],
  };
}

function buildName(type, category, selectedFeatures) {
  const sourceFeature =
    selectedFeatures.find((f) => f.slot === "horror") ||
    selectedFeatures.find((f) => f.slot === "body") ||
    selectedFeatures[0];
  const source = sourceFeature ? SOURCES.find((s) => s.id === sourceFeature.source)?.label : null;

  if (!source) return `Cruor ${category}`;
  if (source === "Wolf Spiders") return `Brood-Bearing ${category}`;
  if (source === "Wax Death Masks") return `Wax-Faced ${category}`;
  if (source === "Gashadokuro") return `Many-Boned ${category}`;
  if (source === "Jikininki") return `Grave-Hungry ${category}`;
  if (source === "Decomposition") return `Rot-Swollen ${category}`;
  return `${source} ${titleCase(type)}`;
}

function featureMatchesFrame(feature, sourceId, typeId, roleId, slotId = null) {
  const sourceMatch = feature.source === sourceId;
  const typeMatch = !feature.typeBias?.length || feature.typeBias.includes(typeId);
  const roleMatch = !feature.roleBias?.length || feature.roleBias.includes(roleId);
  const slotMatch = !slotId || feature.slot === slotId;
  return sourceMatch && typeMatch && roleMatch && slotMatch;
}

function featureMatchesSourceAndSlot(feature, sourceId, slotId = null) {
  const sourceMatch = feature.source === sourceId;
  const slotMatch = !slotId || feature.slot === slotId;
  return sourceMatch && slotMatch;
}

function getPresetById(presetId) {
  return MONSTER_FAMILY_PRESETS.find((preset) => preset.id === presetId) || null;
}

function normalizePresetSelection(preset) {
  if (!preset?.selection) return {};
  return Object.fromEntries(
    Object.entries(preset.selection)
      .map(([slotId, value]) => {
        const ids = asArray(value).filter((id) =>
          FEATURES.some((feature) => feature.id === id && feature.slot === slotId)
        );
        return [slotId, ids.length > 1 ? ids : ids[0]];
      })
      .filter(([, value]) => (Array.isArray(value) ? value.length : Boolean(value)))
  );
}

function getPresetFeatureIds(preset) {
  return Object.values(normalizePresetSelection(preset)).flatMap((value) =>
    Array.isArray(value) ? value : [value]
  );
}

function getPresetCoverage(preset) {
  const selection = normalizePresetSelection(preset);
  const slotCount = Object.keys(selection).length;
  const graftCount = getPresetFeatureIds(preset).length;
  return {
    slotCount,
    graftCount,
    percent: clamp(Math.round((slotCount / SLOTS.length) * 100), 0, 100),
  };
}

function getFeatureDecisionProfile(feature, context = {}) {
  return buildFeatureDecisionProfileModel(feature, {
    ...context,
    getFeatureSection,
    getFeatureMechanicProfile,
    getFeatureCounterplayProfile,
    titleCase,
  });
}

function getFeatureSpiceScore(feature, profile) {
  return getFeatureSpiceScoreModel(feature, profile, {
    getFeatureSection,
    getFeatureCounterplayProfile,
  });
}

function getFeatureSafetyScore(feature, profile) {
  return getFeatureSafetyScoreModel(feature, profile, {
    getFeatureMechanicProfile,
    getFeatureCounterplayProfile,
  });
}

function buildSmartSlotPicks(args) {
  return buildSmartSlotPicksModel({
    ...args,
    getFeatureDecisionProfile,
    getFeatureSafetyScore,
    getFeatureSpiceScore,
  });
}

function buildFeatureImpactPreview(args) {
  return buildFeatureImpactPreviewModel({
    ...args,
    getFeatureMechanicProfile,
    summarizeMechanicProfiles,
    buildPressureProfile,
    buildComplexityProfile,
    getFeatureCounterplayProfile,
  });
}

function getFeatureMechanicProfile(feature) {
  const override = FEATURE_MECHANIC_OVERRIDES[feature.id] || {};
  const section = getFeatureSection(feature);
  const fallbackUsage =
    section === "reaction"
      ? { frequency: "reaction" }
      : section === "lairAction"
        ? { frequency: "lair_action" }
        : section === "death"
          ? { frequency: "death" }
          : { frequency: "at_will" };

  return {
    abilityType: override.abilityType || section,
    mechanicTags: uniqueArray([
      ...asArray(feature.mechanicTags),
      ...asArray(override.mechanicTags),
    ]),
    pressureTags: uniqueArray([
      ...asArray(feature.pressureTags),
      ...asArray(override.pressureTags),
    ]),
    complexityTags: uniqueArray([
      ...asArray(feature.complexityTags),
      ...asArray(override.complexityTags),
    ]),
    damageProfile: override.damageProfile ||
      feature.damageProfile || {
        baseDamage: Math.max(0, feature.stats?.dpr || 0),
        damageType: "Variable",
        expectedTargets: feature.stats?.control ? 1.25 : 1,
        roundWeight: [1, 1, 1],
      },
    usageProfile: override.usageProfile || feature.usageProfile || fallbackUsage,
    conditionProfile: override.conditionProfile || feature.conditionProfile || null,
  };
}

function countValues(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function summarizeMechanicProfiles(profiles) {
  const mechanicTags = profiles.flatMap((profile) => profile.mechanicTags);
  const pressureTags = profiles.flatMap((profile) => profile.pressureTags);
  const complexityTags = profiles.flatMap((profile) => profile.complexityTags);
  const usageProfiles = profiles.map((profile) => profile.usageProfile || {});
  const conditionProfiles = profiles.map((profile) => profile.conditionProfile).filter(Boolean);
  const structuredDamage = profiles.reduce((sum, profile) => {
    const damage = profile.damageProfile || {};
    const weights = Array.isArray(damage.roundWeight) ? damage.roundWeight : [1, 1, 1];
    const averageWeight =
      weights.reduce((total, value) => total + value, 0) / Math.max(1, weights.length);
    return (
      sum +
      Math.max(0, damage.baseDamage || 0) * Math.max(1, damage.expectedTargets || 1) * averageWeight
    );
  }, 0);

  return {
    mechanicTags: countValues(mechanicTags),
    pressureTags: countValues(pressureTags),
    complexityTags: countValues(complexityTags),
    rechargeCount: usageProfiles.filter((profile) => profile.frequency === "recharge").length,
    reactionCount: usageProfiles.filter((profile) => profile.frequency === "reaction").length,
    deathEffectCount: usageProfiles.filter((profile) => profile.frequency === "death").length,
    conditionCount: conditionProfiles.length,
    majorConditionCount: conditionProfiles.filter((profile) =>
      ["Major", "Severe"].includes(profile.severity)
    ).length,
    structuredDamage: Math.round(structuredDamage),
  };
}

function topMechanicTags(counts, limit = 6) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => `${formatToken(tag)} ×${count}`);
}

function tagCount(counts, tag) {
  return Number(counts?.[tag] || 0);
}

function roundBreakdown(breakdown) {
  return Object.fromEntries(
    Object.entries(breakdown).map(([key, value]) => [key, Math.round(value)])
  );
}

function sumBreakdown(breakdown) {
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
}

function buildProfileSources(breakdown, labelMap, limit = 4) {
  return Object.entries(breakdown)
    .filter(([, value]) => Math.abs(value) > 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit)
    .map(([key, value]) => `${labelMap[key] || titleCase(key)} ${value > 0 ? "+" : ""}${value}`);
}

function profileBand(score, limit) {
  if (score <= limit * 0.55) return "Low";
  if (score <= limit * 0.85) return "Moderate";
  if (score <= limit) return "High";
  if (score <= limit * 1.25) return "Over Target";
  return "Critical";
}

const PRESSURE_LABELS = {
  base: "Base Grafts",
  offense: "Offense",
  area: "Area",
  control: "Control",
  tempo: "Tempo",
  defense: "Defense",
  sustain: "Sustain",
  other: "Other",
};

const COMPLEXITY_LABELS = {
  base: "Base Grafts",
  actions: "Actions",
  timing: "Timing",
  conditions: "Conditions",
  environment: "Environment",
  other: "Other",
};

function buildPressureProfile({
  cost,
  monsterTier,
  tempoProfile,
  statMods,
  mechanicsSummary,
  budget,
}) {
  const pressureTags = mechanicsSummary.pressureTags || {};
  const positiveCost = Math.max(0, cost);
  const fairnessRelief = Math.max(0, statMods.fairness || 0);
  const breakdown = roundBreakdown({
    base: positiveCost * 0.35,
    offense:
      Math.max(0, statMods.dpr || 0) * 0.2 +
      tagCount(pressureTags, "single_target") * 0.5 +
      tagCount(pressureTags, "reaction_burst") * 1.1 +
      tagCount(pressureTags, "burst") * 1.4,
    area: tagCount(pressureTags, "area") * 1 + tagCount(pressureTags, "death_burst") * 0.6,
    control:
      Math.max(0, statMods.control || 0) * 0.45 +
      tagCount(pressureTags, "control") * 0.9 +
      tagCount(pressureTags, "ranged_lockdown") * 1 +
      tagCount(pressureTags, "single_target_lockdown") * 1 +
      tagCount(pressureTags, "control_synergy") * 0.4,
    tempo:
      monsterTier.pressureMod * 0.55 +
      tempoProfile.pressureMod * 0.7 +
      tagCount(pressureTags, "tempo") * 1 +
      tagCount(pressureTags, "action_economy") * 1.1 +
      tagCount(pressureTags, "retaliation") * 0.8,
    defense: Math.max(0, statMods.hp || 0) / 28 + Math.max(0, statMods.ac || 0) * 0.85,
    sustain:
      tagCount(pressureTags, "sustain") * 0.8 +
      tagCount(pressureTags, "escalation") * 1 +
      tagCount(pressureTags, "campaign_pressure") * 0.5,
    other: Math.max(0, statMods.mobility || 0) * 0.35 - fairnessRelief * 1.35,
  });
  const score = Math.max(0, Math.round(sumBreakdown(breakdown)));
  return {
    score,
    label: profileBand(score, budget),
    breakdown,
    sources: buildProfileSources(breakdown, PRESSURE_LABELS),
  };
}

function buildComplexityProfile({ complexity, mechanicsSummary, featureMechanics, limit }) {
  const complexityTags = mechanicsSummary.complexityTags || {};
  const uniqueTagCount = Object.keys(complexityTags).length;
  const breakdown = roundBreakdown({
    base: Math.max(0, complexity) * 0.35,
    actions:
      mechanicsSummary.rechargeCount * 0.55 +
      mechanicsSummary.reactionCount * 0.7 +
      mechanicsSummary.deathEffectCount * 0.35 +
      tagCount(complexityTags, "action_cost") * 0.6 +
      tagCount(complexityTags, "summon_tracking") * 0.8,
    timing:
      tagCount(complexityTags, "recharge") * 0.45 +
      tagCount(complexityTags, "reaction_trigger") * 0.65 +
      tagCount(complexityTags, "random_trigger") * 0.55 +
      tagCount(complexityTags, "death_trigger") * 0.35 +
      tagCount(complexityTags, "round_tracking") * 0.75 +
      tagCount(complexityTags, "delayed_tracking") * 0.7,
    conditions:
      mechanicsSummary.conditionCount * 0.35 +
      mechanicsSummary.majorConditionCount * 0.55 +
      tagCount(complexityTags, "condition_tracking") * 0.5 +
      tagCount(complexityTags, "repeat_save") * 0.65 +
      tagCount(complexityTags, "ongoing_tracking") * 0.65 +
      tagCount(complexityTags, "escape_check") * 0.55,
    environment:
      tagCount(complexityTags, "object_hp") * 0.65 +
      tagCount(complexityTags, "object_tracking") * 0.65 +
      tagCount(complexityTags, "corpse_anchor") * 0.55 +
      tagCount(complexityTags, "corpse_tracking") * 0.55 +
      tagCount(complexityTags, "terrain_anchor") * 0.45 +
      tagCount(complexityTags, "cleanup_action") * 0.55,
    other: Math.max(0, uniqueTagCount - featureMechanics.length) * 0.2,
  });
  const score = Math.max(0, Math.round(sumBreakdown(breakdown)));
  return {
    score,
    label: profileBand(score, limit),
    breakdown,
    sources: buildProfileSources(breakdown, COMPLEXITY_LABELS),
  };
}

function formatBreakdownCompact(profile, labelMap) {
  return Object.entries(profile.breakdown || {})
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${labelMap[key] || titleCase(key)} ${value > 0 ? "+" : ""}${value}`)
    .join("; ");
}

const COUNTERPLAY_TERMS = {
  telegraph: [
    "visible",
    "before",
    "obvious",
    "telegraph",
    "see",
    "shines",
    "creaks",
    "bulges",
    "distends",
    "leaks",
    "audible",
    "readable",
    "warning",
    "notices",
    "reveals",
  ],
  breakCondition: [
    "save",
    "escape",
    "destroyed",
    "burned",
    "clean",
    "cleaned",
    "ends",
    "end the effect",
    "until",
    "action",
    "medicine",
    "healing",
    "removed",
    "short rest",
    "long rest",
  ],
  nonDamageAnswer: [
    "fire",
    "radiant",
    "holy",
    "salt",
    "rite",
    "name",
    "true name",
    "bait",
    "corpse",
    "distance",
    "range",
    "cover",
    "light",
    "bright light",
    "burn",
    "destroy",
    "avoid",
    "move",
    "forced movement",
    "medicine",
    "healing",
    "clean",
    "antitoxin",
    "scouting",
    "watch",
    "formation",
    "readied",
  ],
  positioning: [
    "distance",
    "range",
    "cover",
    "spacing",
    "formation",
    "avoid",
    "move",
    "position",
    "lane",
    "path",
    "surface",
    "terrain",
    "wall",
    "ceiling",
    "light",
  ],
  prep: [
    "prepared",
    "bait",
    "holy water",
    "salt",
    "rite",
    "investigation",
    "scouting",
    "watch",
    "records",
    "offering",
    "antitoxin",
    "cleansing",
    "consecrated",
  ],
};

function textHasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getFeatureCounterplayProfile(feature) {
  const mechanicProfile = getFeatureMechanicProfile(feature);
  const text =
    `${feature.summary || ""} ${feature.mechanics || ""} ${feature.counterplay || ""}`.toLowerCase();
  const counterplayText = String(feature.counterplay || "").trim();
  const control = Math.max(0, feature.stats?.control || 0);
  const dpr = Math.max(0, feature.stats?.dpr || 0);
  const majorCondition = ["Major", "Severe"].includes(mechanicProfile.conditionProfile?.severity);
  const hardControl =
    control >= 2 ||
    majorCondition ||
    mechanicProfile.mechanicTags.some((tag) =>
      ["restrained", "grapple", "condition", "exhaustion", "healing_denial"].includes(tag)
    );
  const burst =
    dpr >= 6 ||
    mechanicProfile.pressureTags.some((tag) =>
      ["burst", "death_burst", "reaction_burst"].includes(tag)
    );
  const agencyTags = uniqueArray([
    textHasAny(text, COUNTERPLAY_TERMS.telegraph) ? "telegraph" : null,
    textHasAny(text, COUNTERPLAY_TERMS.breakCondition) ? "break_condition" : null,
    textHasAny(text, COUNTERPLAY_TERMS.nonDamageAnswer) ? "non_damage_answer" : null,
    textHasAny(text, COUNTERPLAY_TERMS.positioning) ? "positioning_answer" : null,
    textHasAny(text, COUNTERPLAY_TERMS.prep) ? "prep_answer" : null,
    feature.slot === "weakness" ? "explicit_weakness" : null,
    feature.stats?.fairness ? "fairness_graft" : null,
  ]);

  return {
    id: feature.id,
    title: feature.title,
    slot: feature.slot,
    section: getFeatureSection(feature),
    isOppressive: hardControl || burst || feature.cost >= 5,
    hardControl,
    burst,
    hasCounterplayText: counterplayText.length >= 24,
    hasTelegraph: agencyTags.includes("telegraph"),
    hasBreakCondition: agencyTags.includes("break_condition") || feature.slot === "weakness",
    hasNonDamageAnswer: agencyTags.includes("non_damage_answer") || feature.slot === "weakness",
    agencyTags,
    mechanicTags: mechanicProfile.mechanicTags,
    risk: hardControl ? "Control" : burst ? "Burst" : feature.cost >= 5 ? "High Cost" : "Routine",
  };
}

function summarizeCounterplayProfiles(profiles) {
  const oppressive = profiles.filter((profile) => profile.isOppressive);
  return {
    total: profiles.length,
    oppressiveCount: oppressive.length,
    withCounterplayText: profiles.filter((profile) => profile.hasCounterplayText).length,
    telegraphedCount: profiles.filter((profile) => profile.hasTelegraph).length,
    breakConditionCount: profiles.filter((profile) => profile.hasBreakCondition).length,
    nonDamageAnswerCount: profiles.filter((profile) => profile.hasNonDamageAnswer).length,
    hardControlCount: profiles.filter((profile) => profile.hardControl).length,
    burstCount: profiles.filter((profile) => profile.burst).length,
    agencyTags: countValues(profiles.flatMap((profile) => profile.agencyTags)),
    untelegraphedOppressive: oppressive.filter((profile) => !profile.hasTelegraph),
    unresolvedOppressive: oppressive.filter(
      (profile) => !profile.hasBreakCondition && !profile.hasNonDamageAnswer
    ),
  };
}

function buildCounterplayAudit({
  selected,
  roleId,
  monsterTier,
  pressureProfile,
  complexityProfile,
  mechanicsSummary,
  counterplayProfiles,
}) {
  const summary = summarizeCounterplayProfiles(counterplayProfiles);
  const issues = [];
  const recommendations = [];
  const hasWeakness = hasSelectedSlot(selected, "weakness");
  const hasLair = hasSelectedSlot(selected, "lair");
  const hasDeath = hasSelectedSlot(selected, "death");

  if (!hasWeakness) {
    issues.push({
      severity: "critical",
      label: "Missing Weakness / Tell",
      detail:
        "Add at least one explicit player-facing answer before using this as a horror monster.",
    });
    recommendations.push(
      "Add a Weakness / Tell graft with a visible trigger or non-damage solution."
    );
  }

  if (summary.unresolvedOppressive.length) {
    issues.push({
      severity: "major",
      label: "Oppressive Grafts Need Answers",
      detail: summary.unresolvedOppressive.map((profile) => profile.title).join(", "),
    });
    recommendations.push(
      "Give high-pressure grafts a break condition, destroyable object, repeat save, positioning answer, or preparation answer."
    );
  }

  if (summary.untelegraphedOppressive.length >= 2) {
    issues.push({
      severity: "major",
      label: "Too Many Untelegraphed Threats",
      detail: summary.untelegraphedOppressive.map((profile) => profile.title).join(", "),
    });
    recommendations.push(
      "Add visual, audio, timing, or behavior tells before the most punishing abilities resolve."
    );
  }

  if (
    mechanicsSummary.majorConditionCount >= 2 &&
    summary.breakConditionCount < mechanicsSummary.majorConditionCount
  ) {
    issues.push({
      severity: "major",
      label: "Hard Conditions Need Release Valves",
      detail: "Major conditions outnumber clear break conditions.",
    });
    recommendations.push(
      "Prefer repeat saves, escape checks, destroyed anchors, visible setup, or one-round durations for hard control."
    );
  }

  if (mechanicsSummary.deathEffectCount && !hasDeath) {
    issues.push({
      severity: "minor",
      label: "Implicit Death Pressure",
      detail: "Structured mechanics imply death pressure, but no Death Effect slot is occupied.",
    });
  }

  if (pressureProfile.label === "Critical" && summary.nonDamageAnswerCount < 2) {
    issues.push({
      severity: "critical",
      label: "Critical Pressure Needs Non-Damage Answers",
      detail: "The build is highly pressuring but has few non-damage answers.",
    });
    recommendations.push(
      "Add answers such as fire, radiant damage, distance, cover, bait, rites, medicine, object destruction, or light management."
    );
  }

  if (["boss", "legendary", "setpiece"].includes(monsterTier.id) && !hasLair && roleId === "boss") {
    issues.push({
      severity: "minor",
      label: "Boss Has No Scene Counterplay",
      detail:
        "A boss can work without lair rules, but scene-level interaction would make counterplay clearer.",
    });
  }

  const score = clamp(
    40 +
      (hasWeakness ? 20 : 0) +
      Math.min(18, summary.nonDamageAnswerCount * 6) +
      Math.min(16, summary.telegraphedCount * 4) +
      Math.min(16, summary.breakConditionCount * 4) -
      issues.filter((issue) => issue.severity === "critical").length * 22 -
      issues.filter((issue) => issue.severity === "major").length * 12 -
      issues.filter((issue) => issue.severity === "minor").length * 5,
    0,
    100
  );

  return {
    score,
    rating:
      score >= 82 ? "Strong" : score >= 64 ? "Playable" : score >= 45 ? "Needs Work" : "Unsafe",
    summary,
    issues,
    recommendations: uniqueArray(recommendations),
    agencyTags: summary.agencyTags,
  };
}

function formatCounterplayIssues(issues) {
  if (!issues.length) return "No major counterplay issues.";
  return issues.map((issue) => `${issue.label}: ${issue.detail}`).join("; ");
}

function getFeaturePressureWeight(feature) {
  const counterplayProfile = getFeatureCounterplayProfile(feature);
  return (
    Math.max(0, feature.cost) * 2 +
    feature.complexity +
    Math.max(0, feature.stats?.dpr || 0) +
    Math.max(0, feature.stats?.control || 0) * 1.5 +
    (counterplayProfile.burst ? 3 : 0) +
    (counterplayProfile.hardControl ? 3 : 0)
  );
}

function getFeatureComplexityWeight(feature) {
  const mechanicProfile = getFeatureMechanicProfile(feature);
  return (
    feature.complexity * 2 +
    mechanicProfile.complexityTags.length +
    (mechanicProfile.usageProfile?.frequency === "reaction" ? 2 : 0) +
    (mechanicProfile.usageProfile?.frequency === "recharge" ? 1 : 0) +
    (mechanicProfile.conditionProfile ? 1 : 0)
  );
}

function getTopFeatureByWeight(features, weightFn) {
  return (
    [...features].sort(
      (a, b) => weightFn(b) - weightFn(a) || b.cost - a.cost || a.title.localeCompare(b.title)
    )[0] || null
  );
}

function getOneClickFixCandidates({
  slotId,
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  sourceId,
  composerMode,
  customMode,
  excludeFeatureId = "",
}) {
  return FEATURES.map((feature) => ({
    feature,
    status: getCompatibilityStatus(feature, selectedFeatures, typeId, category),
  }))
    .filter(({ feature, status }) => {
      if (feature.id === excludeFeatureId) return false;
      if (feature.slot !== slotId) return false;
      if (getSelectedIdsForSlot(selected, feature.slot).includes(feature.id)) return false;
      const frameMatch = customMode
        ? featureMatchesSourceAndSlot(feature, sourceId, slotId)
        : featureMatchesFrame(feature, sourceId, typeId, roleId, slotId);
      return frameMatch && canShowFeatureForMode(status, composerMode);
    })
    .map(({ feature, status }) => {
      const profile = getFeatureDecisionProfile(feature, {
        status,
        selected,
        selectedFeatures,
        typeId,
        category,
        roleId,
        currentSlot: slotId,
      });
      return { feature, status, profile, safety: getFeatureSafetyScore(feature, profile) };
    });
}

function getBestAddFeatureFix(args) {
  const candidates = getOneClickFixCandidates(args);
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (args.slotId === "weakness") {
      return (
        (b.feature.stats?.fairness || 0) - (a.feature.stats?.fairness || 0) ||
        b.safety - a.safety ||
        getFeatureDecisionRank(a.profile) - getFeatureDecisionRank(b.profile) ||
        a.feature.title.localeCompare(b.feature.title)
      );
    }
    return (
      getFeatureDecisionRank(a.profile) - getFeatureDecisionRank(b.profile) ||
      b.safety - a.safety ||
      Math.max(0, a.feature.cost) - Math.max(0, b.feature.cost) ||
      a.feature.title.localeCompare(b.feature.title)
    );
  });
  return sorted[0]?.feature || null;
}

function getSelectedWithoutFeature(selected, feature) {
  if (!feature) return selected;
  const currentIds = getSelectedIdsForSlot(selected, feature.slot).filter(
    (id) => id !== feature.id
  );
  const next = { ...selected };
  if (!currentIds.length) delete next[feature.slot];
  else next[feature.slot] = Array.isArray(selected[feature.slot]) ? currentIds : currentIds[0];
  return next;
}

function findReplacementFix({
  feature,
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  sourceId,
  composerMode,
  customMode,
  reason = "pressure",
}) {
  if (!feature) return null;
  const reducedFeatures = selectedFeatures.filter((item) => item.id !== feature.id);
  const reducedSelected = getSelectedWithoutFeature(selected, feature);
  const originalWeight =
    reason === "complexity"
      ? getFeatureComplexityWeight(feature)
      : getFeaturePressureWeight(feature);
  const candidates = FEATURES.map((candidate) => ({
    candidate,
    status: getCompatibilityStatus(candidate, reducedFeatures, typeId, category),
  }))
    .filter(({ candidate, status }) => {
      if (candidate.id === feature.id) return false;
      if (candidate.slot !== feature.slot) return false;
      if (getSelectedIdsForSlot(reducedSelected, candidate.slot).includes(candidate.id))
        return false;
      const frameMatch = customMode
        ? featureMatchesSourceAndSlot(candidate, sourceId, feature.slot)
        : featureMatchesFrame(candidate, sourceId, typeId, roleId, feature.slot);
      if (!frameMatch || !canShowFeatureForMode(status, composerMode)) return false;
      const candidateWeight =
        reason === "complexity"
          ? getFeatureComplexityWeight(candidate)
          : getFeaturePressureWeight(candidate);
      return (
        candidateWeight < originalWeight ||
        candidate.cost < feature.cost ||
        candidate.complexity < feature.complexity
      );
    })
    .map(({ candidate, status }) => ({
      feature: candidate,
      status,
      weight:
        reason === "complexity"
          ? getFeatureComplexityWeight(candidate)
          : getFeaturePressureWeight(candidate),
      profile: getFeatureDecisionProfile(candidate, {
        status,
        selected: reducedSelected,
        selectedFeatures: reducedFeatures,
        typeId,
        category,
        roleId,
        currentSlot: feature.slot,
      }),
    }))
    .sort(
      (a, b) =>
        originalWeight - b.weight - (originalWeight - a.weight) ||
        getFeatureDecisionRank(a.profile) - getFeatureDecisionRank(b.profile) ||
        a.feature.title.localeCompare(b.feature.title)
    );
  return candidates[0]?.feature || null;
}

function buildOneClickFixes({
  issue,
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  sourceId,
  composerMode,
  customMode,
  topPressureFeature,
  topComplexityFeature,
}) {
  const fixes = [];
  const pushFix = (fix) => {
    if (!fix) return;
    if (
      fixes.some(
        (item) =>
          item.kind === fix.kind &&
          item.featureId === fix.featureId &&
          item.addFeatureId === fix.addFeatureId &&
          item.removeFeatureId === fix.removeFeatureId
      )
    )
      return;
    fixes.push(fix);
  };

  const weaknessFix = getBestAddFeatureFix({
    slotId: "weakness",
    selected,
    selectedFeatures,
    typeId,
    category,
    roleId,
    sourceId,
    composerMode,
    customMode,
  });
  const twistFix = getBestAddFeatureFix({
    slotId: "twist",
    selected,
    selectedFeatures,
    typeId,
    category,
    roleId,
    sourceId,
    composerMode,
    customMode,
  });
  const lairFix = getBestAddFeatureFix({
    slotId: "lair",
    selected,
    selectedFeatures,
    typeId,
    category,
    roleId,
    sourceId,
    composerMode,
    customMode,
  });

  if (["missing-weakness", "counterplay", "conditions"].includes(issue) && weaknessFix) {
    pushFix({ label: `Add ${weaknessFix.title}`, kind: "addFeature", featureId: weaknessFix.id });
  }

  if (["pressure", "damage", "hp"].includes(issue) && topPressureFeature) {
    const replacement = findReplacementFix({
      feature: topPressureFeature,
      selected,
      selectedFeatures,
      typeId,
      category,
      roleId,
      sourceId,
      composerMode,
      customMode,
      reason: "pressure",
    });
    if (replacement)
      pushFix({
        label: `Replace with ${replacement.title}`,
        kind: "replaceFeature",
        removeFeatureId: topPressureFeature.id,
        addFeatureId: replacement.id,
      });
    pushFix({
      label: `Remove ${topPressureFeature.title}`,
      kind: "removeFeature",
      featureId: topPressureFeature.id,
    });
  }

  if (["complexity", "reactions"].includes(issue) && topComplexityFeature) {
    const replacement = findReplacementFix({
      feature: topComplexityFeature,
      selected,
      selectedFeatures,
      typeId,
      category,
      roleId,
      sourceId,
      composerMode,
      customMode,
      reason: "complexity",
    });
    if (replacement)
      pushFix({
        label: `Replace with ${replacement.title}`,
        kind: "replaceFeature",
        removeFeatureId: topComplexityFeature.id,
        addFeatureId: replacement.id,
      });
    pushFix({
      label: `Remove ${topComplexityFeature.title}`,
      kind: "removeFeature",
      featureId: topComplexityFeature.id,
    });
  }

  if (issue === "boss-action") {
    if (twistFix)
      pushFix({ label: `Add ${twistFix.title}`, kind: "addFeature", featureId: twistFix.id });
    if (lairFix)
      pushFix({ label: `Add ${lairFix.title}`, kind: "addFeature", featureId: lairFix.id });
  }

  return fixes.slice(0, 2);
}

function buildBalanceRecommendations({
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  sourceId,
  composerMode,
  customMode,
  monsterTier,
  tempoProfile,
  pressure,
  budget,
  complexity,
  complexityCap,
  counterplayAudit,
  mechanicsSummary,
  baseline,
  hp,
  dpr,
  effectiveProfile,
}) {
  const recommendations = [];
  const addRecommendation = (item) => {
    if (recommendations.some((recommendation) => recommendation.id === item.id)) return;
    recommendations.push(item);
  };

  const topPressureFeature = getTopFeatureByWeight(selectedFeatures, getFeaturePressureWeight);
  const topComplexityFeature = getTopFeatureByWeight(selectedFeatures, getFeatureComplexityWeight);
  const hasWeakness = hasSelectedSlot(selected, "weakness");
  const hasTwist = hasSelectedSlot(selected, "twist");
  const hasLair = hasSelectedSlot(selected, "lair");
  const nextTier =
    monsterTier.id === "normal"
      ? "elite"
      : monsterTier.id === "elite"
        ? "boss"
        : monsterTier.id === "boss"
          ? "legendary"
          : "setpiece";

  if (!hasWeakness) {
    addRecommendation({
      id: "add-weakness",
      severity: "critical",
      title: "Add a Weakness / Tell",
      detail: "The monster has no explicit player-facing answer.",
      actions: [
        ...buildOneClickFixes({
          issue: "missing-weakness",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        { label: "Open Weakness Slot", kind: "slot", slotId: "weakness" },
      ],
    });
  }

  if (pressure > budget) {
    addRecommendation({
      id: "reduce-pressure",
      severity: pressure > budget * 1.25 ? "critical" : "major",
      title: "Reduce Pressure",
      detail: topPressureFeature
        ? `${topPressureFeature.title} is the first graft to review.`
        : "The pressure score is above the current budget.",
      actions: [
        ...buildOneClickFixes({
          issue: "pressure",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        topPressureFeature
          ? {
              label: `Open ${titleCase(topPressureFeature.slot)}`,
              kind: "slot",
              slotId: topPressureFeature.slot,
            }
          : null,
        { label: `Set ${titleCase(nextTier)} Tier`, kind: "tier", tierId: nextTier },
      ].filter(Boolean),
    });
  }

  if (complexity > complexityCap) {
    addRecommendation({
      id: "reduce-complexity",
      severity: complexity > complexityCap * 1.25 ? "critical" : "major",
      title: "Simplify Table Handling",
      detail: topComplexityFeature
        ? `${topComplexityFeature.title} is the first tracking-heavy graft to review.`
        : "Complexity is above the current cap.",
      actions: [
        ...buildOneClickFixes({
          issue: "complexity",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        topComplexityFeature
          ? {
              label: `Open ${titleCase(topComplexityFeature.slot)}`,
              kind: "slot",
              slotId: topComplexityFeature.slot,
            }
          : null,
        { label: "Use Advanced Limits", kind: "advanced" },
      ].filter(Boolean),
    });
  }

  if (
    counterplayAudit.rating === "Unsafe" ||
    counterplayAudit.issues.some((issue) => issue.severity === "critical")
  ) {
    addRecommendation({
      id: "counterplay-release-valves",
      severity: "critical",
      title: "Add Release Valves",
      detail: "Hard control, burst damage, or scene pressure needs a clear answer.",
      actions: [
        ...buildOneClickFixes({
          issue: "counterplay",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        { label: "Open Weakness Slot", kind: "slot", slotId: "weakness" },
      ],
    });
  }

  if (
    mechanicsSummary.majorConditionCount >= 2 &&
    counterplayAudit.summary.breakConditionCount < mechanicsSummary.majorConditionCount
  ) {
    addRecommendation({
      id: "condition-breaks",
      severity: "major",
      title: "Give Hard Conditions an Exit",
      detail: "Major conditions currently outnumber clear break conditions.",
      actions: [
        ...buildOneClickFixes({
          issue: "conditions",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        { label: "Open Weakness Slot", kind: "slot", slotId: "weakness" },
      ],
    });
  }

  if (
    mechanicsSummary.reactionCount >= 3 &&
    !["boss", "legendary", "setpiece"].includes(monsterTier.id)
  ) {
    addRecommendation({
      id: "too-many-reactions",
      severity: "major",
      title: "Reduce Reactions",
      detail: "Too many reaction hooks can slow turns and feel like hidden punishment.",
      actions: [
        ...buildOneClickFixes({
          issue: "reactions",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        topComplexityFeature
          ? {
              label: `Open ${titleCase(topComplexityFeature.slot)}`,
              kind: "slot",
              slotId: topComplexityFeature.slot,
            }
          : null,
        { label: "Set Boss Tier", kind: "tier", tierId: "boss" },
      ].filter(Boolean),
    });
  }

  if (roleId === "boss" && !hasTwist && !hasLair) {
    addRecommendation({
      id: "boss-action-economy",
      severity: "minor",
      title: "Add Boss-Level Action Pressure",
      detail: "A boss with no Twist or Lair may play like a high-HP standard monster.",
      actions: [
        ...buildOneClickFixes({
          issue: "boss-action",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        { label: "Open Twist Slot", kind: "slot", slotId: "twist" },
        { label: "Open Lair Slot", kind: "slot", slotId: "lair" },
      ],
    });
  }

  if (hp > baseline.hp * 1.45 && monsterTier.id === "normal") {
    addRecommendation({
      id: "hp-tier-mismatch",
      severity: "major",
      title: "HP Reads Above Normal",
      detail: "Durability is far above the current CR baseline.",
      actions: [
        ...buildOneClickFixes({
          issue: "hp",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        topPressureFeature
          ? {
              label: `Open ${titleCase(topPressureFeature.slot)}`,
              kind: "slot",
              slotId: topPressureFeature.slot,
            }
          : null,
        { label: "Set Elite Tier", kind: "tier", tierId: "elite" },
      ].filter(Boolean),
    });
  }

  if (dpr > baseline.dpr * 1.4 || effectiveProfile.burstDpr > baseline.dpr * 1.75) {
    addRecommendation({
      id: "damage-spike",
      severity: "major",
      title: "Limit the Damage Spike",
      detail: "Damage or burst is above the expected profile.",
      actions: [
        ...buildOneClickFixes({
          issue: "damage",
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          sourceId,
          composerMode,
          customMode,
          topPressureFeature,
          topComplexityFeature,
        }),
        { label: "Open Attack Slot", kind: "slot", slotId: "attack" },
        { label: "Open Weakness Slot", kind: "slot", slotId: "weakness" },
      ],
    });
  }

  if (
    tempoProfile.id === "legendary" &&
    !["boss", "legendary", "setpiece"].includes(monsterTier.id)
  ) {
    addRecommendation({
      id: "tempo-tier-mismatch",
      severity: "major",
      title: "Legendary tempo needs boss framing",
      detail:
        "Legendary tempo on a non-boss tier can feel overtuned. Slow the tempo or raise the monster tier to match the action economy.",
      actions: [
        { label: "Set Boss Tier", kind: "tier", tierId: "boss" },
        { label: "Open Monster Frame", kind: "frame" },
      ],
    });
  }

  return recommendations.slice(0, 6);
}

function getForgePriority(roleId) {
  if (roleId === "minion") return ["body", "attack", "weakness", "death"];
  if (roleId === "boss")
    return ["body", "mind", "movement", "attack", "horror", "twist", "weakness", "lair", "death"];
  return ["body", "mind", "movement", "attack", "horror", "weakness", "twist", "death"];
}

function getFeaturesFromSelection(selected) {
  return getFeaturesFromSelectionModel(selected, FEATURES);
}

function trimSelectedToCaps(current, slotCaps) {
  return trimSelectedToCapsModel(current, slotCaps, { getSlotCap });
}

const GUIDED_SLOT_PRIORITY = [
  "body",
  "attack",
  "weakness",
  "movement",
  "mind",
  "horror",
  "twist",
  "death",
  "lair",
];

function classifyWarning(warning) {
  const text = String(warning || "").toLowerCase();
  if (
    text.includes("no weakness") ||
    text.includes("missing") ||
    text.includes("critical") ||
    text.includes("unsafe") ||
    text.includes("counterplay audit")
  )
    return "critical";
  if (
    text.includes("above") ||
    text.includes("over") ||
    text.includes("too many") ||
    text.includes("high")
  )
    return "major";
  return "minor";
}

function buildGuidedFlow({ composerStarted, startMode, selected, computed, activePreset }) {
  const slotDetails = {
    body: {
      title: "Add Body",
      detail: "Define what the creature physically is before choosing attacks.",
      cta: "Open Body Slot",
    },
    attack: {
      title: "Add Attack Pattern",
      detail: "Give the monster a main offensive loop the DM can run every round.",
      cta: "Open Attack Slot",
    },
    weakness: {
      title: "Add Weakness / Tell",
      detail: "Add visible counterplay so the horror feels fair instead of arbitrary.",
      cta: "Open Weakness Slot",
    },
    movement: {
      title: "Add Movement",
      detail: "Decide how the monster reaches, pressures, or fails to reach the characters.",
      cta: "Open Movement Slot",
    },
    mind: {
      title: "Add Mind",
      detail: "Give the creature a behavior rule the DM can follow without guessing.",
      cta: "Open Mind Slot",
    },
    horror: {
      title: "Add Horror Feature",
      detail: "Install the memorable disturbing element that players will remember.",
      cta: "Open Horror Slot",
    },
    twist: {
      title: "Add Combat Twist",
      detail: "Add one fight-changing rule if this monster needs a stronger table presence.",
      cta: "Open Twist Slot",
    },
    death: {
      title: "Add Death Effect",
      detail: "Decide whether death creates a clue, risk, terrain change, or final beat.",
      cta: "Open Death Slot",
    },
    lair: {
      title: "Add Lair / Scene Effect",
      detail: "Use scene pressure only when the battlefield should matter as much as the body.",
      cta: "Open Lair Slot",
    },
  };

  const slotRoadmap = GUIDED_SLOT_PRIORITY.map((slotId, index) => {
    const slot = SLOTS.find((item) => item.id === slotId) || SLOTS[0];
    const filled = hasSelectedSlot(selected, slotId);
    return {
      id: slotId,
      label: slot.label,
      number: index + 1,
      filled,
      detail: slotDetails[slotId]?.detail || slot.hint,
    };
  });

  const bodyReady = hasSelectedSlot(selected, "body");
  const attackReady = hasSelectedSlot(selected, "attack");
  const weaknessReady = hasSelectedSlot(selected, "weakness");
  const coreReady = bodyReady && attackReady && weaknessReady;
  const completedSlots = SLOTS.filter((slot) => hasSelectedSlot(selected, slot.id)).length;
  const filledRecommendedCount = slotRoadmap.filter((step) => step.filled).length;
  const hasSetpieceSlot = ["twist", "death", "lair"].some((slotId) =>
    hasSelectedSlot(selected, slotId)
  );
  const pressureOk = computed.pressure <= computed.budget;
  const complexityOk = computed.complexity <= computed.complexityCap;
  const counterplayOk = ["Strong", "Playable"].includes(computed.counterplayAudit.rating);
  const balanceReady = pressureOk && complexityOk && counterplayOk;
  const exportReady = composerStarted && coreReady && balanceReady && !computed.warnings.length;
  const prioritizedWarnings = [...computed.warnings]
    .sort((a, b) => {
      const rank = { critical: 0, major: 1, minor: 2 };
      return rank[classifyWarning(a)] - rank[classifyWarning(b)];
    })
    .slice(0, 3);

  const recommendedSlotId = composerStarted
    ? GUIDED_SLOT_PRIORITY.find((slotId) => !hasSelectedSlot(selected, slotId)) || null
    : null;
  const recommendedSlot = recommendedSlotId
    ? SLOTS.find((slot) => slot.id === recommendedSlotId)
    : null;
  const recommendedDetail = recommendedSlotId ? slotDetails[recommendedSlotId] : null;
  const activePresetText = activePreset
    ? `${activePreset.label} loaded.`
    : startMode === "scratch"
      ? "Scratch build selected."
      : "Choose Template or Scratch.";

  let nextAction = {
    kind: "start",
    label: "Choose Start",
    title: "Start a Monster",
    detail: activePresetText,
    cta: "Pick Template",
  };

  if (composerStarted && recommendedSlotId) {
    nextAction = {
      kind: "slot",
      slotId: recommendedSlotId,
      label: recommendedSlot?.label || "Next Slot",
      title: recommendedDetail?.title || `Add ${recommendedSlot?.label || "Slot"}`,
      detail:
        recommendedDetail?.detail || recommendedSlot?.hint || "Install the next useful graft.",
      cta: recommendedDetail?.cta || "Open Slot",
    };
  } else if (composerStarted && !balanceReady) {
    nextAction = {
      kind: "review",
      label: "Review Balance",
      title: "Review Balance",
      detail: "Pressure, Complexity, or Counterplay still need attention before export.",
      cta: "Open Balance",
    };
  } else if (composerStarted) {
    nextAction = {
      kind: "export",
      label: "Export Ready",
      title: exportReady ? "Ready to Export" : "Export Draft",
      detail: exportReady
        ? "The monster has core anatomy, counterplay, and clean balance checks."
        : "The monster is usable, but warnings remain in the balance review.",
      cta: "Open Export",
    };
  }

  const readiness = [
    {
      id: "playable",
      label: "Playable Draft",
      reached: composerStarted && coreReady,
      detail: "Body + Attack + Weakness",
    },
    {
      id: "complete",
      label: "Complete Monster",
      reached: composerStarted && completedSlots >= 6,
      detail: "At least 6 anatomy slots",
    },
    {
      id: "setpiece",
      label: "Setpiece Ready",
      reached: composerStarted && coreReady && hasSetpieceSlot,
      detail: "Twist, Death, or Lair present",
    },
    {
      id: "export",
      label: "Export Ready",
      reached: exportReady,
      detail: "Balance and counterplay passed",
    },
  ];

  const activeStepId = !composerStarted
    ? "start"
    : !bodyReady
      ? "body"
      : !attackReady
        ? "attack"
        : !weaknessReady
          ? "weakness"
          : filledRecommendedCount < 6
            ? "complete"
            : !balanceReady || prioritizedWarnings.length
              ? "review"
              : "export";

  const steps = [
    {
      id: "start",
      label: "Start",
      action: "start",
      reached: composerStarted,
      active: activeStepId === "start",
      disabled: false,
      detail: activePresetText,
    },
    {
      id: "body",
      label: "Body",
      action: "slot",
      slotId: "body",
      reached: bodyReady,
      active: activeStepId === "body",
      disabled: !composerStarted,
      detail: bodyReady ? "Body graft installed." : slotDetails.body.detail,
    },
    {
      id: "attack",
      label: "Attack",
      action: "slot",
      slotId: "attack",
      reached: attackReady,
      active: activeStepId === "attack",
      disabled: !composerStarted,
      detail: attackReady ? "Attack pattern installed." : slotDetails.attack.detail,
    },
    {
      id: "weakness",
      label: "Tell",
      action: "slot",
      slotId: "weakness",
      reached: weaknessReady,
      active: activeStepId === "weakness",
      disabled: !composerStarted,
      detail: weaknessReady ? "Counterplay installed." : slotDetails.weakness.detail,
    },
    {
      id: "complete",
      label: "Complete",
      action: recommendedSlotId ? "slot" : "review",
      slotId: recommendedSlotId,
      reached: composerStarted && completedSlots >= 6,
      active: activeStepId === "complete",
      disabled: !composerStarted,
      detail: recommendedSlotId
        ? `Next useful slot: ${recommendedSlot?.label || "slot"}.`
        : "The anatomy has enough installed grafts for a complete monster.",
    },
    {
      id: "review",
      label: "Review",
      action: "review",
      reached: composerStarted && balanceReady,
      active: activeStepId === "review",
      disabled: !composerStarted,
      detail: balanceReady
        ? "Balance and counterplay look playable."
        : "Review pressure, complexity, warnings, and counterplay.",
    },
    {
      id: "export",
      label: "Export",
      action: "export",
      reached: exportReady,
      active: activeStepId === "export",
      disabled: !composerStarted,
      detail: exportReady ? "Ready for handoff." : "Export after balance review.",
    },
  ].map((step, index) => ({ ...step, number: index + 1 }));

  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.active)
  );
  const highestReachedIndex = steps.reduce(
    (highest, step, index) => (step.reached ? Math.max(highest, index) : highest),
    0
  );
  const progressIndex = exportReady ? steps.length - 1 : Math.max(activeIndex, highestReachedIndex);

  return {
    steps,
    slotRoadmap,
    readiness,
    nextSlot: recommendedSlot,
    recommendedSlotId,
    nextAction,
    exportReady,
    prioritizedWarnings,
    progress: clamp(progressIndex / Math.max(1, steps.length - 1), 0, 1),
    activeStep: steps.find((step) => step.active) || steps[0],
  };
}

function getSilhouetteId(typeId, category, activePreset = null) {
  if (activePreset?.silhouetteId) return activePreset.silhouetteId;

  const normalizedCategory = String(category || "").toLowerCase();
  if (normalizedCategory.includes("spider")) return "spider";
  if (normalizedCategory.includes("skeleton") || normalizedCategory.includes("bone")) return "skeleton";

  return typeId;
}

function getSilhouetteProfile(typeId, category, activePreset = null) {
  const silhouetteId = getSilhouetteId(typeId, category, activePreset);
  return MONSTER_SILHOUETTES[silhouetteId] || MONSTER_SILHOUETTES[typeId] || MONSTER_SILHOUETTES.undead;
}

function getFeatureSection(feature) {
  return feature.section || SLOT_SECTION_FALLBACK[feature.slot] || "trait";
}

function getSectionLabel(section) {
  return STAT_BLOCK_SECTION_LABELS[section] || titleCase(section);
}

function groupFeaturesBySection(features) {
  return features.reduce((groups, feature) => {
    const section = getFeatureSection(feature);
    if (!groups[section]) groups[section] = [];
    groups[section].push(feature);
    return groups;
  }, {});
}

function pickForgeCandidate(candidates, slotId, remainingBudget, roleId) {
  if (!candidates.length) return null;

  const coreSlots = new Set(["body", "attack", "weakness"]);
  const sorted = [...candidates].sort((a, b) => {
    const weaknessBiasA = a.slot === "weakness" ? -8 : 0;
    const weaknessBiasB = b.slot === "weakness" ? -8 : 0;
    const lairBiasA = roleId === "boss" && a.slot === "lair" ? -2 : 0;
    const lairBiasB = roleId === "boss" && b.slot === "lair" ? -2 : 0;
    return (
      Math.max(0, a.cost) +
      a.complexity * 0.45 +
      weaknessBiasA +
      lairBiasA -
      (Math.max(0, b.cost) + b.complexity * 0.45 + weaknessBiasB + lairBiasB)
    );
  });

  if (slotId === "weakness") return sorted[0];
  const affordable = sorted.find((feature) => Math.max(0, feature.cost) <= remainingBudget);
  if (affordable) return affordable;
  if (coreSlots.has(slotId)) return sorted[0];
  return null;
}

function getStatBlockBasics(creatureType, category, role, computed, abilityProfile, xp) {
  const initiative =
    (abilityProfile.physical.find((row) => row.key === "dex")?.mod || 0) +
    (computed.tempoProfile?.initiativeMod || 0);
  const initiativeTotal = 10 + initiative;
  const size = role.id === "boss" ? "Large" : role.id === "minion" ? "Small" : "Medium";
  const creatureLine = `${size} ${creatureType.label} (${category}), Unaligned`;
  const resistances =
    creatureType.id === "undead"
      ? "Necrotic; Bludgeoning, Piercing, and Slashing damage from nonmagical attacks"
      : creatureType.id === "beast"
        ? "Poison"
        : "Psychic, Necrotic";
  const immunities =
    creatureType.id === "undead"
      ? "Poison damage; Poisoned condition"
      : creatureType.id === "beast"
        ? "None"
        : "Charmed and Frightened conditions";
  const skills =
    creatureType.id === "beast"
      ? `Perception ${modText(computed.prof + 2)}, Stealth ${modText(computed.prof + 2)}`
      : creatureType.id === "aberration"
        ? `Insight ${modText(computed.prof + 2)}, Perception ${modText(computed.prof + 2)}`
        : `Perception ${modText(computed.prof)}`;
  const languages =
    creatureType.id === "beast"
      ? "None"
      : creatureType.id === "undead"
        ? "Understands the languages it knew in life but can’t speak"
        : "Deep Speech or telepathy 60 ft.";

  return {
    initiative,
    initiativeTotal,
    size,
    creatureLine,
    resistances,
    immunities,
    skills,
    languages,
    xp,
  };
}

function exportItems(items, fallback, computed) {
  return (items.length ? items : fallback)
    .map((item) => `${item.title}. ${normalizeRulesText(item.mechanics, computed)}`)
    .join(String.fromCharCode(10));
}

function abilityExportLines(abilityProfile) {
  return [...abilityProfile.physical, ...abilityProfile.mental]
    .map((row) => `${row.label} ${row.score} (${modText(row.mod)}), Save ${modText(row.save)}`)
    .join(String.fromCharCode(10));
}

function hpFormula(hitPoints, dieSize = 8) {
  const average = dieSize / 2 + 0.5;
  const dice = Math.max(1, Math.round(hitPoints / Math.max(1, average + 3)));
  const flat = Math.round(hitPoints - dice * average);
  if (flat === 0) return `${dice}d${dieSize}`;
  return `${dice}d${dieSize} ${flat > 0 ? "+" : "−"} ${Math.abs(flat)}`;
}

function replaceAllText(text, search, replacement) {
  return String(text || "")
    .split(search)
    .join(replacement);
}

function copyTextFallback(text) {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    // Clipboard fallback can fail in restricted browser contexts.
  }
  document.body.removeChild(textarea);
  return copied;
}

function normalizeConditionWording(text) {
  let output = String(text || "");
  [
    "Blinded",
    "Charmed",
    "Deafened",
    "Frightened",
    "Grappled",
    "Incapacitated",
    "Invisible",
    "Paralyzed",
    "Petrified",
    "Poisoned",
    "Prone",
    "Restrained",
    "Stunned",
    "Unconscious",
  ].forEach((condition) => {
    output = replaceAllText(output, `is ${condition}`, `has the ${condition} condition`);
    output = replaceAllText(output, `is also ${condition}`, `also has the ${condition} condition`);
    output = replaceAllText(output, `becomes ${condition}`, `has the ${condition} condition`);
    output = replaceAllText(output, `falling ${condition}`, `having the ${condition} condition`);
    output = replaceAllText(output, `falls ${condition}`, `has the ${condition} condition`);
  });
  output = replaceAllText(output, "knocked prone", "given the Prone condition");
  output = replaceAllText(output, "knock it prone", "give it the Prone condition");
  return output;
}

function normalizeSaveWording(text, computed) {
  if (!computed) return text;
  let output = String(text || "");
  ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"].forEach(
    (ability) => {
      output = replaceAllText(
        output,
        `${ability} Saving Throw, `,
        `${ability} Saving Throw: DC ${computed.dc}, `
      );
      output = replaceAllText(output, `${ability} save`, `${ability} Saving Throw`);
    }
  );
  output = replaceAllText(
    output,
    "Strength or Dexterity save",
    "Strength or Dexterity Saving Throw"
  );
  return output;
}

function normalizeAttackWording(text, computed) {
  if (!computed) return text;
  let output = String(text || "");
  output = replaceAllText(
    output,
    "Melee Attack Roll. On hit, ",
    `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit: `
  );
  output = replaceAllText(
    output,
    "Melee Attack Roll. On hit,",
    `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit:`
  );
  output = replaceAllText(
    output,
    "Melee Attack Roll.",
    `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit:`
  );
  output = replaceAllText(output, "On a hit, ", "Hit: ");
  output = replaceAllText(output, "On hit, ", "Hit: ");
  output = replaceAllText(
    output,
    "Ranged Attack Roll, range ",
    `Ranged Attack Roll: ${modText(computed.attack)}, range `
  );
  return output;
}

function normalizeMonsterReferences(text, computed = null) {
  const noun = computed?.rulesContext?.categoryNoun || "monster";
  const substitutions = [
    ["this spirit's", `this ${noun}'s`],
    ["This spirit's", `This ${noun}'s`],
    ["the spirit's", `the ${noun}'s`],
    ["The spirit's", `The ${noun}'s`],
    ["this spirit", `this ${noun}`],
    ["This spirit", `This ${noun}`],
    ["the spirit", `the ${noun}`],
    ["The spirit", `The ${noun}`],
    ["this spider's", `this ${noun}'s`],
    ["This spider's", `This ${noun}'s`],
    ["the spider's", `the ${noun}'s`],
    ["The spider's", `The ${noun}'s`],
    ["this spider", `this ${noun}`],
    ["This spider", `This ${noun}`],
    ["the spider", `the ${noun}`],
    ["The spider", `The ${noun}`],
  ];
  return substitutions.reduce(
    (output, [search, replacement]) => replaceAllText(output, search, replacement),
    String(text || "")
  );
}

function normalizeRulesText(text, computed = null) {
  return normalizeMonsterReferences(
    normalizeConditionWording(
      normalizeSaveWording(normalizeAttackWording(text, computed), computed)
    ),
    computed
  )
    .split("  ")
    .join(" ")
    .trim();
}

function buildDesignerNotes({ danger, role, computed }) {
  return [
    `Encounter Use. ${danger.label} ${role.label}. ${role.actionNote}`,
    `Target Profile. CR ${computed.targetCr}; ${computed.tacticalRole.label}; ${computed.monsterTier.label}; ${computed.tempoProfile.label}.`,
    `Baseline Check. AC ${computed.ac}/${computed.baseline.ac}; HP ${computed.hp}/${computed.baseline.hp}; Printed DPR ${computed.dpr}/${computed.baseline.dpr}; Effective DPR ${computed.effectiveProfile.effectiveDpr3Round}/${computed.baseline.dpr}; Attack ${modText(computed.attack)}/${modText(computed.baseline.attackBonus)}; DC ${computed.dc}/${computed.baseline.saveDc}.`,
    `Pressure Breakdown. ${computed.pressureProfile.label}: ${formatBreakdownCompact(computed.pressureProfile, PRESSURE_LABELS)}.`,
    `Complexity Breakdown. ${computed.complexityProfile.label}: ${formatBreakdownCompact(computed.complexityProfile, COMPLEXITY_LABELS)}.`,
    `Counterplay Audit. ${computed.counterplayAudit.rating} ${computed.counterplayAudit.score}/100. ${formatCounterplayIssues(computed.counterplayAudit.issues)}`,
    ...computed.warnings.map((warning) => `Warning. ${warning}`),
  ];
}

function buildExportReadiness({
  computed,
  selected,
  selectedFeatures,
  traits,
  actions,
  weaknessFeatures,
  deathEffects,
  lairActions,
}) {
  const checks = [
    {
      id: "core-anatomy",
      label: "Core Anatomy",
      detail: "Body + Attack + Weakness / Tell",
      ready:
        hasSelectedSlot(selected, "body") &&
        hasSelectedSlot(selected, "attack") &&
        hasSelectedSlot(selected, "weakness"),
      severity: "required",
    },
    {
      id: "main-action",
      label: "Main Action",
      detail: "At least one exported Action",
      ready: actions.length > 0,
      severity: "required",
    },
    {
      id: "weakness-tell",
      label: "Counterplay",
      detail: "Explicit player-facing answer",
      ready:
        weaknessFeatures.length > 0 &&
        ["Strong", "Playable"].includes(computed.counterplayAudit.rating),
      severity: "required",
    },
    {
      id: "pressure",
      label: "Pressure Target",
      detail: `${computed.pressure} / ${computed.budget}`,
      ready: computed.pressure <= computed.budget,
      severity: "review",
    },
    {
      id: "complexity",
      label: "Complexity Target",
      detail: `${computed.complexity} / ${computed.complexityCap}`,
      ready: computed.complexity <= computed.complexityCap,
      severity: "review",
    },
    {
      id: "warnings",
      label: "Warnings",
      detail: computed.warnings.length
        ? `${computed.warnings.length} issue${computed.warnings.length === 1 ? "" : "s"}`
        : "No active warnings",
      ready: computed.warnings.length === 0,
      severity: "review",
    },
    {
      id: "handoff-depth",
      label: "DM Handoff",
      detail:
        deathEffects.length || lairActions.length
          ? "Setpiece beats included"
          : "Core stat block only",
      ready: selectedFeatures.length >= 3,
      severity: "required",
    },
    {
      id: "structured-data",
      label: "Structured JSON",
      detail: `${selectedFeatures.length} graft${selectedFeatures.length === 1 ? "" : "s"} serialized`,
      ready: selectedFeatures.length > 0,
      severity: "required",
    },
  ];
  const blockers = checks.filter((check) => check.severity === "required" && !check.ready);
  const reviews = checks.filter((check) => check.severity === "review" && !check.ready);
  const ready = blockers.length === 0 && reviews.length === 0;
  return {
    checks,
    blockers,
    reviews,
    ready,
    label: blockers.length ? "Blocked" : reviews.length ? "Review Recommended" : "Ready",
    percent: clamp(
      Math.round((checks.filter((check) => check.ready).length / Math.max(1, checks.length)) * 100),
      0,
      100
    ),
  };
}

function buildExportRunSheet({
  computed,
  selectedFeatures,
  traits,
  actions,
  bonusActions,
  reactions,
  deathEffects,
  lairActions,
}) {
  const topPressureFeature = getTopFeatureByWeight(selectedFeatures, getFeaturePressureWeight);
  const topComplexityFeature = getTopFeatureByWeight(selectedFeatures, getFeatureComplexityWeight);
  const weakness = selectedFeatures.find((feature) => feature.slot === "weakness");
  const movement = selectedFeatures.find((feature) => feature.slot === "movement");
  const horror = selectedFeatures.find((feature) => feature.slot === "horror");
  const mainAction = actions[0] || selectedFeatures.find((feature) => feature.slot === "attack");
  const reaction = reactions[0];
  const lair = lairActions[0];
  const death = deathEffects[0];

  return [
    {
      label: "Open With",
      value: horror
        ? horror.title
        : movement
          ? movement.title
          : mainAction
            ? mainAction.title
            : computed.name,
    },
    {
      label: "Default Turn",
      value: mainAction ? mainAction.title : "Use the fallback Strike action",
    },
    {
      label: "Watch Closely",
      value: topPressureFeature ? topPressureFeature.title : "No high-pressure graft yet",
    },
    {
      label: "Table Load",
      value: topComplexityFeature ? topComplexityFeature.title : "Low tracking load",
    },
    {
      label: "Player Answer",
      value: weakness ? weakness.title : "Add a Weakness / Tell before final use",
    },
    { label: "Off-Turn Hook", value: reaction ? reaction.title : lair ? lair.title : "None" },
    { label: "Death Beat", value: death ? death.title : "None" },
    {
      label: "Rules Sections",
      value: `${traits.length} Traits · ${actions.length} Actions · ${bonusActions.length} Bonus · ${reactions.length} Reactions · ${lairActions.length} Lair`,
    },
  ];
}

function compactRunText(text, computed = null, maxLength = 180) {
  const normalized = normalizeRulesText(text, computed).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function getRunFeatureTrigger(feature, computed = null) {
  const section = getFeatureSection(feature);
  const mechanics = normalizeRulesText(feature.mechanics || "", computed);
  const triggerMatch = mechanics.match(/Trigger:\s*([^.]+)\./i);
  const rechargeMatch = mechanics.match(/Recharge\s*([0-9–-]+)/i);

  if (triggerMatch?.[1]) return triggerMatch[1].trim();
  if (rechargeMatch?.[1]) return `Recharge ${rechargeMatch[1]}`;
  if (/bloodied/i.test(mechanics)) return "When bloodied";
  if (/drops to 0 hit points|on death|when it dies/i.test(mechanics)) return "On death";
  if (/initiative count 20/i.test(mechanics) || section === "lairAction")
    return "Initiative count 20";
  if (section === "reaction") return "Reaction trigger";
  if (section === "bonusAction") return "Bonus action";
  if (section === "action") return "Action";
  return getSectionLabel(section);
}

function getRunFeatureResponse(feature, computed = null) {
  const mechanics = normalizeRulesText(feature.mechanics || feature.summary || "", computed);
  const responseMatch = mechanics.match(/Response:\s*(.+)$/i);
  if (responseMatch?.[1]) return compactRunText(responseMatch[1], computed, 170);
  return compactRunText(mechanics, computed, 170);
}

function isRunTriggerFeature(feature) {
  const section = getFeatureSection(feature);
  const mechanics = String(feature.mechanics || "").toLowerCase();
  return (
    ["reaction", "bonusAction", "lairAction", "death"].includes(section) ||
    /recharge|bloodied|drops to 0 hit points|on death|initiative count 20|trigger:/i.test(
      feature.mechanics || ""
    )
  );
}

function uniqueFeatures(features) {
  const seen = new Set();
  return features.filter((feature) => {
    if (!feature || seen.has(feature.id)) return false;
    seen.add(feature.id);
    return true;
  });
}

function buildRunTriggerItems({
  selectedFeatures,
  bonusActions,
  reactions,
  lairActions,
  deathEffects,
  computed,
}) {
  const triggerPool = uniqueFeatures([
    ...reactions,
    ...lairActions,
    ...deathEffects,
    ...bonusActions,
    ...selectedFeatures.filter(isRunTriggerFeature),
  ]);

  return triggerPool
    .map((feature) => ({
      id: feature.id,
      title: feature.title,
      trigger: getRunFeatureTrigger(feature, computed),
      response: getRunFeatureResponse(feature, computed),
      section: getSectionLabel(getFeatureSection(feature)),
      slot: titleCase(feature.slot),
    }))
    .sort((a, b) => {
      const order = {
        "Lair Actions": 0,
        Reactions: 1,
        "Bonus Actions": 2,
        "Death Effects": 3,
        Traits: 4,
        Actions: 5,
      };
      return (order[a.section] ?? 9) - (order[b.section] ?? 9) || a.title.localeCompare(b.title);
    });
}

function buildRunTrackingItems({
  computed,
  selectedFeatures,
  actions,
  bonusActions,
  reactions,
  lairActions,
  deathEffects,
}) {
  const rechargeItems = uniqueFeatures(
    selectedFeatures.filter((feature) => /recharge/i.test(feature.mechanics || ""))
  );
  const conditionItems = selectedFeatures
    .map((feature) => ({ feature, profile: getFeatureMechanicProfile(feature) }))
    .filter((item) => item.profile.conditionProfile);
  const objectItems = selectedFeatures.filter((feature) => {
    const profile = getFeatureMechanicProfile(feature);
    return (
      profile.mechanicTags.some((tag) =>
        ["destroyable_anchor", "corpse_requirement", "egg_requirement"].includes(tag)
      ) ||
      profile.complexityTags.some((tag) =>
        [
          "object_hp",
          "object_tracking",
          "corpse_anchor",
          "corpse_tracking",
          "terrain_anchor",
          "summon_tracking",
        ].includes(tag)
      )
    );
  });

  const tracking = [
    {
      label: "HP State",
      value: `HP ${computed.hp}; watch bloodied at ${Math.floor(computed.hp / 2)}.`,
    },
    {
      label: "Recharge",
      value: rechargeItems.length
        ? rechargeItems.map((feature) => feature.title).join(", ")
        : "None.",
    },
    {
      label: "Conditions",
      value: conditionItems.length
        ? conditionItems
            .map(
              ({ feature, profile }) => `${feature.title}: ${profile.conditionProfile.condition}`
            )
            .join("; ")
        : "None.",
    },
    {
      label: "Objects / Terrain",
      value: objectItems.length ? objectItems.map((feature) => feature.title).join(", ") : "None.",
    },
    {
      label: "Off-Turn Rules",
      value:
        reactions.length || lairActions.length
          ? `${reactions.length} reaction${reactions.length === 1 ? "" : "s"}; ${lairActions.length} lair action${lairActions.length === 1 ? "" : "s"}.`
          : "None.",
    },
    {
      label: "Death",
      value: deathEffects.length
        ? deathEffects.map((feature) => feature.title).join(", ")
        : "No death trigger.",
    },
  ];

  return tracking.filter((item) => item.value);
}

function buildRunModeSheet({
  name,
  creatureType,
  category,
  role,
  danger,
  computed,
  selectedFeatures,
  traits,
  actions,
  bonusActions,
  reactions,
  lairActions,
  deathEffects,
}) {
  const mainAction =
    actions.find((feature) => feature.slot === "attack") ||
    actions[0] ||
    selectedFeatures.find((feature) => feature.slot === "attack");
  const opener =
    actions.find(
      (feature) => getFeatureMechanicProfile(feature).usageProfile?.frequency === "encounter_opener"
    ) ||
    selectedFeatures.find((feature) => feature.slot === "horror") ||
    mainAction;
  const movement = selectedFeatures.find((feature) => feature.slot === "movement");
  const twist = selectedFeatures.find((feature) => feature.slot === "twist");
  const weaknessFeatures = selectedFeatures.filter((feature) => feature.slot === "weakness");
  const death = deathEffects[0];
  const topPressureFeature = getTopFeatureByWeight(selectedFeatures, getFeaturePressureWeight);
  const topComplexityFeature = getTopFeatureByWeight(selectedFeatures, getFeatureComplexityWeight);
  const actionFallback = {
    id: "fallback-strike",
    title: "Strike",
    summary: "Use the baseline attack when no action graft is installed.",
    mechanics: `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit: ${computed.damageText} damage.`,
  };
  const defaultAction = mainAction || actionFallback;

  return {
    name,
    frame: `${creatureType.label} (${category}) · CR ${computed.targetCr} · ${role.label} · ${computed.tacticalRole.label} · ${computed.monsterTier.label} · ${danger.label}`,
    quickStats: [
      { label: "AC", value: computed.ac },
      { label: "HP", value: computed.hp },
      { label: "Speed", value: creatureType.defaults.speed },
      { label: "Init", value: modText(computed.printedStats.initiativeMod) },
      { label: "Attack", value: modText(computed.attack) },
      { label: "DC", value: computed.dc },
    ],
    turnLoop: [
      {
        label: "Open",
        value: opener
          ? `${opener.title}. ${compactRunText(opener.summary || opener.mechanics, computed, 150)}`
          : "Reveal the threat and establish its strongest visible tell.",
      },
      {
        label: "Default Turn",
        value: `${defaultAction.title}. ${compactRunText(defaultAction.mechanics || defaultAction.summary, computed, 160)}`,
      },
      {
        label: "Move",
        value: movement
          ? `${movement.title}. ${compactRunText(movement.summary || movement.mechanics, computed, 150)}`
          : "Advance directly, hold a threatening lane, or force the party to reposition.",
      },
      {
        label: "When Pressed",
        value: twist
          ? `${twist.title}. ${compactRunText(twist.summary || twist.mechanics, computed, 150)}`
          : topPressureFeature
            ? `Protect the table from ${topPressureFeature.title}: telegraph before it resolves.`
            : "Use the clearest installed graft, not every rule at once.",
      },
      {
        label: "End Beat",
        value: death
          ? `${death.title}. ${compactRunText(death.summary || death.mechanics, computed, 150)}`
          : "Let the death reveal a clue, consequence, or safe ending.",
      },
    ],
    triggers: buildRunTriggerItems({
      selectedFeatures,
      bonusActions,
      reactions,
      lairActions,
      deathEffects,
      computed,
    }),
    tracking: buildRunTrackingItems({
      computed,
      selectedFeatures,
      actions,
      bonusActions,
      reactions,
      lairActions,
      deathEffects,
    }),
    playerAnswers: weaknessFeatures.length
      ? weaknessFeatures.map((feature) => ({
          id: feature.id,
          title: feature.title,
          value: compactRunText(
            feature.counterplay || feature.mechanics || feature.summary,
            computed,
            170
          ),
        }))
      : computed.counterplayAudit.recommendations.map((value, index) => ({
          id: `counterplay-${index}`,
          title: "Needed Answer",
          value,
        })),
    watch: [
      topPressureFeature
        ? {
            label: "Pressure",
            value: `${topPressureFeature.title}: ${compactRunText(topPressureFeature.summary || topPressureFeature.mechanics, computed, 150)}`,
          }
        : null,
      topComplexityFeature
        ? {
            label: "Tracking",
            value: `${topComplexityFeature.title}: keep its rule visible while running.`,
          }
        : null,
      computed.warnings[0] ? { label: "Warning", value: computed.warnings[0] } : null,
    ].filter(Boolean),
  };
}

function buildNormalizedSections({
  traits,
  actions,
  bonusActions,
  reactions,
  legendaryActions,
  lairActions,
  deathEffects,
  computed,
}) {
  return {
    traits: traits.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
    actions: actions.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
    bonusActions: bonusActions.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
    reactions: reactions.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
    legendaryActions: legendaryActions.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
    lairActions: lairActions.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
    deathEffects: deathEffects.map((item) => ({
      title: item.title,
      text: normalizeRulesText(item.mechanics, computed),
    })),
  };
}

function buildStructuredFeature(feature, computed = null) {
  const compatibility = getFeatureCompatibility(feature);
  const mechanicProfile = getFeatureMechanicProfile(feature);
  const counterplayProfile = getFeatureCounterplayProfile(feature);
  return {
    schemaVersion: FEATURE_SCHEMA_VERSION,
    id: feature.id,
    title: feature.title,
    source: feature.source,
    slot: feature.slot,
    section: getFeatureSection(feature),
    typeBias: asArray(feature.typeBias),
    roleBias: asArray(feature.roleBias),
    cost: feature.cost,
    complexity: feature.complexity,
    stats: feature.stats || {},
    summary: feature.summary,
    rulesText: {
      mechanics: feature.mechanics,
      normalizedMechanics: normalizeRulesText(feature.mechanics, computed),
      counterplay: feature.counterplay,
      normalizedCounterplay: normalizeRulesText(feature.counterplay, computed),
    },
    tags: uniqueArray([
      ...asArray(feature.tags),
      ...mechanicProfile.mechanicTags,
      ...mechanicProfile.pressureTags,
      ...mechanicProfile.complexityTags,
      ...compatibility.grants,
    ]),
    compatibility,
    mechanicProfile,
    counterplayProfile,
    migration: {
      stage: DATA_MODEL_MIGRATION_STAGE,
      hasInlineCompatibility: Boolean(
        feature.grants ||
        feature.requires ||
        feature.softRequires ||
        feature.incompatibleWith ||
        feature.avoidWith
      ),
      hasInlineMechanics: Boolean(
        feature.mechanicTags ||
        feature.pressureTags ||
        feature.complexityTags ||
        feature.damageProfile ||
        feature.usageProfile ||
        feature.conditionProfile
      ),
      usesCompatibilityOverride: hasFeatureCompatibilityOverride(feature),
      usesMechanicOverride: Boolean(FEATURE_MECHANIC_OVERRIDES[feature.id]),
    },
  };
}

function getStructuredFeatureCatalog(features = FEATURES) {
  return features.map((feature) => buildStructuredFeature(feature));
}

function getFeatureCatalogStats(features = FEATURES) {
  const structured = getStructuredFeatureCatalog(features);
  return {
    schemaVersion: FEATURE_SCHEMA_VERSION,
    total: structured.length,
    bySource: countValues(structured.map((feature) => feature.source)),
    bySlot: countValues(structured.map((feature) => feature.slot)),
    bySection: countValues(structured.map((feature) => feature.section)),
    usingCompatibilityOverrides: structured.filter(
      (feature) => feature.migration.usesCompatibilityOverride
    ).length,
    usingMechanicOverrides: structured.filter((feature) => feature.migration.usesMechanicOverride)
      .length,
    inlineCompatibility: structured.filter((feature) => feature.migration.hasInlineCompatibility)
      .length,
    inlineMechanics: structured.filter((feature) => feature.migration.hasInlineMechanics).length,
  };
}

function getPresetCatalogStats(presets = MONSTER_FAMILY_PRESETS) {
  return {
    total: presets.length,
    bySource: countValues(presets.map((preset) => preset.source)),
    byFamily: countValues(presets.map((preset) => preset.family)),
    averageGrafts: presets.length
      ? Math.round(
          presets.reduce((sum, preset) => sum + getPresetCoverage(preset).graftCount, 0) /
            presets.length
        )
      : 0,
  };
}

function buildExportText({
  name,
  creatureType,
  category,
  role,
  danger,
  computed,
  abilityProfile,
  traits,
  actions,
  bonusActions,
  reactions,
  legendaryActions,
  lairActions,
  deathEffects,
  hasLegendaryActions,
  xp,
}) {
  const basics = getStatBlockBasics(creatureType, category, role, computed, abilityProfile, xp);
  const fallbackTraits = [
    {
      title: "Unfinished Horror",
      mechanics:
        "Add grafts in the Crucible to generate traits, tells, weaknesses, and horror behavior.",
    },
  ];
  const fallbackActions = [
    {
      title: "Strike",
      mechanics: `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit: ${computed.damageText} damage.`,
    },
  ];
  const sections = [
    name,
    basics.creatureLine,
    "",
    `AC ${computed.ac}  Initiative ${modText(basics.initiative)} (${basics.initiativeTotal})`,
    `HP ${computed.hp} (${hpFormula(computed.hp, role.id === "boss" ? 10 : 8)})`,
    `Speed ${creatureType.defaults.speed}`,
    "",
    abilityExportLines(abilityProfile),
    "",
    `Skills ${basics.skills}`,
    `Resistances ${basics.resistances}`,
    `Immunities ${basics.immunities}`,
    `Senses ${creatureType.defaults.senses}`,
    `Languages ${basics.languages}`,
    `CR ${computed.targetCr} (Estimated ${computed.estimatedCr}; XP ${basics.xp}; PB ${modText(computed.prof)})`,
    "",
    "Traits",
    exportItems(traits, fallbackTraits, computed),
    "",
    "Actions",
    exportItems(actions, fallbackActions, computed),
  ];

  if (bonusActions.length)
    sections.push("", "Bonus Actions", exportItems(bonusActions, [], computed));
  if (reactions.length) sections.push("", "Reactions", exportItems(reactions, [], computed));
  if (deathEffects.length)
    sections.push("", "Death Effects", exportItems(deathEffects, [], computed));
  if (lairActions.length) sections.push("", "Lair Actions", exportItems(lairActions, [], computed));
  if (legendaryActions.length)
    sections.push("", "Legendary Actions", exportItems(legendaryActions, [], computed));
  else if (hasLegendaryActions)
    sections.push(
      "",
      "Legendary Actions",
      "Legendary Action Uses: 3. Immediately after another creature’s turn, the monster can expend a use to move, attack, or trigger one selected horror graft. It regains all expended uses at the start of each of its turns.",
      "Press the Horror. The monster uses one non-lair graft that has not already been used this round."
    );
  sections.push("", "Designer Notes", ...buildDesignerNotes({ danger, role, computed }));

  return sections.join("\n");
}

function buildStatBlockItems(items, computed) {
  return items.map((item) => ({
    id: item.id || item.title,
    title: item.title,
    text: normalizeRulesText(item.mechanics, computed),
  }));
}

function buildRenderableStatBlock({
  name,
  creatureType,
  category,
  role,
  danger,
  computed,
  abilityProfile,
  traits,
  actions,
  bonusActions,
  reactions,
  legendaryActions,
  lairActions,
  deathEffects,
  selectedFeatures,
  hasLegendaryActions,
  xp,
}) {
  const basics = getStatBlockBasics(creatureType, category, role, computed, abilityProfile, xp);
  const fallbackTraits = [
    {
      id: "unfinished-horror",
      title: "Unfinished Horror",
      mechanics:
        "Add grafts in the Crucible to generate traits, tells, weaknesses, and horror behavior.",
    },
  ];
  const fallbackActions = [
    {
      id: "fallback-strike",
      title: "Strike",
      mechanics: `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit: ${computed.damageText} damage.`,
    },
  ];
  const traitItems = traits.filter((item) => item.slot !== "weakness");
  const weaknessItems = selectedFeatures.filter((item) => item.slot === "weakness");
  const legendaryFallback =
    hasLegendaryActions && !legendaryActions.length
      ? [
          {
            id: "legendary-action-uses",
            title: "Legendary Action Uses",
            mechanics:
              "3. Immediately after another creature’s turn, the monster can expend a use to move, attack, or trigger one selected horror graft. It regains all expended uses at the start of each of its turns.",
          },
          {
            id: "press-the-horror",
            title: "Press the Horror",
            mechanics:
              "The monster uses one non-lair graft that has not already been used this round.",
          },
        ]
      : [];

  return {
    name,
    creatureLine: basics.creatureLine,
    coreStats: [
      { label: "AC", value: computed.ac },
      {
        label: "HP",
        value: `${computed.hp} (${hpFormula(computed.hp, role.id === "boss" ? 10 : 8)})`,
      },
      { label: "Speed", value: creatureType.defaults.speed },
      { label: "Initiative", value: `${modText(basics.initiative)} (${basics.initiativeTotal})` },
      { label: "CR", value: `${computed.targetCr} (${basics.xp} XP)` },
      { label: "PB", value: modText(computed.prof) },
    ],
    abilities: [...abilityProfile.physical, ...abilityProfile.mental],
    defenses: [
      { label: "Skills", value: basics.skills },
      { label: "Resistances", value: basics.resistances },
      { label: "Immunities", value: basics.immunities },
      { label: "Senses", value: creatureType.defaults.senses },
      { label: "Languages", value: basics.languages },
    ],
    sections: [
      {
        id: "traits",
        title: "Traits",
        items: buildStatBlockItems(traitItems.length ? traitItems : fallbackTraits, computed),
      },
      {
        id: "weaknesses",
        title: "Weakness / Tell",
        items: buildStatBlockItems(weaknessItems, computed),
        highlight: true,
      },
      {
        id: "actions",
        title: "Actions",
        items: buildStatBlockItems(actions.length ? actions : fallbackActions, computed),
      },
      {
        id: "bonus-actions",
        title: "Bonus Actions",
        items: buildStatBlockItems(bonusActions, computed),
      },
      { id: "reactions", title: "Reactions", items: buildStatBlockItems(reactions, computed) },
      {
        id: "death-effects",
        title: "Death Effects",
        items: buildStatBlockItems(deathEffects, computed),
      },
      {
        id: "lair-actions",
        title: "Lair Actions",
        items: buildStatBlockItems(lairActions, computed),
      },
      {
        id: "legendary-actions",
        title: "Legendary Actions",
        items: buildStatBlockItems(
          legendaryActions.length ? legendaryActions : legendaryFallback,
          computed
        ),
      },
    ],
    designerNotes: buildDesignerNotes({ danger, role, computed }),
  };
}

function buildExportJson({
  name,
  creatureType,
  category,
  role,
  danger,
  source,
  computed,
  abilityProfile,
  traits,
  actions,
  bonusActions,
  reactions,
  legendaryActions,
  lairActions,
  deathEffects,
  selectedFeatures,
  activePreset,
  xp,
}) {
  const basics = getStatBlockBasics(creatureType, category, role, computed, abilityProfile, xp);
  const normalizedSections = buildNormalizedSections({
    traits,
    actions,
    bonusActions,
    reactions,
    legendaryActions,
    lairActions,
    deathEffects,
    computed,
  });
  return JSON.stringify(
    {
      exportMeta: {
        schemaVersion: EXPORT_SCHEMA_VERSION,
        featureSchemaVersion: FEATURE_SCHEMA_VERSION,
        migrationStage: DATA_MODEL_MIGRATION_STAGE,
        statBlockStyle: "D&D 2024-inspired",
        normalization: "rules-text-normalized-v1",
        activePreset: activePreset
          ? {
              id: activePreset.id,
              label: activePreset.label,
              family: activePreset.family,
              source: activePreset.source,
            }
          : null,
      },
      name,
      frame: {
        creatureType: creatureType.label,
        category,
        targetCr: computed.targetCr,
        encounterRole: role.label,
        tacticalRole: computed.tacticalRole.label,
        tier: computed.monsterTier.label,
        tempoProfile: computed.tempoProfile.label,
        danger: danger.label,
        source: source.label,
        size: basics.size,
        alignment: "Unaligned",
      },
      combat: {
        ac: computed.ac,
        hp: computed.hp,
        dpr: computed.dpr,
        attackBonus: modText(computed.attack),
        dc: computed.dc,
        initiative: modText(basics.initiative),
        speed: creatureType.defaults.speed,
        targetCr: computed.targetCr,
        estimatedCr: computed.estimatedCr,
        xp,
        proficiencyBonus: modText(computed.prof),
      },
      printedStats: computed.printedStats,
      effectiveProfile: computed.effectiveProfile,
      profileDeltas: computed.profileDeltas,
      pressureProfile: computed.pressureProfile,
      complexityProfile: computed.complexityProfile,
      counterplayAudit: computed.counterplayAudit,
      counterplayProfiles: computed.counterplayProfiles,
      featureMechanics: computed.featureMechanics,
      mechanicsSummary: computed.mechanicsSummary,
      abilities: {
        physical: abilityProfile.physical,
        mental: abilityProfile.mental,
      },
      defenses: {
        skills: basics.skills,
        resistances: basics.resistances,
        immunities: basics.immunities,
        senses: creatureType.defaults.senses,
        languages: basics.languages,
      },
      sections: normalizedSections,
      balance: {
        pressure: computed.pressure,
        budget: computed.budget,
        complexity: computed.complexity,
        complexityCap: computed.complexityCap,
        warnings: computed.warnings,
        baseline: computed.baseline,
        printedStats: computed.printedStats,
        effectiveProfile: computed.effectiveProfile,
        profileDeltas: computed.profileDeltas,
        pressureProfile: computed.pressureProfile,
        complexityProfile: computed.complexityProfile,
        counterplayAudit: computed.counterplayAudit,
        counterplayProfiles: computed.counterplayProfiles,
        featureMechanics: computed.featureMechanics,
        mechanicsSummary: computed.mechanicsSummary,
        baselinePower: computed.baselinePower,
        effectivePower: computed.effectivePower,
      },
      catalog: {
        features: getFeatureCatalogStats(FEATURES),
        presets: getPresetCatalogStats(MONSTER_FAMILY_PRESETS),
      },
      grafts: selectedFeatures.map((feature) => buildStructuredFeature(feature, computed)),
    },
    null,
    2
  );
}

export default function CruorMonsterComposerMvp() {
  const [typeId, setTypeId] = useState("undead");
  const [category, setCategory] = useState("Zombie");
  const [roleId, setRoleId] = useState("standard");
  const [sourceId, setSourceId] = useState("decomposition");
  const [partyLevel, setPartyLevel] = useState(5);
  const [partySize, setPartySize] = useState(4);
  const [dangerId, setDangerId] = useState("hard");
  const [targetCr, setTargetCr] = useState(5);
  const [tacticalRoleId, setTacticalRoleId] = useState("brute");
  const [monsterTierId, setMonsterTierId] = useState("normal");
  const [tempoProfileId, setTempoProfileId] = useState("standard");
  const [selected, setSelected] = useState({});
  const [composerStarted, setComposerStarted] = useState(false);
  const [startMode, setStartMode] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [draggedFeatureId, setDraggedFeatureId] = useState(null);
  const [activeSlot, setActiveSlot] = useState("body");
  const [frameOpen, setFrameOpen] = useState(false);
  const [viewMode, setViewMode] = useState("composer");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customPressureBudget, setCustomPressureBudget] = useState(15);
  const [customComplexityCap, setCustomComplexityCap] = useState(10);
  const [slotCaps, setSlotCaps] = useState(DEFAULT_SLOT_CAPS);
  const [activePresetId, setActivePresetId] = useState("");
  const [navigatorSearch, setNavigatorSearch] = useState("");
  const [navigatorFiltersOpen, setNavigatorFiltersOpen] = useState(false);
  const [componentNavigatorOpen, setComponentNavigatorOpen] = useState(false);
  const [componentNavigatorMode, setComponentNavigatorMode] = useState("slot");
  const [navigatorSlotFilter, setNavigatorSlotFilter] = useState("all");
  const [exportCopyStatus, setExportCopyStatus] = useState("");

  const creatureType = CREATURE_TYPES.find((type) => type.id === typeId) || CREATURE_TYPES[0];
  const role = ROLES.find((item) => item.id === roleId) || ROLES[1];
  const danger = DANGERS.find((item) => item.id === dangerId) || DANGERS[0];
  const source = SOURCES.find((item) => item.id === sourceId) || SOURCES[0];
  const tacticalRole =
    TACTICAL_ROLES.find((item) => item.id === tacticalRoleId) || TACTICAL_ROLES[0];
  const monsterTier = MONSTER_TIERS.find((item) => item.id === monsterTierId) || MONSTER_TIERS[0];
  const tempoProfile =
    TEMPO_PROFILES.find((item) => item.id === tempoProfileId) || TEMPO_PROFILES[1];
  const defaultPressureBudget =
    role.budget +
    danger.budgetOffset +
    monsterTier.budgetOffset +
    tacticalRole.budgetMod +
    tempoProfile.budgetMod +
    Math.max(0, partySize - 4);
  const defaultComplexityCap =
    role.complexityCap +
    monsterTier.complexityCapOffset +
    tacticalRole.complexityMod +
    tempoProfile.complexityMod;
  const effectivePressureBudget = advancedMode ? customPressureBudget : defaultPressureBudget;
  const effectiveComplexityCap = advancedMode ? customComplexityCap : defaultComplexityCap;
  const composerMode = getComposerMode(advancedMode, customMode);
  const activePreset = getPresetById(activePresetId);
  const currentNavigatorSlot =
    componentNavigatorMode === "global" ? navigatorSlotFilter : activeSlot;

  const selectedFeatures = useMemo(() => getFeaturesFromSelection(selected), [selected]);

  const availableFeatures = useMemo(() => {
    const slotFilter = currentNavigatorSlot === "all" ? null : currentNavigatorSlot;
    return FEATURES.map((feature) => ({
      feature,
      status: getCompatibilityStatus(feature, selectedFeatures, typeId, category),
    }))
      .filter(({ feature, status }) => {
        const frameMatch = customMode
          ? featureMatchesSourceAndSlot(feature, sourceId, slotFilter)
          : featureMatchesFrame(feature, sourceId, typeId, roleId, slotFilter);
        return frameMatch && canShowFeatureForMode(status, composerMode);
      })
      .sort((a, b) => {
        const aDecision = getFeatureDecisionProfile(a.feature, {
          status: a.status,
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          tacticalRoleId,
          monsterTierId,
          currentSlot: currentNavigatorSlot,
        });
        const bDecision = getFeatureDecisionProfile(b.feature, {
          status: b.status,
          selected,
          selectedFeatures,
          typeId,
          category,
          roleId,
          tacticalRoleId,
          monsterTierId,
          currentSlot: currentNavigatorSlot,
        });
        const slotSort =
          SLOTS.findIndex((slot) => slot.id === a.feature.slot) -
          SLOTS.findIndex((slot) => slot.id === b.feature.slot);
        return (
          getFeatureDecisionRank(aDecision) - getFeatureDecisionRank(bDecision) ||
          slotSort ||
          a.feature.cost - b.feature.cost ||
          a.feature.title.localeCompare(b.feature.title)
        );
      })
      .map(({ feature }) => feature);
  }, [
    sourceId,
    typeId,
    roleId,
    currentNavigatorSlot,
    selectedFeatures,
    selected,
    category,
    composerMode,
    customMode,
    tacticalRoleId,
    monsterTierId,
  ]);

  const compatibleCount = useMemo(() => {
    return FEATURES.map((feature) => ({
      feature,
      status: getCompatibilityStatus(feature, selectedFeatures, typeId, category),
    })).filter(({ feature, status }) => {
      const frameMatch = customMode
        ? feature.source === sourceId
        : featureMatchesFrame(feature, sourceId, typeId, roleId);
      return frameMatch && canShowFeatureForMode(status, composerMode);
    }).length;
  }, [sourceId, typeId, roleId, selectedFeatures, category, composerMode, customMode]);

  const computed = useMemo(() => {
    const partyTier = getTier(partyLevel);
    const prof = getProfForCr(targetCr);
    const baseline = getBaselineProfile(targetCr, monsterTier.id);
    const baseHp = Math.round(baseline.hp * role.hpMult * tacticalRole.hpMult);
    const baseDpr = Math.round(
      baseline.dpr * role.dprMult * danger.dprMod * tacticalRole.dprMult * tempoProfile.dprMult
    );
    const baseAc = baseline.ac + monsterTier.acMod + tacticalRole.acMod;
    const baseAttack = baseline.attackBonus + tacticalRole.attackMod + tempoProfile.attackMod;
    const baseDc = baseline.saveDc + tacticalRole.dcMod;

    const statMods = selectedFeatures.reduce(
      (acc, feature) => {
        Object.entries(feature.stats || {}).forEach(([key, value]) => {
          acc[key] = (acc[key] || 0) + value;
        });
        return acc;
      },
      { hp: 0, dpr: 0, ac: 0, control: 0, mobility: 0, fairness: 0 }
    );

    const featureMechanics = selectedFeatures.map((feature) => ({
      id: feature.id,
      title: feature.title,
      ...getFeatureMechanicProfile(feature),
    }));
    const mechanicsSummary = summarizeMechanicProfiles(featureMechanics);
    const counterplayProfiles = selectedFeatures.map((feature) =>
      getFeatureCounterplayProfile(feature)
    );
    const cost = selectedFeatures.reduce((sum, feature) => sum + feature.cost, 0);
    const rawComplexity = selectedFeatures.reduce((sum, feature) => sum + feature.complexity, 0);
    const budget = effectivePressureBudget;
    const pressureProfile = buildPressureProfile({
      cost,
      monsterTier,
      tempoProfile,
      statMods,
      mechanicsSummary,
      budget,
    });
    const complexityProfile = buildComplexityProfile({
      complexity: rawComplexity,
      mechanicsSummary,
      featureMechanics,
      limit: effectiveComplexityCap,
    });
    const counterplayAudit = buildCounterplayAudit({
      selected,
      roleId,
      monsterTier,
      pressureProfile,
      complexityProfile,
      mechanicsSummary,
      counterplayProfiles,
    });
    const pressure = pressureProfile.score;
    const complexity = complexityProfile.score;
    const hp = Math.max(1, Math.round(baseHp + (statMods.hp || 0)));
    const ac = clamp(baseAc + (statMods.ac || 0), 10, 28);
    const dpr = Math.max(1, Math.round(baseDpr + (statMods.dpr || 0)));
    const dc = clamp(baseDc + Math.floor((statMods.control || 0) / 3), 10, 30);
    const attack = clamp(baseAttack, 2, 18);
    const printedStats = {
      ac,
      hp,
      dpr,
      attackBonus: attack,
      saveDc: dc,
      initiativeMod: tempoProfile.initiativeMod,
      speed: creatureType.defaults.speed,
    };
    const effectiveProfile = {
      effectiveAc: ac + Math.floor((statMods.mobility || 0) / 4),
      effectiveHp: Math.round(hp * (1 + Math.max(0, statMods.fairness || 0) * 0.015)),
      effectiveAttackBonus: attack + (tempoProfile.id === "ambusher" ? 1 : 0),
      effectiveSaveDc: dc,
      printedDpr: dpr,
      effectiveDpr3Round: Math.max(
        Math.round(
          dpr *
            (1 +
              Math.max(0, statMods.control || 0) * 0.035 +
              Math.max(0, statMods.mobility || 0) * 0.02 +
              (tempoProfile.id === "ambusher" ? 0.08 : 0))
        ),
        Math.round(dpr + mechanicsSummary.structuredDamage * 0.2)
      ),
      burstDpr: Math.round(
        dpr *
          (1 +
            (tempoProfile.id === "ambusher" ? 0.35 : 0.12) +
            Math.max(0, statMods.dpr || 0) * 0.01)
      ),
      tempoFactor: 1 + tempoProfile.pressureMod * 0.05,
      defenseFactor:
        1 + Math.max(0, statMods.hp || 0) / Math.max(1, hp) + Math.max(0, statMods.ac || 0) * 0.04,
    };
    effectiveProfile.combatPowerEstimate = Math.round(
      effectiveProfile.effectiveHp *
        effectiveProfile.effectiveDpr3Round *
        ((effectiveProfile.effectiveAc + effectiveProfile.effectiveAttackBonus - 2) / 13)
    );
    const profileDeltas = buildProfileDeltas(printedStats, effectiveProfile, baseline);
    const estimatedCr = clamp(
      Math.round(
        targetCr +
          (pressure - budget) / 6 +
          ((effectiveProfile.effectiveDpr3Round - baseline.dpr) / Math.max(8, baseline.dpr)) * 2
      ),
      0,
      30
    );
    const name = buildName(typeId, category, selectedFeatures);
    const rulesContext = {
      typeId,
      creatureType: creatureType.label,
      category,
      categoryNoun: String(category || "monster").toLowerCase(),
    };
    const effectivePower = effectiveProfile.combatPowerEstimate;
    const baselinePower = Math.round(
      baseline.hp * baseline.dpr * ((baseline.ac + baseline.attackBonus - 2) / 13)
    );

    const warnings = [];
    if (pressure > budget)
      warnings.push(
        "Threat budget is above target. Reduce one high-cost twist or treat this as a boss/setpiece."
      );
    if (complexity > effectiveComplexityCap)
      warnings.push(
        "Table complexity is high. Remove one feature with a reaction, recharge, or delayed effect, or increase the custom Complexity limit in Advanced Mode."
      );
    if (!hasSelectedSlot(selected, "weakness"))
      warnings.push(
        "No Weakness / Tell selected. Add counterplay before using this as horror, otherwise it may feel arbitrary."
      );
    if (
      roleId === "boss" &&
      !hasSelectedSlot(selected, "twist") &&
      !hasSelectedSlot(selected, "lair")
    )
      warnings.push(
        "Boss lacks action-economy pressure. Add a Combat Twist, Lair Effect, or minions."
      );
    if ((statMods.control || 0) >= 5 && !hasSelectedSlot(selected, "weakness"))
      warnings.push("Control pressure is high and currently has no clear player-facing answer.");
    if (roleId === "minion" && complexity > 4)
      warnings.push("Minions should be simple. Keep only one memorable feature.");
    if (hp > baseline.hp * 1.45 && monsterTier.id === "normal")
      warnings.push(
        "HP is far above the normal CR baseline. Consider Elite, Boss, Legendary, or reduce defensive grafts."
      );
    if (dpr > baseline.dpr * 1.4 && monsterTier.id !== "legendary")
      warnings.push(
        "Printed DPR is far above baseline. Treat this as an Elite/Boss profile or reduce offensive grafts."
      );
    if (effectiveProfile.effectiveDpr3Round > baseline.dpr * 1.35 && monsterTier.id === "normal")
      warnings.push(
        "Effective DPR is above the normal CR baseline once control, mobility, and tempo are considered. Consider Elite/Boss tier or lower offensive pressure."
      );
    if (effectiveProfile.burstDpr > baseline.dpr * 1.75)
      warnings.push(
        "Burst DPR spike is high. Add a recharge, telegraph, setup requirement, or reduce opening damage."
      );
    if (effectiveProfile.combatPowerEstimate > baselinePower * 1.7 && monsterTier.id === "normal")
      warnings.push(
        "Effective combat power is much higher than baseline. Consider raising Tier or lowering HP/DPR/control grafts."
      );
    if (
      tempoProfile.id === "legendary" &&
      !["boss", "legendary", "setpiece"].includes(monsterTier.id)
    )
      warnings.push(
        "Legendary tempo on a non-boss tier can feel overtuned. Consider Boss, Legendary, or a slower tempo profile."
      );
    if (mechanicsSummary.rechargeCount >= 3)
      warnings.push(
        "Too many recharge abilities. Consider converting one recharge effect into an at-will minor action or a phase trigger."
      );
    if (
      mechanicsSummary.reactionCount >= 3 &&
      !["boss", "legendary", "setpiece"].includes(monsterTier.id)
    )
      warnings.push(
        "Too many reaction hooks for a non-boss monster. Reduce reactions or raise the monster Tier."
      );
    if (mechanicsSummary.majorConditionCount >= 3)
      warnings.push(
        "Major condition load is high. Make sure at least one condition has a clear break condition, repeat save, or visible setup."
      );
    counterplayAudit.issues.forEach((issue) => {
      warnings.push(`Counterplay Audit: ${issue.label}. ${issue.detail}`);
    });

    selectedFeatures.forEach((feature) => {
      const compatibilityWarning = buildCompatibilityWarning(
        feature,
        getCompatibilityStatus(feature, selectedFeatures, typeId, category)
      );
      if (compatibilityWarning) warnings.push(compatibilityWarning);
    });

    const balanceRecommendations = buildBalanceRecommendations({
      selected,
      selectedFeatures,
      typeId,
      category,
      roleId,
      sourceId,
      composerMode,
      customMode,
      monsterTier,
      tempoProfile,
      pressure,
      budget,
      complexity,
      complexityCap: effectiveComplexityCap,
      counterplayAudit,
      mechanicsSummary,
      baseline,
      hp,
      dpr,
      effectiveProfile,
    });

    return {
      tier: partyTier,
      targetCr,
      tacticalRole,
      monsterTier,
      tempoProfile,
      rulesContext,
      baseline,
      printedStats,
      effectiveProfile,
      profileDeltas,
      pressureProfile,
      complexityProfile,
      counterplayAudit,
      counterplayProfiles,
      featureMechanics,
      mechanicsSummary,
      baselinePower,
      effectivePower,
      prof,
      hp,
      ac,
      dpr,
      dc,
      attack,
      budget,
      cost,
      pressure,
      complexity,
      complexityCap: effectiveComplexityCap,
      estimatedCr,
      name,
      warnings: uniqueArray(warnings),
      balanceRecommendations,
      damageText: averageDamageText(dpr),
      statMods,
    };
  }, [
    partyLevel,
    role,
    roleId,
    danger,
    creatureType,
    selectedFeatures,
    selected,
    typeId,
    category,
    sourceId,
    composerMode,
    customMode,
    effectivePressureBudget,
    effectiveComplexityCap,
    targetCr,
    tacticalRole,
    monsterTier,
    tempoProfile,
  ]);

  function selectType(nextTypeId) {
    if (isCreatureTypeUnavailable(nextTypeId)) return;
    const nextType = CREATURE_TYPES.find((type) => type.id === nextTypeId) || CREATURE_TYPES[0];
    setTypeId(nextType.id);
    setCategory(getDefaultCreatureCategory(nextType));
    setSelected({});
    setActivePresetId("");
  }

  function applyPreset(preset) {
    if (!preset) return;
    const presetType =
      CREATURE_TYPES.find((type) => type.id === preset.typeId) || CREATURE_TYPES[0];
    const nextCategory = presetType.categories.includes(preset.category)
      ? preset.category
      : getDefaultCreatureCategory(presetType);
    const nextSelection = normalizePresetSelection(preset);
    setTypeId(preset.typeId);
    setCategory(nextCategory);
    setRoleId(preset.roleId);
    setSourceId(preset.source);
    setDangerId(preset.dangerId);
    setTargetCr(preset.targetCr);
    setTacticalRoleId(preset.tacticalRoleId);
    setMonsterTierId(preset.monsterTierId);
    setTempoProfileId(preset.tempoProfileId);
    setSelected(nextSelection);
    setActiveSlot(Object.keys(nextSelection)[0] || "body");
    setActivePresetId(preset.id);
  }

  function startFromTemplate(preset) {
    if (!preset) return;
    applyPreset(preset);
    setStartMode("template");
    setComposerStarted(true);
    setTemplatePickerOpen(false);
  }

  function openTemplatePicker() {
    setTemplatePickerOpen(true);
  }

  function startFromScratch() {
    setSelected({});
    setActivePresetId("");
    setStartMode("scratch");
    setComposerStarted(true);
    setTemplatePickerOpen(false);
    setComponentNavigatorOpen(false);
    setComponentNavigatorMode("slot");
    setNavigatorSlotFilter("body");
    setNavigatorSearch("");
    setNavigatorFiltersOpen(false);
    setActiveSlot("body");
    setViewMode("composer");
  }

  function startOver() {
    setSelected({});
    setActivePresetId("");
    setStartMode("");
    setComposerStarted(false);
    setTemplatePickerOpen(false);
    setComponentNavigatorOpen(false);
    setComponentNavigatorMode("slot");
    setNavigatorSlotFilter("body");
    setNavigatorSearch("");
    setNavigatorFiltersOpen(false);
    setActiveSlot("body");
    setViewMode("composer");
  }

  function addFeature(feature) {
    const status = getCompatibilityStatus(feature, selectedFeatures, typeId, category);
    if (!canShowFeatureForMode(status, composerMode)) return;

    setActivePresetId("");
    setSelected((current) => {
      const slotCap = advancedMode ? getSlotCap(slotCaps, feature.slot) : 1;
      const currentIds = getSelectedIdsForSlot(current, feature.slot);
      if (currentIds.includes(feature.id)) return current;
      if (slotCap > 1 && currentIds.length >= slotCap) return current;
      const nextIds = slotCap <= 1 ? [feature.id] : [...currentIds, feature.id];
      return { ...current, [feature.slot]: slotCap <= 1 ? nextIds[0] : nextIds };
    });
    setActiveSlot(feature.slot);
  }

  function removeSlot(slotId) {
    setActivePresetId("");
    setSelected((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
  }

  function removeFeature(slotId, featureId) {
    setActivePresetId("");
    setSelected((current) => {
      const currentIds = getSelectedIdsForSlot(current, slotId);
      const nextIds = currentIds.filter((id) => id !== featureId);
      const next = { ...current };
      if (!nextIds.length) {
        delete next[slotId];
        return next;
      }
      next[slotId] = Array.isArray(current[slotId]) ? nextIds : nextIds[0];
      return next;
    });
  }

  function handleDrop(slotId) {
    if (!draggedFeatureId) return;
    const feature = FEATURES.find((item) => item.id === draggedFeatureId);
    if (!feature || feature.slot !== slotId) return;
    addFeature(feature);
    setDraggedFeatureId(null);
  }

  function forgeMonster() {
    setComposerStarted(true);
    setStartMode((current) => current || "scratch");
    setTemplatePickerOpen(false);
    const priority = getForgePriority(roleId);
    const budget = effectivePressureBudget;
    const next = {};
    let runningCost = 0;

    priority.forEach((slotId) => {
      const slotCap = advancedMode ? getSlotCap(slotCaps, slotId) : 1;
      const picks = [];

      for (let index = 0; index < slotCap; index += 1) {
        const partialFeatures = getFeaturesFromSelection(next);
        const candidates = FEATURES.map((feature) => ({
          feature,
          status: getCompatibilityStatus(feature, partialFeatures, typeId, category),
        }))
          .filter(({ feature, status }) => {
            const alreadyPicked =
              picks.includes(feature.id) ||
              getSelectedIdsForSlot(next, slotId).includes(feature.id);
            const frameMatch = customMode
              ? featureMatchesSourceAndSlot(feature, sourceId, slotId)
              : featureMatchesFrame(feature, sourceId, typeId, roleId, slotId);
            return !alreadyPicked && frameMatch && canShowFeatureForMode(status, composerMode);
          })
          .sort(
            (a, b) =>
              getCompatibilityRank(a.status) - getCompatibilityRank(b.status) ||
              a.feature.cost - b.feature.cost
          )
          .map(({ feature }) => feature);
        const remainingBudget = Math.max(0, budget - runningCost + (roleId === "boss" ? 3 : 0));
        const picked = pickForgeCandidate(candidates, slotId, remainingBudget, roleId);
        if (!picked) break;
        picks.push(picked.id);
        runningCost += Math.max(0, picked.cost);
        if (!advancedMode) break;
      }

      if (!picks.length) return;
      next[slotId] = slotCap <= 1 ? picks[0] : picks;
    });

    setSelected(next);
    setActivePresetId("");
    setActiveSlot(priority.find((slotId) => !next[slotId]) || "attack");
  }

  function resetBuild() {
    startOver();
  }

  function handleAdvancedModeToggle() {
    if (advancedMode) {
      setSelected((current) => collapseSelectedToSingle(current));
      setSlotCaps(DEFAULT_SLOT_CAPS);
      setAdvancedMode(false);
      return;
    }

    setCustomPressureBudget(defaultPressureBudget);
    setCustomComplexityCap(defaultComplexityCap);
    setAdvancedMode(true);
  }

  function handleSlotCapChange(slotId, value) {
    const nextValue = clamp(Number(value || 1), 1, 4);
    setActivePresetId("");
    setSlotCaps((current) => {
      const next = { ...current, [slotId]: nextValue };
      setSelected((selectedCurrent) => trimSelectedToCaps(selectedCurrent, next));
      return next;
    });
  }

  function handleCustomModeToggle() {
    setActivePresetId("");
    setCustomMode((current) => !current);
  }

  const pressurePercent = clamp((computed.pressure / computed.budget) * 100, 0, 160);
  const complexityPercent = clamp((computed.complexity / computed.complexityCap) * 100, 0, 160);
  const abilityProfile = buildAbilityProfile(
    typeId,
    category,
    roleId,
    selectedFeatures,
    computed.prof
  );
  const sectionGroups = useMemo(() => groupFeaturesBySection(selectedFeatures), [selectedFeatures]);
  const traits = sectionGroups.trait || [];
  const actions = sectionGroups.action || [];
  const bonusActions = sectionGroups.bonusAction || [];
  const reactions = sectionGroups.reaction || [];
  const legendaryActions = sectionGroups.legendaryAction || [];
  const lairActions = sectionGroups.lairAction || [];
  const deathEffects = sectionGroups.death || [];
  const hasLegendaryActions = roleId === "boss";
  const xp = xpForCr(computed.targetCr).toLocaleString("en-US");
  const selectedSlotCount = SLOTS.filter((slot) => hasSelectedSlot(selected, slot.id)).length;
  const selectedGraftCount = selectedFeatures.length;
  const slotCompletionPercent = clamp(Math.round((selectedSlotCount / SLOTS.length) * 100), 0, 100);
  const activeSlotData = SLOTS.find((slot) => slot.id === activeSlot) || SLOTS[0];
  const activeSlotFeatureIds = getSelectedIdsForSlot(selected, activeSlot);
  const activeSlotFeatures = activeSlotFeatureIds
    .map((id) => FEATURES.find((feature) => feature.id === id))
    .filter(Boolean);
  const activeSlotCap = advancedMode ? getSlotCap(slotCaps, activeSlot) : 1;
  const activeSlotAvailableFeatures = useMemo(() => {
    return FEATURES.map((feature) => ({
      feature,
      status: getCompatibilityStatus(feature, selectedFeatures, typeId, category),
    }))
      .filter(({ feature, status }) => {
        const frameMatch = customMode
          ? featureMatchesSourceAndSlot(feature, sourceId, activeSlot)
          : featureMatchesFrame(feature, sourceId, typeId, roleId, activeSlot);
        return frameMatch && canShowFeatureForMode(status, composerMode);
      })
      .map(({ feature }) => feature);
  }, [sourceId, typeId, roleId, activeSlot, selectedFeatures, category, composerMode, customMode]);
  const activeAlternatives = activeSlotAvailableFeatures.filter(
    (feature) => !activeSlotFeatureIds.includes(feature.id)
  ).length;
  const visibleFeatures = useMemo(() => {
    const query = navigatorSearch.trim().toLowerCase();
    if (!query) return availableFeatures;
    return availableFeatures.filter((feature) => {
      const sourceLabel = SOURCES.find((item) => item.id === feature.source)?.label || "";
      const haystack = [
        feature.title,
        feature.summary,
        feature.mechanics,
        feature.counterplay,
        sourceLabel,
        feature.slot,
        getSectionLabel(getFeatureSection(feature)),
        ...asArray(feature.tags),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [availableFeatures, navigatorSearch]);
  const guidedFlow = buildGuidedFlow({
    composerStarted,
    startMode,
    selected,
    computed,
    activePreset,
  });

  function openSlotNavigator(slotId) {
    if (!composerStarted) return;
    setActiveSlot(slotId);
    setNavigatorSlotFilter(slotId);
    setNavigatorSearch("");
    setNavigatorFiltersOpen(false);
    setComponentNavigatorMode("slot");
    setComponentNavigatorOpen(true);
  }

  function openGlobalNavigator() {
    if (!composerStarted) return;
    setComponentNavigatorMode("global");
    setNavigatorSlotFilter("all");
    setNavigatorSearch("");
    setNavigatorFiltersOpen(false);
    setComponentNavigatorOpen(true);
  }

  function handleBalanceRecommendationAction(action) {
    if (!action) return;

    if (action.kind === "addFeature" && action.featureId) {
      const feature = FEATURES.find((item) => item.id === action.featureId);
      if (!feature) return;
      addFeature(feature);
      setActiveSlot(feature.slot);
      setViewMode("balance");
      return;
    }

    if (action.kind === "removeFeature" && action.featureId) {
      const feature = FEATURES.find((item) => item.id === action.featureId);
      if (!feature) return;
      removeFeature(feature.slot, feature.id);
      setViewMode("balance");
      return;
    }

    if (action.kind === "replaceFeature" && action.removeFeatureId && action.addFeatureId) {
      const removeTarget = FEATURES.find((item) => item.id === action.removeFeatureId);
      const addTarget = FEATURES.find((item) => item.id === action.addFeatureId);
      if (!removeTarget || !addTarget) return;
      setActivePresetId("");
      setSelected((current) => {
        const next = getSelectedWithoutFeature(current, removeTarget);
        const slotCap = advancedMode ? getSlotCap(slotCaps, addTarget.slot) : 1;
        const currentIds = getSelectedIdsForSlot(next, addTarget.slot);
        if (currentIds.includes(addTarget.id)) return next;
        if (slotCap <= 1) return { ...next, [addTarget.slot]: addTarget.id };
        if (currentIds.length >= slotCap) return next;
        return { ...next, [addTarget.slot]: [...currentIds, addTarget.id] };
      });
      setActiveSlot(addTarget.slot);
      setViewMode("balance");
      return;
    }

    if (action.kind === "slot" && action.slotId) {
      setViewMode("composer");
      openSlotNavigator(action.slotId);
      return;
    }

    if (action.kind === "tier" && action.tierId) {
      setMonsterTierId(action.tierId);
      setActivePresetId("");
      setViewMode("balance");
      return;
    }

    if (action.kind === "advanced") {
      if (!advancedMode) handleAdvancedModeToggle();
      setViewMode("balance");
      return;
    }

    if (action.kind === "frame") {
      setFrameOpen(true);
      return;
    }

    if (action.kind === "view" && action.viewMode) {
      setViewMode(action.viewMode);
    }
  }

  function copyExportPayload(kind, payload) {
    if (!payload) return;
    setExportCopyStatus(`${kind}-copying`);
    const finish = (status) => {
      setExportCopyStatus(`${kind}-${status}`);
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          setExportCopyStatus((current) => (current === `${kind}-${status}` ? "" : current));
        }, 1600);
      }
    };

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(payload)
        .then(() => finish("copied"))
        .catch(() => finish(copyTextFallback(payload) ? "copied" : "failed"));
      return;
    }

    finish(copyTextFallback(payload) ? "copied" : "failed");
  }

  function handleAddFeatureFromNavigator(feature) {
    addFeature(feature);
    if (
      componentNavigatorMode === "slot" &&
      !(advancedMode && getSlotCap(slotCaps, feature.slot) > 1)
    ) {
      setComponentNavigatorOpen(false);
    }
  }

  return (
    <div
      className="monster-shell"
      data-composer-started={composerStarted ? "true" : "false"}
      data-start-mode={startMode || "unstarted"}
      data-template-picker-open={templatePickerOpen ? "true" : "false"}
    >
      <main className="monster-workspace">
        <div className="darken-workspace__topbar monster-topbar-wrap">
          <header className="darken-topbar monster-topbar">
            <div className="darken-topbar__primary">
              <h1 className="darken-topbar__title">
                <span className="darken-topbar__title-prefix">I need to</span>
                <span className="darken-topbar__need-value">Build a Monster</span>
              </h1>
              <div className="darken-topbar__control-row monster-topbar__control-row">
                <div
                  className="mode-switch darken-topbar__mode-switch"
                  aria-label="Choose what you need to do"
                >
                  <button
                    className="mode-btn"
                    type="button"
                    aria-label="Darken a Location"
                    aria-pressed="false"
                  >
                    <BookOpen aria-hidden="true" />
                    <span className="sr-only">Darken a Location</span>
                  </button>
                  <button
                    className="mode-btn active"
                    type="button"
                    aria-label="Build a Monster"
                    aria-pressed="true"
                  >
                    <Skull aria-hidden="true" />
                    <span className="sr-only">Build a Monster</span>
                  </button>
                  <button
                    className="mode-btn"
                    type="button"
                    aria-label="Inspirations"
                    aria-pressed="false"
                  >
                    <Sparkles aria-hidden="true" />
                    <span className="sr-only">Inspirations</span>
                  </button>
                </div>
                <div className="monster-topbar__right">
                  <div className="monster-topbar__summary" aria-label="Current monster frame">
                    <span className="monster-current-frame">
                      {activePreset ? `${activePreset.label} · ` : ""}CR {targetCr} ·{" "}
                      {tacticalRole.label} · {monsterTier.label} · {tempoProfile.label}
                    </span>
                  </div>
                  <div
                    className="darken-workspace__tabs"
                    role="tablist"
                    aria-label="Monster composer views"
                  >
                    <button
                      className={`darken-workspace__tab ${viewMode === "composer" ? "is-active" : ""}`}
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "composer"}
                      onClick={() => setViewMode("composer")}
                    >
                      Composer
                    </button>
                    <button
                      className={`darken-workspace__tab ${viewMode === "balance" ? "is-active" : ""}`}
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "balance"}
                      onClick={() => setViewMode("balance")}
                    >
                      Balance
                    </button>
                    <button
                      className={`darken-workspace__tab ${viewMode === "run" ? "is-active" : ""}`}
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "run"}
                      onClick={() => setViewMode("run")}
                    >
                      Run
                    </button>
                    <button
                      className={`darken-workspace__tab ${viewMode === "export" ? "is-active" : ""}`}
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "export"}
                      onClick={() => setViewMode("export")}
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>

        {frameOpen ? (
          <>
            <button
              className="monster-frame-scrim is-open"
          type="button"
          aria-label="Close Monster Frame"
          onClick={() => setFrameOpen(false)}
            />

            <aside
              className="panel navigator monster-frame-drawer game-frame-drawer is-open"
              aria-label="Monster Frame"
              aria-hidden="false"
            >
          <div className="game-frame__hero">
            <div className="game-frame__status-row">
              <span className="game-frame__status">
                <span /> Live Frame
              </span>
              <button
                className="icon-btn"
                type="button"
                aria-label="Close Monster Frame"
                onClick={() => setFrameOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <p className="eyebrow">Monster Frame</p>
            <h2>{computed.name}</h2>
            <div className="game-frame__loadout" aria-label="Current frame summary">
              <span>
                <Skull aria-hidden="true" /> {creatureType.label}
              </span>
              <span>
                <Activity aria-hidden="true" /> {category}
              </span>
              <span>
                <Sword aria-hidden="true" /> {role.label}
              </span>
              <span>
                <Gauge aria-hidden="true" /> CR {targetCr}
              </span>
              <span>
                <Activity aria-hidden="true" /> {tacticalRole.label}
              </span>
              <span>
                <Sparkles aria-hidden="true" /> {monsterTier.label}
              </span>
              <span>
                <AlertTriangle aria-hidden="true" /> {tempoProfile.label}
              </span>
            </div>
          </div>

          <div className="game-frame__body">
            <PanelGroup title="Creature Type" icon={Skull}>
              <div className="game-type-grid">
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
                      className={`game-type-card ${active ? "active" : ""} ${unavailable ? "is-disabled" : ""}`}
                      onClick={() => selectType(type.id)}
                    >
                      <span className="game-type-card__icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="game-type-card__text">
                        <strong>{type.label}</strong>
                        <small>{unavailable ? "Unavailable" : `${type.categories.length} variants`}</small>
                      </span>
                      <span className="game-type-card__mark">
                        {active ? "Active" : unavailable ? "Later" : "Select"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="game-category-panel">
                <div className="game-frame__minihead">
                  <span>Variant</span>
                  <strong>{category}</strong>
                </div>
                <div
                  className="game-category-grid"
                  role="radiogroup"
                  aria-label="Creature category"
                >
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
                        className={`game-category-chip ${item === category ? "active" : ""} ${unavailable ? "is-disabled" : ""}`}
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
              </div>
            </PanelGroup>

            <PanelGroup title="Encounter Role" icon={Sword}>
              <div className="game-role-grid">
                {ROLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`game-role-card ${item.id === roleId ? "active" : ""}`}
                    onClick={() => {
                      setRoleId(item.id);
                      setActivePresetId("");
                    }}
                  >
                    <span className="game-role-card__top">
                      <strong>{item.label}</strong>
                      <small>{item.id === roleId ? "Equipped" : "Loadout"}</small>
                    </span>
                    <span className="game-role-card__summary">{item.summary}</span>
                    <span className="game-role-card__stats">
                      <span>HP {Math.round(item.hpMult * 100)}%</span>
                      <span>DPR {Math.round(item.dprMult * 100)}%</span>
                    </span>
                  </button>
                ))}
              </div>
            </PanelGroup>

            <PanelGroup title="Design Profile" icon={Gauge}>
              <div className="game-category-panel">
                <div className="game-frame__minihead">
                  <span>Target CR</span>
                  <strong>{targetCr}</strong>
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
              </div>

              <div className="game-category-panel">
                <div className="game-frame__minihead">
                  <span>Tactical Role</span>
                  <strong>{tacticalRole.label}</strong>
                </div>
                <div className="game-category-grid" role="radiogroup" aria-label="Tactical role">
                  {TACTICAL_ROLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={item.id === tacticalRoleId}
                      className={`game-category-chip ${item.id === tacticalRoleId ? "active" : ""}`}
                      onClick={() => {
                        setTacticalRoleId(item.id);
                        setActivePresetId("");
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="game-category-panel">
                <div className="game-frame__minihead">
                  <span>Tier</span>
                  <strong>{monsterTier.label}</strong>
                </div>
                <div className="game-category-grid" role="radiogroup" aria-label="Monster tier">
                  {MONSTER_TIERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={item.id === monsterTierId}
                      className={`game-category-chip ${item.id === monsterTierId ? "active" : ""}`}
                      onClick={() => {
                        setMonsterTierId(item.id);
                        setActivePresetId("");
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="game-category-panel">
                <div className="game-frame__minihead">
                  <span>Tempo</span>
                  <strong>{tempoProfile.label}</strong>
                </div>
                <div className="game-category-grid" role="radiogroup" aria-label="Tempo profile">
                  {TEMPO_PROFILES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={item.id === tempoProfileId}
                      className={`game-category-chip ${item.id === tempoProfileId ? "active" : ""}`}
                      onClick={() => {
                        setTempoProfileId(item.id);
                        setActivePresetId("");
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </PanelGroup>

            <PanelGroup title="Danger" icon={AlertTriangle}>
              <div className="game-threat-panel">
                <div className="game-threat-scale" role="radiogroup" aria-label="Monster danger">
                  {DANGERS.map((item, index) => (
                    <button
                      key={item.id}
                      className={`game-threat-chip ${item.id === dangerId ? "active" : ""}`}
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

                <div className="game-frame__meters" aria-label="Current pressure readout">
                  <div className="game-frame__meter">
                    <span>
                      <small>Pressure</small>
                      <strong>
                        {computed.pressure} / {computed.budget}
                      </strong>
                    </span>
                    <i>
                      <b
                        className={computed.pressure > computed.budget ? "is-over" : ""}
                        style={{ width: `${Math.min(pressurePercent, 100)}%` }}
                      />
                    </i>
                  </div>
                  <div className="game-frame__meter">
                    <span>
                      <small>Complexity</small>
                      <strong>
                        {computed.complexity} / {computed.complexityCap}
                      </strong>
                    </span>
                    <i>
                      <b
                        className={computed.complexity > computed.complexityCap ? "is-over" : ""}
                        style={{ width: `${Math.min(complexityPercent, 100)}%` }}
                      />
                    </i>
                  </div>
                </div>
              </div>
            </PanelGroup>
          </div>
            </aside>
          </>
        ) : null}

        {viewMode === "composer" && (
          <section className="monster-layout">
            <section
              className="panel build-canvas monster-canvas"
              aria-label="The Crucible build canvas"
            >
              <div className="build-head monster-build-head">
                <div>
                  <h2 className="monster-canvas-title">{computed.name}</h2>
                  <div
                    className="monster-canvas-meta-row"
                    aria-label="Current anatomy composer state"
                  >
                    <button
                      className="anatomy-frame-btn"
                      type="button"
                      aria-label="Open Monster Frame"
                      title="Open Monster Frame"
                      onClick={() => setFrameOpen(true)}
                    >
                      <SlidersHorizontal aria-hidden="true" />
                    </button>
                    <strong>
                      {composerStarted
                        ? `${selectedSlotCount}/${SLOTS.length} Filled`
                        : "Choose Start"}
                    </strong>
                  </div>
                </div>
                <div className="crucible-head-controls">
                  <div className="brief-actions" aria-label="Build actions">
                    <button
                      className="icon-btn primary empty-cta tooltip-btn"
                      type="button"
                      aria-label="Forge Monster"
                      data-tooltip="Auto-build a playable first draft from the current Monster Frame. You can customize every anatomy slot afterward."
                      onClick={forgeMonster}
                    >
                      <Flame aria-hidden="true" />
                    </button>
                    <button
                      className="crucible-action-btn tooltip-btn"
                      type="button"
                      aria-label="Open Component Navigator"
                      aria-disabled={!composerStarted}
                      data-tooltip={
                        composerStarted
                          ? "Browse compatible components independently from a specific anatomy slot."
                          : "Choose Pick a Template or Build from Scratch before browsing components."
                      }
                      onClick={openGlobalNavigator}
                    >
                      <SlidersHorizontal aria-hidden="true" /> Components
                    </button>
                    <button
                      className={`icon-btn tooltip-btn ${composerStarted ? "" : "is-disabled"}`}
                      type="button"
                      aria-label="Start Over"
                      aria-disabled={!composerStarted}
                      data-tooltip={
                        composerStarted
                          ? "Return to the initial Template / Scratch choice and clear the current build."
                          : "Start a build before using Start Over."
                      }
                      onClick={composerStarted ? startOver : undefined}
                    >
                      <RotateCcw aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <MonsterSilhouetteMap
                typeId={typeId}
                category={category}
                activePreset={activePreset}
                selected={selected}
                activeSlot={activeSlot}
                guidedSlotId={guidedFlow.recommendedSlotId}
                computed={computed}
                started={composerStarted}
                startMode={startMode}
                presetsCount={MONSTER_FAMILY_PRESETS.length}
                onPickTemplate={openTemplatePicker}
                onBuildFromScratch={startFromScratch}
                onOpenFrame={() => setFrameOpen(true)}
                onFocusSlot={openSlotNavigator}
              />

              <GuidedFlowPanel
                guidedFlow={guidedFlow}
                onOpenStart={openTemplatePicker}
                onOpenFrame={() => setFrameOpen(true)}
                onFocusSlot={openSlotNavigator}
                onOpenBalance={() => setViewMode("balance")}
                onOpenExport={() => setViewMode("export")}
              />

              <div className="build-slots monster-slots">
                {SLOTS.map((slot) => {
                  const Icon = slot.icon;
                  const slotFeatures = getSelectedIdsForSlot(selected, slot.id)
                    .map((id) => FEATURES.find((feature) => feature.id === id))
                    .filter(Boolean);
                  const active = activeSlot === slot.id;
                  const filled = slotFeatures.length > 0;
                  return (
                    <article
                      key={slot.id}
                      role="button"
                      tabIndex={0}
                      className={`build-slot ${active ? "active" : ""} ${guidedFlow.recommendedSlotId === slot.id ? "is-guided" : ""} ${filled ? "has-items" : "needs-attention"}`}
                      onClick={() => openSlotNavigator(slot.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openSlotNavigator(slot.id);
                        }
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(slot.id)}
                    >
                      <div className="slot-head">
                        <span className="slot-name">
                          <Icon className="slot-icon" aria-hidden="true" /> {slot.label}
                        </span>
                        <span className="count">{slotFeatures.length || "—"}</span>
                      </div>
                      {filled ? (
                        <div className="slot-stack">
                          {slotFeatures.map((feature) => (
                            <article key={feature.id} className="slot-item">
                              <button
                                className="slot-item-remove"
                                type="button"
                                aria-label={`Remove ${feature.title}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeFeature(slot.id, feature.id);
                                }}
                              >
                                <X aria-hidden="true" />
                              </button>
                              <p className="slot-item-text">
                                <strong className="slot-item-title">{feature.title}</strong>
                                {normalizeMonsterReferences(feature.summary, computed)}
                              </p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <span className="slot-empty">{slot.hint}</span>
                      )}
                    </article>
                  );
                })}
              </div>

              {composerStarted && (
                <GraftInspector
                  slot={activeSlotData}
                  features={activeSlotFeatures}
                  alternatives={activeAlternatives}
                  source={source}
                  computed={computed}
                  onClear={() => removeSlot(activeSlot)}
                  onRemoveFeature={(featureId) => removeFeature(activeSlot, featureId)}
                />
              )}
            </section>
          </section>
        )}

        {viewMode === "balance" && (
          <section className="panel balance-workbench" aria-label="Monster balance review">
            <div className="balance-hero">
              <div>
                <h2>Balance Review</h2>
              </div>
              <span
                className={`balance-verdict ${computed.warnings.length ? "needs-review" : "ready"}`}
              >
                <Shield aria-hidden="true" /> {computed.warnings.length ? "Needs Review" : "Ready"}
              </span>
            </div>
            <div className="balance-grid balance-grid--simplified">
              <article className="balance-card balance-wide-card balance-recommendations-card">
                <div className="balance-card__head">
                  <span>Fix These First</span>
                  <strong>{computed.balanceRecommendations.length || "Clear"}</strong>
                </div>
                <BalanceRecommendationList
                  recommendations={computed.balanceRecommendations}
                  onAction={handleBalanceRecommendationAction}
                />
              </article>
              <article className="balance-card">
                <div className="balance-card__head">
                  <span>Pressure</span>
                  <strong>{computed.pressureProfile.label}</strong>
                </div>
                <Meter
                  label="Pressure"
                  value={computed.pressure}
                  max={computed.budget}
                  percent={pressurePercent}
                />
                <p className="balance-note">
                  {computed.pressureProfile.sources.join(" · ") || "No pressure sources yet."}
                </p>
              </article>
              <article className="balance-card">
                <div className="balance-card__head">
                  <span>Complexity</span>
                  <strong>{computed.complexityProfile.label}</strong>
                </div>
                <Meter
                  label="Complexity"
                  value={computed.complexity}
                  max={computed.complexityCap}
                  percent={complexityPercent}
                />
                <p className="balance-note">
                  {computed.complexityProfile.sources.join(" · ") || "No complexity sources yet."}
                </p>
              </article>
              <article className="balance-card">
                <div className="balance-card__head">
                  <span>Counterplay</span>
                  <strong>{computed.counterplayAudit.rating}</strong>
                </div>
                <div
                  className="balance-progress-ring"
                  style={{ "--progress": `${computed.counterplayAudit.score}%` }}
                >
                  <span>{computed.counterplayAudit.score}</span>
                </div>
                <p className="balance-note">
                  {formatCounterplayIssues(computed.counterplayAudit.issues)}
                </p>
              </article>
              <details className="balance-diagnostics balance-wide-card">
                <summary>Raw Diagnostics</summary>
                <div className="balance-diagnostics__grid">
                  <article className="balance-card">
                    <div className="balance-card__head">
                      <span>Warnings</span>
                      <strong>{computed.warnings.length}</strong>
                    </div>
                    <WarningList warnings={computed.warnings} />
                  </article>
                  <article className="balance-card">
                    <div className="balance-card__head">
                      <span>Baseline</span>
                      <strong>CR {computed.targetCr}</strong>
                    </div>
                    <div className="compiled-meta-grid balance-meta-grid">
                      <CompiledMeta label="AC" value={`${computed.ac} / ${computed.baseline.ac}`} />
                      <CompiledMeta label="HP" value={`${computed.hp} / ${computed.baseline.hp}`} />
                      <CompiledMeta
                        label="DPR"
                        value={`${computed.effectiveProfile.effectiveDpr3Round} / ${computed.baseline.dpr}`}
                      />
                      <CompiledMeta
                        label="Attack"
                        value={`${modText(computed.attack)} / ${modText(computed.baseline.attackBonus)}`}
                      />
                      <CompiledMeta
                        label="DC"
                        value={`${computed.dc} / ${computed.baseline.saveDc}`}
                      />
                      <CompiledMeta label="Burst" value={computed.effectiveProfile.burstDpr} />
                    </div>
                  </article>
                </div>
              </details>
            </div>
          </section>
        )}

        {viewMode === "run" &&
          (() => {
            const runSheet = buildRunModeSheet({
              name: computed.name,
              creatureType,
              category,
              role,
              danger,
              computed,
              selectedFeatures,
              traits,
              actions,
              bonusActions,
              reactions,
              lairActions,
              deathEffects,
            });
            return (
              <RunModePanel
                sheet={runSheet}
                recommendations={computed.balanceRecommendations}
                onAction={handleBalanceRecommendationAction}
                onOpenComposer={() => setViewMode("composer")}
                onOpenBalance={() => setViewMode("balance")}
                onOpenExport={() => setViewMode("export")}
              />
            );
          })()}

        {viewMode === "export" &&
          (() => {
            const exportText = buildExportText({
              name: computed.name,
              creatureType,
              category,
              role,
              danger,
              computed,
              abilityProfile,
              traits,
              actions,
              bonusActions,
              reactions,
              legendaryActions,
              lairActions,
              deathEffects,
              hasLegendaryActions,
              xp,
            });
            const exportJson = buildExportJson({
              name: computed.name,
              creatureType,
              category,
              role,
              danger,
              source,
              computed,
              abilityProfile,
              traits,
              actions,
              bonusActions,
              reactions,
              legendaryActions,
              lairActions,
              deathEffects,
              selectedFeatures,
              activePreset,
              xp,
            });
            const statBlock = buildRenderableStatBlock({
              name: computed.name,
              creatureType,
              category,
              role,
              danger,
              computed,
              abilityProfile,
              traits,
              actions,
              bonusActions,
              reactions,
              legendaryActions,
              lairActions,
              deathEffects,
              selectedFeatures,
              hasLegendaryActions,
              xp,
            });
            const exportReadiness = buildExportReadiness({
              computed,
              selected,
              selectedFeatures,
              traits,
              actions,
              weaknessFeatures: selectedFeatures.filter((feature) => feature.slot === "weakness"),
              deathEffects,
              lairActions,
            });
            const exportRunSheet = buildExportRunSheet({
              computed,
              selectedFeatures,
              traits,
              actions,
              bonusActions,
              reactions,
              deathEffects,
              lairActions,
            });
            return (
              <section className="export-workbench" aria-label="Monster export">
                <div className="export-layout">
                  <section className="panel table-view export-stat-preview">
                    <RenderedStatBlock statBlock={statBlock} />
                  </section>
                  <aside className="panel export-console" aria-label="Export console">
                    <div className="export-console__head">
                      <h2>Table Handoff</h2>
                    </div>

                    <ExportReadinessPanel
                      readiness={exportReadiness}
                      onOpenBalance={() => setViewMode("balance")}
                    />

                    <div className="export-action-grid" aria-label="Export actions">
                      <button
                        className={`export-copy-btn ${exportCopyStatus === "text-copied" ? "copied" : exportCopyStatus === "text-failed" ? "failed" : ""}`}
                        type="button"
                        onClick={() => copyExportPayload("text", exportText)}
                      >
                        {exportCopyStatus === "text-copied"
                          ? "Copied Stat Block"
                          : exportCopyStatus === "text-failed"
                            ? "Copy Failed"
                            : "Copy Stat Block"}
                      </button>
                      <button
                        className={`export-copy-btn ${exportCopyStatus === "json-copied" ? "copied" : exportCopyStatus === "json-failed" ? "failed" : ""}`}
                        type="button"
                        onClick={() => copyExportPayload("json", exportJson)}
                      >
                        {exportCopyStatus === "json-copied"
                          ? "Copied JSON"
                          : exportCopyStatus === "json-failed"
                            ? "Copy Failed"
                            : "Copy JSON"}
                      </button>
                    </div>

                    <ExportRunSheet items={exportRunSheet} />

                    <details className="export-raw-panel">
                      <summary>Raw Export</summary>
                      <div className="export-raw-panel__body">
                        <div className="export-textarea-shell">
                          <span>Stat Block Text</span>
                          <textarea
                            value={exportText}
                            readOnly
                            aria-label="Exported stat block text"
                          />
                        </div>
                        <div className="export-textarea-shell">
                          <span>Structured JSON</span>
                          <textarea
                            value={exportJson}
                            readOnly
                            aria-label="Exported monster JSON"
                          />
                        </div>
                      </div>
                    </details>
                  </aside>
                </div>
              </section>
            );
          })()}

        <ComponentNavigatorModal
          open={componentNavigatorOpen}
          mode={componentNavigatorMode}
          activeSlot={activeSlot}
          navigatorSlotFilter={navigatorSlotFilter}
          setNavigatorSlotFilter={setNavigatorSlotFilter}
          setActiveSlot={setActiveSlot}
          onClose={() => setComponentNavigatorOpen(false)}
          visibleFeatures={visibleFeatures}
          selected={selected}
          selectedFeatures={selectedFeatures}
          typeId={typeId}
          category={category}
          roleId={roleId}
          computed={computed}
          sourceId={sourceId}
          setSourceId={setSourceId}
          setActivePresetId={setActivePresetId}
          navigatorSearch={navigatorSearch}
          setNavigatorSearch={setNavigatorSearch}
          navigatorFiltersOpen={navigatorFiltersOpen}
          setNavigatorFiltersOpen={setNavigatorFiltersOpen}
          advancedMode={advancedMode}
          slotCaps={slotCaps}
          activeSlotFeatures={activeSlotFeatures}
          activeSlotCap={activeSlotCap}
          composerMode={composerMode}
          customMode={customMode}
          addFeature={handleAddFeatureFromNavigator}
          setDraggedFeatureId={setDraggedFeatureId}
        />

        <TemplatePickerModal
          open={templatePickerOpen}
          presets={MONSTER_FAMILY_PRESETS}
          activePresetId={activePresetId}
          onApply={startFromTemplate}
          onClose={() => setTemplatePickerOpen(false)}
        />
      </main>
    </div>
  );
}

function GuidedFlowPanel({
  guidedFlow,
  onOpenStart,
  onOpenFrame,
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
    if (step.action === "frame") {
      onOpenFrame?.();
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

function MonsterStartScreen({ onPickTemplate, onBuildFromScratch, presetsCount }) {
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

function MonsterSilhouetteMap({
  typeId,
  category,
  activePreset,
  selected,
  activeSlot,
  guidedSlotId,
  computed,
  started,
  startMode,
  presetsCount,
  onPickTemplate,
  onBuildFromScratch,
  onOpenFrame,
  onFocusSlot,
}) {
  const silhouetteId = getSilhouetteId(typeId, category, activePreset);
  const profile = getSilhouetteProfile(typeId, category, activePreset);
  const filledCount = SLOTS.filter((slot) => hasSelectedSlot(selected, slot.id)).length;

  function openFrameFromSilhouette(event) {
    event.stopPropagation();
    onOpenFrame?.();
  }

  function handleSilhouetteKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenFrame?.();
    }
  }

  function getSlotCardData(slotId) {
    const slot = SLOTS.find((item) => item.id === slotId) || SLOTS[0];
    const Icon = slot.icon;
    const card = SILHOUETTE_SLOT_CARDS[slot.id] || { side: "center" };
    const slotFeatures = getSelectedIdsForSlot(selected, slot.id)
      .map((id) => FEATURES.find((feature) => feature.id === id))
      .filter(Boolean);
    const feature = slotFeatures[0] || null;
    const filled = slotFeatures.length > 0;
    const active = activeSlot === slot.id;
    const guided = guidedSlotId === slot.id;

    return { slot, Icon, card, slotFeatures, feature, filled, active, guided };
  }

  function renderSlotCard(slotId) {
    const { slot, Icon, card, slotFeatures, feature, filled, active, guided } =
      getSlotCardData(slotId);

    return (
      <button
        key={slot.id}
        type="button"
        className={`monster-silhouette-slot-card is-${card.side} ${filled ? "is-filled" : "is-empty"} ${active ? "is-active" : ""} ${guided ? "is-guided" : ""}`}
        aria-label={`Focus ${slot.label}`}
        aria-pressed={active}
        onClick={(event) => {
          event.stopPropagation();
          onFocusSlot(slot.id);
        }}
      >
        <span className="monster-silhouette-slot-card__head">
          <span>
            <Icon aria-hidden="true" /> {slot.label}
          </span>
          <strong>{slotFeatures.length || "—"}</strong>
        </span>
        <span className="monster-silhouette-slot-card__body">
          {feature ? (
            <>
              <strong>{feature.title}</strong>
              <em>{normalizeMonsterReferences(feature.summary, computed)}</em>
            </>
          ) : (
            <>
              <strong>Empty Slot</strong>
              <em>{slot.hint}</em>
            </>
          )}
        </span>
      </button>
    );
  }

  return (
    <section className="monster-anatomy-composer" aria-label="Monster anatomy composer">
      {!started ? (
        <MonsterStartScreen
          onPickTemplate={onPickTemplate}
          onBuildFromScratch={onBuildFromScratch}
          presetsCount={presetsCount}
        />
      ) : (
        <>
          {startMode === "scratch" && filledCount === 0 && (
            <div className="monster-scratch-hint" aria-label="Scratch build hint">
              <strong>Empty Anatomy Frame</strong>
              <span>
                Click Body, Attack Pattern, or Weakness / Tell to install the first graft.
              </span>
            </div>
          )}
          <div
            className="monster-silhouette-stage anatomy-stage"
            data-active-slot={activeSlot}
            data-start-mode={startMode || "manual"}
          >
            <div className="anatomy-stage__grid">
              <aside
                className="anatomy-stage__column anatomy-stage__column--left"
                aria-label="Left anatomy slots"
              >
                <article className="silhouette-metric-card is-pressure">
                  <Meter
                    label="Pressure"
                    value={computed.pressure}
                    max={computed.budget}
                    percent={clamp((computed.pressure / computed.budget) * 100, 0, 160)}
                  />
                </article>
                <div className="anatomy-stage__slot-stack">
                  {ANATOMY_LEFT_SLOT_IDS.map(renderSlotCard)}
                </div>
              </aside>

              <div className="anatomy-stage__center" aria-label="Interactive monster silhouette">
                <div className="anatomy-stage__silhouette-layer">
                  <svg
                    className="monster-silhouette-connectors"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {SLOTS.map((slot) => {
                      const anchor = profile.anchors[slot.id] ||
                        BASE_SILHOUETTE_ANCHORS[slot.id] || { x: 0.5, y: 0.5 };
                      const card = SILHOUETTE_SLOT_CARDS[slot.id] || { x: anchor.x, y: anchor.y };
                      const filled = hasSelectedSlot(selected, slot.id);
                      const active = activeSlot === slot.id;
                      const guided = guidedSlotId === slot.id;
                      return (
                        <line
                          key={slot.id}
                          className={`monster-silhouette-connector ${filled ? "is-filled" : ""} ${active ? "is-active" : ""} ${guided ? "is-guided" : ""}`}
                          x1={card.x * 100}
                          y1={card.y * 100}
                          x2={anchor.x * 100}
                          y2={anchor.y * 100}
                        />
                      );
                    })}
                  </svg>

                  {profile.assetUrl ? (
                    <button
                      className={`monster-silhouette-svg monster-silhouette-asset monster-silhouette-svg--${silhouetteId}`}
                      type="button"
                      aria-label={`${profile.label}. Open Monster Frame`}
                      onClick={openFrameFromSilhouette}
                      onKeyDown={handleSilhouetteKeyDown}
                    >
                      <img
                        className="monster-silhouette-asset__image"
                        src={profile.assetUrl}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                      />
                    </button>
                  ) : (
                    <svg
                      className={`monster-silhouette-svg monster-silhouette-svg--${silhouetteId}`}
                      viewBox={profile.viewBox}
                      role="button"
                      tabIndex={0}
                      aria-label={`${profile.label}. Open Monster Frame`}
                      onClick={openFrameFromSilhouette}
                      onKeyDown={handleSilhouetteKeyDown}
                    >
                      <g className="monster-silhouette-aura">
                        {profile.layers
                          .filter((layer) => layer.id === "aura")
                          .map((layer) => (
                            <path key={layer.id} d={layer.d} />
                          ))}
                      </g>
                      <g className="monster-silhouette-body">
                        {profile.layers
                          .filter((layer) => layer.id !== "aura")
                          .map((layer) => (
                            <path
                              key={layer.id}
                              className={`silhouette-layer silhouette-layer--${layer.id}`}
                              d={layer.d}
                            />
                          ))}
                      </g>
                    </svg>
                  )}

                  {SLOTS.map((slot) => {
                    const Icon = slot.icon;
                    const anchor = profile.anchors[slot.id] ||
                      BASE_SILHOUETTE_ANCHORS[slot.id] || { x: 0.5, y: 0.5 };
                    const filled = hasSelectedSlot(selected, slot.id);
                    const active = activeSlot === slot.id;
                    const guided = guidedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        className={`monster-silhouette-node ${filled ? "is-filled" : ""} ${active ? "is-active" : ""} ${guided ? "is-guided" : ""}`}
                        style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
                        aria-label={`Focus ${slot.label}`}
                        aria-pressed={active}
                        onClick={(event) => {
                          event.stopPropagation();
                          onFocusSlot(slot.id);
                        }}
                      >
                        <Icon aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <aside
                className="anatomy-stage__column anatomy-stage__column--right"
                aria-label="Right anatomy slots"
              >
                <article className="silhouette-metric-card is-complexity">
                  <Meter
                    label="Complexity"
                    value={computed.complexity}
                    max={computed.complexityCap}
                    percent={clamp((computed.complexity / computed.complexityCap) * 100, 0, 160)}
                  />
                </article>
                <div className="anatomy-stage__slot-stack">
                  {ANATOMY_RIGHT_SLOT_IDS.map(renderSlotCard)}
                </div>
              </aside>

              <div className="anatomy-stage__lair" aria-label="Bottom anatomy slot">
                {ANATOMY_BOTTOM_SLOT_IDS.map(renderSlotCard)}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TemplatePickerModal({ open, presets, activePresetId, onApply, onClose }) {
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
            const source = SOURCES.find((item) => item.id === preset.source);
            const tacticalRole = TACTICAL_ROLES.find((item) => item.id === preset.tacticalRoleId);
            const monsterTier = MONSTER_TIERS.find((item) => item.id === preset.monsterTierId);
            const tempoProfile = TEMPO_PROFILES.find((item) => item.id === preset.tempoProfileId);
            const coverage = getPresetCoverage(preset);
            const active = preset.id === activePresetId;
            return (
              <article key={preset.id} className={`template-choice-card ${active ? "active" : ""}`}>
                <button
                  type="button"
                  className="template-choice-card__button"
                  onClick={() => onApply(preset)}
                >
                  {" "}
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

function ComponentNavigatorModal({
  open,
  mode,
  activeSlot,
  navigatorSlotFilter,
  setNavigatorSlotFilter,
  setActiveSlot,
  onClose,
  visibleFeatures,
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  computed,
  sourceId,
  setSourceId,
  setActivePresetId,
  navigatorSearch,
  setNavigatorSearch,
  navigatorFiltersOpen,
  setNavigatorFiltersOpen,
  advancedMode,
  slotCaps,
  activeSlotFeatures,
  activeSlotCap,
  addFeature,
  setDraggedFeatureId,
}) {
  if (!open) return null;

  const slotData = SLOTS.find((slot) => slot.id === activeSlot) || SLOTS[0];
  const filteredSlotData = SLOTS.find((slot) => slot.id === navigatorSlotFilter);
  const modalTitle =
    mode === "global"
      ? navigatorSlotFilter === "all"
        ? "Global Component Navigator"
        : `${filteredSlotData?.label || "Filtered"} Components`
      : `Choose ${slotData.label} Graft`;
  const smartPickSlotId = mode === "global" ? navigatorSlotFilter : activeSlot;
  const smartPicks = buildSmartSlotPicks({
    slotId: smartPickSlotId,
    candidates: visibleFeatures,
    selected,
    selectedFeatures,
    typeId,
    category,
    roleId,
    tacticalRoleId: computed.tacticalRole.id,
    monsterTierId: computed.monsterTier.id,
  });

  return (
    <div
      className="component-navigator-modal"
      data-navigator-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
    >
      <button
        className="component-navigator-modal__scrim"
        type="button"
        aria-label="Close Component Navigator"
        onClick={onClose}
      />
      <aside
        className="panel navigator monster-navigator component-navigator-modal__panel"
        aria-label="Component Navigator"
      >
        <div className="component-navigator-modal__head">
          <div>
            <h2>{modalTitle}</h2>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Close Component Navigator"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="navigator-tools monster-navigator-tools">
          <div className="navigator-search-row">
            <div className="search-wrap monster-search-wrap">
              <input
                type="search"
                value={navigatorSearch}
                placeholder="Search components…"
                aria-label="Search components"
                onChange={(event) => setNavigatorSearch(event.target.value)}
              />
            </div>
            <button
              className={`icon-btn navigator-filter-btn ${navigatorFiltersOpen ? "active" : ""}`}
              type="button"
              aria-label="Filter components"
              aria-expanded={navigatorFiltersOpen}
              data-active-count={
                navigatorSearch.trim() ||
                sourceId !== "decomposition" ||
                (mode === "global" && navigatorSlotFilter !== "all")
                  ? 1
                  : 0
              }
              onClick={() => setNavigatorFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal aria-hidden="true" />
            </button>
            <div className="navigator-count" aria-label="Visible component count">
              {visibleFeatures.length}
            </div>
          </div>

          {navigatorFiltersOpen && (
            <div className="tag-filter-row monster-source-grid-open" aria-label="Filter components">
              <div className="tag-filter-row__head">
                <span>Component Filters</span>
                <button
                  className="tag-clear-btn"
                  type="button"
                  onClick={() => {
                    setNavigatorSearch("");
                    setNavigatorSlotFilter(mode === "global" ? "all" : activeSlot);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="navigator-filter-panel">
                <section className="navigator-filter-section">
                  <strong>Source Anchor</strong>
                  <div className="filter-chip-grid source-filter">
                    {SOURCES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`navigator-filter-chip ${item.id === sourceId ? "active" : ""}`}
                        aria-pressed={item.id === sourceId}
                        onClick={() => {
                          setSourceId(item.id);
                          setActivePresetId("");
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        {mode === "global" && (
          <div className="source-modal__tools monster-slot-tabs component-navigator-modal__slot-tabs">
            <button
              type="button"
              className={`navigator-filter-chip ${navigatorSlotFilter === "all" ? "active" : ""}`}
              onClick={() => setNavigatorSlotFilter("all")}
            >
              All
            </button>
            {SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`navigator-filter-chip ${slot.id === navigatorSlotFilter ? "active" : ""}`}
                onClick={() => {
                  setNavigatorSlotFilter(slot.id);
                  setActiveSlot(slot.id);
                }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}

        {smartPickSlotId !== "all" && smartPicks.length > 0 && (
          <SmartSlotPicks
            slotId={smartPickSlotId}
            picks={smartPicks}
            selected={selected}
            selectedFeatures={selectedFeatures}
            typeId={typeId}
            category={category}
            advancedMode={advancedMode}
            slotCaps={slotCaps}
            computed={computed}
            onAdd={addFeature}
          />
        )}

        <div className="component-list monster-component-list component-navigator-modal__list">
          {visibleFeatures.length === 0 ? (
            <EmptyState text="No compatible components for this source/type/role/filter combination in the MVP dataset." />
          ) : (
            visibleFeatures.map((feature) => {
              const featureSlotIds = getSelectedIdsForSlot(selected, feature.slot);
              const featureSlotCap = advancedMode ? getSlotCap(slotCaps, feature.slot) : 1;
              const selectedInSlot = featureSlotIds.includes(feature.id);
              const slotFull =
                featureSlotCap > 1 && featureSlotIds.length >= featureSlotCap && !selectedInSlot;
              const compatibility = getCompatibilityStatus(
                feature,
                selectedFeatures,
                typeId,
                category
              );
              const decisionProfile = getFeatureDecisionProfile(feature, {
                status: compatibility,
                selected,
                selectedFeatures,
                typeId,
                category,
                roleId,
                tacticalRoleId: computed.tacticalRole.id,
                monsterTierId: computed.monsterTier.id,
                currentSlot: mode === "global" ? navigatorSlotFilter : activeSlot,
                selectedInSlot,
              });
              return (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  selected={selectedInSlot}
                  slotFull={slotFull}
                  compatibility={compatibility}
                  decisionProfile={decisionProfile}
                  selectedBuild={selected}
                  selectedFeatures={selectedFeatures}
                  typeId={typeId}
                  category={category}
                  computed={computed}
                  onAdd={() => addFeature(feature)}
                  onDragStart={() => setDraggedFeatureId(feature.id)}
                  onDragEnd={() => setDraggedFeatureId(null)}
                />
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}

function GraftInspector({
  slot,
  features,
  alternatives,
  source,
  computed,
  onClear,
  onRemoveFeature,
}) {
  const Icon = slot.icon;
  const installed = features.length > 0;

  return (
    <details
      className={`graft-inspector ${installed ? "has-feature" : "is-empty"}`}
      aria-label="Selected graft inspector"
    >
      <summary className="graft-inspector__head">
        <div>
          <h3>
            <Icon aria-hidden="true" /> {slot.label}
          </h3>
        </div>
        <div className="graft-inspector__status">
          <span>{source.label}</span>
          <strong>{installed ? `${features.length} Installed` : `${alternatives} Options`}</strong>
        </div>
      </summary>

      {installed ? (
        <div className="graft-inspector__content">
          <div className="graft-inspector__stack">
            {features.map((feature) => {
              const statEntries = Object.entries(feature.stats || {});
              const mechanicProfile = getFeatureMechanicProfile(feature);
              return (
                <article key={feature.id} className="graft-inspector__item">
                  <div className="graft-inspector__main">
                    <div className="graft-inspector__title-row">
                      <h4>{feature.title}</h4>
                      <button
                        type="button"
                        aria-label={`Remove ${feature.title}`}
                        onClick={() => onRemoveFeature(feature.id)}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                    <p>{normalizeMonsterReferences(feature.summary, computed)}</p>
                  </div>

                  <div className="graft-inspector__rules">
                    <article>
                      <BookOpen aria-hidden="true" />
                      <div>
                        <strong>Mechanics</strong>
                        <p>{normalizeRulesText(feature.mechanics, computed)}</p>
                      </div>
                    </article>
                    <article>
                      <Shield aria-hidden="true" />
                      <div>
                        <strong>Counterplay</strong>
                        <p>{normalizeMonsterReferences(feature.counterplay, computed)}</p>
                      </div>
                    </article>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="graft-inspector__footer">
            <span>
              {alternatives} alternative{alternatives === 1 ? "" : "s"}
            </span>
            <button type="button" onClick={onClear}>
              Clear Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="graft-inspector__empty">
          <p>{slot.hint}</p>
          <span>
            {alternatives} compatible graft{alternatives === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </details>
  );
}

function PanelGroup({ title, icon: Icon, children }) {
  return (
    <section className="monster-panel-group">
      <div className="monster-panel-group__head">
        <Icon aria-hidden="true" />
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <label className="monster-field">
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

function SmartSlotPicks({
  slotId,
  picks,
  selected,
  selectedFeatures,
  typeId,
  category,
  advancedMode,
  slotCaps,
  computed,
  onAdd,
}) {
  const slot = SLOTS.find((item) => item.id === slotId) || SLOTS[0];
  if (!picks.length) return null;

  return (
    <section className="smart-slot-picks" aria-label={`Best picks for ${slot.label}`}>
      <div className="smart-slot-picks__head">
        <strong>Best Picks</strong>
        <span>{slot.label}</span>
      </div>
      <div className="smart-slot-picks__grid">
        {picks.map((pick) => {
          const feature = pick.feature;
          const featureSlotIds = getSelectedIdsForSlot(selected, feature.slot);
          const featureSlotCap = advancedMode ? getSlotCap(slotCaps, feature.slot) : 1;
          const selectedInSlot = featureSlotIds.includes(feature.id);
          const slotFull =
            featureSlotCap > 1 && featureSlotIds.length >= featureSlotCap && !selectedInSlot;
          const compatibility = getCompatibilityStatus(feature, selectedFeatures, typeId, category);
          const impact = buildFeatureImpactPreview({
            feature,
            selected,
            selectedFeatures,
            typeId,
            category,
            computed,
          });
          const disabled =
            selectedInSlot || slotFull || ["missing", "incompatible"].includes(compatibility.kind);
          return (
            <article key={`${pick.id}-${feature.id}`} className={`smart-pick-card is-${pick.id}`}>
              <div className="smart-pick-card__top">
                <span>{pick.label}</span>
                <button type="button" disabled={disabled} onClick={() => onAdd?.(feature)}>
                  {selectedInSlot ? "Installed" : slotFull ? "Full" : "Add"}
                </button>
              </div>
              <h3>{feature.title}</h3>
              <p>{normalizeMonsterReferences(feature.summary, computed)}</p>
              <em>{formatFeatureImpactPreview(impact)}</em>
              {compatibility.kind !== "compatible" && <small>{compatibility.message}</small>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  selected,
  slotFull,
  compatibility,
  decisionProfile,
  selectedBuild,
  selectedFeatures,
  typeId,
  category,
  computed,
  onAdd,
  onDragStart,
  onDragEnd,
}) {
  const source = SOURCES.find((item) => item.id === feature.source);
  const rules = getFeatureCompatibility(feature);
  const mechanicProfile = getFeatureMechanicProfile(feature);
  const hasCompatibilityBadge = compatibility?.kind && compatibility.kind !== "compatible";
  const profile = decisionProfile || getFeatureDecisionProfile(feature, { status: compatibility });
  const actionLabel = selected ? "Installed" : slotFull ? "Full" : "Add";
  const impact = buildFeatureImpactPreview({
    feature,
    selected: selectedBuild || {},
    selectedFeatures: selectedFeatures || [],
    typeId,
    category,
    computed,
  });
  return (
    <motion.article
      layout
      draggable={!selected && !slotFull}
      onDragStart={(event) => {
        if (selected || slotFull) {
          event.preventDefault();
          return;
        }
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      className={`component-card ${selected ? "in-build" : ""} ${slotFull ? "slot-full" : ""} ${hasCompatibilityBadge ? `compatibility-${compatibility.kind}` : ""}`}
      data-decision-tier={profile.tier}
    >
      <button
        className="component-toggle-btn"
        type="button"
        onClick={onAdd}
        aria-label={
          selected
            ? `${feature.title} already installed`
            : slotFull
              ? `${titleCase(feature.slot)} slot is full`
              : `Add ${feature.title}`
        }
        disabled={selected || slotFull}
      >
        <Plus aria-hidden="true" />
        <span>{actionLabel}</span>
      </button>

      <div className="card-top">
        <div className="component-title-stack">
          <h3>{feature.title}</h3>
        </div>
        {hasCompatibilityBadge && (
          <span className={`compatibility-badge ${compatibility.kind}`}>{compatibility.label}</span>
        )}
      </div>

      <p className="summary">{normalizeMonsterReferences(feature.summary, computed)}</p>
      <p className="component-impact-line">{formatFeatureImpactPreview(impact)}</p>

      {hasCompatibilityBadge && <p className="compatibility-note">{compatibility.message}</p>}
      {slotFull && (
        <p className="compatibility-note">
          This slot is full. Raise its cap or remove a graft first.
        </p>
      )}
      <details className="component-details">
        <summary>Details</summary>
        <div className="meta-list" aria-label="Component metadata">
          <div className="meta-row">
            <span className="meta-label">Source</span>
            <span className="meta-values">
              <span className="meta-value source-chip">{source?.label}</span>
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Slot</span>
            <span className="meta-values">
              <span className="meta-value strong-chip">{titleCase(feature.slot)}</span>
              <span className="meta-value">{getSectionLabel(getFeatureSection(feature))}</span>
            </span>
          </div>
          {mechanicProfile.mechanicTags.length > 0 && (
            <div className="meta-row">
              <span className="meta-label">Tags</span>
              <span className="meta-values">
                {mechanicProfile.mechanicTags.slice(0, 5).map((tag) => (
                  <span key={tag} className="meta-value">
                    {formatToken(tag)}
                  </span>
                ))}
              </span>
            </div>
          )}
          {rules.grants.length > 0 && (
            <div className="meta-row">
              <span className="meta-label">Grants</span>
              <span className="meta-values">
                {rules.grants.map((token) => (
                  <span key={token} className="meta-value">
                    {formatToken(token)}
                  </span>
                ))}
              </span>
            </div>
          )}
          {(rules.requires.length > 0 ||
            rules.softRequires.length > 0 ||
            rules.incompatibleWith.length > 0) && (
            <div className="meta-row">
              <span className="meta-label">Locks</span>
              <span className="meta-values">
                {rules.requires.map((token) => (
                  <span key={`requires-${token}`} className="meta-value strong-chip">
                    Requires {formatToken(token)}
                  </span>
                ))}
                {rules.softRequires.map((token) => (
                  <span key={`soft-${token}`} className="meta-value">
                    Wants {formatToken(token)}
                  </span>
                ))}
                {rules.incompatibleWith.map((token) => (
                  <span key={`blocks-${token}`} className="meta-value danger-chip">
                    Blocks {formatToken(token)}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </details>
    </motion.article>
  );
}

function Meter({ label, value, max, percent }) {
  const over = value > max;
  return (
    <div className="monster-meter">
      <div className="monster-meter__head">
        <span>{label}</span>
        <strong className={over ? "is-over" : ""}>
          {value} / {max}
        </strong>
      </div>
      <div className="monster-meter__track">
        <div className={over ? "is-over" : ""} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="compiled-meta-item monster-stat">
      <span className="compiled-label">{label}</span>
      <strong className="compiled-value">{value}</strong>
    </div>
  );
}

function CompiledMeta({ label, value }) {
  return (
    <div className="compiled-meta-item">
      <span className="compiled-label">{label}</span>
      <strong className="compiled-value">{value}</strong>
    </div>
  );
}

function WarningList({ warnings }) {
  if (!warnings.length) {
    return (
      <div className="monster-warning monster-warning--ok">
        <Shield aria-hidden="true" />
        <span>
          The monster has a weakness/tell, stays inside the pressure budget, and should be playable
          for the selected use.
        </span>
      </div>
    );
  }

  return (
    <div className="monster-warning-list">
      {warnings.map((warning) => (
        <div key={warning} className="monster-warning">
          <AlertTriangle aria-hidden="true" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
}

function RunModePanel({
  sheet,
  recommendations,
  onAction,
  onOpenComposer,
  onOpenBalance,
  onOpenExport,
}) {
  return (
    <section className="run-mode-workbench" aria-label="Run mode">
      <div className="run-mode-hero">
        <div>
          <h2>{sheet.name}</h2>
          <p>{sheet.frame}</p>
        </div>
        <div className="run-mode-actions" aria-label="Run mode actions">
          <button type="button" onClick={onOpenComposer}>
            Composer
          </button>
          <button type="button" onClick={onOpenBalance}>
            Balance
          </button>
          <button type="button" onClick={onOpenExport}>
            Export
          </button>
        </div>
      </div>

      <div className="run-stat-strip" aria-label="Table statistics">
        {sheet.quickStats.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="run-mode-grid">
        <RunModeSection title="Turn Loop" items={sheet.turnLoop} wide />
        <RunModeTriggerSection items={sheet.triggers} />
        <RunModeSection title="Track During Play" items={sheet.tracking} />
        <RunModeSection title="Player Answers" items={sheet.playerAnswers} />
        <RunModeSection title="Watch Closely" items={sheet.watch} />
        <section className="run-panel">
          <div className="run-panel__head">
            <h3>Fix Before Table</h3>
            <strong>{recommendations.length || "Clear"}</strong>
          </div>
          <BalanceRecommendationList
            recommendations={recommendations.slice(0, 3)}
            onAction={onAction}
          />
        </section>
      </div>
    </section>
  );
}

function RunModeSection({ title, items, wide = false }) {
  return (
    <section className={`run-panel ${wide ? "run-panel--wide" : ""}`}>
      <div className="run-panel__head">
        <h3>{title}</h3>
        <strong>{items.length || "—"}</strong>
      </div>
      {items.length ? (
        <div className="run-list">
          {items.map((item) => (
            <article key={`${title}-${item.id || item.label}`}>
              <strong>{item.label || item.title}</strong>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="run-empty">Nothing to track.</p>
      )}
    </section>
  );
}

function RunModeTriggerSection({ items }) {
  return (
    <section className="run-panel run-panel--wide">
      <div className="run-panel__head">
        <h3>Live Triggers</h3>
        <strong>{items.length || "—"}</strong>
      </div>
      {items.length ? (
        <div className="run-trigger-list">
          {items.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.trigger}</span>
              </div>
              <p>{item.response}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="run-empty">
          No reactions, lair actions, recharge hooks, or death triggers installed.
        </p>
      )}
    </section>
  );
}

function BalanceRecommendationList({ recommendations, onAction }) {
  if (!recommendations.length) {
    return (
      <div className="balance-recommendation balance-recommendation--ok">
        <Shield aria-hidden="true" />
        <div>
          <strong>No changes required</strong>
          <p>
            The monster is within the current pressure and complexity targets, and the counterplay
            audit is playable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-recommendation-list">
      {recommendations.map((recommendation) => (
        <article
          key={recommendation.id}
          className={`balance-recommendation is-${recommendation.severity}`}
        >
          <AlertTriangle aria-hidden="true" />
          <div className="balance-recommendation__body">
            <span>{recommendation.severity}</span>
            <strong>{recommendation.title}</strong>
            <p>{recommendation.detail}</p>
            {recommendation.actions?.length > 0 && (
              <div className="balance-recommendation__actions">
                {recommendation.actions.map((action) => (
                  <button
                    key={`${recommendation.id}-${action.label}`}
                    type="button"
                    onClick={() => onAction?.(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function RenderedStatBlock({ statBlock }) {
  const visibleSections = statBlock.sections.filter((section) => section.items.length > 0);

  return (
    <article
      className="cruor-stat-block rendered-stat-block"
      aria-label={`${statBlock.name} rendered stat block`}
    >
      <header className="cruor-stat-block__head">
        <h3>{statBlock.name}</h3>
        <p>{statBlock.creatureLine}</p>
      </header>

      <section className="cruor-stat-block__core" aria-label="Core combat statistics">
        {statBlock.coreStats.map((item) => (
          <p key={item.label}>
            <strong>{item.label}</strong> {item.value}
          </p>
        ))}
      </section>

      <section className="cruor-stat-block__abilities" aria-label="Ability scores">
        <div className="table-overflow-wrapper">
          <table className="cruor-ability-table">
            <thead>
              <tr>
                {statBlock.abilities.map((ability) => (
                  <th key={ability.key}>{ability.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {statBlock.abilities.map((ability) => (
                  <td key={`${ability.key}-score`}>{ability.score}</td>
                ))}
              </tr>
              <tr>
                {statBlock.abilities.map((ability) => (
                  <td key={`${ability.key}-mod`}>{modText(ability.mod)}</td>
                ))}
              </tr>
              <tr>
                {statBlock.abilities.map((ability) => (
                  <td key={`${ability.key}-save`}>Save {modText(ability.save)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="cruor-stat-block__facts" aria-label="Defenses and senses">
        {statBlock.defenses.map((item) => (
          <p key={item.label}>
            <strong>{item.label}</strong> {item.value}
          </p>
        ))}
      </section>

      {visibleSections.map((section) => (
        <RenderedStatBlockSection
          key={section.id}
          title={section.title}
          items={section.items}
          highlight={section.highlight}
        />
      ))}

      <details className="cruor-stat-block__designer-notes">
        <summary>Designer Notes</summary>
        <div>
          {statBlock.designerNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </details>
    </article>
  );
}

function RenderedStatBlockSection({ title, items, highlight }) {
  if (!items.length) return null;

  return (
    <section className={`cruor-stat-block__section ${highlight ? "is-weakness" : ""}`}>
      <h2>{title}</h2>
      {items.map((item) => (
        <p key={item.id}>
          <strong>{item.title}.</strong> {item.text}
        </p>
      ))}
    </section>
  );
}

function ExportReadinessPanel({ readiness, onOpenBalance }) {
  return (
    <section
      className={`export-readiness-card ${readiness.ready ? "is-ready" : readiness.blockers.length ? "is-blocked" : "needs-review"}`}
      aria-label="Export readiness"
    >
      <div className="export-readiness-card__head">
        <div>
          <span>Export Readiness</span>
          <strong>{readiness.label}</strong>
        </div>
        <em>{readiness.percent}%</em>
      </div>
      <div className="export-readiness-meter" aria-hidden="true">
        <span style={{ width: `${readiness.percent}%` }} />
      </div>
      <div className="export-check-grid">
        {readiness.checks.map((check) => (
          <article
            key={check.id}
            className={`export-check ${check.ready ? "is-ready" : check.severity === "required" ? "is-blocked" : "needs-review"}`}
          >
            {check.ready ? <Shield aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
          </article>
        ))}
      </div>
      {!readiness.ready && (
        <button className="export-review-btn" type="button" onClick={onOpenBalance}>
          Review Balance Recommendations
        </button>
      )}
    </section>
  );
}

function ExportRunSheet({ items }) {
  return (
    <section className="export-run-sheet" aria-label="DM run sheet">
      <div className="export-run-sheet__head">
        <span>DM Run Sheet</span>
        <strong>Fast Reference</strong>
      </div>
      <div className="export-run-sheet__grid">
        {items.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>;
}


