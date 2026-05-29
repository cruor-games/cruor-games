import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import {
  Skull,
  Bug,
  Eye,
  Shield,
  Sword,
  Gauge,
  AlertTriangle,
  Wand2,
  RotateCcw,
  Plus,
  X,
  Flame,
  BookOpen,
  Activity,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

const CREATURE_TYPES = [
  {
    id: "undead",
    label: "Undead",
    icon: Skull,
    categories: ["Zombie", "Skeleton", "Ghoul", "Wraith"],
    defaults: {
      ac: 12,
      hp: 22,
      dpr: 7,
      speed: "30 ft.",
      senses: "darkvision 60 ft.",
    },
  },
  {
    id: "beast",
    label: "Beast",
    icon: Bug,
    categories: ["Spider", "Wolf", "Rat Swarm", "Carrion Bird"],
    defaults: {
      ac: 13,
      hp: 18,
      dpr: 6,
      speed: "40 ft.",
      senses: "passive Perception 12",
    },
  },
  {
    id: "aberration",
    label: "Aberration",
    icon: Eye,
    categories: ["Flesh Mass", "Eye Horror", "Parasite", "Psychic Predator"],
    defaults: {
      ac: 13,
      hp: 24,
      dpr: 8,
      speed: "30 ft.",
      senses: "darkvision 90 ft.",
    },
  },
];

const ROLES = [
  {
    id: "minion",
    label: "Minion",
    summary: "Low HP, simple damage, useful in groups.",
    hpMult: 0.45,
    dprMult: 0.75,
    budget: 7,
    complexityCap: 5,
    actionNote: "Use 3–6 of these. Keep turns fast.",
  },
  {
    id: "standard",
    label: "Standard",
    summary: "A full creature for one encounter slot.",
    hpMult: 1,
    dprMult: 1,
    budget: 12,
    complexityCap: 8,
    actionNote: "Works as one threat among several creatures.",
  },
  {
    id: "boss",
    label: "Boss",
    summary: "A setpiece monster with reactions, phases, or lair pressure.",
    hpMult: 2.3,
    dprMult: 1.25,
    budget: 18,
    complexityCap: 12,
    actionNote: "Needs action economy support or minions.",
  },
];

const DANGERS = [
  { id: "standard", label: "Standard", budgetOffset: 0, dprMod: 1 },
  { id: "hard", label: "Hard", budgetOffset: 3, dprMod: 1.15 },
  { id: "horror", label: "Horror Setpiece", budgetOffset: 5, dprMod: 1.25 },
];

const TACTICAL_ROLES = [
  {
    id: "brute",
    label: "Brute",
    summary: "High durability and direct damage. Low tactical trickery.",
    hpMult: 1.18,
    dprMult: 1.08,
    acMod: 0,
    attackMod: 1,
    dcMod: 0,
    budgetMod: 1,
    complexityMod: 0,
  },
  {
    id: "skirmisher",
    label: "Skirmisher",
    summary: "Mobile threat that pressures weak positions and retreats.",
    hpMult: 0.92,
    dprMult: 1,
    acMod: 1,
    attackMod: 0,
    dcMod: 0,
    budgetMod: 1,
    complexityMod: 1,
  },
  {
    id: "controller",
    label: "Controller",
    summary:
      "Shapes space with saves, movement denial, terrain, and conditions.",
    hpMult: 0.96,
    dprMult: 0.86,
    acMod: 0,
    attackMod: 0,
    dcMod: 1,
    budgetMod: 2,
    complexityMod: 2,
  },
  {
    id: "lurker",
    label: "Lurker",
    summary: "Ambush predator with stealth, burst, and readable counterplay.",
    hpMult: 0.86,
    dprMult: 1.15,
    acMod: 1,
    attackMod: 1,
    dcMod: 0,
    budgetMod: 1,
    complexityMod: 1,
  },
  {
    id: "artillery",
    label: "Artillery",
    summary:
      "Ranged or area pressure that must be protected by space or minions.",
    hpMult: 0.82,
    dprMult: 1.2,
    acMod: -1,
    attackMod: 1,
    dcMod: 1,
    budgetMod: 2,
    complexityMod: 1,
  },
  {
    id: "support",
    label: "Support",
    summary:
      "Makes other threats worse through buffs, healing, summons, or scene pressure.",
    hpMult: 0.9,
    dprMult: 0.72,
    acMod: 0,
    attackMod: 0,
    dcMod: 1,
    budgetMod: 1,
    complexityMod: 2,
  },
];

const MONSTER_TIERS = [
  {
    id: "normal",
    label: "Normal",
    summary: "Baseline monster for its CR.",
    hpMult: 1,
    dprMult: 1,
    acMod: 0,
    budgetOffset: 0,
    complexityCapOffset: 0,
    pressureMod: 0,
  },
  {
    id: "elite",
    label: "Elite",
    summary: "Stronger single threat without full legendary action economy.",
    hpMult: 1.32,
    dprMult: 1.12,
    acMod: 0,
    budgetOffset: 3,
    complexityCapOffset: 2,
    pressureMod: 2,
  },
  {
    id: "boss",
    label: "Boss",
    summary: "Setpiece creature with phases, reactions, or lair pressure.",
    hpMult: 1.75,
    dprMult: 1.22,
    acMod: 1,
    budgetOffset: 6,
    complexityCapOffset: 4,
    pressureMod: 4,
  },
  {
    id: "legendary",
    label: "Legendary",
    summary: "Solo-grade monster with alternative action economy.",
    hpMult: 1.95,
    dprMult: 1.35,
    acMod: 1,
    budgetOffset: 8,
    complexityCapOffset: 5,
    pressureMod: 6,
  },
  {
    id: "setpiece",
    label: "Setpiece",
    summary:
      "Encounter-defining horror object, ritual beast, or scene monster.",
    hpMult: 1.55,
    dprMult: 1.05,
    acMod: 0,
    budgetOffset: 7,
    complexityCapOffset: 6,
    pressureMod: 5,
  },
];

const TEMPO_PROFILES = [
  {
    id: "slow",
    label: "Slow",
    summary: "Predictable, heavy, and easier to kite.",
    initiativeMod: -2,
    dprMult: 0.9,
    attackMod: 0,
    budgetMod: -1,
    complexityMod: 0,
    pressureMod: -1,
  },
  {
    id: "standard",
    label: "Standard",
    summary: "Uses ordinary initiative and turn rhythm.",
    initiativeMod: 0,
    dprMult: 1,
    attackMod: 0,
    budgetMod: 0,
    complexityMod: 0,
    pressureMod: 0,
  },
  {
    id: "fast",
    label: "Fast",
    summary: "Acts early and can punish exposed characters.",
    initiativeMod: 2,
    dprMult: 1.06,
    attackMod: 0,
    budgetMod: 1,
    complexityMod: 1,
    pressureMod: 1,
  },
  {
    id: "ambusher",
    label: "Ambusher",
    summary: "Front-loaded pressure before the party fully stabilizes.",
    initiativeMod: 3,
    dprMult: 1.12,
    attackMod: 1,
    budgetMod: 2,
    complexityMod: 1,
    pressureMod: 2,
  },
  {
    id: "legendary",
    label: "Legendary",
    summary:
      "Boss tempo through initiative, reactions, lair pressure, or off-turn actions.",
    initiativeMod: 4,
    dprMult: 1.18,
    attackMod: 1,
    budgetMod: 3,
    complexityMod: 2,
    pressureMod: 3,
  },
];

const SOURCES = [
  {
    id: "decomposition",
    label: "Decomposition",
    tags: ["Body Horror", "Disease Horror"],
  },
  {
    id: "jikininki",
    label: "Jikininki",
    tags: ["Folk Horror", "Religious Horror"],
  },
  {
    id: "gashadokuro",
    label: "Gashadokuro",
    tags: ["Folk Horror", "Body Horror"],
  },
  {
    id: "wolf-spiders",
    label: "Wolf Spiders",
    tags: ["Body Horror", "Predatory Horror"],
  },
  {
    id: "wax-death-masks",
    label: "Wax Death Masks",
    tags: ["Gothic", "Psychological Horror"],
  },
];

const MONSTER_FAMILY_PRESETS = [
  {
    id: "bloated-corpse",
    label: "Bloated Corpse",
    family: "Bloated",
    source: "decomposition",
    typeId: "undead",
    category: "Zombie",
    roleId: "standard",
    targetCr: 5,
    tacticalRoleId: "brute",
    monsterTierId: "normal",
    tempoProfileId: "slow",
    dangerId: "hard",
    summary:
      "A readable decomposition brute with pressure, rupture risk, and radiant counterplay.",
    selection: {
      body: "fresh-bloat-hide",
      mind: "pressure-agony",
      movement: "stumbling-mass",
      attack: "empowered-slam",
      twist: "gas-buildup",
      weakness: "radiant-preservation-failure",
      death: "toxic-detonation",
    },
  },
  {
    id: "volatile-bloated",
    label: "Volatile Bloated",
    family: "Bloated",
    source: "decomposition",
    typeId: "undead",
    category: "Zombie",
    roleId: "boss",
    targetCr: 8,
    tacticalRoleId: "controller",
    monsterTierId: "setpiece",
    tempoProfileId: "slow",
    dangerId: "horror",
    summary:
      "An immobile pressure bomb built around toxic rupture, scene control, and telegraphed danger.",
    selection: {
      body: "volatile-immobile-mass",
      mind: "pressure-agony",
      movement: "stumbling-mass",
      attack: "acid-vomit",
      horror: "swollen-corpse",
      twist: "dangerously-unstable",
      weakness: "mechanical-stress",
      death: "purge-fluid-flood",
      lair: "corpse-pressure-room",
    },
  },
  {
    id: "ravenous-spirit",
    label: "Ravenous Spirit",
    family: "Jikininki",
    source: "jikininki",
    typeId: "undead",
    category: "Wraith",
    roleId: "standard",
    targetCr: 6,
    tacticalRoleId: "lurker",
    monsterTierId: "normal",
    tempoProfileId: "ambusher",
    dangerId: "hard",
    summary:
      "A corpse-feeding spirit with shame, incorporeal movement, bite pressure, and ritual counterplay.",
    selection: {
      body: "ethereal-sight",
      mind: "corpse-craving",
      movement: "incorporeal-movement",
      attack: "grave-bite",
      horror: "horrific-apparition",
      twist: "flesh-harvest",
      weakness: "salt-and-names",
      death: "spectral-dust-death",
    },
  },
  {
    id: "diseased-ravenous-spirit",
    label: "Diseased Ravenous Spirit",
    family: "Jikininki",
    source: "jikininki",
    typeId: "undead",
    category: "Wraith",
    roleId: "boss",
    targetCr: 9,
    tacticalRoleId: "controller",
    monsterTierId: "boss",
    tempoProfileId: "fast",
    dangerId: "horror",
    summary:
      "A higher-pressure Jikininki variant focused on infection, corpse anchors, and delayed harm.",
    selection: {
      body: "ethereal-sight",
      mind: "shame-hunger",
      movement: "vanish-spirit",
      attack: "purulent-bite",
      horror: "horrific-apparition",
      twist: "no-witnesses-rage",
      weakness: "dangerous-hunger",
      death: "last-meal-memory",
      lair: "funeral-silence-lair",
    },
  },
  {
    id: "broodmother",
    label: "Broodmother",
    family: "Wolf Spiders",
    source: "wolf-spiders",
    typeId: "beast",
    category: "Spider",
    roleId: "boss",
    targetCr: 7,
    tacticalRoleId: "controller",
    monsterTierId: "boss",
    tempoProfileId: "fast",
    dangerId: "hard",
    summary:
      "A web-and-egg setpiece using visible brood pressure, restrained targets, and fire counterplay.",
    selection: {
      body: "egg-carrier",
      mind: "maternal-swarm-instinct",
      movement: "web-dancer",
      attack: "web-recharge",
      horror: "hundred-eyed",
      twist: "enrage-broodmother",
      weakness: "fear-of-fire",
      death: "egg-hatch-death",
      lair: "broodmother-web-lair",
    },
  },
  {
    id: "umbral-hunter-spider",
    label: "Umbral Hunter Spider",
    family: "Wolf Spiders",
    source: "wolf-spiders",
    typeId: "beast",
    category: "Spider",
    roleId: "standard",
    targetCr: 5,
    tacticalRoleId: "lurker",
    monsterTierId: "normal",
    tempoProfileId: "ambusher",
    dangerId: "hard",
    summary:
      "A stealth predator built around darkness, sudden movement, venom, and light-based counterplay.",
    selection: {
      body: "umbral-skin",
      mind: "hunter-spider",
      movement: "shadow-jump",
      attack: "venomous-bite",
      twist: "web-architect",
      weakness: "underbelly-weak-spot",
      death: "silk-cocoon-remains",
      lair: "dense-web-region",
    },
  },
  {
    id: "many-boned-horror",
    label: "Many-Boned Horror",
    family: "Gashadokuro",
    source: "gashadokuro",
    typeId: "undead",
    category: "Skeleton",
    roleId: "boss",
    targetCr: 8,
    tacticalRoleId: "brute",
    monsterTierId: "elite",
    tempoProfileId: "standard",
    dangerId: "hard",
    summary:
      "A skeletal pressure monster focused on reassembly, dragging movement, and ossuary scene control.",
    selection: {
      body: "bone-collective",
      movement: "bone-drag-step",
      attack: "bone-splinter-cone",
      twist: "bone-reassembly",
      death: "bone-rattle-warning",
      lair: "ossuary-counts-you",
    },
  },
  {
    id: "wax-faced-stalker",
    label: "Wax-Faced Stalker",
    family: "Wax Death Masks",
    source: "wax-death-masks",
    typeId: "undead",
    category: "Wraith",
    roleId: "standard",
    targetCr: 6,
    tacticalRoleId: "lurker",
    monsterTierId: "normal",
    tempoProfileId: "fast",
    dangerId: "hard",
    summary:
      "A gothic stalker with a readable mask weakness, unwatched movement, and identity horror.",
    selection: {
      body: "waxen-mask-body",
      mind: "borrowed-face",
      movement: "shadow-stillness",
      twist: "mask-phase",
      weakness: "fire-softens-it",
      death: "face-curse",
    },
  },
];

const SLOTS = [
  {
    id: "body",
    label: "Body",
    icon: Activity,
    hint: "What the creature physically is.",
  },
  { id: "mind", label: "Mind", icon: Eye, hint: "What drives its behavior." },
  {
    id: "movement",
    label: "Movement",
    icon: Gauge,
    hint: "How it reaches the characters.",
  },
  {
    id: "attack",
    label: "Attack Pattern",
    icon: Sword,
    hint: "Its main offensive loop.",
  },
  {
    id: "horror",
    label: "Horror Feature",
    icon: Flame,
    hint: "The memorable disturbing element.",
  },
  {
    id: "twist",
    label: "Combat Twist",
    icon: Wand2,
    hint: "The rule that changes the fight.",
  },
  {
    id: "weakness",
    label: "Weakness / Tell",
    icon: Shield,
    hint: "Counterplay and readability.",
  },
  {
    id: "death",
    label: "Death Effect",
    icon: Skull,
    hint: "What happens when it dies.",
  },
  {
    id: "lair",
    label: "Lair / Scene Effect",
    icon: BookOpen,
    hint: "Optional pressure from the environment.",
  },
];

const DEFAULT_SLOT_CAPS = Object.fromEntries(SLOTS.map((slot) => [slot.id, 1]));

const BASE_SILHOUETTE_ANCHORS = {
  mind: { x: 0.44, y: 0.16 },
  horror: { x: 0.44, y: 0.34 },
  weakness: { x: 0.44, y: 0.52 },
  death: { x: 0.44, y: 0.74 },
  body: { x: 0.56, y: 0.24 },
  attack: { x: 0.56, y: 0.42 },
  movement: { x: 0.56, y: 0.6 },
  twist: { x: 0.56, y: 0.78 },
  lair: { x: 0.5, y: 0.92 },
};

const SILHOUETTE_SLOT_CARDS = {
  mind: { x: 0.16, y: 0.24, side: "left" },
  horror: { x: 0.16, y: 0.41, side: "left" },
  weakness: { x: 0.16, y: 0.58, side: "left" },
  death: { x: 0.16, y: 0.75, side: "left" },
  body: { x: 0.84, y: 0.24, side: "right" },
  attack: { x: 0.84, y: 0.41, side: "right" },
  movement: { x: 0.84, y: 0.58, side: "right" },
  twist: { x: 0.84, y: 0.75, side: "right" },
  lair: { x: 0.5, y: 0.92, side: "bottom" },
};

const ANATOMY_LEFT_SLOT_IDS = ["mind", "horror", "weakness", "death"];
const ANATOMY_RIGHT_SLOT_IDS = ["body", "attack", "movement", "twist"];
const ANATOMY_BOTTOM_SLOT_IDS = ["lair"];

const MONSTER_SILHOUETTES = {
  undead: {
    label: "Zombie Silhouette",
    viewBox: "0 0 392.95 841.89",
    anchors: {
      ...BASE_SILHOUETTE_ANCHORS,
      mind: { x: 0.43, y: 0.15 },
      horror: { x: 0.43, y: 0.33 },
      weakness: { x: 0.43, y: 0.51 },
      death: { x: 0.43, y: 0.73 },
      body: { x: 0.57, y: 0.24 },
      attack: { x: 0.57, y: 0.42 },
      movement: { x: 0.57, y: 0.6 },
      twist: { x: 0.57, y: 0.78 },
      lair: { x: 0.5, y: 0.92 },
    },
    layers: [
      {
        id: "body",
        d: `M187.3,0.7L174.7,6.7L163.3,21.3L160.7,27.3L162.3,50.0L159.3,49.3L156.0,52.7L157.0,64.7L163.0,75.7L165.3,99.7L167.3,99.7L168.3,80.3L169.3,91.3L173.3,97.0L174.3,105.0L170.0,120.3L157.3,132.3L147.0,138.0L130.7,143.7L114.0,145.3L104.3,152.7L93.3,178.7L94.7,205.0L83.0,230.3L81.7,242.0L85.3,240.0L87.0,234.3L90.7,231.0L84.0,253.7L82.7,254.7L81.7,251.7L79.3,252.7L75.0,267.0L55.7,293.0L48.0,320.0L51.3,315.3L52.3,317.7L46.7,329.7L40.7,335.3L39.3,345.3L32.3,363.0L21.3,381.0L20.7,393.3L12.3,415.3L5.0,427.7L5.7,435.0L0.0,450.0L5.3,473.3L16.3,486.0L20.7,488.3L22.0,487.0L18.3,482.3L17.3,474.3L12.0,466.7L10.7,453.3L16.3,462.0L18.7,470.0L31.0,478.7L36.0,480.0L36.3,477.3L32.7,474.7L27.7,465.0L35.3,465.0L35.7,463.3L29.3,457.3L25.0,456.0L22.7,452.0L24.3,438.3L31.7,425.3L39.7,421.7L44.0,424.3L47.3,432.3L46.3,444.0L50.3,449.0L50.0,453.0L53.3,452.0L57.3,432.7L54.7,426.3L54.0,415.3L49.7,410.0L43.3,394.0L46.7,376.3L51.3,366.7L60.0,374.0L62.0,374.0L65.3,369.0L65.7,373.3L68.0,372.3L74.0,333.7L81.7,322.3L83.7,329.0L82.0,334.3L83.7,343.0L94.7,304.7L97.0,277.0L105.7,255.7L108.0,292.0L110.0,291.0L112.3,248.3L113.7,243.3L114.0,261.0L115.7,263.7L118.3,236.0L123.7,217.3L127.3,229.3L130.0,229.3L129.7,223.0L133.3,228.0L133.0,237.0L137.0,244.7L137.0,253.3L142.3,259.3L146.3,290.7L149.3,289.0L150.3,303.0L143.7,322.0L133.7,325.7L132.0,341.3L126.3,350.7L129.0,358.3L128.0,369.3L118.3,399.0L118.7,425.0L112.3,493.0L109.7,504.3L104.0,513.3L104.3,518.3L106.7,518.0L109.3,529.7L113.3,521.0L117.7,517.3L118.0,533.3L109.0,577.0L95.7,610.7L90.7,638.0L86.7,679.0L88.7,679.3L92.3,664.7L94.0,672.0L94.3,709.0L92.0,746.3L86.0,766.3L86.7,778.3L77.7,795.7L62.7,812.7L55.3,815.7L49.0,829.7L53.0,835.7L56.7,832.7L58.3,839.0L65.0,834.0L65.0,838.7L67.7,840.0L70.3,836.7L76.0,834.7L78.3,827.7L84.3,825.3L79.3,832.0L79.3,838.7L81.0,840.7L83.3,838.7L91.0,838.7L103.7,826.7L104.7,815.7L115.0,812.3L119.7,806.7L120.3,800.0L116.7,780.0L120.3,767.7L115.3,752.7L116.0,727.0L124.0,684.3L127.0,684.0L126.0,677.7L128.7,672.0L131.0,681.0L130.0,704.3L131.7,707.0L134.3,697.0L136.3,667.3L142.3,650.0L142.3,591.7L155.3,561.7L155.0,542.7L157.7,530.7L160.7,527.0L160.7,516.3L161.3,520.7L163.0,521.0L165.0,516.7L168.3,519.0L171.0,514.7L173.3,543.3L181.3,479.0L183.3,472.0L186.3,470.0L192.7,439.0L195.3,434.7L197.7,434.3L211.3,471.3L215.0,490.0L214.0,501.7L218.3,514.7L220.3,514.0L219.3,503.7L222.0,506.3L224.0,504.0L222.0,497.3L227.0,484.3L233.0,502.0L236.7,505.7L234.7,515.0L232.3,511.0L230.0,514.7L235.0,536.7L233.3,563.7L235.0,565.7L236.3,562.0L238.7,567.0L239.3,573.3L236.7,581.7L244.7,588.3L250.0,606.0L250.7,653.3L256.3,665.3L259.3,683.0L261.3,683.0L262.3,669.7L267.7,681.3L272.0,700.7L273.0,724.7L275.0,725.0L275.0,722.3L277.0,752.0L272.0,767.7L275.7,785.3L271.7,800.7L272.0,806.7L276.7,812.0L284.7,814.7L284.3,825.7L293.0,837.7L302.3,838.7L305.3,841.3L308.0,833.0L305.0,826.3L310.3,829.7L312.7,836.3L316.7,837.0L319.3,840.3L321.7,839.7L322.3,835.3L329.3,839.7L330.7,833.7L334.3,836.7L336.3,835.7L335.7,831.3L339.0,830.7L338.7,827.0L334.0,817.7L326.3,813.3L312.0,793.7L305.0,778.7L306.3,766.7L300.3,748.0L298.7,722.3L301.0,707.7L298.0,697.7L298.7,669.3L301.3,670.0L304.7,679.7L306.3,668.0L308.3,669.0L309.3,667.3L301.3,646.7L299.0,621.7L300.3,619.0L303.0,619.3L302.0,610.7L290.3,595.7L292.0,585.0L282.0,571.0L274.3,533.0L275.3,521.3L279.0,535.3L281.0,531.7L277.0,491.0L281.0,491.3L284.3,501.0L284.7,490.7L289.0,489.7L288.7,484.3L279.7,465.0L277.7,442.7L273.7,438.7L272.3,447.0L270.3,440.3L272.0,432.3L268.3,426.3L268.0,414.0L271.7,419.7L276.0,422.0L281.3,439.7L279.7,416.0L270.7,392.3L269.0,383.3L270.0,373.3L263.7,363.3L260.3,350.3L257.3,347.3L262.0,337.3L257.3,331.7L257.0,321.7L247.3,318.3L242.0,302.7L241.7,291.0L245.0,272.0L249.0,266.7L249.3,258.7L254.0,252.7L254.3,245.0L258.7,236.3L258.3,229.0L262.7,221.0L261.3,210.3L257.0,210.7L265.3,200.0L272.3,227.0L286.3,253.3L295.0,275.3L294.7,285.3L301.7,318.3L304.7,347.0L307.0,327.0L310.3,333.7L314.7,337.0L318.7,367.3L320.3,367.0L319.3,354.0L323.3,338.3L338.3,360.3L345.0,374.7L349.3,392.7L344.0,407.3L337.3,416.7L338.3,425.7L335.3,432.7L340.0,453.0L343.0,453.3L342.7,449.0L346.7,443.7L345.3,430.7L348.3,425.0L353.7,422.3L361.3,424.7L369.0,440.3L370.0,451.7L357.0,464.0L367.0,464.3L362.0,468.7L356.3,478.0L357.0,480.0L363.3,477.7L374.3,468.7L381.0,451.7L382.0,453.3L380.3,466.7L374.3,475.3L374.3,481.7L371.0,486.7L372.3,488.0L376.3,486.3L387.3,473.7L392.3,450.3L388.0,439.7L386.0,425.3L372.0,393.7L371.7,381.7L359.7,361.7L349.7,332.7L346.0,330.7L346.0,339.3L340.3,329.0L341.7,320.0L337.3,316.3L337.0,304.3L340.3,308.3L342.3,303.0L338.0,298.3L334.0,288.3L317.7,268.3L311.7,250.3L310.0,236.0L303.7,229.3L303.0,226.7L306.0,228.0L297.3,205.0L298.3,177.7L288.7,153.3L279.7,146.0L261.7,143.7L241.0,134.0L236.0,134.0L237.3,136.7L232.7,141.0L229.0,136.0L225.3,136.3L223.0,133.7L226.7,134.3L229.3,126.7L223.7,121.7L219.0,113.3L217.7,99.3L221.7,92.0L223.3,104.0L225.7,104.3L225.7,80.7L234.3,65.7L235.3,54.3L234.3,50.0L229.7,50.3L231.0,43.7L228.7,41.7L226.3,42.7L224.0,28.7L228.0,32.0L228.3,37.7L234.3,46.3L234.3,34.3L228.0,17.3L222.3,10.7L209.0,2.3L198.7,0.0Z`,
      },
    ],
  },
  beast: {
    label: "Beast Silhouette",
    viewBox: "0 0 300 420",
    anchors: {
      ...BASE_SILHOUETTE_ANCHORS,
      mind: { x: 0.57, y: 0.26 },
      body: { x: 0.48, y: 0.51 },
      movement: { x: 0.5, y: 0.76 },
      attack: { x: 0.72, y: 0.34 },
      weakness: { x: 0.45, y: 0.58 },
      death: { x: 0.5, y: 0.9 },
    },
    layers: [
      {
        id: "aura",
        d: "M50 214 C66 131 126 91 196 111 C258 128 270 210 225 284 C181 357 74 330 50 214 Z",
      },
      {
        id: "body",
        d: "M68 205 C82 150 128 125 182 137 C226 147 244 186 231 229 C218 272 181 300 136 292 C91 284 56 252 68 205 Z",
      },
      {
        id: "head",
        d: "M175 123 C205 98 245 115 248 151 C250 179 230 199 202 197 C175 196 154 179 155 153 C155 141 162 131 175 123 Z",
      },
      {
        id: "legs",
        d: "M95 266 L69 337 L96 344 L121 276 Z M139 283 L128 357 L156 357 L166 283 Z M180 268 L207 337 L232 328 L202 258 Z",
      },
      {
        id: "tail",
        d: "M76 194 C41 183 27 151 39 122 C59 150 73 158 102 161 Z",
      },
    ],
  },
  aberration: {
    label: "Aberration Silhouette",
    viewBox: "0 0 300 420",
    anchors: {
      ...BASE_SILHOUETTE_ANCHORS,
      mind: { x: 0.5, y: 0.22 },
      body: { x: 0.5, y: 0.5 },
      movement: { x: 0.5, y: 0.78 },
      attack: { x: 0.74, y: 0.5 },
      horror: { x: 0.5, y: 0.36 },
      weakness: { x: 0.36, y: 0.52 },
      death: { x: 0.5, y: 0.92 },
    },
    layers: [
      {
        id: "aura",
        d: "M151 38 C205 44 243 92 237 151 C283 186 262 258 215 270 C207 337 154 389 102 358 C54 330 55 260 87 229 C44 194 55 123 103 112 C107 70 124 45 151 38 Z",
      },
      {
        id: "body",
        d: "M148 101 C189 95 220 130 216 176 C253 204 232 260 188 257 C173 304 118 311 97 269 C61 263 46 213 77 187 C68 143 102 104 148 101 Z",
      },
      {
        id: "eye",
        d: "M150 136 C181 136 203 154 214 179 C200 206 180 221 150 221 C120 221 100 206 86 179 C97 154 119 136 150 136 Z M150 157 C137 157 127 167 127 180 C127 193 137 203 150 203 C163 203 173 193 173 180 C173 167 163 157 150 157 Z",
      },
      {
        id: "tendrils",
        d: "M96 247 C50 277 39 316 61 355 C70 322 89 300 125 282 Z M188 248 C239 279 249 319 225 358 C216 323 197 300 163 282 Z M135 275 C119 321 123 358 153 389 C149 350 157 319 174 282 Z",
      },
    ],
  },
};

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

const FEATURES = [
  // Decomposition / Bloated
  {
    id: "swollen-corpse",
    title: "Swollen Corpse Vessel",
    slot: "body",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { hp: 12, dpr: 2 },
    summary:
      "The body is stretched tight with grave gas, purge fluid, and unstable pressure.",
    mechanics:
      "When the creature is first bloodied, each creature within 5 feet makes a Constitution save. On a failure, the target has the Poisoned condition until the end of its next turn.",
    counterplay:
      "The skin shines, creaks, and bulges before the pressure releases.",
  },
  {
    id: "fresh-bloat-hide",
    title: "Fresh Bloat Hide",
    slot: "body",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 1,
    stats: { ac: 2, hp: 18 },
    summary:
      "The cadaver has only recently entered the bloating stage and still moves with heavy resilience.",
    tags: ["bloated_body", "defensive_body"],
    mechanics:
      "The creature gains a +2 bonus to AC while it has more than half its hit points. When bloodied, reduce its AC by 2 and increase its walking speed by 10 feet.",
    counterplay: "The tight outer layer tears away as the corpse takes damage.",
  },
  {
    id: "volatile-immobile-mass",
    title: "Volatile Immobile Mass",
    slot: "body",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 5,
    complexity: 2,
    stats: { hp: 28, ac: -1, control: 1 },
    summary:
      "The corpse is too swollen to walk and functions like a living explosive hazard.",
    mechanics:
      "The creature's speed becomes 0. It gains reach 10 ft. with body, bite, or grab attacks. Effects that push, pull, or drag it move it only half the normal distance.",
    counterplay:
      "Players can reposition around it, attack from range, or use forced movement to aim the eventual rupture.",
  },
  {
    id: "skin-slippage",
    title: "Skin Slippage",
    slot: "body",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1, control: 1 },
    summary:
      "Outer layers detach in wet sheets when the corpse is grabbed or struck.",
    mechanics:
      "The creature has advantage on checks and saves made to escape a grapple. A creature that grapples it must succeed on a Constitution save or have disadvantage on the next attack roll it makes before the end of its turn.",
    counterplay:
      "Characters see the loose skin sliding before they commit to a grapple.",
  },
  {
    id: "mindless-command",
    title: "Mindless Command Loop",
    slot: "mind",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 1,
    complexity: 1,
    stats: { fairness: 1 },
    summary: "It follows a single order and lacks tactical awareness.",
    mechanics:
      "At the start of combat, define one simple command. The creature prioritizes that command even when doing so is tactically poor. If no command applies, it attacks the nearest living creature.",
    counterplay:
      "Players can exploit the command by luring or blocking the creature.",
  },
  {
    id: "pressure-agony",
    title: "Pressure Agony",
    slot: "mind",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { dpr: 2, mobility: 1 },
    summary:
      "The corpse is driven forward by swelling pain rather than hunger or thought.",
    mechanics:
      "When the creature starts its turn bloodied, it can move up to 10 feet toward the nearest enemy without provoking opportunity attacks, then it must attack that enemy if able.",
    counterplay: "It becomes easier to predict once damaged.",
  },
  {
    id: "stumbling-mass",
    title: "Stumbling Mass",
    slot: "movement",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 1,
    complexity: 1,
    stats: { fairness: 1 },
    summary:
      "The corpse moves directly and poorly, ignoring obstacles and danger.",
    mechanics:
      "The creature ignores nonmagical difficult terrain created by rubble, corpses, or mud, but it has disadvantage on Dexterity saving throws.",
    counterplay: "Its path is obvious and can be shaped with hazards.",
  },
  {
    id: "rupture-charge",
    title: "Rupture Charge",
    slot: "movement",
    section: "bonusAction",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { mobility: 2, dpr: 2 },
    summary: "It rushes forward with enough force to split itself open.",
    mechanics:
      "The creature moves up to half its speed in a straight line toward a creature it can see. Its next Slam before the end of the turn deals extra bludgeoning damage equal to its proficiency bonus. After moving this way, roll a d6; on a 6, trigger one selected Unstable reaction without spending the reaction.",
    counterplay:
      "The charge requires a straight path and is obvious before it begins.",
  },
  {
    id: "collapsed-crawler",
    title: "Collapsed Crawler",
    slot: "movement",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard"],
    cost: 2,
    complexity: 1,
    stats: { hp: 4, fairness: 1 },
    summary:
      "A damaged bloated corpse continues dragging itself forward after losing a limb.",
    mechanics:
      "The creature is immune to the Prone condition while its speed is 10 feet or lower. If an effect would knock it prone, reduce its speed by 5 feet until the end of combat instead.",
    counterplay:
      "Players can slow it by targeting legs, but cannot simply disable it with prone loops.",
  },
  {
    id: "slam-decomposition",
    title: "Heavy Slam",
    slot: "attack",
    section: "action",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { dpr: 4 },
    summary: "A simple blunt attack from a swollen corpse.",
    mechanics:
      "Melee Attack Roll. On hit, the target takes bludgeoning damage. If the creature moved at least 10 feet straight toward the target this turn, add one extra damage die.",
    counterplay: "Denying charge lanes keeps the attack ordinary.",
  },
  {
    id: "empowered-slam",
    title: "Empowered Slam",
    slot: "attack",
    section: "action",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 1,
    stats: { dpr: 7 },
    summary: "The corpse hits with enough mass to stagger a front line.",
    mechanics:
      "Melee Attack Roll. On hit, the target takes bludgeoning damage and must succeed on a Strength save or be pushed 5 feet. If the target collides with a creature or object, both take bludgeoning damage equal to the proficiency bonus.",
    counterplay:
      "The attack is strongest near walls, allies, and cluttered terrain.",
  },
  {
    id: "acid-vomit",
    title: "Acid Vomit",
    slot: "attack",
    section: "action",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 6,
    complexity: 3,
    stats: { dpr: 7, control: 2 },
    summary:
      "It emits purge fluid in a pressurized cone that keeps burning after impact.",
    mechanics:
      "Recharge 5-6. Creatures in a 30-foot cone make a Dexterity save. On a failure, a target takes acid damage and is covered in purge fluid. While covered, the target cannot regain hit points and takes acid damage at the start of each of its turns. A creature can use an action to clean the fluid with a suitable approach.",
    counterplay:
      "The throat distends and leaks dark fluid before the recharge attack.",
  },
  {
    id: "corpse-grab",
    title: "Corpse Grab",
    slot: "attack",
    section: "action",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { control: 2, dpr: 1 },
    summary: "The corpse pins a victim against its swollen body.",
    mechanics:
      "One Large or smaller creature within reach makes a Dexterity save. On a failure, the target has the Grappled condition and is Restrained while the grapple lasts. The target can escape with an Athletics or Acrobatics check against the monster DC.",
    counterplay: "The creature can usually hold only one target this way.",
  },
  {
    id: "gas-buildup",
    title: "Gas Buildup",
    slot: "twist",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { dpr: 2, control: 1 },
    summary: "Dropping the corpse can trigger the thing everyone feared.",
    mechanics:
      "When the creature drops to 0 hit points, roll a d6. On a 4 or higher, trigger one selected Unstable reaction before the creature dies.",
    counterplay:
      "Radiant damage, careful positioning, or distance can reduce the danger of the final hit.",
  },
  {
    id: "unstable-rupture",
    title: "Unstable Rupture",
    slot: "twist",
    section: "reaction",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { dpr: 3, control: 1 },
    summary: "Piercing or slashing damage can make the battlefield worse.",
    mechanics:
      "Trigger: the creature takes piercing or slashing damage. Response: roll a d6. On a 6, the creature explodes or releases a toxic burst. Each creature within 10 feet makes a Dexterity save, taking poison damage on a failure or half as much on a success.",
    counterplay:
      "Bludgeoning, cold, radiant, and many spell attacks avoid the trigger.",
  },
  {
    id: "dangerously-unstable",
    title: "Dangerously Unstable",
    slot: "twist",
    section: "reaction",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["boss"],
    cost: 8,
    complexity: 3,
    stats: { dpr: 8, control: 3 },
    summary: "The creature is an encounter-scale bomb waiting for a puncture.",
    mechanics:
      "Trigger: the creature takes piercing or slashing damage. Response: roll a d6. On a 2 or higher, it detonates and destroys itself. Creatures in a 40-foot sphere make a Dexterity save, taking heavy poison damage and falling Prone on a failure, or taking half damage on a success. Creatures out to 80 feet take minor thunder damage and may be Deafened for 1 minute.",
    counterplay:
      "Its immobility, swelling, and audible pressure make the blast radius readable before combat.",
  },
  {
    id: "undead-fortitude",
    title: "Undead Fortitude",
    slot: "twist",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { hp: 10 },
    summary: "The corpse refuses to stop unless destroyed correctly.",
    mechanics:
      "If damage reduces the creature to 0 hit points, it makes a Constitution save with a DC equal to 5 plus the damage taken, unless the damage is radiant, from a critical hit, or caused it to explode. On a success, it drops to 1 hit point instead.",
    counterplay: "Radiant damage and critical hits bypass the feature.",
  },
  {
    id: "siege-corpse",
    title: "Siege Corpse",
    slot: "twist",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { dpr: 1 },
    summary:
      "The bloated mass crushes doors, barricades, and structures by accident.",
    mechanics: "The creature deals double damage to objects and structures.",
    counterplay:
      "Barricades buy time but should not be trusted as permanent safety.",
  },
  {
    id: "head-weak-spot",
    title: "Head Weak Spot",
    slot: "weakness",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: -2,
    complexity: 1,
    stats: { fairness: 2 },
    summary: "The head remains the most reliable way to end the corpse.",
    mechanics:
      "A character can target the head with a called shot. The attack takes a -5 penalty. On a hit, the attack becomes a critical hit.",
    counterplay:
      "This gives precision-focused players a clear high-risk answer.",
  },
  {
    id: "mechanical-stress",
    title: "Mechanical Stress",
    slot: "weakness",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: -2,
    complexity: 2,
    stats: { fairness: 2 },
    summary:
      "Massive hits tear off parts without always detonating the whole corpse.",
    mechanics:
      "When the creature takes more than half its maximum hit points in one hit, the attacker chooses head, arms, or leg. Head: the creature is Blinded but dies in 2 rounds without triggering Gas Buildup. Arms: it has disadvantage on attacks requiring arms. Leg: it falls prone and its speed becomes 5 feet.",
    counterplay: "Big single hits can solve the encounter in a controlled way.",
  },
  {
    id: "radiant-preservation-failure",
    title: "Radiant Preservation Failure",
    slot: "weakness",
    section: "trait",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: -1,
    complexity: 1,
    stats: { fairness: 1 },
    summary:
      "Holy light collapses the necromancy before the gases can weaponize the corpse.",
    mechanics:
      "When the creature takes radiant damage, it cannot use Unstable reactions until the start of its next turn.",
    counterplay:
      "Radiant damage becomes a safety tool, not just a damage type.",
  },
  {
    id: "corpse-bloom-death",
    title: "Corpse Bloom Death",
    slot: "death",
    section: "death",
    source: "decomposition",
    typeBias: ["undead", "aberration", "beast"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { dpr: 2, control: 1 },
    summary:
      "When it dies, the body becomes terrain and clue at the same time.",
    mechanics:
      "On death, the corpse creates a 10-foot patch of slick rot. The area is difficult terrain. A character who examines it can find one clue tied to the Source Anchor.",
    counterplay: "Players can drag or burn the body before the bloom spreads.",
  },
  {
    id: "toxic-detonation",
    title: "Toxic Detonation",
    slot: "death",
    section: "death",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 5,
    complexity: 2,
    stats: { dpr: 5, control: 1 },
    summary: "The corpse finally ruptures when destroyed.",
    mechanics:
      "On death, each creature within 10 feet makes a Dexterity save. On a failure, the target takes poison damage and has the Poisoned condition until the end of its next turn. On a success, the target takes half damage only.",
    counterplay:
      "The safest play is to finish it from range or with radiant damage.",
  },
  {
    id: "purge-fluid-flood",
    title: "Purge Fluid Flood",
    slot: "death",
    section: "death",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { control: 2 },
    summary:
      "Dark fluid spills from the body and turns the floor into a disgusting hazard.",
    mechanics:
      "On death, a 15-foot area becomes slick and foul until cleaned or burned away. It is difficult terrain. A creature that enters it for the first time on a turn or starts there makes a Dexterity save or falls Prone.",
    counterplay:
      "Fire, sand, holy water, or clever cleaning can neutralize the area.",
  },
  {
    id: "choking-air",
    title: "Choking Air",
    slot: "lair",
    section: "lairAction",
    source: "decomposition",
    typeBias: ["undead", "aberration"],
    roleBias: ["boss"],
    cost: 5,
    complexity: 3,
    stats: { control: 2 },
    summary: "The room itself becomes a failing lung.",
    mechanics:
      "At initiative count 20, choose one 10-foot area. Until the next count 20, the area is lightly obscured, and creatures that start there make a Constitution save or cannot take reactions until their next turn.",
    counterplay:
      "The air visibly thickens before the initiative count resolves.",
  },
  {
    id: "corpse-pressure-room",
    title: "Corpse Pressure Room",
    slot: "lair",
    section: "lairAction",
    source: "decomposition",
    typeBias: ["undead"],
    roleBias: ["boss"],
    cost: 6,
    complexity: 3,
    stats: { control: 2, dpr: 2 },
    summary:
      "Nearby corpses swell and begin acting as secondary pressure hazards.",
    mechanics:
      "At initiative count 20, one corpse or body part in the lair swells. Until the next count 20, the first creature that moves within 5 feet of it triggers a small toxic burst requiring a Constitution save.",
    counterplay:
      "Players can identify swelling corpses and avoid, move, or destroy them safely.",
  },

  // Jikininki / Ravenous Spirit
  {
    id: "shame-hunger",
    title: "Shame-Hunger",
    slot: "mind",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { dpr: 2, control: 1 },
    summary:
      "It feeds because it remembers being judged, buried, and left wanting.",
    mechanics:
      "It prioritizes creatures carrying holy symbols, funerary items, or fresh wounds. Once per fight, after it damages such a target, it regains hit points equal to the target's proficiency bonus + level tier.",
    counterplay:
      "It can be baited with funerary offerings or distracted by rites for the dead.",
  },
  {
    id: "corpse-craving",
    title: "Corpse Craving",
    slot: "mind",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1, dpr: 1 },
    summary: "Its hunger is specific, shameful, and easy to lure.",
    mechanics:
      "If the creature can see an unattended corpse, it must succeed on a Wisdom save at the start of its turn or move toward the corpse and feed. While feeding, its attacks against creatures have disadvantage.",
    counterplay:
      "A prepared corpse, contaminated meal, or funerary decoy can redirect the monster.",
  },
  {
    id: "nocturnal-haunting",
    title: "Nocturnal Haunting",
    slot: "mind",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1, mobility: 1 },
    summary: "It hides its sacrilege from daylight and witnesses.",
    mechanics:
      "During the day, the creature retreats to the Ethereal Plane or a hidden refuge if able. During the night, it gains advantage on Dexterity (Stealth) checks made near graveyards, temples, alleys, or corpse sites.",
    counterplay:
      "Daylight investigations and forced exposure weaken the encounter before combat begins.",
  },
  {
    id: "ethereal-sight",
    title: "Ethereal Sight",
    slot: "body",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { control: 1 },
    summary:
      "The spirit sees both the living world and the thin place beside it.",
    mechanics:
      "The creature can see 60 feet into the Ethereal Plane while it is on the Material Plane, and it has advantage on checks made to locate invisible or ethereal undead.",
    counterplay:
      "It is still limited by walls, line of sight, and mundane concealment on its current plane.",
  },
  {
    id: "incorporeal-movement",
    title: "Incorporeal Movement",
    slot: "movement",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { mobility: 2, control: 1 },
    summary: "It passes through creatures and objects like a hungry draft.",
    mechanics:
      "The creature can move through other creatures and objects as if they were difficult terrain. It takes force damage if it ends its turn inside an object.",
    counterplay:
      "Readied actions, force effects, and keeping it out of walls punish careless movement.",
  },
  {
    id: "grave-bite",
    title: "Grave Bite",
    slot: "attack",
    section: "action",
    source: "jikininki",
    typeBias: ["undead", "beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { dpr: 4 },
    summary: "Its bite is a feeding rite, not only an attack.",
    mechanics:
      "Melee Attack Roll. On hit, the target takes piercing damage plus necrotic damage. If the target is below half hit points, the monster gains temporary hit points equal to the necrotic damage dealt.",
    counterplay:
      "It becomes predictable around wounded characters and corpses.",
  },
  {
    id: "infected-bite",
    title: "Infected Bite",
    slot: "attack",
    section: "action",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { dpr: 5, control: 1 },
    summary:
      "The spirit's bite leaves a spiritual infection that worsens after rest.",
    mechanics:
      "Melee Attack Roll. On hit, the target takes poison or necrotic damage. If the target is not undead, it makes a Constitution save. On a failure, it gains 1 level of Exhaustion at the end of its next Long Rest, to a maximum of 3 levels from this feature.",
    counterplay:
      "Magic that cures disease, consecrated rest, or removing the curse before the next Long Rest stops the delayed harm.",
  },
  {
    id: "purulent-bite",
    title: "Purulent Bite",
    slot: "attack",
    section: "action",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 6,
    complexity: 3,
    stats: { dpr: 6, control: 2 },
    summary:
      "The bite carries a disease that clings to exhaustion and refuses easy recovery.",
    mechanics:
      "Melee Attack Roll. On hit, a non-undead target makes a Constitution save. On a failure, it gains 2 Exhaustion levels at the end of its next Long Rest, to a maximum of 4 levels from this feature. If it fails by 5 or more, the target also contracts a disease for 1d4 weeks that prevents Exhaustion levels from this feature from being removed by ordinary Long Rests.",
    counterplay:
      "The delayed effect gives time for investigation, cleansing, or magical treatment.",
  },
  {
    id: "horrific-apparition",
    title: "Horrific Apparition",
    slot: "horror",
    section: "action",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 3,
    stats: { control: 3, dpr: 2 },
    summary:
      "The spirit reveals the obscene contradiction of ghostly flesh and grave hunger.",
    mechanics:
      "Wisdom Saving Throw, each non-undead creature in a 60-foot cone that can see the spirit. Failure: psychic damage and the Frightened condition until the start of the spirit's next turn. If the target fails by 5 or more, it also suffers a supernatural aging or wasting mark that can be reversed by powerful restoration magic within 24 hours.",
    counterplay:
      "A creature that succeeds is immune to this spirit's apparition for 24 hours.",
  },
  {
    id: "corpse-tendrils",
    title: "Corpse Tendrils",
    slot: "attack",
    section: "action",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["boss", "standard"],
    cost: 5,
    complexity: 3,
    stats: { control: 3, dpr: 1 },
    summary:
      "It enters a corpse and makes the entrails hunt nearby living bodies.",
    mechanics:
      "Choose a corpse within 30 feet. Creatures in a 10-foot emanation from that corpse make a Dexterity save. On a failure, a target has the Restrained condition for 1 minute. It repeats the save at the end of each of its turns, ending the effect on a success.",
    counterplay: "Destroying, burning, or avoiding corpses limits this action.",
  },
  {
    id: "flesh-harvest",
    title: "Flesh Harvest",
    slot: "twist",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 3,
    stats: { dpr: 2, ac: 1, control: 1 },
    summary:
      "Each corpse devoured makes the spirit more certain, more violent, and more complete.",
    mechanics:
      "The creature can consume a Medium or smaller corpse using an action. For each corpse consumed this way, it gains a +1 bonus to attack rolls, damage rolls, and AC until dawn, to a maximum bonus equal to its proficiency bonus.",
    counterplay: "Removing corpses from the scene denies the escalation.",
  },
  {
    id: "deceitful-apparition",
    title: "Deceitful Apparition",
    slot: "mind",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { control: 2 },
    summary:
      "The spirit wears clothes, mannerisms, and fragments of identity stolen from the corpses it devoured.",
    mechanics:
      "The creature can appear as a mundane person whose corpse it has consumed. A creature can identify the deception with a successful Insight or Investigation check contested by the monster's Deception, or by magical means.",
    counterplay:
      "Suspicious details, funerary records, and body evidence can expose it without combat.",
  },
  {
    id: "mortal-afterlife",
    title: "Mortal Afterlife",
    slot: "mind",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1, control: 1 },
    summary:
      "It is trying to belong by stealing a life rather than merely haunting a place.",
    mechanics:
      "If publicly exposed by its community, the creature must succeed on a Wisdom save or spend its next turn fleeing toward its lair, refuge, or a corpse it can use to rebuild its identity.",
    counterplay: "Social exposure can function as battlefield control.",
  },
  {
    id: "vanish-spirit",
    title: "Vanish",
    slot: "movement",
    section: "bonusAction",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { mobility: 2, control: 1 },
    summary: "The spirit disappears behind shame, darkness, and stolen breath.",
    mechanics:
      "3/day. The creature has the Invisible condition until its concentration ends. The effect ends early immediately after the creature makes an attack roll.",
    counterplay:
      "Area effects, held actions, and forcing concentration checks can reveal it.",
  },
  {
    id: "cunning-action-spirit",
    title: "Cunning Action",
    slot: "movement",
    section: "bonusAction",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { mobility: 2 },
    summary: "It hunts like a murderer rather than a wandering ghost.",
    mechanics: "The creature takes the Dash, Disengage, or Hide action.",
    counterplay:
      "Tight formation and readied actions reduce the value of its mobility.",
  },
  {
    id: "horrific-assault",
    title: "Horrific Assault",
    slot: "twist",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 2,
    stats: { dpr: 5, mobility: 1 },
    summary:
      "The spirit is most dangerous before the victims realize the dead thing is already among them.",
    mechanics:
      "During its first turn, the creature has advantage on attack rolls against any creature that has not taken a turn. Any hit it scores against a surprised creature is a critical hit.",
    counterplay:
      "Scouting, watches, light, and suspicion reduce or eliminate the opening ambush.",
  },
  {
    id: "no-witnesses-rage",
    title: "No Witnesses Rage",
    slot: "twist",
    section: "reaction",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["boss", "standard"],
    cost: 5,
    complexity: 3,
    stats: { dpr: 4, control: 1 },
    summary: "When caught feeding, shame becomes violence instead of fear.",
    mechanics:
      "Trigger: a hostile creature sees the spirit feeding on a corpse or repugnant meal. Response: the spirit becomes enraged for 1 minute. While enraged, it gains bonus damage on bite attacks and advantage on Intelligence checks and saves, but it must attack a witness each turn if able.",
    counterplay:
      "Witnesses can lure the rage, but doing so makes them the focus.",
  },
  {
    id: "daytime-weakness",
    title: "Daytime Weakness",
    slot: "weakness",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: -3,
    complexity: 1,
    stats: { fairness: 3 },
    summary:
      "Held in the world during daylight, the spirit loses the confidence of night.",
    mechanics:
      "While forced to remain on the Material Plane during daytime, the creature has disadvantage on attack rolls, ability checks, and saving throws.",
    counterplay:
      "Ritual anchors, daylight pursuit, or binding circles can create a decisive advantage.",
  },
  {
    id: "shameful-feeding",
    title: "Shameful Feeding",
    slot: "weakness",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: -2,
    complexity: 2,
    stats: { fairness: 2 },
    summary: "Being witnessed during its meal wounds the spirit's identity.",
    mechanics:
      "If caught eating a corpse or other repugnant meal, the creature has the Frightened condition until it succeeds on a Wisdom save at the start of one of its turns. This overrides immunity to the Frightened condition.",
    counterplay:
      "Players can set surveillance, bait, and public exposure as a trap.",
  },
  {
    id: "dangerous-hunger",
    title: "Dangerous Hunger",
    slot: "weakness",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: -2,
    complexity: 1,
    stats: { fairness: 2 },
    summary: "The spirit cannot distinguish a safe meal from a prepared trap.",
    mechanics:
      "A corpse soaked in holy water, packed with salt, or otherwise prepared against ghosts counts as bait. If the spirit feeds from it, it takes radiant damage and cannot use Incorporeal Movement until the end of its next turn.",
    counterplay:
      "The players can defeat or weaken the monster through preparation instead of raw damage.",
  },
  {
    id: "salt-and-names",
    title: "Salt and True Names",
    slot: "weakness",
    section: "trait",
    source: "jikininki",
    typeBias: ["undead", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: -2,
    complexity: 1,
    stats: { fairness: 2 },
    summary:
      "The creature recoils from burial rites, salt, and being named as the dead person it was.",
    mechanics:
      "A character who spends an action invoking a true name, funeral rite, or line of salt can force a Wisdom save. On a failure, the monster cannot willingly move closer to that character until the end of its next turn.",
    counterplay: "This gives players a non-damage way to control space.",
  },
  {
    id: "spectral-dust-death",
    title: "Spectral Dust",
    slot: "death",
    section: "death",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1 },
    summary: "When the spirit collapses, grave dust reveals what it devoured.",
    mechanics:
      "On death, the creature leaves spectral dust and small grave goods from its meals. A character who studies them learns one useful fact about the spirit's feeding route, victim, or lair.",
    counterplay: "This death effect rewards investigation after violence.",
  },
  {
    id: "last-meal-memory",
    title: "Last Meal Memory",
    slot: "death",
    section: "death",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { control: 1, fairness: 1 },
    summary: "The final corpse it consumed speaks through the fading spirit.",
    mechanics:
      "On death, one creature within 30 feet hears a stolen memory. That creature makes a Wisdom save. On a failure, it is Frightened until the end of its next turn. Success or failure, it learns one clue from the consumed victim.",
    counterplay:
      "Covering the corpse's face or completing a funeral rite before the killing blow prevents the fear effect but preserves the clue.",
  },
  {
    id: "funeral-silence-lair",
    title: "Funeral Silence",
    slot: "lair",
    section: "lairAction",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["boss"],
    cost: 5,
    complexity: 3,
    stats: { control: 3 },
    summary: "The lair swallows prayer, witness, and warning.",
    mechanics:
      "At initiative count 20, choose a 20-foot area. Until the next count 20, sound in that area is muffled. Creatures inside have disadvantage on checks relying on hearing, and verbal spell components require a successful spellcasting ability check against the monster DC.",
    counterplay:
      "Leaving the area or using nonverbal magic avoids the worst pressure.",
  },
  {
    id: "graveyard-offerings-lair",
    title: "Graveyard Offerings",
    slot: "lair",
    section: "lairAction",
    source: "jikininki",
    typeBias: ["undead"],
    roleBias: ["boss", "standard"],
    cost: 4,
    complexity: 2,
    stats: { control: 2 },
    summary: "Offerings, bones, and old names shift around the battlefield.",
    mechanics:
      "At initiative count 20, one funerary object or corpse within 60 feet becomes a lure. Until the next count 20, a creature that starts within 10 feet of it makes a Wisdom save or must spend 10 feet of movement moving toward it.",
    counterplay:
      "Destroying or respectfully moving the offering ends the lure.",
  },

  // Wolf Spiders / Broodmother
  {
    id: "maternal-swarm-instinct",
    title: "Maternal Swarm Instinct",
    slot: "mind",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { hp: 6, control: 1 },
    summary:
      "It protects a brood carried on its body and becomes more violent when the young are threatened.",
    mechanics:
      "The first time it is bloodied, a brood swarm appears in an adjacent space. Until the brood is destroyed, the creature gains +2 damage on melee attacks.",
    counterplay:
      "The brood is visible before combat as a shifting texture across its back.",
  },
  {
    id: "egg-carrier",
    title: "Egg Carrier",
    slot: "body",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 6,
    complexity: 4,
    stats: { hp: 16, control: 3 },
    summary:
      "The spider carries a living clutch on its back, turning damage into a hatching risk.",
    mechanics:
      "The creature carries eggs on its back. At the start of each combatant's turn while eggs remain, roll a d20. On a 1, one egg breaks. On a 13-19, one egg hatches into a spider minion. On a 20, 1d4+1 eggs hatch. The eggs can be attacked and destroyed as fragile objects.",
    counterplay: "The eggs are visible, vulnerable, and dangerous to ignore.",
  },
  {
    id: "spider-climb",
    title: "Spider Climb",
    slot: "body",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration", "undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { mobility: 1 },
    summary:
      "The spider treats ceilings and vertical surfaces as ordinary ground.",
    mechanics:
      "The creature can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.",
    counterplay:
      "Destroying surfaces, burning webs, and forcing falls remain valid answers.",
  },
  {
    id: "web-walker",
    title: "Web Walker",
    slot: "body",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration", "undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { mobility: 1, control: 1 },
    summary: "The spider feels the battlefield through every web strand.",
    mechanics:
      "The creature ignores movement restrictions caused by webs, and it knows the location of any other creature in contact with the same web.",
    counterplay:
      "Cutting, burning, or avoiding web networks removes its awareness.",
  },
  {
    id: "barbed-chitin",
    title: "Barbed Chitin",
    slot: "body",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { ac: 1, dpr: 2 },
    summary: "Jagged protrusions make grappling or holding the spider painful.",
    mechanics:
      "At the start of each of its turns, the creature deals piercing damage to any creature grappling it or being grappled by it.",
    counterplay:
      "Ranged control, weapons, and forced movement avoid direct contact.",
  },
  {
    id: "umbral-skin",
    title: "Umbral Skin",
    slot: "body",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 2,
    stats: { control: 2, mobility: 1 },
    summary:
      "Darkness folds into the spider's body until it nearly disappears.",
    mechanics:
      "While in darkness, the creature has the Invisible condition. The condition ends immediately when the creature enters bright light or takes fire or radiant damage.",
    counterplay: "Light management becomes the key countermeasure.",
  },
  {
    id: "malformed-broodling",
    title: "Malformed Broodling",
    slot: "body",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion"],
    cost: 1,
    complexity: 1,
    stats: { hp: -8, control: 1, fairness: 1 },
    summary:
      "The offspring is fragile, wet, misshapen, and useful mainly as a horrible battlefield resource.",
    mechanics:
      "The creature has 1 hit point. A Broodmother or allied spider within 5 feet can use a bonus action to devour it and regain hit points equal to 2d6 plus proficiency bonus.",
    counterplay: "Players can destroy the broodling before it becomes healing.",
  },
  {
    id: "hundred-eyed",
    title: "Hundred-Eyed",
    slot: "mind",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { control: 1, fairness: 1 },
    summary:
      "Dozens of eyes cover the malformed head, many blind, some always watching.",
    mechanics:
      "The creature cannot be surprised while conscious and gains a bonus to passive Perception equal to twice its proficiency bonus.",
    counterplay:
      "Blinding, darkness, smoke, or attacking from beyond sight still works.",
  },
  {
    id: "wall-crawler",
    title: "Wall-Crawling Approach",
    slot: "movement",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration", "undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { mobility: 1 },
    summary: "It treats walls and ceilings as normal hunting ground.",
    mechanics:
      "The creature gains a climb speed equal to its walking speed and ignores difficult terrain caused by webs, rubble, or bones.",
    counterplay:
      "Characters can force it down by breaking surfaces, burning webbing, or using thunderous effects.",
  },
  {
    id: "web-dancer",
    title: "Web Dancer",
    slot: "movement",
    section: "bonusAction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { mobility: 3 },
    summary:
      "It shoots a strand of web and swings across the lair without opening itself to retaliation.",
    mechanics:
      "The creature shoots a strand of web at a surface within 60 feet it can see. As part of this bonus action, it moves along the web up to its remaining speed without provoking opportunity attacks. The web can be attacked and destroyed as a fragile object vulnerable to fire.",
    counterplay: "Destroying the strand interrupts future movement routes.",
  },
  {
    id: "shadow-jump",
    title: "Shadow Jump",
    slot: "movement",
    section: "bonusAction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 2,
    stats: { mobility: 3, control: 1 },
    summary:
      "The spider teleports through pockets of darkness instead of crawling.",
    mechanics:
      "3/day. The creature teleports up to 40 feet to an unoccupied space in darkness it can see.",
    counterplay:
      "Bright light and removing dark corners limit its escape routes.",
  },
  {
    id: "predatory-jump",
    title: "Predatory Jump",
    slot: "movement",
    section: "bonusAction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { mobility: 2, dpr: 1 },
    summary: "It leaps across the battlefield and lands already striking.",
    mechanics:
      "The creature jumps up to 30 feet in any direction without provoking opportunity attacks. If it lands within 5 feet of an enemy, it has advantage on the next attack against that enemy before the end of the turn.",
    counterplay: "Open spacing and readied attacks reduce the leap's value.",
  },
  {
    id: "venomous-bite",
    title: "Venomous Bite",
    slot: "attack",
    section: "action",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { dpr: 5, control: 1 },
    summary:
      "The bite injects venom that becomes terrifying when it drops a victim.",
    mechanics:
      "Melee Attack Roll. On hit, the target takes piercing damage and makes a Constitution save. Failure: poison damage. If this damage reduces the target to 0 hit points, the target has the Paralyzed and Poisoned conditions for 1 hour. Success: half poison damage only.",
    counterplay:
      "Poison resistance, distance, and antitoxin reduce the bite's threat.",
  },
  {
    id: "perforate",
    title: "Perforate",
    slot: "attack",
    section: "action",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard"],
    cost: 3,
    complexity: 2,
    stats: { dpr: 4, control: 1 },
    summary: "Barbed fangs leave wounds that keep tearing until treated.",
    mechanics:
      "Melee Attack Roll. On hit, the target takes piercing damage and makes a Constitution save. On a failure, it takes extra piercing damage at the start of each of its turns until it receives healing or a creature succeeds on a Medicine check to close the wound.",
    counterplay: "Healing and Medicine stop the ongoing damage.",
  },
  {
    id: "web-recharge",
    title: "Web",
    slot: "attack",
    section: "action",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { control: 3 },
    summary:
      "A classic restraining web shot that turns positioning into danger.",
    mechanics:
      "Recharge 5-6. Dexterity Saving Throw, one creature the monster can see within 60 feet. Failure: the target has the Restrained condition until the web is destroyed. The web has low AC and hit points, vulnerability to fire, and immunity to poison and psychic damage.",
    counterplay: "The web can be attacked, burned, or avoided with cover.",
  },
  {
    id: "shadow-web",
    title: "Shadow Web",
    slot: "attack",
    section: "action",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 3,
    stats: { control: 3, dpr: 2 },
    summary:
      "The web is darker, tougher, and cuts into prey while holding them.",
    mechanics:
      "Recharge 5-6. Dexterity Saving Throw, one creature within 60 feet. Failure: the target has the Restrained condition until the web is destroyed. A restrained target takes slashing damage at the start of each of its turns. Shadow webs have higher AC and hit points than ordinary webs.",
    counterplay:
      "Fire remains effective, but the web takes more effort to destroy.",
  },
  {
    id: "venomous-spit",
    title: "Venomous Spit",
    slot: "attack",
    section: "action",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard"],
    cost: 3,
    complexity: 1,
    stats: { dpr: 4 },
    summary:
      "The spider has a ranged pressure option when prey refuses the web.",
    mechanics:
      "Ranged Attack Roll, range 30 feet. On hit, the target takes poison damage.",
    counterplay: "Cover and poison resistance keep the attack modest.",
  },
  {
    id: "brood-injection",
    title: "Brood Injection",
    slot: "attack",
    section: "action",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 5,
    complexity: 3,
    stats: { dpr: 3, control: 2 },
    summary: "A hit leaves something moving under the skin.",
    mechanics:
      "On a hit, the target makes a Constitution save. On a failure, its speed is reduced by 10 feet and it takes piercing damage at the start of its next turn. An action and a successful Medicine check ends the effect.",
    counterplay: "The wound visibly ripples before the delayed damage happens.",
  },
  {
    id: "enrage-broodmother",
    title: "Enrage",
    slot: "twist",
    section: "reaction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 4,
    complexity: 2,
    stats: { dpr: 4, mobility: 1 },
    summary:
      "Destroying an egg risks making the mother faster and more lethal.",
    mechanics:
      "Trigger: a creature destroys an egg the monster is carrying. Response: roll a d6. On a 4 or higher, the monster enrages until the combat ends, gaining a bonus to attack rolls, damage rolls, speed, and jump distance.",
    counterplay: "Attacking eggs is effective but not free.",
  },
  {
    id: "web-architect",
    title: "Web Architect",
    slot: "twist",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { control: 2 },
    summary: "Its webs are engineered defenses rather than simple strands.",
    mechanics:
      "All webs created by the creature have a bonus to AC and hit points, and they lose vulnerability to fire while the creature is not bloodied.",
    counterplay: "Bloodying the spider weakens the web network.",
  },
  {
    id: "corrosive-web",
    title: "Corrosive Web",
    slot: "twist",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { dpr: 2 },
    summary: "Webbing burns skin and armor with acidic residue.",
    mechanics:
      "Whenever a creature is hit by one of the monster's web abilities or starts its turn restrained by its web, it takes acid damage equal to the monster's proficiency bonus.",
    counterplay:
      "Escaping or burning the web quickly prevents repeated damage.",
  },
  {
    id: "hunter-spider",
    title: "Hunter",
    slot: "mind",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { mobility: 1 },
    summary: "The spider stalks prey patiently and uses cover like a predator.",
    mechanics:
      "The creature has advantage on Dexterity (Stealth) checks, and it can take the Hide action as a bonus action on each of its turns.",
    counterplay:
      "Light, fire, tremorsense, and clearing webs make hiding harder.",
  },
  {
    id: "thin-legs",
    title: "Thin Legs",
    slot: "weakness",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: -1,
    complexity: 1,
    stats: { fairness: 1 },
    summary:
      "The spider is terrifying on webbing, but unstable on slick ground.",
    mechanics:
      "When the creature moves at least 5 feet on a slippery surface such as ice, oil, grease, or polished wet stone, it automatically fails checks made to keep its balance.",
    counterplay: "Players can create slick terrain as a meaningful answer.",
  },
  {
    id: "fear-of-fire",
    title: "Fear of Fire",
    slot: "weakness",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: -2,
    complexity: 1,
    stats: { fairness: 2 },
    summary: "Large flame turns predatory confidence into animal panic.",
    mechanics:
      "While within 30 feet of a fire with a radius greater than 10 feet, wildfire, or a similar blaze, the creature has the Frightened condition.",
    counterplay: "Torches are not enough; players need meaningful fire.",
  },
  {
    id: "underbelly-weak-spot",
    title: "Underbelly Weak Spot",
    slot: "weakness",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: -2,
    complexity: 1,
    stats: { fairness: 2 },
    summary:
      "The underside is pale, soft, and visible during leaps or climbing transitions.",
    mechanics:
      "When the creature jumps, climbs from ceiling to wall, or is knocked prone, the next hit against it before the start of its next turn deals extra damage of the same type equal to 2d6.",
    counterplay: "Forcing movement transitions opens the weak spot.",
  },
  {
    id: "eyes-weak-spot",
    title: "Eyes Weak Spot",
    slot: "weakness",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: -2,
    complexity: 2,
    stats: { fairness: 2 },
    summary:
      "The cluster of eyes can be damaged to break the monster's battlefield control.",
    mechanics:
      "A character can target the eyes with a called shot at a -5 penalty. On a hit, the creature has the Blinded condition until the end of its next turn. If the attack deals at least 30 damage, the blindness lasts until magically healed or until the creature finishes a short rest.",
    counterplay:
      "This weak spot rewards precision without trivializing the monster.",
  },
  {
    id: "brood-tell",
    title: "Brood Tell",
    slot: "weakness",
    section: "trait",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: -1,
    complexity: 1,
    stats: { fairness: 2 },
    summary: "The brood moves before the parent attacks.",
    mechanics:
      "Before using its strongest attack, the brood shifts toward the target. A character who notices this can use a reaction to move 5 feet without provoking from the monster.",
    counterplay: "The scary feature becomes readable instead of arbitrary.",
  },
  {
    id: "egg-hatch-death",
    title: "Egg Hatch Death",
    slot: "death",
    section: "death",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { control: 2 },
    summary:
      "Killing the mother can turn the clutch into the next immediate problem.",
    mechanics:
      "On death, each remaining egg hatches on a 13 or higher on a d20. Hatched eggs create spider minions in adjacent spaces. If the body was burned before death, this effect does not trigger.",
    counterplay:
      "Destroying or burning eggs before the final blow prevents the swarm.",
  },
  {
    id: "silk-cocoon-remains",
    title: "Silk Cocoon Remains",
    slot: "death",
    section: "death",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1 },
    summary:
      "The corpse collapses into webbed remains that reveal previous victims.",
    mechanics:
      "On death, the body tears open nearby cocoons or drops its own silk-wrapped trophies. Searching the silk reveals one clue, treasure roll, or sign of a missing NPC.",
    counterplay: "The death effect is investigative rather than punitive.",
  },
  {
    id: "sticky-surroundings",
    title: "Sticky Surroundings",
    slot: "lair",
    section: "lairAction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 5,
    complexity: 2,
    stats: { control: 3 },
    summary: "The entire nest makes agile movement unreliable.",
    mechanics:
      "At initiative count 20, creatures without Web Walker have disadvantage on Dexterity saving throws and Dexterity (Acrobatics) checks until initiative count 20 on the next round.",
    counterplay:
      "Burning lanes through the web or staying off webbed surfaces avoids the penalty.",
  },
  {
    id: "broodmother-web-lair",
    title: "Broodmother Web",
    slot: "lair",
    section: "lairAction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["boss"],
    cost: 5,
    complexity: 3,
    stats: { control: 3 },
    summary:
      "The mother turns any visible point in the nest into a restraining web trap.",
    mechanics:
      "At initiative count 20, the creature casts or creates Web at a point it can see within 60 feet. While maintaining this effect, it cannot take other lair actions. A target that succeeds on the saving throw or escapes becomes immune to this lair action for 24 hours.",
    counterplay: "The single maintained web forces the monster to commit.",
  },
  {
    id: "dense-web-region",
    title: "Dense Webs",
    slot: "lair",
    section: "lairAction",
    source: "wolf-spiders",
    typeBias: ["beast", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 3,
    complexity: 1,
    stats: { control: 2 },
    summary: "Surfaces throughout the nest are layered with old silk.",
    mechanics:
      "At initiative count 20, choose a visible surface. Until cleared or burned, it becomes difficult terrain for creatures without Web Walker. Spiders attacking surprised targets on the surface have advantage.",
    counterplay: "Fire, blades, and careful routes create safe lanes.",
  },

  // Gashadokuro support kept for source coverage
  {
    id: "bone-collective",
    title: "Many-Boned Frame",
    slot: "body",
    section: "trait",
    source: "gashadokuro",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { hp: 18, ac: 1 },
    summary:
      "The monster is not one skeleton but a hunger-shaped arrangement of stolen bones.",
    mechanics:
      "It has advantage on saves against being knocked prone. When it takes bludgeoning damage, its next attack deals -2 damage but gains 5 temporary hit points.",
    counterplay:
      "Bludgeoning damage disrupts its shape even when it does not destroy it.",
  },
  {
    id: "bone-drag-step",
    title: "Bone-Drag Step",
    slot: "movement",
    section: "trait",
    source: "gashadokuro",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { mobility: 1, dpr: 1 },
    summary:
      "Its movement sounds too large for the space, as if something huge is crawling through a smaller body.",
    mechanics:
      "After it moves at least 15 feet, its next melee hit before the end of the turn pushes the target 5 feet and fills the vacated space with bone fragments, making it difficult terrain.",
    counterplay: "The drag sound telegraphs where it will charge next.",
  },
  {
    id: "bone-splinter-cone",
    title: "Bone Splinter Cone",
    slot: "attack",
    section: "action",
    source: "gashadokuro",
    typeBias: ["undead"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { dpr: 5 },
    summary: "It coughs or tears loose shards from its own frame.",
    mechanics:
      "Recharge 5-6. Creatures in a 15-foot cone make a Dexterity save, taking piercing damage on a failure or half as much on a success.",
    counterplay: "Its ribs open and rattle one turn before the cone recharges.",
  },
  {
    id: "bone-reassembly",
    title: "Bone Reassembly",
    slot: "twist",
    section: "trait",
    source: "gashadokuro",
    typeBias: ["undead"],
    roleBias: ["boss", "standard"],
    cost: 6,
    complexity: 3,
    stats: { hp: 20, control: 1 },
    summary: "Killing it once may only scatter the body.",
    mechanics:
      "The first time it drops to 0 hit points, it collapses instead. At initiative count 20 on the next round, it reforms with hit points equal to twice the party level unless its bones are scattered, burned, or sanctified first.",
    counterplay: "The skull keeps whispering while the bones are inactive.",
  },
  {
    id: "bone-rattle-warning",
    title: "Bone-Rattle Warning",
    slot: "death",
    section: "death",
    source: "gashadokuro",
    typeBias: ["undead"],
    roleBias: ["minion", "standard", "boss"],
    cost: 2,
    complexity: 1,
    stats: { fairness: 1 },
    summary: "Death releases a warning instead of only damage.",
    mechanics:
      "On death, its bones arrange into an arrow, a name, or a crude map pointing toward the next horror component in the location.",
    counterplay:
      "This death effect advances play rather than punishing players.",
  },
  {
    id: "ossuary-counts-you",
    title: "The Ossuary Counts You",
    slot: "lair",
    section: "lairAction",
    source: "gashadokuro",
    typeBias: ["undead"],
    roleBias: ["boss", "standard"],
    cost: 5,
    complexity: 3,
    stats: { control: 2, dpr: 1 },
    summary: "The environment begins arranging the living as future remains.",
    mechanics:
      "At initiative count 20, bone piles shift around one isolated creature. That creature makes a Strength save or is pulled 10 feet toward the monster.",
    counterplay: "Staying near allies reduces the pressure.",
  },

  // Wax Death Masks support kept for source coverage
  {
    id: "waxen-mask-body",
    title: "Waxen Funeral Flesh",
    slot: "body",
    section: "trait",
    source: "wax-death-masks",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 1,
    stats: { ac: 1, hp: 8 },
    summary: "Its face and skin look preserved, smooth, and almost ceremonial.",
    mechanics:
      "The creature has resistance to cold damage but vulnerability to fire damage until it is bloodied.",
    counterplay:
      "Heat softens the wax and exposes the moving thing underneath.",
  },
  {
    id: "borrowed-face",
    title: "Borrowed Face Memory",
    slot: "mind",
    section: "trait",
    source: "wax-death-masks",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 3,
    complexity: 2,
    stats: { control: 1 },
    summary: "It acts through the copied expressions of the dead.",
    mechanics:
      "When a creature first sees its face clearly, it makes a Wisdom save or cannot take reactions against this monster until the start of its next turn.",
    counterplay: "Covering, breaking, or melting the mask ends this feature.",
  },
  {
    id: "shadow-stillness",
    title: "Moves Only When Unwatched",
    slot: "movement",
    section: "bonusAction",
    source: "wax-death-masks",
    typeBias: ["undead", "aberration"],
    roleBias: ["boss", "standard"],
    cost: 5,
    complexity: 3,
    stats: { mobility: 2, control: 1 },
    summary:
      "The creature advances during blinks, darkness, panic, and distraction.",
    mechanics:
      "Once per round, when no conscious hostile creature has line of sight to it, it can move up to half its speed without provoking opportunity attacks.",
    counterplay:
      "Keeping light and sight lines on it prevents the free movement.",
  },
  {
    id: "mask-phase",
    title: "Changing Funeral Mask",
    slot: "twist",
    section: "trait",
    source: "wax-death-masks",
    typeBias: ["undead", "aberration"],
    roleBias: ["boss"],
    cost: 6,
    complexity: 4,
    stats: { dpr: 2, control: 2 },
    summary:
      "At bloodied, the mask changes identity and the fight changes tone.",
    mechanics:
      "When bloodied, choose one: Mourner Mask imposes disadvantage on opportunity attacks against it; Accuser Mask gives it +2 damage against frightened creatures; Saint Mask lets it end one condition on itself.",
    counterplay: "Breaking the mask before bloodied prevents the phase change.",
  },
  {
    id: "fire-softens-it",
    title: "Fire Softens It",
    slot: "weakness",
    section: "trait",
    source: "wax-death-masks",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: -2,
    complexity: 1,
    stats: { fairness: 2 },
    summary:
      "Heat reveals seams, fingerprints, and the false face beneath the wax.",
    mechanics:
      "After the monster takes fire damage, the next attack against it before the start of its next turn has advantage.",
    counterplay: "Useful even when fire is not the best damage type.",
  },
  {
    id: "face-curse",
    title: "Last Face Curse",
    slot: "death",
    section: "death",
    source: "wax-death-masks",
    typeBias: ["undead", "aberration"],
    roleBias: ["standard", "boss"],
    cost: 4,
    complexity: 2,
    stats: { control: 2 },
    summary: "The final expression remains in the room after the body falls.",
    mechanics:
      "On death, one creature that can see the mask makes a Wisdom save. On a failure, it is Frightened until the end of its next turn. If the mask was broken before death, this does not trigger.",
    counterplay: "Destroying the mask prevents the effect.",
  },
];

const FEATURE_COMPATIBILITY_OVERRIDES = {
  "swollen-corpse": {
    grants: ["undead_body", "corpse_body", "bloated_body", "corpse_presence"],
  },
  "fresh-bloat-hide": {
    grants: ["undead_body", "corpse_body", "bloated_body", "corpse_presence"],
  },
  "volatile-immobile-mass": {
    grants: ["corpse_body", "bloated_body", "corpse_presence", "immobile_mass"],
    incompatibleWith: [
      "high_mobility",
      "web_dancer",
      "predatory_jump",
      "shadow_jump",
    ],
  },
  "skin-slippage": { grants: ["corpse_body"] },
  "mindless-command": { grants: ["mindless"] },
  "pressure-agony": { softRequires: ["bloated_body"] },
  "gas-buildup": { grants: ["unstable_body", "bloated_body"] },
  "unstable-rupture": { softRequires: ["unstable_body", "bloated_body"] },
  "dangerously-unstable": {
    requires: ["bloated_body"],
    grants: ["unstable_body"],
    avoidWith: ["high_mobility", "stealth_predator"],
  },
  "undead-fortitude": { requires: ["undead_body"] },
  "corpse-bloom-death": { softRequires: ["corpse_body"] },
  "toxic-detonation": { softRequires: ["bloated_body"] },
  "purge-fluid-flood": { softRequires: ["bloated_body"] },
  "corpse-pressure-room": { softRequires: ["corpse_presence"] },

  "corpse-craving": { grants: ["corpse_feeding", "corpse_presence"] },
  "shame-hunger": { grants: ["corpse_feeding"] },
  "grave-bite": { grants: ["corpse_feeding"] },
  "ethereal-sight": { grants: ["spirit_body"] },
  "incorporeal-movement": {
    grants: ["spirit_body"],
    incompatibleWith: ["egg_carrier", "barbed_chitin", "physical_chitin"],
  },
  "corpse-tendrils": { requires: ["corpse_presence"] },
  "flesh-harvest": {
    softRequires: ["corpse_presence"],
    grants: ["corpse_feeding"],
  },
  "deceitful-apparition": { incompatibleWith: ["mindless"] },
  "mortal-afterlife": { incompatibleWith: ["mindless"] },
  "no-witnesses-rage": { requires: ["corpse_feeding"] },
  "dangerous-hunger": { softRequires: ["corpse_feeding"] },
  "last-meal-memory": { softRequires: ["corpse_feeding"] },
  "graveyard-offerings-lair": {
    softRequires: ["corpse_presence", "graveyard_context"],
  },

  "maternal-swarm-instinct": { grants: ["brood"] },
  "egg-carrier": { grants: ["egg_carrier", "brood"] },
  "spider-climb": { grants: ["climber", "spider_body"] },
  "web-walker": { grants: ["web_walker", "web_terrain"] },
  "barbed-chitin": {
    grants: ["barbed_chitin", "physical_chitin"],
    incompatibleWith: ["spirit_body", "no_body"],
  },
  "umbral-skin": { grants: ["shadow_body"] },
  "malformed-broodling": { requires: ["brood"] },
  "hunter-spider": { grants: ["stealth_predator"] },
  "wall-crawler": { grants: ["climber", "spider_body"] },
  "web-dancer": {
    requires: ["web_maker"],
    grants: ["high_mobility", "web_dancer"],
  },
  "shadow-jump": {
    grants: ["high_mobility", "shadow_jump", "shadow_movement"],
  },
  "predatory-jump": { grants: ["high_mobility", "predatory_jump"] },
  "web-recharge": { grants: ["web_maker", "web_terrain"] },
  "shadow-web": { grants: ["web_maker", "web_terrain"] },
  "enrage-broodmother": { requires: ["egg_carrier"] },
  "web-architect": { requires: ["web_maker"] },
  "corrosive-web": { requires: ["web_maker"] },
  "brood-tell": { softRequires: ["brood"] },
  "egg-hatch-death": { requires: ["egg_carrier"] },
  "sticky-surroundings": { softRequires: ["web_terrain"] },
  "broodmother-web-lair": { requires: ["web_maker"] },
  "dense-web-region": { grants: ["web_terrain"] },

  "bone-collective": { grants: ["bone_body"] },
  "bone-reassembly": { requires: ["bone_body"] },
  "ossuary-counts-you": { softRequires: ["bone_body"] },

  "waxen-mask-body": { grants: ["wax_body", "wax_mask"] },
  "borrowed-face": { requires: ["wax_mask"], incompatibleWith: ["mindless"] },
  "shadow-stillness": { grants: ["high_mobility"] },
  "mask-phase": { requires: ["wax_mask"] },
  "fire-softens-it": { requires: ["wax_body"] },
  "face-curse": { requires: ["wax_mask"] },
};

const FEATURE_MECHANIC_OVERRIDES = {
  "acid-vomit": {
    mechanicTags: [
      "damage",
      "aoe",
      "ongoing_damage",
      "healing_denial",
      "recharge",
      "cleanup_action",
    ],
    pressureTags: ["area", "control", "sustain"],
    complexityTags: ["recharge", "ongoing_tracking", "cleanup_action"],
    damageProfile: {
      baseDamage: 7,
      damageType: "Acid",
      expectedTargets: 2,
      roundWeight: [1, 0.35, 0.35],
    },
    usageProfile: { frequency: "recharge", recharge: "5-6" },
    conditionProfile: {
      condition: "Healing Denial",
      severity: "Major",
      duration: "until_cleaned",
      repeatSave: false,
    },
  },
  "corpse-grab": {
    mechanicTags: ["save", "grapple", "restrained", "escape_check"],
    pressureTags: ["control", "single_target_lockdown"],
    complexityTags: ["condition_tracking", "escape_check"],
    conditionProfile: {
      condition: "Restrained",
      severity: "Major",
      duration: "until_escape",
      repeatSave: true,
    },
  },
  "unstable-rupture": {
    mechanicTags: ["reaction", "triggered_damage", "aoe", "save"],
    pressureTags: ["reaction_burst", "area", "punish_damage_type"],
    complexityTags: ["reaction_trigger", "random_trigger"],
    damageProfile: {
      baseDamage: 3,
      damageType: "Poison",
      expectedTargets: 2,
      roundWeight: [0.25, 0.25, 0.25],
    },
    usageProfile: {
      frequency: "reaction",
      trigger: "piercing_or_slashing_damage",
    },
  },
  "dangerously-unstable": {
    mechanicTags: ["reaction", "death_burst", "large_aoe", "save", "condition"],
    pressureTags: ["burst", "area", "control", "self_destruct"],
    complexityTags: ["reaction_trigger", "large_area", "random_trigger"],
    damageProfile: {
      baseDamage: 8,
      damageType: "Poison",
      expectedTargets: 3,
      roundWeight: [0.25, 0.25, 0.25],
    },
    usageProfile: {
      frequency: "reaction",
      trigger: "piercing_or_slashing_damage",
    },
    conditionProfile: {
      condition: "Prone",
      severity: "Moderate",
      duration: "instant",
      repeatSave: false,
    },
  },
  "toxic-detonation": {
    mechanicTags: ["death_effect", "aoe", "condition", "save"],
    pressureTags: ["death_burst", "area"],
    complexityTags: ["death_trigger"],
    damageProfile: {
      baseDamage: 5,
      damageType: "Poison",
      expectedTargets: 2,
      roundWeight: [0, 0, 0],
    },
    usageProfile: { frequency: "death" },
    conditionProfile: {
      condition: "Poisoned",
      severity: "Minor",
      duration: "until_end_next_turn",
      repeatSave: false,
    },
  },
  "grave-bite": {
    mechanicTags: ["attack", "damage", "healing"],
    pressureTags: ["sustain", "single_target"],
    complexityTags: ["conditional_healing"],
    damageProfile: {
      baseDamage: 4,
      damageType: "Piercing/Necrotic",
      expectedTargets: 1,
      roundWeight: [1, 1, 1],
    },
    usageProfile: { frequency: "at_will" },
  },
  "infected-bite": {
    mechanicTags: ["attack", "damage", "delayed_effect", "exhaustion", "save"],
    pressureTags: ["sustain", "campaign_pressure"],
    complexityTags: ["delayed_tracking", "rest_trigger"],
    damageProfile: {
      baseDamage: 5,
      damageType: "Poison/Necrotic",
      expectedTargets: 1,
      roundWeight: [1, 1, 1],
    },
    conditionProfile: {
      condition: "Exhaustion",
      severity: "Major",
      duration: "after_long_rest",
      repeatSave: false,
    },
  },
  "purulent-bite": {
    mechanicTags: [
      "attack",
      "damage",
      "delayed_effect",
      "exhaustion",
      "disease",
      "save",
    ],
    pressureTags: ["campaign_pressure", "sustain"],
    complexityTags: ["delayed_tracking", "disease_tracking", "rest_trigger"],
    damageProfile: {
      baseDamage: 6,
      damageType: "Poison/Necrotic",
      expectedTargets: 1,
      roundWeight: [1, 1, 1],
    },
    conditionProfile: {
      condition: "Exhaustion/Disease",
      severity: "Severe",
      duration: "weeks_or_until_cured",
      repeatSave: false,
    },
  },
  "horrific-apparition": {
    mechanicTags: [
      "aoe",
      "condition",
      "psychic_damage",
      "save",
      "immunity_after_success",
    ],
    pressureTags: ["area", "fear", "control"],
    complexityTags: ["immunity_tracking", "condition_tracking"],
    damageProfile: {
      baseDamage: 2,
      damageType: "Psychic",
      expectedTargets: 3,
      roundWeight: [1, 0, 0],
    },
    conditionProfile: {
      condition: "Frightened",
      severity: "Moderate",
      duration: "until_start_next_turn",
      repeatSave: false,
    },
    usageProfile: { frequency: "encounter_opener" },
  },
  "corpse-tendrils": {
    mechanicTags: ["corpse_requirement", "aoe", "restrained", "repeat_save"],
    pressureTags: ["area", "control", "terrain_anchor"],
    complexityTags: ["corpse_anchor", "repeat_save", "condition_tracking"],
    conditionProfile: {
      condition: "Restrained",
      severity: "Major",
      duration: "1_minute",
      repeatSave: true,
    },
  },
  "flesh-harvest": {
    mechanicTags: ["corpse_requirement", "scaling_buff", "action_cost"],
    pressureTags: ["sustain", "escalation"],
    complexityTags: ["stack_tracking", "corpse_tracking"],
    usageProfile: { frequency: "action", trigger: "consume_corpse" },
  },
  "web-recharge": {
    mechanicTags: ["recharge", "save", "restrained", "destroyable_anchor"],
    pressureTags: ["control", "ranged_lockdown"],
    complexityTags: ["recharge", "object_hp", "condition_tracking"],
    usageProfile: { frequency: "recharge", recharge: "5-6" },
    conditionProfile: {
      condition: "Restrained",
      severity: "Major",
      duration: "until_web_destroyed",
      repeatSave: false,
    },
  },
  "shadow-web": {
    mechanicTags: [
      "recharge",
      "save",
      "restrained",
      "ongoing_damage",
      "destroyable_anchor",
    ],
    pressureTags: ["control", "sustain", "ranged_lockdown"],
    complexityTags: [
      "recharge",
      "object_hp",
      "ongoing_tracking",
      "condition_tracking",
    ],
    damageProfile: {
      baseDamage: 2,
      damageType: "Slashing",
      expectedTargets: 1,
      roundWeight: [1, 0.5, 0.5],
    },
    usageProfile: { frequency: "recharge", recharge: "5-6" },
    conditionProfile: {
      condition: "Restrained",
      severity: "Major",
      duration: "until_web_destroyed",
      repeatSave: false,
    },
  },
  "corrosive-web": {
    mechanicTags: ["web_modifier", "ongoing_damage"],
    pressureTags: ["sustain", "control_synergy"],
    complexityTags: ["trigger_tracking"],
    damageProfile: {
      baseDamage: 2,
      damageType: "Acid",
      expectedTargets: 1,
      roundWeight: [0.4, 0.4, 0.4],
    },
  },
  "egg-carrier": {
    mechanicTags: ["summon", "random_table", "destroyable_anchor"],
    pressureTags: ["action_economy", "escalation"],
    complexityTags: ["round_tracking", "summon_tracking", "object_tracking"],
    usageProfile: { frequency: "start_of_turn_random" },
  },
  "enrage-broodmother": {
    mechanicTags: ["reaction", "rage", "random_trigger", "egg_requirement"],
    pressureTags: ["retaliation", "tempo"],
    complexityTags: ["reaction_trigger", "state_change"],
    usageProfile: { frequency: "reaction", trigger: "egg_destroyed" },
  },
  "egg-hatch-death": {
    mechanicTags: ["death_effect", "summon", "random_table", "egg_requirement"],
    pressureTags: ["death_escalation", "action_economy"],
    complexityTags: ["death_trigger", "summon_tracking"],
    usageProfile: { frequency: "death" },
  },
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
  const tier =
    MONSTER_TIERS.find((item) => item.id === tierId) || MONSTER_TIERS[0];
  return Math.max(1, Math.round(base * tier.hpMult));
}

function getExpectedDpr(cr, tierId = "normal") {
  const legendaryLike =
    tierId === "legendary" || tierId === "boss" || tierId === "setpiece";
  const base =
    cr < 20
      ? legendaryLike
        ? 7.5 + 7.5 * cr
        : 6 + 6 * cr
      : legendaryLike
        ? 165 + 15 * (cr - 20)
        : 132 + 12 * (cr - 20);
  const tier =
    MONSTER_TIERS.find((item) => item.id === tierId) || MONSTER_TIERS[0];
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
    Ghoul: { dex: 2, str: 1 },
    Wraith: { str: -2, dex: 4, cha: 2 },
    Spider: { str: -2, dex: 2 },
    Wolf: { str: 2, wis: 1 },
    "Rat Swarm": { str: -4, dex: 3 },
    "Carrion Bird": { dex: 3, wis: 1 },
    "Flesh Mass": { dex: -2, con: 4 },
    "Eye Horror": { dex: 1, int: 2, wis: 2 },
    Parasite: { dex: 3, con: -1 },
    "Psychic Predator": { int: 3, wis: 2, cha: 2 },
  };

  Object.entries(categoryAdjustments[category] || {}).forEach(
    ([ability, value]) => {
      scores[ability] += value;
    },
  );

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
  const source = sourceFeature
    ? SOURCES.find((s) => s.id === sourceFeature.source)?.label
    : null;

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
  const typeMatch =
    !feature.typeBias?.length || feature.typeBias.includes(typeId);
  const roleMatch =
    !feature.roleBias?.length || feature.roleBias.includes(roleId);
  const slotMatch = !slotId || feature.slot === slotId;
  return sourceMatch && typeMatch && roleMatch && slotMatch;
}

function featureMatchesSourceAndSlot(feature, sourceId, slotId = null) {
  const sourceMatch = feature.source === sourceId;
  const slotMatch = !slotId || feature.slot === slotId;
  return sourceMatch && slotMatch;
}

function getPresetById(presetId) {
  return (
    MONSTER_FAMILY_PRESETS.find((preset) => preset.id === presetId) || null
  );
}

function normalizePresetSelection(preset) {
  if (!preset?.selection) return {};
  return Object.fromEntries(
    Object.entries(preset.selection)
      .map(([slotId, value]) => {
        const ids = asArray(value).filter((id) =>
          FEATURES.some(
            (feature) => feature.id === id && feature.slot === slotId,
          ),
        );
        return [slotId, ids.length > 1 ? ids : ids[0]];
      })
      .filter(([, value]) =>
        Array.isArray(value) ? value.length : Boolean(value),
      ),
  );
}

function getPresetFeatureIds(preset) {
  return Object.values(normalizePresetSelection(preset)).flatMap((value) =>
    Array.isArray(value) ? value : [value],
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

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function uniqueArray(values) {
  return [...new Set(values.filter(Boolean))];
}

function getFeatureCompatibility(feature) {
  const override = FEATURE_COMPATIBILITY_OVERRIDES[feature.id] || {};
  return {
    grants: uniqueArray([
      ...asArray(feature.grants),
      ...asArray(override.grants),
    ]),
    requires: uniqueArray([
      ...asArray(feature.requires),
      ...asArray(override.requires),
    ]),
    softRequires: uniqueArray([
      ...asArray(feature.softRequires),
      ...asArray(override.softRequires),
    ]),
    incompatibleWith: uniqueArray([
      ...asArray(feature.incompatibleWith),
      ...asArray(override.incompatibleWith),
    ]),
    avoidWith: uniqueArray([
      ...asArray(feature.avoidWith),
      ...asArray(override.avoidWith),
    ]),
  };
}

function formatToken(token) {
  return String(token || "")
    .replace(/^type:/, "")
    .replace(/^category:/, "")
    .replace(/[_.-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBaseTokens(typeId, category) {
  const normalizedCategory = String(category || "")
    .toLowerCase()
    .trim()
    .split(" ")
    .filter(Boolean)
    .join("_");
  const tokens = [`type:${typeId}`, `${typeId}_body`];

  if (typeId === "undead")
    tokens.push("undead_body", "corpse_body", "corpse_presence");
  if (typeId === "beast") tokens.push("beast_body");
  if (typeId === "aberration") tokens.push("aberration_body");
  if (normalizedCategory) tokens.push(`category:${normalizedCategory}`);
  if (normalizedCategory.includes("spider"))
    tokens.push("spider_body", "climber", "web_maker", "web_terrain");
  if (normalizedCategory.includes("wraith")) tokens.push("spirit_body");
  if (normalizedCategory.includes("flesh_mass"))
    tokens.push("corpse_body", "bloated_body");

  return uniqueArray(tokens);
}

function getGrantedTokens(features, typeId, category) {
  return uniqueArray([
    ...getBaseTokens(typeId, category),
    ...features.flatMap((feature) => getFeatureCompatibility(feature).grants),
  ]);
}

function tokenOverlap(left, right) {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token));
}

function getCompatibilityStatus(
  feature,
  selectedFeatures = [],
  typeId = "undead",
  category = "Zombie",
) {
  const compatibility = getFeatureCompatibility(feature);
  const grantedTokens = getGrantedTokens(selectedFeatures, typeId, category);
  const selectedBlocks = uniqueArray(
    selectedFeatures.flatMap(
      (item) => getFeatureCompatibility(item).incompatibleWith,
    ),
  );
  const missingRequires = compatibility.requires.filter(
    (token) => !grantedTokens.includes(token),
  );
  const blockingTokens = tokenOverlap(
    compatibility.incompatibleWith,
    grantedTokens,
  );
  const blockedBySelected = tokenOverlap(selectedBlocks, compatibility.grants);
  const missingSoftRequires = compatibility.softRequires.filter(
    (token) => !grantedTokens.includes(token),
  );
  const avoidTokens = tokenOverlap(compatibility.avoidWith, grantedTokens);

  if (blockingTokens.length || blockedBySelected.length) {
    const tokens = uniqueArray([...blockingTokens, ...blockedBySelected]);
    return {
      kind: "incompatible",
      label: "Incompatible",
      tokens,
      message: `Incompatible with ${tokens.map(formatToken).join(", ")}.`,
    };
  }

  if (missingRequires.length) {
    return {
      kind: "missing",
      label: "Missing Requirement",
      tokens: missingRequires,
      message: `Requires ${missingRequires.map(formatToken).join(", ")}.`,
    };
  }

  if (missingSoftRequires.length) {
    return {
      kind: "soft",
      label: "Soft Warning",
      tokens: missingSoftRequires,
      message: `Works best with ${missingSoftRequires.map(formatToken).join(", ")}.`,
    };
  }

  if (avoidTokens.length) {
    return {
      kind: "avoid",
      label: "Needs Justification",
      tokens: avoidTokens,
      message: `Avoid with ${avoidTokens.map(formatToken).join(", ")} unless this is intentional.`,
    };
  }

  return {
    kind: "compatible",
    label: "Compatible",
    tokens: [],
    message: "All requirements satisfied.",
  };
}

function getComposerMode(advancedMode, customMode) {
  if (customMode) return "custom";
  if (advancedMode) return "advanced";
  return "guided";
}

function canShowFeatureForMode(status, mode) {
  if (mode === "custom") return true;
  if (mode === "advanced") return status.kind !== "incompatible";
  return status.kind !== "missing" && status.kind !== "incompatible";
}

function getCompatibilityRank(status) {
  const rank = {
    compatible: 0,
    soft: 1,
    avoid: 2,
    missing: 3,
    incompatible: 4,
  };
  return rank[status.kind] ?? 5;
}

function getFeatureDecisionProfile(feature, context = {}) {
  const status = context.status || {
    kind: "compatible",
    label: "Compatible",
    message: "All requirements satisfied.",
  };
  const selected = context.selected || {};
  const selectedFeatures = context.selectedFeatures || [];
  const typeId = context.typeId || "undead";
  const category = context.category || "Zombie";
  const roleId = context.roleId || "standard";
  const tacticalRoleId = context.tacticalRoleId || "brute";
  const currentSlot = context.currentSlot || "all";
  const section = getFeatureSection(feature);
  const mechanicProfile = getFeatureMechanicProfile(feature);
  const counterplayProfile = getFeatureCounterplayProfile(feature);
  const compatibility = getFeatureCompatibility(feature);
  const grantedTokens = getGrantedTokens(selectedFeatures, typeId, category);
  const synergyTokens = uniqueArray(
    [...compatibility.requires, ...compatibility.softRequires].filter((token) =>
      grantedTokens.includes(token),
    ),
  );
  const complexityTags = mechanicProfile.complexityTags || [];
  const currentSlotMatch =
    currentSlot !== "all" && feature.slot === currentSlot;
  const slotEmpty = !hasSelectedSlot(selected, feature.slot);
  const simple =
    feature.complexity <= 1 &&
    Math.max(0, feature.cost) <= 3 &&
    !complexityTags.some((tag) =>
      [
        "reaction_trigger",
        "ongoing_tracking",
        "summon_tracking",
        "round_tracking",
        "delayed_tracking",
      ].includes(tag),
    );
  const highPressure =
    feature.cost >= 5 ||
    (feature.stats?.dpr || 0) >= 6 ||
    (feature.stats?.control || 0) >= 3 ||
    counterplayProfile.burst ||
    counterplayProfile.hardControl;
  const needsTell =
    highPressure &&
    !hasSelectedSlot(selected, "weakness") &&
    feature.slot !== "weakness";
  const bossOnly =
    (asArray(feature.roleBias).length > 0 &&
      asArray(feature.roleBias).every((role) => role === "boss")) ||
    section === "lairAction" ||
    section === "legendaryAction";
  const risky =
    ["soft", "avoid", "missing", "incompatible"].includes(status.kind) ||
    needsTell ||
    (highPressure && feature.complexity >= 3);
  const blocked = ["missing", "incompatible"].includes(status.kind);
  const recommended =
    !blocked &&
    !risky &&
    !context.selectedInSlot &&
    (currentSlotMatch || (currentSlot === "all" && slotEmpty)) &&
    (simple ||
      synergyTokens.length > 0 ||
      Math.max(0, feature.cost) <= 4 ||
      roleId === "boss");

  const bestForParts = [];
  if (feature.slot === "body") bestForParts.push("Foundation");
  if (feature.slot === "weakness") bestForParts.push("Counterplay");
  if (["death", "lair", "twist"].includes(feature.slot))
    bestForParts.push("Setpiece");
  if ((feature.stats?.control || 0) >= 2) bestForParts.push("Controller");
  if ((feature.stats?.mobility || 0) >= 2)
    bestForParts.push(tacticalRoleId === "lurker" ? "Lurker" : "Skirmisher");
  if ((feature.stats?.dpr || 0) >= 5)
    bestForParts.push(tacticalRoleId === "artillery" ? "Artillery" : "Damage");
  if (asArray(feature.roleBias).includes("boss")) bestForParts.push("Boss");
  if (!bestForParts.length) bestForParts.push(titleCase(feature.slot));

  const badges = uniqueArray([
    recommended ? "Recommended" : null,
    simple ? "Simple" : null,
    highPressure ? "High Pressure" : null,
    needsTell ? "Needs Tell" : null,
    bossOnly ? "Boss Only" : null,
    synergyTokens.length ? "Synergy" : null,
    risky && !blocked ? "Risky" : null,
    blocked ? "Blocked" : null,
  ]);

  let riskLabel = "Low";
  if (blocked) riskLabel = status.label;
  else if (needsTell) riskLabel = "Needs Tell";
  else if (["soft", "avoid"].includes(status.kind)) riskLabel = status.label;
  else if (counterplayProfile.hardControl) riskLabel = "Hard Control";
  else if (highPressure) riskLabel = "High Pressure";
  else if (complexityTags.length >= 3) riskLabel = "Tracking";

  const tier = blocked
    ? "blocked"
    : risky
      ? "risky"
      : recommended
        ? "recommended"
        : simple
          ? "simple"
          : "standard";
  const rank =
    (recommended ? 0 : simple ? 10 : risky ? 35 : 20) +
    getCompatibilityRank(status) * 10 +
    Math.max(0, feature.cost) +
    feature.complexity * 1.5 -
    synergyTokens.length * 4 -
    (currentSlotMatch ? 6 : 0);

  return {
    tier,
    rank,
    recommended,
    simple,
    highPressure,
    needsTell,
    bossOnly,
    risky,
    blocked,
    badges,
    bestFor: uniqueArray(bestForParts).slice(0, 2).join(" / "),
    riskLabel,
    synergyTokens,
  };
}

function getFeatureDecisionRank(profile) {
  return Number(profile?.rank ?? 99);
}

function formatFeatureImpact(feature) {
  const pressure = feature.cost > 0 ? `+${feature.cost}` : String(feature.cost);
  return `Pressure ${pressure} · Complexity ${feature.complexity}`;
}

function getFeatureSpiceScore(feature, profile) {
  const section = getFeatureSection(feature);
  const counterplayProfile = getFeatureCounterplayProfile(feature);
  const setpieceWeight =
    ["horror", "twist", "death", "lair"].includes(feature.slot) ||
    ["reaction", "death", "lairAction", "legendaryAction"].includes(section)
      ? 8
      : 0;
  return (
    Math.max(0, feature.cost) * 2 +
    feature.complexity * 2 +
    Math.max(0, feature.stats?.dpr || 0) +
    Math.max(0, feature.stats?.control || 0) * 2 +
    setpieceWeight +
    (profile?.highPressure ? 5 : 0) +
    (counterplayProfile.burst ? 4 : 0) +
    (counterplayProfile.hardControl ? 4 : 0) -
    (profile?.blocked ? 100 : 0)
  );
}

function getFeatureSafetyScore(feature, profile) {
  const mechanicProfile = getFeatureMechanicProfile(feature);
  const counterplayProfile = getFeatureCounterplayProfile(feature);
  const trackingPenalty =
    mechanicProfile.complexityTags.filter((tag) =>
      [
        "reaction_trigger",
        "ongoing_tracking",
        "summon_tracking",
        "round_tracking",
        "delayed_tracking",
        "object_tracking",
      ].includes(tag),
    ).length * 4;
  return (
    60 -
    Math.max(0, feature.cost) * 4 -
    feature.complexity * 6 -
    trackingPenalty -
    (counterplayProfile.hardControl ? 10 : 0) -
    (counterplayProfile.burst ? 8 : 0) -
    (profile?.risky ? 8 : 0) +
    Math.max(0, feature.stats?.fairness || 0) * 7 +
    (feature.slot === "weakness" ? 12 : 0) +
    (profile?.simple ? 8 : 0)
  );
}

function buildSmartSlotPicks({
  slotId,
  candidates,
  selected,
  selectedFeatures,
  typeId,
  category,
  roleId,
  tacticalRoleId,
  monsterTierId,
}) {
  if (!slotId || slotId === "all") return [];
  const slotCandidates = candidates
    .filter(
      (feature) =>
        feature.slot === slotId &&
        !getSelectedIdsForSlot(selected, feature.slot).includes(feature.id),
    )
    .map((feature) => {
      const status = getCompatibilityStatus(
        feature,
        selectedFeatures,
        typeId,
        category,
      );
      const profile = getFeatureDecisionProfile(feature, {
        status,
        selected,
        selectedFeatures,
        typeId,
        category,
        roleId,
        tacticalRoleId,
        monsterTierId,
        currentSlot: slotId,
      });
      return { feature, status, profile };
    })
    .filter((item) => !item.profile.blocked);

  const used = new Set();
  const take = (id, label, reason, items) => {
    const item = items.find((candidate) => !used.has(candidate.feature.id));
    if (!item) return null;
    used.add(item.feature.id);
    return {
      id,
      label,
      reason,
      feature: item.feature,
      profile: item.profile,
      status: item.status,
    };
  };

  const recommended = take(
    "recommended",
    "Recommended",
    "Best fit for the current frame.",
    [...slotCandidates].sort(
      (a, b) =>
        getFeatureDecisionRank(a.profile) - getFeatureDecisionRank(b.profile) ||
        a.feature.title.localeCompare(b.feature.title),
    ),
  );

  const safe = take(
    "safe",
    "Safe",
    "Low tracking and easy to run.",
    [...slotCandidates]
      .filter(
        ({ feature, profile }) =>
          feature.complexity <= 2 &&
          Math.max(0, feature.cost) <= 4 &&
          !profile.blocked,
      )
      .sort(
        (a, b) =>
          getFeatureSafetyScore(b.feature, b.profile) -
            getFeatureSafetyScore(a.feature, a.profile) ||
          getFeatureDecisionRank(a.profile) - getFeatureDecisionRank(b.profile),
      ),
  );

  const spicy = take(
    "spicy",
    "Spicy",
    "More memorable, heavier at the table.",
    [...slotCandidates]
      .filter(({ profile }) => !profile.blocked)
      .sort(
        (a, b) =>
          getFeatureSpiceScore(b.feature, b.profile) -
            getFeatureSpiceScore(a.feature, a.profile) ||
          b.feature.cost - a.feature.cost,
      ),
  );

  return [recommended, safe, spicy].filter(Boolean);
}

function buildFeatureImpactPreview({
  feature,
  selected,
  selectedFeatures,
  typeId,
  category,
  computed,
}) {
  const alreadySelected = getSelectedIdsForSlot(
    selected,
    feature.slot,
  ).includes(feature.id);
  if (alreadySelected) {
    return {
      pressureDelta: 0,
      complexityDelta: 0,
      hpDelta: 0,
      acDelta: 0,
      dprDelta: 0,
      counterplay: "Installed",
      warningsAdded: 0,
      warningsCleared: 0,
    };
  }

  const nextFeatures = [...selectedFeatures, feature];
  const statMods = nextFeatures.reduce(
    (acc, item) => {
      Object.entries(item.stats || {}).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    },
    { hp: 0, dpr: 0, ac: 0, control: 0, mobility: 0, fairness: 0 },
  );
  const featureMechanics = nextFeatures.map((item) => ({
    id: item.id,
    title: item.title,
    ...getFeatureMechanicProfile(item),
  }));
  const mechanicsSummary = summarizeMechanicProfiles(featureMechanics);
  const cost = nextFeatures.reduce((sum, item) => sum + item.cost, 0);
  const rawComplexity = nextFeatures.reduce(
    (sum, item) => sum + item.complexity,
    0,
  );
  const nextPressureProfile = buildPressureProfile({
    cost,
    monsterTier: computed.monsterTier,
    tempoProfile: computed.tempoProfile,
    statMods,
    mechanicsSummary,
    budget: computed.budget,
  });
  const nextComplexityProfile = buildComplexityProfile({
    complexity: rawComplexity,
    mechanicsSummary,
    featureMechanics,
    limit: computed.complexityCap,
  });
  const compatibility = getCompatibilityStatus(
    feature,
    selectedFeatures,
    typeId,
    category,
  );
  const counterplayProfile = getFeatureCounterplayProfile(feature);
  const currentHasWeakness = hasSelectedSlot(selected, "weakness");
  const clearsWeaknessWarning =
    feature.slot === "weakness" && !currentHasWeakness ? 1 : 0;
  const pressureCrossesLimit =
    computed.pressure <= computed.budget &&
    nextPressureProfile.score > computed.budget
      ? 1
      : 0;
  const complexityCrossesLimit =
    computed.complexity <= computed.complexityCap &&
    nextComplexityProfile.score > computed.complexityCap
      ? 1
      : 0;
  const compatibilityWarning = ["missing", "incompatible"].includes(
    compatibility.kind,
  )
    ? 1
    : 0;
  const highPressureNeedsTell =
    !currentHasWeakness &&
    feature.slot !== "weakness" &&
    (feature.cost >= 5 ||
      counterplayProfile.hardControl ||
      counterplayProfile.burst)
      ? 1
      : 0;

  let counterplay = "Neutral";
  if (
    feature.slot === "weakness" ||
    counterplayProfile.hasNonDamageAnswer ||
    counterplayProfile.hasBreakCondition
  )
    counterplay = "Improves";
  if (counterplayProfile.hardControl || counterplayProfile.burst)
    counterplay = currentHasWeakness ? "Needs Tell" : "Worsens";

  return {
    pressureDelta: nextPressureProfile.score - computed.pressure,
    complexityDelta: nextComplexityProfile.score - computed.complexity,
    hpDelta: feature.stats?.hp || 0,
    acDelta: feature.stats?.ac || 0,
    dprDelta: feature.stats?.dpr || 0,
    counterplay,
    warningsAdded:
      pressureCrossesLimit +
      complexityCrossesLimit +
      compatibilityWarning +
      highPressureNeedsTell,
    warningsCleared: clearsWeaknessWarning,
  };
}

function signedDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

function formatFeatureImpactPreview(impact) {
  const parts = [
    `Pressure ${signedDelta(impact.pressureDelta)}`,
    `Complexity ${signedDelta(impact.complexityDelta)}`,
  ];
  if (impact.dprDelta) parts.push(`DPR ${signedDelta(impact.dprDelta)}`);
  if (impact.hpDelta) parts.push(`HP ${signedDelta(impact.hpDelta)}`);
  if (impact.acDelta) parts.push(`AC ${signedDelta(impact.acDelta)}`);
  if (impact.counterplay && impact.counterplay !== "Neutral")
    parts.push(`Counterplay ${impact.counterplay}`);
  if (impact.warningsCleared) parts.push(`Clears ${impact.warningsCleared}`);
  if (impact.warningsAdded)
    parts.push(
      `Adds ${impact.warningsAdded} warning${impact.warningsAdded === 1 ? "" : "s"}`,
    );
  return parts.join(" · ");
}

function buildCompatibilityWarning(feature, status) {
  if (!status || status.kind === "compatible") return null;
  return `Compatibility: ${feature.title} — ${status.message}`;
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
    usageProfile:
      override.usageProfile || feature.usageProfile || fallbackUsage,
    conditionProfile:
      override.conditionProfile || feature.conditionProfile || null,
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
  const conditionProfiles = profiles
    .map((profile) => profile.conditionProfile)
    .filter(Boolean);
  const structuredDamage = profiles.reduce((sum, profile) => {
    const damage = profile.damageProfile || {};
    const weights = Array.isArray(damage.roundWeight)
      ? damage.roundWeight
      : [1, 1, 1];
    const averageWeight =
      weights.reduce((total, value) => total + value, 0) /
      Math.max(1, weights.length);
    return (
      sum +
      Math.max(0, damage.baseDamage || 0) *
        Math.max(1, damage.expectedTargets || 1) *
        averageWeight
    );
  }, 0);

  return {
    mechanicTags: countValues(mechanicTags),
    pressureTags: countValues(pressureTags),
    complexityTags: countValues(complexityTags),
    rechargeCount: usageProfiles.filter(
      (profile) => profile.frequency === "recharge",
    ).length,
    reactionCount: usageProfiles.filter(
      (profile) => profile.frequency === "reaction",
    ).length,
    deathEffectCount: usageProfiles.filter(
      (profile) => profile.frequency === "death",
    ).length,
    conditionCount: conditionProfiles.length,
    majorConditionCount: conditionProfiles.filter((profile) =>
      ["Major", "Severe"].includes(profile.severity),
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
    Object.entries(breakdown).map(([key, value]) => [key, Math.round(value)]),
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
    .map(
      ([key, value]) =>
        `${labelMap[key] || titleCase(key)} ${value > 0 ? "+" : ""}${value}`,
    );
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
    area:
      tagCount(pressureTags, "area") * 1 +
      tagCount(pressureTags, "death_burst") * 0.6,
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
    defense:
      Math.max(0, statMods.hp || 0) / 28 + Math.max(0, statMods.ac || 0) * 0.85,
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

function buildComplexityProfile({
  complexity,
  mechanicsSummary,
  featureMechanics,
  limit,
}) {
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
    .map(
      ([key, value]) =>
        `${labelMap[key] || titleCase(key)} ${value > 0 ? "+" : ""}${value}`,
    )
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
  const majorCondition = ["Major", "Severe"].includes(
    mechanicProfile.conditionProfile?.severity,
  );
  const hardControl =
    control >= 2 ||
    majorCondition ||
    mechanicProfile.mechanicTags.some((tag) =>
      [
        "restrained",
        "grapple",
        "condition",
        "exhaustion",
        "healing_denial",
      ].includes(tag),
    );
  const burst =
    dpr >= 6 ||
    mechanicProfile.pressureTags.some((tag) =>
      ["burst", "death_burst", "reaction_burst"].includes(tag),
    );
  const agencyTags = uniqueArray([
    textHasAny(text, COUNTERPLAY_TERMS.telegraph) ? "telegraph" : null,
    textHasAny(text, COUNTERPLAY_TERMS.breakCondition)
      ? "break_condition"
      : null,
    textHasAny(text, COUNTERPLAY_TERMS.nonDamageAnswer)
      ? "non_damage_answer"
      : null,
    textHasAny(text, COUNTERPLAY_TERMS.positioning)
      ? "positioning_answer"
      : null,
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
    hasBreakCondition:
      agencyTags.includes("break_condition") || feature.slot === "weakness",
    hasNonDamageAnswer:
      agencyTags.includes("non_damage_answer") || feature.slot === "weakness",
    agencyTags,
    mechanicTags: mechanicProfile.mechanicTags,
    risk: hardControl
      ? "Control"
      : burst
        ? "Burst"
        : feature.cost >= 5
          ? "High Cost"
          : "Routine",
  };
}

function summarizeCounterplayProfiles(profiles) {
  const oppressive = profiles.filter((profile) => profile.isOppressive);
  return {
    total: profiles.length,
    oppressiveCount: oppressive.length,
    withCounterplayText: profiles.filter(
      (profile) => profile.hasCounterplayText,
    ).length,
    telegraphedCount: profiles.filter((profile) => profile.hasTelegraph).length,
    breakConditionCount: profiles.filter((profile) => profile.hasBreakCondition)
      .length,
    nonDamageAnswerCount: profiles.filter(
      (profile) => profile.hasNonDamageAnswer,
    ).length,
    hardControlCount: profiles.filter((profile) => profile.hardControl).length,
    burstCount: profiles.filter((profile) => profile.burst).length,
    agencyTags: countValues(profiles.flatMap((profile) => profile.agencyTags)),
    untelegraphedOppressive: oppressive.filter(
      (profile) => !profile.hasTelegraph,
    ),
    unresolvedOppressive: oppressive.filter(
      (profile) => !profile.hasBreakCondition && !profile.hasNonDamageAnswer,
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
      "Add a Weakness / Tell graft with a visible trigger or non-damage solution.",
    );
  }

  if (summary.unresolvedOppressive.length) {
    issues.push({
      severity: "major",
      label: "Oppressive Grafts Need Answers",
      detail: summary.unresolvedOppressive
        .map((profile) => profile.title)
        .join(", "),
    });
    recommendations.push(
      "Give high-pressure grafts a break condition, destroyable object, repeat save, positioning answer, or preparation answer.",
    );
  }

  if (summary.untelegraphedOppressive.length >= 2) {
    issues.push({
      severity: "major",
      label: "Too Many Untelegraphed Threats",
      detail: summary.untelegraphedOppressive
        .map((profile) => profile.title)
        .join(", "),
    });
    recommendations.push(
      "Add visual, audio, timing, or behavior tells before the most punishing abilities resolve.",
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
      "Prefer repeat saves, escape checks, destroyed anchors, visible setup, or one-round durations for hard control.",
    );
  }

  if (mechanicsSummary.deathEffectCount && !hasDeath) {
    issues.push({
      severity: "minor",
      label: "Implicit Death Pressure",
      detail:
        "Structured mechanics imply death pressure, but no Death Effect slot is occupied.",
    });
  }

  if (
    pressureProfile.label === "Critical" &&
    summary.nonDamageAnswerCount < 2
  ) {
    issues.push({
      severity: "critical",
      label: "Critical Pressure Needs Non-Damage Answers",
      detail: "The build is highly pressuring but has few non-damage answers.",
    });
    recommendations.push(
      "Add answers such as fire, radiant damage, distance, cover, bait, rites, medicine, object destruction, or light management.",
    );
  }

  if (
    ["boss", "legendary", "setpiece"].includes(monsterTier.id) &&
    !hasLair &&
    roleId === "boss"
  ) {
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
    100,
  );

  return {
    score,
    rating:
      score >= 82
        ? "Strong"
        : score >= 64
          ? "Playable"
          : score >= 45
            ? "Needs Work"
            : "Unsafe",
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
      (a, b) =>
        weightFn(b) - weightFn(a) ||
        b.cost - a.cost ||
        a.title.localeCompare(b.title),
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
      if (getSelectedIdsForSlot(selected, feature.slot).includes(feature.id))
        return false;
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
      return {
        feature,
        status,
        profile,
        safety: getFeatureSafetyScore(feature, profile),
      };
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
    (id) => id !== feature.id,
  );
  const next = { ...selected };
  if (!currentIds.length) delete next[feature.slot];
  else
    next[feature.slot] = Array.isArray(selected[feature.slot])
      ? currentIds
      : currentIds[0];
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
  const reducedFeatures = selectedFeatures.filter(
    (item) => item.id !== feature.id,
  );
  const reducedSelected = getSelectedWithoutFeature(selected, feature);
  const originalWeight =
    reason === "complexity"
      ? getFeatureComplexityWeight(feature)
      : getFeaturePressureWeight(feature);
  const candidates = FEATURES.map((candidate) => ({
    candidate,
    status: getCompatibilityStatus(
      candidate,
      reducedFeatures,
      typeId,
      category,
    ),
  }))
    .filter(({ candidate, status }) => {
      if (candidate.id === feature.id) return false;
      if (candidate.slot !== feature.slot) return false;
      if (
        getSelectedIdsForSlot(reducedSelected, candidate.slot).includes(
          candidate.id,
        )
      )
        return false;
      const frameMatch = customMode
        ? featureMatchesSourceAndSlot(candidate, sourceId, feature.slot)
        : featureMatchesFrame(
            candidate,
            sourceId,
            typeId,
            roleId,
            feature.slot,
          );
      if (!frameMatch || !canShowFeatureForMode(status, composerMode))
        return false;
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
        a.feature.title.localeCompare(b.feature.title),
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
          item.removeFeatureId === fix.removeFeatureId,
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

  if (
    ["missing-weakness", "counterplay", "conditions"].includes(issue) &&
    weaknessFix
  ) {
    pushFix({
      label: `Add ${weaknessFix.title}`,
      kind: "addFeature",
      featureId: weaknessFix.id,
    });
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
      pushFix({
        label: `Add ${twistFix.title}`,
        kind: "addFeature",
        featureId: twistFix.id,
      });
    if (lairFix)
      pushFix({
        label: `Add ${lairFix.title}`,
        kind: "addFeature",
        featureId: lairFix.id,
      });
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
    if (recommendations.some((recommendation) => recommendation.id === item.id))
      return;
    recommendations.push(item);
  };

  const topPressureFeature = getTopFeatureByWeight(
    selectedFeatures,
    getFeaturePressureWeight,
  );
  const topComplexityFeature = getTopFeatureByWeight(
    selectedFeatures,
    getFeatureComplexityWeight,
  );
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
        {
          label: `Set ${titleCase(nextTier)} Tier`,
          kind: "tier",
          tierId: nextTier,
        },
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
      detail:
        "Hard control, burst damage, or scene pressure needs a clear answer.",
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
    counterplayAudit.summary.breakConditionCount <
      mechanicsSummary.majorConditionCount
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
      detail:
        "Too many reaction hooks can slow turns and feel like hidden punishment.",
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
      detail:
        "A boss with no Twist or Lair may play like a high-HP standard monster.",
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

  if (
    dpr > baseline.dpr * 1.4 ||
    effectiveProfile.burstDpr > baseline.dpr * 1.75
  ) {
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
    return [
      "body",
      "mind",
      "movement",
      "attack",
      "horror",
      "twist",
      "weakness",
      "lair",
      "death",
    ];
  return [
    "body",
    "mind",
    "movement",
    "attack",
    "horror",
    "weakness",
    "twist",
    "death",
  ];
}

function getSelectedIdsForSlot(selected, slotId) {
  const value = selected[slotId];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function getFeaturesFromSelection(selected) {
  return Object.values(selected)
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((id) => FEATURES.find((feature) => feature.id === id))
    .filter(Boolean);
}

function collapseSelectedToSingle(current) {
  return Object.fromEntries(
    Object.entries(current)
      .map(([slotId, value]) => [
        slotId,
        getSelectedIdsForSlot(current, slotId)[0],
      ])
      .filter(([, value]) => Boolean(value)),
  );
}

function trimSelectedToCaps(current, slotCaps) {
  return Object.fromEntries(
    Object.entries(current)
      .map(([slotId]) => {
        const cap = getSlotCap(slotCaps, slotId);
        const ids = getSelectedIdsForSlot(current, slotId).slice(0, cap);
        return [slotId, cap <= 1 ? ids[0] : ids];
      })
      .filter(([, value]) =>
        Array.isArray(value) ? value.length : Boolean(value),
      ),
  );
}

function hasSelectedSlot(selected, slotId) {
  return getSelectedIdsForSlot(selected, slotId).length > 0;
}

function getSlotCap(slotCaps, slotId) {
  return clamp(Number(slotCaps?.[slotId] || 1), 1, 4);
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

function buildGuidedFlow({
  composerStarted,
  startMode,
  selected,
  computed,
  activePreset,
}) {
  const slotDetails = {
    body: {
      title: "Add Body",
      detail: "Define what the creature physically is before choosing attacks.",
      cta: "Open Body Slot",
    },
    attack: {
      title: "Add Attack Pattern",
      detail:
        "Give the monster a main offensive loop the DM can run every round.",
      cta: "Open Attack Slot",
    },
    weakness: {
      title: "Add Weakness / Tell",
      detail:
        "Add visible counterplay so the horror feels fair instead of arbitrary.",
      cta: "Open Weakness Slot",
    },
    movement: {
      title: "Add Movement",
      detail:
        "Decide how the monster reaches, pressures, or fails to reach the characters.",
      cta: "Open Movement Slot",
    },
    mind: {
      title: "Add Mind",
      detail:
        "Give the creature a behavior rule the DM can follow without guessing.",
      cta: "Open Mind Slot",
    },
    horror: {
      title: "Add Horror Feature",
      detail:
        "Install the memorable disturbing element that players will remember.",
      cta: "Open Horror Slot",
    },
    twist: {
      title: "Add Combat Twist",
      detail:
        "Add one fight-changing rule if this monster needs a stronger table presence.",
      cta: "Open Twist Slot",
    },
    death: {
      title: "Add Death Effect",
      detail:
        "Decide whether death creates a clue, risk, terrain change, or final beat.",
      cta: "Open Death Slot",
    },
    lair: {
      title: "Add Lair / Scene Effect",
      detail:
        "Use scene pressure only when the battlefield should matter as much as the body.",
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
  const completedSlots = SLOTS.filter((slot) =>
    hasSelectedSlot(selected, slot.id),
  ).length;
  const filledRecommendedCount = slotRoadmap.filter(
    (step) => step.filled,
  ).length;
  const hasSetpieceSlot = ["twist", "death", "lair"].some((slotId) =>
    hasSelectedSlot(selected, slotId),
  );
  const pressureOk = computed.pressure <= computed.budget;
  const complexityOk = computed.complexity <= computed.complexityCap;
  const counterplayOk = ["Strong", "Playable"].includes(
    computed.counterplayAudit.rating,
  );
  const balanceReady = pressureOk && complexityOk && counterplayOk;
  const exportReady =
    composerStarted && coreReady && balanceReady && !computed.warnings.length;
  const prioritizedWarnings = [...computed.warnings]
    .sort((a, b) => {
      const rank = { critical: 0, major: 1, minor: 2 };
      return rank[classifyWarning(a)] - rank[classifyWarning(b)];
    })
    .slice(0, 3);

  const recommendedSlotId = composerStarted
    ? GUIDED_SLOT_PRIORITY.find(
        (slotId) => !hasSelectedSlot(selected, slotId),
      ) || null
    : null;
  const recommendedSlot = recommendedSlotId
    ? SLOTS.find((slot) => slot.id === recommendedSlotId)
    : null;
  const recommendedDetail = recommendedSlotId
    ? slotDetails[recommendedSlotId]
    : null;
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
      title:
        recommendedDetail?.title || `Add ${recommendedSlot?.label || "Slot"}`,
      detail:
        recommendedDetail?.detail ||
        recommendedSlot?.hint ||
        "Install the next useful graft.",
      cta: recommendedDetail?.cta || "Open Slot",
    };
  } else if (composerStarted && !balanceReady) {
    nextAction = {
      kind: "review",
      label: "Review Balance",
      title: "Review Balance",
      detail:
        "Pressure, Complexity, or Counterplay still need attention before export.",
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
      detail: attackReady
        ? "Attack pattern installed."
        : slotDetails.attack.detail,
    },
    {
      id: "weakness",
      label: "Tell",
      action: "slot",
      slotId: "weakness",
      reached: weaknessReady,
      active: activeStepId === "weakness",
      disabled: !composerStarted,
      detail: weaknessReady
        ? "Counterplay installed."
        : slotDetails.weakness.detail,
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
      detail: exportReady
        ? "Ready for handoff."
        : "Export after balance review.",
    },
  ].map((step, index) => ({ ...step, number: index + 1 }));

  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.active),
  );
  const highestReachedIndex = steps.reduce(
    (highest, step, index) =>
      step.reached ? Math.max(highest, index) : highest,
    0,
  );
  const progressIndex = exportReady
    ? steps.length - 1
    : Math.max(activeIndex, highestReachedIndex);

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

function getSilhouetteProfile(typeId) {
  return MONSTER_SILHOUETTES[typeId] || MONSTER_SILHOUETTES.undead;
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
  const affordable = sorted.find(
    (feature) => Math.max(0, feature.cost) <= remainingBudget,
  );
  if (affordable) return affordable;
  if (coreSlots.has(slotId)) return sorted[0];
  return null;
}

function getStatBlockBasics(
  creatureType,
  category,
  role,
  computed,
  abilityProfile,
  xp,
) {
  const initiative =
    (abilityProfile.physical.find((row) => row.key === "dex")?.mod || 0) +
    (computed.tempoProfile?.initiativeMod || 0);
  const initiativeTotal = 10 + initiative;
  const size =
    role.id === "boss" ? "Large" : role.id === "minion" ? "Small" : "Medium";
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
    .map(
      (item) =>
        `${item.title}. ${normalizeRulesText(item.mechanics, computed)}`,
    )
    .join(String.fromCharCode(10));
}

function abilityExportLines(abilityProfile) {
  return [...abilityProfile.physical, ...abilityProfile.mental]
    .map(
      (row) =>
        `${row.label} ${row.score} (${modText(row.mod)}), Save ${modText(row.save)}`,
    )
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
    copied = false;
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
    output = replaceAllText(
      output,
      `is ${condition}`,
      `has the ${condition} condition`,
    );
    output = replaceAllText(
      output,
      `is also ${condition}`,
      `also has the ${condition} condition`,
    );
    output = replaceAllText(
      output,
      `becomes ${condition}`,
      `has the ${condition} condition`,
    );
    output = replaceAllText(
      output,
      `falling ${condition}`,
      `having the ${condition} condition`,
    );
    output = replaceAllText(
      output,
      `falls ${condition}`,
      `has the ${condition} condition`,
    );
  });
  output = replaceAllText(output, "knocked prone", "given the Prone condition");
  output = replaceAllText(
    output,
    "knock it prone",
    "give it the Prone condition",
  );
  return output;
}

function normalizeSaveWording(text, computed) {
  if (!computed) return text;
  let output = String(text || "");
  [
    "Strength",
    "Dexterity",
    "Constitution",
    "Intelligence",
    "Wisdom",
    "Charisma",
  ].forEach((ability) => {
    output = replaceAllText(
      output,
      `${ability} Saving Throw, `,
      `${ability} Saving Throw: DC ${computed.dc}, `,
    );
    output = replaceAllText(
      output,
      `${ability} save`,
      `${ability} Saving Throw`,
    );
  });
  output = replaceAllText(
    output,
    "Strength or Dexterity save",
    "Strength or Dexterity Saving Throw",
  );
  return output;
}

function normalizeAttackWording(text, computed) {
  if (!computed) return text;
  let output = String(text || "");
  output = replaceAllText(
    output,
    "Melee Attack Roll. On hit, ",
    `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit: `,
  );
  output = replaceAllText(
    output,
    "Melee Attack Roll. On hit,",
    `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit:`,
  );
  output = replaceAllText(
    output,
    "Melee Attack Roll.",
    `Melee Attack Roll: ${modText(computed.attack)}, reach 5 ft. Hit:`,
  );
  output = replaceAllText(output, "On a hit, ", "Hit: ");
  output = replaceAllText(output, "On hit, ", "Hit: ");
  output = replaceAllText(
    output,
    "Ranged Attack Roll, range ",
    `Ranged Attack Roll: ${modText(computed.attack)}, range `,
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
    (output, [search, replacement]) =>
      replaceAllText(output, search, replacement),
    String(text || ""),
  );
}

function normalizeRulesText(text, computed = null) {
  return normalizeMonsterReferences(
    normalizeConditionWording(
      normalizeSaveWording(normalizeAttackWording(text, computed), computed),
    ),
    computed,
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
  const blockers = checks.filter(
    (check) => check.severity === "required" && !check.ready,
  );
  const reviews = checks.filter(
    (check) => check.severity === "review" && !check.ready,
  );
  const ready = blockers.length === 0 && reviews.length === 0;
  return {
    checks,
    blockers,
    reviews,
    ready,
    label: blockers.length
      ? "Blocked"
      : reviews.length
        ? "Review Recommended"
        : "Ready",
    percent: clamp(
      Math.round(
        (checks.filter((check) => check.ready).length /
          Math.max(1, checks.length)) *
          100,
      ),
      0,
      100,
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
  const topPressureFeature = getTopFeatureByWeight(
    selectedFeatures,
    getFeaturePressureWeight,
  );
  const topComplexityFeature = getTopFeatureByWeight(
    selectedFeatures,
    getFeatureComplexityWeight,
  );
  const weakness = selectedFeatures.find(
    (feature) => feature.slot === "weakness",
  );
  const movement = selectedFeatures.find(
    (feature) => feature.slot === "movement",
  );
  const horror = selectedFeatures.find((feature) => feature.slot === "horror");
  const mainAction =
    actions[0] || selectedFeatures.find((feature) => feature.slot === "attack");
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
      value: topPressureFeature
        ? topPressureFeature.title
        : "No high-pressure graft yet",
    },
    {
      label: "Table Load",
      value: topComplexityFeature
        ? topComplexityFeature.title
        : "Low tracking load",
    },
    {
      label: "Player Answer",
      value: weakness
        ? weakness.title
        : "Add a Weakness / Tell before final use",
    },
    {
      label: "Off-Turn Hook",
      value: reaction ? reaction.title : lair ? lair.title : "None",
    },
    { label: "Death Beat", value: death ? death.title : "None" },
    {
      label: "Rules Sections",
      value: `${traits.length} Traits · ${actions.length} Actions · ${bonusActions.length} Bonus · ${reactions.length} Reactions · ${lairActions.length} Lair`,
    },
  ];
}

function compactRunText(text, computed = null, maxLength = 180) {
  const normalized = normalizeRulesText(text, computed)
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function getRunFeatureTrigger(feature, computed = null) {
  const section = getFeatureSection(feature);
  const mechanics = normalizeRulesText(feature.mechanics || "", computed);
  const triggerMatch = mechanics.match(/Trigger:\s*([^\.]+)\./i);
  const rechargeMatch = mechanics.match(/Recharge\s*([0-9–-]+)/i);

  if (triggerMatch?.[1]) return triggerMatch[1].trim();
  if (rechargeMatch?.[1]) return `Recharge ${rechargeMatch[1]}`;
  if (/bloodied/i.test(mechanics)) return "When bloodied";
  if (/drops to 0 hit points|on death|when it dies/i.test(mechanics))
    return "On death";
  if (/initiative count 20/i.test(mechanics) || section === "lairAction")
    return "Initiative count 20";
  if (section === "reaction") return "Reaction trigger";
  if (section === "bonusAction") return "Bonus action";
  if (section === "action") return "Action";
  return getSectionLabel(section);
}

function getRunFeatureResponse(feature, computed = null) {
  const mechanics = normalizeRulesText(
    feature.mechanics || feature.summary || "",
    computed,
  );
  const responseMatch = mechanics.match(/Response:\s*(.+)$/i);
  if (responseMatch?.[1])
    return compactRunText(responseMatch[1], computed, 170);
  return compactRunText(mechanics, computed, 170);
}

function isRunTriggerFeature(feature) {
  const section = getFeatureSection(feature);
  const mechanics = String(feature.mechanics || "").toLowerCase();
  return (
    ["reaction", "bonusAction", "lairAction", "death"].includes(section) ||
    /recharge|bloodied|drops to 0 hit points|on death|initiative count 20|trigger:/i.test(
      feature.mechanics || "",
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
      return (
        (order[a.section] ?? 9) - (order[b.section] ?? 9) ||
        a.title.localeCompare(b.title)
      );
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
    selectedFeatures.filter((feature) =>
      /recharge/i.test(feature.mechanics || ""),
    ),
  );
  const conditionItems = selectedFeatures
    .map((feature) => ({
      feature,
      profile: getFeatureMechanicProfile(feature),
    }))
    .filter((item) => item.profile.conditionProfile);
  const objectItems = selectedFeatures.filter((feature) => {
    const profile = getFeatureMechanicProfile(feature);
    return (
      profile.mechanicTags.some((tag) =>
        [
          "destroyable_anchor",
          "corpse_requirement",
          "egg_requirement",
        ].includes(tag),
      ) ||
      profile.complexityTags.some((tag) =>
        [
          "object_hp",
          "object_tracking",
          "corpse_anchor",
          "corpse_tracking",
          "terrain_anchor",
          "summon_tracking",
        ].includes(tag),
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
              ({ feature, profile }) =>
                `${feature.title}: ${profile.conditionProfile.condition}`,
            )
            .join("; ")
        : "None.",
    },
    {
      label: "Objects / Terrain",
      value: objectItems.length
        ? objectItems.map((feature) => feature.title).join(", ")
        : "None.",
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
      (feature) =>
        getFeatureMechanicProfile(feature).usageProfile?.frequency ===
        "encounter_opener",
    ) ||
    selectedFeatures.find((feature) => feature.slot === "horror") ||
    mainAction;
  const movement = selectedFeatures.find(
    (feature) => feature.slot === "movement",
  );
  const twist = selectedFeatures.find((feature) => feature.slot === "twist");
  const weaknessFeatures = selectedFeatures.filter(
    (feature) => feature.slot === "weakness",
  );
  const death = deathEffects[0];
  const topPressureFeature = getTopFeatureByWeight(
    selectedFeatures,
    getFeaturePressureWeight,
  );
  const topComplexityFeature = getTopFeatureByWeight(
    selectedFeatures,
    getFeatureComplexityWeight,
  );
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
            170,
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
      computed.warnings[0]
        ? { label: "Warning", value: computed.warnings[0] }
        : null,
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
        feature.avoidWith,
      ),
      hasInlineMechanics: Boolean(
        feature.mechanicTags ||
        feature.pressureTags ||
        feature.complexityTags ||
        feature.damageProfile ||
        feature.usageProfile ||
        feature.conditionProfile,
      ),
      usesCompatibilityOverride: Boolean(
        FEATURE_COMPATIBILITY_OVERRIDES[feature.id],
      ),
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
      (feature) => feature.migration.usesCompatibilityOverride,
    ).length,
    usingMechanicOverrides: structured.filter(
      (feature) => feature.migration.usesMechanicOverride,
    ).length,
    inlineCompatibility: structured.filter(
      (feature) => feature.migration.hasInlineCompatibility,
    ).length,
    inlineMechanics: structured.filter(
      (feature) => feature.migration.hasInlineMechanics,
    ).length,
  };
}

function getPresetCatalogStats(presets = MONSTER_FAMILY_PRESETS) {
  return {
    total: presets.length,
    bySource: countValues(presets.map((preset) => preset.source)),
    byFamily: countValues(presets.map((preset) => preset.family)),
    averageGrafts: presets.length
      ? Math.round(
          presets.reduce(
            (sum, preset) => sum + getPresetCoverage(preset).graftCount,
            0,
          ) / presets.length,
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
  const basics = getStatBlockBasics(
    creatureType,
    category,
    role,
    computed,
    abilityProfile,
    xp,
  );
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
  if (reactions.length)
    sections.push("", "Reactions", exportItems(reactions, [], computed));
  if (deathEffects.length)
    sections.push("", "Death Effects", exportItems(deathEffects, [], computed));
  if (lairActions.length)
    sections.push("", "Lair Actions", exportItems(lairActions, [], computed));
  if (legendaryActions.length)
    sections.push(
      "",
      "Legendary Actions",
      exportItems(legendaryActions, [], computed),
    );
  else if (hasLegendaryActions)
    sections.push(
      "",
      "Legendary Actions",
      "Legendary Action Uses: 3. Immediately after another creature’s turn, the monster can expend a use to move, attack, or trigger one selected horror graft. It regains all expended uses at the start of each of its turns.",
      "Press the Horror. The monster uses one non-lair graft that has not already been used this round.",
    );
  sections.push(
    "",
    "Designer Notes",
    ...buildDesignerNotes({ danger, role, computed }),
  );

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
  const basics = getStatBlockBasics(
    creatureType,
    category,
    role,
    computed,
    abilityProfile,
    xp,
  );
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
  const weaknessItems = selectedFeatures.filter(
    (item) => item.slot === "weakness",
  );
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
      {
        label: "Initiative",
        value: `${modText(basics.initiative)} (${basics.initiativeTotal})`,
      },
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
        items: buildStatBlockItems(
          traitItems.length ? traitItems : fallbackTraits,
          computed,
        ),
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
        items: buildStatBlockItems(
          actions.length ? actions : fallbackActions,
          computed,
        ),
      },
      {
        id: "bonus-actions",
        title: "Bonus Actions",
        items: buildStatBlockItems(bonusActions, computed),
      },
      {
        id: "reactions",
        title: "Reactions",
        items: buildStatBlockItems(reactions, computed),
      },
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
          computed,
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
  const basics = getStatBlockBasics(
    creatureType,
    category,
    role,
    computed,
    abilityProfile,
    xp,
  );
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
      grafts: selectedFeatures.map((feature) =>
        buildStructuredFeature(feature, computed),
      ),
    },
    null,
    2,
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

  const creatureType =
    CREATURE_TYPES.find((type) => type.id === typeId) || CREATURE_TYPES[0];
  const role = ROLES.find((item) => item.id === roleId) || ROLES[1];
  const danger = DANGERS.find((item) => item.id === dangerId) || DANGERS[0];
  const source = SOURCES.find((item) => item.id === sourceId) || SOURCES[0];
  const tacticalRole =
    TACTICAL_ROLES.find((item) => item.id === tacticalRoleId) ||
    TACTICAL_ROLES[0];
  const monsterTier =
    MONSTER_TIERS.find((item) => item.id === monsterTierId) || MONSTER_TIERS[0];
  const tempoProfile =
    TEMPO_PROFILES.find((item) => item.id === tempoProfileId) ||
    TEMPO_PROFILES[1];
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
  const effectivePressureBudget = advancedMode
    ? customPressureBudget
    : defaultPressureBudget;
  const effectiveComplexityCap = advancedMode
    ? customComplexityCap
    : defaultComplexityCap;
  const composerMode = getComposerMode(advancedMode, customMode);
  const activePreset = getPresetById(activePresetId);
  const currentNavigatorSlot =
    componentNavigatorMode === "global" ? navigatorSlotFilter : activeSlot;

  const selectedFeatures = useMemo(
    () => getFeaturesFromSelection(selected),
    [selected],
  );

  const availableFeatures = useMemo(() => {
    const slotFilter =
      currentNavigatorSlot === "all" ? null : currentNavigatorSlot;
    return FEATURES.map((feature) => ({
      feature,
      status: getCompatibilityStatus(
        feature,
        selectedFeatures,
        typeId,
        category,
      ),
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
          getFeatureDecisionRank(aDecision) -
            getFeatureDecisionRank(bDecision) ||
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
      status: getCompatibilityStatus(
        feature,
        selectedFeatures,
        typeId,
        category,
      ),
    })).filter(({ feature, status }) => {
      const frameMatch = customMode
        ? feature.source === sourceId
        : featureMatchesFrame(feature, sourceId, typeId, roleId);
      return frameMatch && canShowFeatureForMode(status, composerMode);
    }).length;
  }, [
    sourceId,
    typeId,
    roleId,
    selectedFeatures,
    category,
    composerMode,
    customMode,
  ]);

  const computed = useMemo(() => {
    const partyTier = getTier(partyLevel);
    const prof = getProfForCr(targetCr);
    const baseline = getBaselineProfile(targetCr, monsterTier.id);
    const baseHp = Math.round(baseline.hp * role.hpMult * tacticalRole.hpMult);
    const baseDpr = Math.round(
      baseline.dpr *
        role.dprMult *
        danger.dprMod *
        tacticalRole.dprMult *
        tempoProfile.dprMult,
    );
    const baseAc = baseline.ac + monsterTier.acMod + tacticalRole.acMod;
    const baseAttack =
      baseline.attackBonus + tacticalRole.attackMod + tempoProfile.attackMod;
    const baseDc = baseline.saveDc + tacticalRole.dcMod;

    const statMods = selectedFeatures.reduce(
      (acc, feature) => {
        Object.entries(feature.stats || {}).forEach(([key, value]) => {
          acc[key] = (acc[key] || 0) + value;
        });
        return acc;
      },
      { hp: 0, dpr: 0, ac: 0, control: 0, mobility: 0, fairness: 0 },
    );

    const featureMechanics = selectedFeatures.map((feature) => ({
      id: feature.id,
      title: feature.title,
      ...getFeatureMechanicProfile(feature),
    }));
    const mechanicsSummary = summarizeMechanicProfiles(featureMechanics);
    const counterplayProfiles = selectedFeatures.map((feature) =>
      getFeatureCounterplayProfile(feature),
    );
    const cost = selectedFeatures.reduce(
      (sum, feature) => sum + feature.cost,
      0,
    );
    const rawComplexity = selectedFeatures.reduce(
      (sum, feature) => sum + feature.complexity,
      0,
    );
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
      effectiveHp: Math.round(
        hp * (1 + Math.max(0, statMods.fairness || 0) * 0.015),
      ),
      effectiveAttackBonus: attack + (tempoProfile.id === "ambusher" ? 1 : 0),
      effectiveSaveDc: dc,
      printedDpr: dpr,
      effectiveDpr3Round: Math.max(
        Math.round(
          dpr *
            (1 +
              Math.max(0, statMods.control || 0) * 0.035 +
              Math.max(0, statMods.mobility || 0) * 0.02 +
              (tempoProfile.id === "ambusher" ? 0.08 : 0)),
        ),
        Math.round(dpr + mechanicsSummary.structuredDamage * 0.2),
      ),
      burstDpr: Math.round(
        dpr *
          (1 +
            (tempoProfile.id === "ambusher" ? 0.35 : 0.12) +
            Math.max(0, statMods.dpr || 0) * 0.01),
      ),
      tempoFactor: 1 + tempoProfile.pressureMod * 0.05,
      defenseFactor:
        1 +
        Math.max(0, statMods.hp || 0) / Math.max(1, hp) +
        Math.max(0, statMods.ac || 0) * 0.04,
    };
    effectiveProfile.combatPowerEstimate = Math.round(
      effectiveProfile.effectiveHp *
        effectiveProfile.effectiveDpr3Round *
        ((effectiveProfile.effectiveAc +
          effectiveProfile.effectiveAttackBonus -
          2) /
          13),
    );
    const profileDeltas = buildProfileDeltas(
      printedStats,
      effectiveProfile,
      baseline,
    );
    const estimatedCr = clamp(
      Math.round(
        targetCr +
          (pressure - budget) / 6 +
          ((effectiveProfile.effectiveDpr3Round - baseline.dpr) /
            Math.max(8, baseline.dpr)) *
            2,
      ),
      0,
      30,
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
      baseline.hp *
        baseline.dpr *
        ((baseline.ac + baseline.attackBonus - 2) / 13),
    );

    const warnings = [];
    if (pressure > budget)
      warnings.push(
        "Threat budget is above target. Reduce one high-cost twist or treat this as a boss/setpiece.",
      );
    if (complexity > effectiveComplexityCap)
      warnings.push(
        "Table complexity is high. Remove one feature with a reaction, recharge, or delayed effect, or increase the custom Complexity limit in Advanced Mode.",
      );
    if (!hasSelectedSlot(selected, "weakness"))
      warnings.push(
        "No Weakness / Tell selected. Add counterplay before using this as horror, otherwise it may feel arbitrary.",
      );
    if (
      roleId === "boss" &&
      !hasSelectedSlot(selected, "twist") &&
      !hasSelectedSlot(selected, "lair")
    )
      warnings.push(
        "Boss lacks action-economy pressure. Add a Combat Twist, Lair Effect, or minions.",
      );
    if ((statMods.control || 0) >= 5 && !hasSelectedSlot(selected, "weakness"))
      warnings.push(
        "Control pressure is high and currently has no clear player-facing answer.",
      );
    if (roleId === "minion" && complexity > 4)
      warnings.push(
        "Minions should be simple. Keep only one memorable feature.",
      );
    if (hp > baseline.hp * 1.45 && monsterTier.id === "normal")
      warnings.push(
        "HP is far above the normal CR baseline. Consider Elite, Boss, Legendary, or reduce defensive grafts.",
      );
    if (dpr > baseline.dpr * 1.4 && monsterTier.id !== "legendary")
      warnings.push(
        "Printed DPR is far above baseline. Treat this as an Elite/Boss profile or reduce offensive grafts.",
      );
    if (
      effectiveProfile.effectiveDpr3Round > baseline.dpr * 1.35 &&
      monsterTier.id === "normal"
    )
      warnings.push(
        "Effective DPR is above the normal CR baseline once control, mobility, and tempo are considered. Consider Elite/Boss tier or lower offensive pressure.",
      );
    if (effectiveProfile.burstDpr > baseline.dpr * 1.75)
      warnings.push(
        "Burst DPR spike is high. Add a recharge, telegraph, setup requirement, or reduce opening damage.",
      );
    if (
      effectiveProfile.combatPowerEstimate > baselinePower * 1.7 &&
      monsterTier.id === "normal"
    )
      warnings.push(
        "Effective combat power is much higher than baseline. Consider raising Tier or lowering HP/DPR/control grafts.",
      );
    if (
      tempoProfile.id === "legendary" &&
      !["boss", "legendary", "setpiece"].includes(monsterTier.id)
    )
      warnings.push(
        "Legendary tempo on a non-boss tier can feel overtuned. Consider Boss, Legendary, or a slower tempo profile.",
      );
    if (mechanicsSummary.rechargeCount >= 3)
      warnings.push(
        "Too many recharge abilities. Consider converting one recharge effect into an at-will minor action or a phase trigger.",
      );
    if (
      mechanicsSummary.reactionCount >= 3 &&
      !["boss", "legendary", "setpiece"].includes(monsterTier.id)
    )
      warnings.push(
        "Too many reaction hooks for a non-boss monster. Reduce reactions or raise the monster Tier.",
      );
    if (mechanicsSummary.majorConditionCount >= 3)
      warnings.push(
        "Major condition load is high. Make sure at least one condition has a clear break condition, repeat save, or visible setup.",
      );
    counterplayAudit.issues.forEach((issue) => {
      warnings.push(`Counterplay Audit: ${issue.label}. ${issue.detail}`);
    });

    selectedFeatures.forEach((feature) => {
      const compatibilityWarning = buildCompatibilityWarning(
        feature,
        getCompatibilityStatus(feature, selectedFeatures, typeId, category),
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
    const nextType =
      CREATURE_TYPES.find((type) => type.id === nextTypeId) ||
      CREATURE_TYPES[0];
    setTypeId(nextTypeId);
    setCategory(nextType.categories[0]);
    setSelected({});
    setActivePresetId("");
  }

  function applyPreset(preset) {
    if (!preset) return;
    const presetType =
      CREATURE_TYPES.find((type) => type.id === preset.typeId) ||
      CREATURE_TYPES[0];
    const nextCategory = presetType.categories.includes(preset.category)
      ? preset.category
      : presetType.categories[0];
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
    const status = getCompatibilityStatus(
      feature,
      selectedFeatures,
      typeId,
      category,
    );
    if (!canShowFeatureForMode(status, composerMode)) return;

    setActivePresetId("");
    setSelected((current) => {
      const slotCap = advancedMode ? getSlotCap(slotCaps, feature.slot) : 1;
      const currentIds = getSelectedIdsForSlot(current, feature.slot);
      if (currentIds.includes(feature.id)) return current;
      if (slotCap > 1 && currentIds.length >= slotCap) return current;
      const nextIds = slotCap <= 1 ? [feature.id] : [...currentIds, feature.id];
      return {
        ...current,
        [feature.slot]: slotCap <= 1 ? nextIds[0] : nextIds,
      };
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
          status: getCompatibilityStatus(
            feature,
            partialFeatures,
            typeId,
            category,
          ),
        }))
          .filter(({ feature, status }) => {
            const alreadyPicked =
              picks.includes(feature.id) ||
              getSelectedIdsForSlot(next, slotId).includes(feature.id);
            const frameMatch = customMode
              ? featureMatchesSourceAndSlot(feature, sourceId, slotId)
              : featureMatchesFrame(feature, sourceId, typeId, roleId, slotId);
            return (
              !alreadyPicked &&
              frameMatch &&
              canShowFeatureForMode(status, composerMode)
            );
          })
          .sort(
            (a, b) =>
              getCompatibilityRank(a.status) - getCompatibilityRank(b.status) ||
              a.feature.cost - b.feature.cost,
          )
          .map(({ feature }) => feature);
        const remainingBudget = Math.max(
          0,
          budget - runningCost + (roleId === "boss" ? 3 : 0),
        );
        const picked = pickForgeCandidate(
          candidates,
          slotId,
          remainingBudget,
          roleId,
        );
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
      setSelected((selectedCurrent) =>
        trimSelectedToCaps(selectedCurrent, next),
      );
      return next;
    });
  }

  function handleCustomModeToggle() {
    setActivePresetId("");
    setCustomMode((current) => !current);
  }

  const pressurePercent = clamp(
    (computed.pressure / computed.budget) * 100,
    0,
    160,
  );
  const complexityPercent = clamp(
    (computed.complexity / computed.complexityCap) * 100,
    0,
    160,
  );
  const abilityProfile = buildAbilityProfile(
    typeId,
    category,
    roleId,
    selectedFeatures,
    computed.prof,
  );
  const sectionGroups = useMemo(
    () => groupFeaturesBySection(selectedFeatures),
    [selectedFeatures],
  );
  const traits = sectionGroups.trait || [];
  const actions = sectionGroups.action || [];
  const bonusActions = sectionGroups.bonusAction || [];
  const reactions = sectionGroups.reaction || [];
  const legendaryActions = sectionGroups.legendaryAction || [];
  const lairActions = sectionGroups.lairAction || [];
  const deathEffects = sectionGroups.death || [];
  const hasLegendaryActions = roleId === "boss";
  const xp = xpForCr(computed.targetCr).toLocaleString("en-US");
  const selectedSlotCount = SLOTS.filter((slot) =>
    hasSelectedSlot(selected, slot.id),
  ).length;
  const selectedGraftCount = selectedFeatures.length;
  const slotCompletionPercent = clamp(
    Math.round((selectedSlotCount / SLOTS.length) * 100),
    0,
    100,
  );
  const activeSlotData =
    SLOTS.find((slot) => slot.id === activeSlot) || SLOTS[0];
  const activeSlotFeatureIds = getSelectedIdsForSlot(selected, activeSlot);
  const activeSlotFeatures = activeSlotFeatureIds
    .map((id) => FEATURES.find((feature) => feature.id === id))
    .filter(Boolean);
  const activeSlotCap = advancedMode ? getSlotCap(slotCaps, activeSlot) : 1;
  const activeSlotAvailableFeatures = useMemo(() => {
    return FEATURES.map((feature) => ({
      feature,
      status: getCompatibilityStatus(
        feature,
        selectedFeatures,
        typeId,
        category,
      ),
    }))
      .filter(({ feature, status }) => {
        const frameMatch = customMode
          ? featureMatchesSourceAndSlot(feature, sourceId, activeSlot)
          : featureMatchesFrame(feature, sourceId, typeId, roleId, activeSlot);
        return frameMatch && canShowFeatureForMode(status, composerMode);
      })
      .map(({ feature }) => feature);
  }, [
    sourceId,
    typeId,
    roleId,
    activeSlot,
    selectedFeatures,
    category,
    composerMode,
    customMode,
  ]);
  const activeAlternatives = activeSlotAvailableFeatures.filter(
    (feature) => !activeSlotFeatureIds.includes(feature.id),
  ).length;
  const visibleFeatures = useMemo(() => {
    const query = navigatorSearch.trim().toLowerCase();
    if (!query) return availableFeatures;
    return availableFeatures.filter((feature) => {
      const sourceLabel =
        SOURCES.find((item) => item.id === feature.source)?.label || "";
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

    if (
      action.kind === "replaceFeature" &&
      action.removeFeatureId &&
      action.addFeatureId
    ) {
      const removeTarget = FEATURES.find(
        (item) => item.id === action.removeFeatureId,
      );
      const addTarget = FEATURES.find(
        (item) => item.id === action.addFeatureId,
      );
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
          setExportCopyStatus((current) =>
            current === `${kind}-${status}` ? "" : current,
          );
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
      <CruorStyle />

      <header className="app-shell__bar monster-shell__bar">
        <div className="app-shell__brand">
          <span className="app-shell__eyebrow">Cruor Games</span>
          <strong>Cruor Games</strong>
        </div>
        <nav className="app-shell__nav" aria-label="Primary sections">
          <button className="app-shell__nav-item" type="button">
            Darken a Location
          </button>
          <button
            className="app-shell__nav-item is-active"
            type="button"
            aria-current="page"
          >
            Monster Composer
          </button>
          <button className="app-shell__nav-item" type="button">
            Inspirations
          </button>
        </nav>
      </header>

      <main className="monster-workspace">
        <div className="darken-workspace__topbar monster-topbar-wrap">
          <header className="darken-topbar monster-topbar">
            <div className="darken-topbar__primary">
              <h1 className="darken-topbar__title">
                <span className="darken-topbar__title-prefix">I need to</span>
                <span className="darken-topbar__need-value">
                  Build a Monster
                </span>
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
                  <div
                    className="monster-topbar__summary"
                    aria-label="Current monster frame"
                  >
                    <span className="monster-current-frame">
                      {activePreset ? `${activePreset.label} · ` : ""}CR{" "}
                      {targetCr} · {tacticalRole.label} · {monsterTier.label} ·{" "}
                      {tempoProfile.label}
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

        <button
          className={`monster-frame-scrim ${frameOpen ? "is-open" : ""}`}
          type="button"
          aria-label="Close Monster Frame"
          onClick={() => setFrameOpen(false)}
        />

        <aside
          className={`panel navigator monster-frame-drawer game-frame-drawer ${frameOpen ? "is-open" : ""}`}
          aria-label="Monster Frame"
          aria-hidden={!frameOpen}
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
            <div
              className="game-frame__loadout"
              aria-label="Current frame summary"
            >
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
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`game-type-card ${active ? "active" : ""}`}
                      onClick={() => selectType(type.id)}
                    >
                      <span className="game-type-card__icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="game-type-card__text">
                        <strong>{type.label}</strong>
                        <small>{type.categories.length} variants</small>
                      </span>
                      <span className="game-type-card__mark">
                        {active ? "Active" : "Select"}
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
                  {creatureType.categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={item === category}
                      className={`game-category-chip ${item === category ? "active" : ""}`}
                      onClick={() => {
                        setCategory(item);
                        setActivePresetId("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
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
                      <small>
                        {item.id === roleId ? "Equipped" : "Loadout"}
                      </small>
                    </span>
                    <span className="game-role-card__summary">
                      {item.summary}
                    </span>
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
                <div
                  className="game-category-grid"
                  role="radiogroup"
                  aria-label="Tactical role"
                >
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
                <div
                  className="game-category-grid"
                  role="radiogroup"
                  aria-label="Monster tier"
                >
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
                <div
                  className="game-category-grid"
                  role="radiogroup"
                  aria-label="Tempo profile"
                >
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
                <div
                  className="game-threat-scale"
                  role="radiogroup"
                  aria-label="Monster danger"
                >
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

                <div
                  className="game-frame__meters"
                  aria-label="Current pressure readout"
                >
                  <div className="game-frame__meter">
                    <span>
                      <small>Pressure</small>
                      <strong>
                        {computed.pressure} / {computed.budget}
                      </strong>
                    </span>
                    <i>
                      <b
                        className={
                          computed.pressure > computed.budget ? "is-over" : ""
                        }
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
                        className={
                          computed.complexity > computed.complexityCap
                            ? "is-over"
                            : ""
                        }
                        style={{
                          width: `${Math.min(complexityPercent, 100)}%`,
                        }}
                      />
                    </i>
                  </div>
                </div>
              </div>
            </PanelGroup>
          </div>
        </aside>

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
                    <button
                      key={slot.id}
                      type="button"
                      className={`build-slot ${active ? "active" : ""} ${guidedFlow.recommendedSlotId === slot.id ? "is-guided" : ""} ${filled ? "has-items" : "needs-attention"}`}
                      onClick={() => openSlotNavigator(slot.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(slot.id)}
                    >
                      <div className="slot-head">
                        <span className="slot-name">
                          <Icon className="slot-icon" aria-hidden="true" />{" "}
                          {slot.label}
                        </span>
                        <span className="count">
                          {slotFeatures.length || "—"}
                        </span>
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
                                <strong className="slot-item-title">
                                  {feature.title}
                                </strong>
                                {normalizeMonsterReferences(
                                  feature.summary,
                                  computed,
                                )}
                              </p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <span className="slot-empty">{slot.hint}</span>
                      )}
                    </button>
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
                  onRemoveFeature={(featureId) =>
                    removeFeature(activeSlot, featureId)
                  }
                />
              )}
            </section>
          </section>
        )}

        {viewMode === "balance" && (
          <section
            className="panel balance-workbench"
            aria-label="Monster balance review"
          >
            <div className="balance-hero">
              <div>
                <h2>Balance Review</h2>
              </div>
              <span
                className={`balance-verdict ${computed.warnings.length ? "needs-review" : "ready"}`}
              >
                <Shield aria-hidden="true" />{" "}
                {computed.warnings.length ? "Needs Review" : "Ready"}
              </span>
            </div>
            <div className="balance-grid balance-grid--simplified">
              <article className="balance-card balance-wide-card balance-recommendations-card">
                <div className="balance-card__head">
                  <span>Fix These First</span>
                  <strong>
                    {computed.balanceRecommendations.length || "Clear"}
                  </strong>
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
                  {computed.pressureProfile.sources.join(" · ") ||
                    "No pressure sources yet."}
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
                  {computed.complexityProfile.sources.join(" · ") ||
                    "No complexity sources yet."}
                </p>
              </article>
              <article className="balance-card">
                <div className="balance-card__head">
                  <span>Counterplay</span>
                  <strong>{computed.counterplayAudit.rating}</strong>
                </div>
                <div
                  className="balance-progress-ring"
                  style={{
                    "--progress": `${computed.counterplayAudit.score}%`,
                  }}
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
                      <CompiledMeta
                        label="AC"
                        value={`${computed.ac} / ${computed.baseline.ac}`}
                      />
                      <CompiledMeta
                        label="HP"
                        value={`${computed.hp} / ${computed.baseline.hp}`}
                      />
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
                      <CompiledMeta
                        label="Burst"
                        value={computed.effectiveProfile.burstDpr}
                      />
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
              weaknessFeatures: selectedFeatures.filter(
                (feature) => feature.slot === "weakness",
              ),
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
                  <aside
                    className="panel export-console"
                    aria-label="Export console"
                  >
                    <div className="export-console__head">
                      <h2>Table Handoff</h2>
                    </div>

                    <ExportReadinessPanel
                      readiness={exportReadiness}
                      onOpenBalance={() => setViewMode("balance")}
                    />

                    <div
                      className="export-action-grid"
                      aria-label="Export actions"
                    >
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
      <div
        className="guided-flow-next"
        data-next-kind={guidedFlow.nextAction?.kind || "start"}
      >
        <div className="guided-flow-next__copy">
          <strong>
            {guidedFlow.nextAction?.title || "Choose how to begin"}
          </strong>
          <p>
            {guidedFlow.nextAction?.detail ||
              "Start from a template or an empty frame."}
          </p>
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

function MonsterStartScreen({
  onPickTemplate,
  onBuildFromScratch,
  presetsCount,
}) {
  return (
    <div className="monster-start-screen" aria-label="Choose how to begin">
      <div className="monster-start-screen__intro">
        <h3>Choose how to begin</h3>
        <p>
          Start from a ready horror family or build an empty anatomy frame slot
          by slot.
        </p>
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
            <em>
              Load a complete horror monster family, then customize its anatomy.
            </em>
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
  const profile = getSilhouetteProfile(typeId);
  const filledCount = SLOTS.filter((slot) =>
    hasSelectedSlot(selected, slot.id),
  ).length;

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
    <section
      className="monster-anatomy-composer"
      aria-label="Monster anatomy composer"
    >
      {!started ? (
        <MonsterStartScreen
          onPickTemplate={onPickTemplate}
          onBuildFromScratch={onBuildFromScratch}
          presetsCount={presetsCount}
        />
      ) : (
        <>
          {startMode === "scratch" && filledCount === 0 && (
            <div
              className="monster-scratch-hint"
              aria-label="Scratch build hint"
            >
              <strong>Empty Anatomy Frame</strong>
              <span>
                Click Body, Attack Pattern, or Weakness / Tell to install the
                first graft.
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
                    percent={clamp(
                      (computed.pressure / computed.budget) * 100,
                      0,
                      160,
                    )}
                  />
                </article>
                <div className="anatomy-stage__slot-stack">
                  {ANATOMY_LEFT_SLOT_IDS.map(renderSlotCard)}
                </div>
              </aside>

              <div
                className="anatomy-stage__center"
                aria-label="Interactive monster silhouette"
              >
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
                      const card = SILHOUETTE_SLOT_CARDS[slot.id] || {
                        x: anchor.x,
                        y: anchor.y,
                      };
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

                  <svg
                    className={`monster-silhouette-svg monster-silhouette-svg--${typeId}`}
                    viewBox={profile.viewBox}
                    role="button"
                    tabIndex={0}
                    aria-label={`${profile.label}. Open Monster Frame`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenFrame?.();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenFrame?.();
                      }
                    }}
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
                        style={{
                          left: `${anchor.x * 100}%`,
                          top: `${anchor.y * 100}%`,
                        }}
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
                    percent={clamp(
                      (computed.complexity / computed.complexityCap) * 100,
                      0,
                      160,
                    )}
                  />
                </article>
                <div className="anatomy-stage__slot-stack">
                  {ANATOMY_RIGHT_SLOT_IDS.map(renderSlotCard)}
                </div>
              </aside>

              <div
                className="anatomy-stage__lair"
                aria-label="Bottom anatomy slot"
              >
                {ANATOMY_BOTTOM_SLOT_IDS.map(renderSlotCard)}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TemplatePickerModal({
  open,
  presets,
  activePresetId,
  onApply,
  onClose,
}) {
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
      <aside
        className="panel template-picker-modal__panel"
        aria-label="Monster templates"
      >
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
            const tacticalRole = TACTICAL_ROLES.find(
              (item) => item.id === preset.tacticalRoleId,
            );
            const monsterTier = MONSTER_TIERS.find(
              (item) => item.id === preset.monsterTierId,
            );
            const tempoProfile = TEMPO_PROFILES.find(
              (item) => item.id === preset.tempoProfileId,
            );
            const coverage = getPresetCoverage(preset);
            const active = preset.id === activePresetId;
            return (
              <article
                key={preset.id}
                className={`template-choice-card ${active ? "active" : ""}`}
              >
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
                  <span className="template-choice-card__summary">
                    {preset.summary}
                  </span>
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
  const filteredSlotData = SLOTS.find(
    (slot) => slot.id === navigatorSlotFilter,
  );
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
            <div
              className="navigator-count"
              aria-label="Visible component count"
            >
              {visibleFeatures.length}
            </div>
          </div>

          {navigatorFiltersOpen && (
            <div
              className="tag-filter-row monster-source-grid-open"
              aria-label="Filter components"
            >
              <div className="tag-filter-row__head">
                <span>Component Filters</span>
                <button
                  className="tag-clear-btn"
                  type="button"
                  onClick={() => {
                    setNavigatorSearch("");
                    setNavigatorSlotFilter(
                      mode === "global" ? "all" : activeSlot,
                    );
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
              const featureSlotIds = getSelectedIdsForSlot(
                selected,
                feature.slot,
              );
              const featureSlotCap = advancedMode
                ? getSlotCap(slotCaps, feature.slot)
                : 1;
              const selectedInSlot = featureSlotIds.includes(feature.id);
              const slotFull =
                featureSlotCap > 1 &&
                featureSlotIds.length >= featureSlotCap &&
                !selectedInSlot;
              const compatibility = getCompatibilityStatus(
                feature,
                selectedFeatures,
                typeId,
                category,
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
                currentSlot:
                  mode === "global" ? navigatorSlotFilter : activeSlot,
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
          <strong>
            {installed
              ? `${features.length} Installed`
              : `${alternatives} Options`}
          </strong>
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
                    <p>
                      {normalizeMonsterReferences(feature.summary, computed)}
                    </p>
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
                        <p>
                          {normalizeMonsterReferences(
                            feature.counterplay,
                            computed,
                          )}
                        </p>
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
        onChange={(event) =>
          onChange(clamp(Number(event.target.value || min), min, max))
        }
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
    <section
      className="smart-slot-picks"
      aria-label={`Best picks for ${slot.label}`}
    >
      <div className="smart-slot-picks__head">
        <strong>Best Picks</strong>
        <span>{slot.label}</span>
      </div>
      <div className="smart-slot-picks__grid">
        {picks.map((pick) => {
          const feature = pick.feature;
          const featureSlotIds = getSelectedIdsForSlot(selected, feature.slot);
          const featureSlotCap = advancedMode
            ? getSlotCap(slotCaps, feature.slot)
            : 1;
          const selectedInSlot = featureSlotIds.includes(feature.id);
          const slotFull =
            featureSlotCap > 1 &&
            featureSlotIds.length >= featureSlotCap &&
            !selectedInSlot;
          const compatibility = getCompatibilityStatus(
            feature,
            selectedFeatures,
            typeId,
            category,
          );
          const impact = buildFeatureImpactPreview({
            feature,
            selected,
            selectedFeatures,
            typeId,
            category,
            computed,
          });
          const disabled =
            selectedInSlot ||
            slotFull ||
            ["missing", "incompatible"].includes(compatibility.kind);
          return (
            <article
              key={`${pick.id}-${feature.id}`}
              className={`smart-pick-card is-${pick.id}`}
            >
              <div className="smart-pick-card__top">
                <span>{pick.label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAdd?.(feature)}
                >
                  {selectedInSlot ? "Installed" : slotFull ? "Full" : "Add"}
                </button>
              </div>
              <h3>{feature.title}</h3>
              <p>{normalizeMonsterReferences(feature.summary, computed)}</p>
              <em>{formatFeatureImpactPreview(impact)}</em>
              {compatibility.kind !== "compatible" && (
                <small>{compatibility.message}</small>
              )}
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
  const hasCompatibilityBadge =
    compatibility?.kind && compatibility.kind !== "compatible";
  const profile =
    decisionProfile ||
    getFeatureDecisionProfile(feature, { status: compatibility });
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
          <span className={`compatibility-badge ${compatibility.kind}`}>
            {compatibility.label}
          </span>
        )}
      </div>

      <p className="summary">
        {normalizeMonsterReferences(feature.summary, computed)}
      </p>
      <p className="component-impact-line">
        {formatFeatureImpactPreview(impact)}
      </p>

      {hasCompatibilityBadge && (
        <p className="compatibility-note">{compatibility.message}</p>
      )}
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
              <span className="meta-value strong-chip">
                {titleCase(feature.slot)}
              </span>
              <span className="meta-value">
                {getSectionLabel(getFeatureSection(feature))}
              </span>
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
                  <span
                    key={`requires-${token}`}
                    className="meta-value strong-chip"
                  >
                    Requires {formatToken(token)}
                  </span>
                ))}
                {rules.softRequires.map((token) => (
                  <span key={`soft-${token}`} className="meta-value">
                    Wants {formatToken(token)}
                  </span>
                ))}
                {rules.incompatibleWith.map((token) => (
                  <span
                    key={`blocks-${token}`}
                    className="meta-value danger-chip"
                  >
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
        <div
          className={over ? "is-over" : ""}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
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
          The monster has a weakness/tell, stays inside the pressure budget, and
          should be playable for the selected use.
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
          No reactions, lair actions, recharge hooks, or death triggers
          installed.
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
            The monster is within the current pressure and complexity targets,
            and the counterplay audit is playable.
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
  const visibleSections = statBlock.sections.filter(
    (section) => section.items.length > 0,
  );

  return (
    <article
      className="cruor-stat-block rendered-stat-block"
      aria-label={`${statBlock.name} rendered stat block`}
    >
      <header className="cruor-stat-block__head">
        <h3>{statBlock.name}</h3>
        <p>{statBlock.creatureLine}</p>
      </header>

      <section
        className="cruor-stat-block__core"
        aria-label="Core combat statistics"
      >
        {statBlock.coreStats.map((item) => (
          <p key={item.label}>
            <strong>{item.label}</strong> {item.value}
          </p>
        ))}
      </section>

      <section
        className="cruor-stat-block__abilities"
        aria-label="Ability scores"
      >
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
                  <td key={`${ability.key}-save`}>
                    Save {modText(ability.save)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="cruor-stat-block__facts"
        aria-label="Defenses and senses"
      >
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
    <section
      className={`cruor-stat-block__section ${highlight ? "is-weakness" : ""}`}
    >
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
            {check.ready ? (
              <Shield aria-hidden="true" />
            ) : (
              <AlertTriangle aria-hidden="true" />
            )}
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
          </article>
        ))}
      </div>
      {!readiness.ready && (
        <button
          className="export-review-btn"
          type="button"
          onClick={onOpenBalance}
        >
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

function CruorStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      @import url(https://db.onlinewebfonts.com/c/84511926c1e0e99e983d71e22d6a5838?family=Lovato-Black);

      :root {
        --bg: #000;
        --surface: #040405;
        --surface-2: #080708;
        --surface-3: #100306;
        --surface-glass: rgba(26, 21, 23, .76);
        --glass-satin: rgba(31, 25, 27, .68);
        --glass-satin-strong: rgba(29, 23, 25, .84);
        --glass-line: rgba(120, 27, 42, .38);
        --panel-white-line: rgba(255, 238, 242, .105);
        --panel-milk: rgba(255, 238, 242, .045);
        --paper-texture: url("https://www.transparenttextures.com/patterns/black-paper.png");
        --text: #eeeeee;
        --muted: #a7a7ad;
        --faint: #666871;
        --line: #231018;
        --line-strong: #3c0712;
        --accent: #33030c;
        --accent-2: #5f0716;
        --accent-3: #7a1a28;
        --good: #8f9694;
        --shadow: 0 24px 80px rgba(0, 0, 0, .55);
        --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --display: "Lovato-Black", Georgia, "Times New Roman", serif;
      }

      * { box-sizing: border-box; }

      .monster-shell {
        position: relative;
        min-height: 100dvh;
        background-color: #000;
        background-image:
          var(--paper-texture),
          radial-gradient(circle at 18% 0%, rgba(122, 26, 40, .38), transparent 30rem),
          radial-gradient(circle at 82% 18%, rgba(95, 7, 22, .22), transparent 28rem),
          radial-gradient(circle at 54% 92%, rgba(51, 3, 12, .34), transparent 34rem),
          linear-gradient(135deg, rgba(51, 3, 12, .96) 0%, rgba(18, 1, 5, .92) 34%, rgba(0, 0, 0, .98) 74%, #000 100%);
        background-blend-mode: multiply, screen, screen, screen, normal;
        background-attachment: fixed, fixed, fixed, fixed, fixed;
        color: var(--text);
        font-family: var(--font);
        line-height: 1.45;
      }

      .monster-shell::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: var(--paper-texture);
        background-repeat: repeat;
        opacity: .34;
        mix-blend-mode: multiply;
      }

      .monster-shell button,
      .monster-shell select,
      .monster-shell input {
        font: inherit;
      }

      .monster-shell button {
        border-radius: 0;
        cursor: pointer;
      }

      .monster-shell select,
      .monster-shell input {
        width: 100%;
        min-height: 40px;
        border: 1px solid var(--line);
        border-radius: 0;
        background:
          linear-gradient(180deg, rgba(122, 26, 40, .04), transparent 64%),
          rgba(5, 5, 6, .72);
        color: var(--text);
        padding: 0 11px;
        outline: none;
        transition: border-color .12s ease, background .12s ease, box-shadow .12s ease, color .12s ease;
      }

      .monster-shell select:hover,
      .monster-shell input:hover,
      .monster-shell select:focus,
      .monster-shell input:focus {
        border-color: rgba(122, 26, 40, .86);
        background:
          linear-gradient(180deg, rgba(122, 26, 40, .08), transparent 64%),
          rgba(5, 5, 6, .82);
        box-shadow: 0 0 0 1px rgba(122, 26, 40, .18), 0 0 20px rgba(51, 3, 12, .32);
      }

      .app-shell__bar {
        position: sticky;
        top: 0;
        z-index: 80;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        min-height: 62px;
        padding: 10px clamp(18px, 3vw, 30px);
        border-bottom: 1px solid rgba(95, 7, 22, .58);
        background:
          linear-gradient(180deg, rgba(18, 4, 7, .94), rgba(4, 4, 5, .86)),
          var(--paper-texture);
        box-shadow: 0 16px 44px rgba(0, 0, 0, .48), inset 0 -1px 0 rgba(255, 238, 242, .035);
        backdrop-filter: blur(16px) saturate(128%);
      }

      .app-shell__brand {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .app-shell__brand strong {
        color: var(--text);
        font-family: var(--display);
        font-size: clamp(20px, 2vw, 27px);
        font-weight: 900;
        line-height: 1;
        letter-spacing: -.02em;
      }

      .app-shell__eyebrow,
      .eyebrow {
        margin: 0;
        color: #d0a2aa;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .16em;
        line-height: 1;
        text-transform: uppercase;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .app-shell__nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .app-shell__nav-item,
      .darken-workspace__tab,
      .mode-btn,
      .icon-btn {
        border: 1px solid rgba(95, 7, 22, .58);
        border-radius: 0;
        background: linear-gradient(180deg, rgba(255, 238, 242, .025), transparent), rgba(0, 0, 0, .22);
        color: var(--muted);
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
        transition: background .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease, transform .12s ease;
      }

      .app-shell__nav-item {
        min-height: 36px;
        padding: 0 14px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .015em;
      }

      .app-shell__nav-item:hover,
      .app-shell__nav-item.is-active,
      .darken-workspace__tab:hover,
      .darken-workspace__tab.is-active,
      .mode-btn:hover,
      .mode-btn.active,
      .icon-btn:hover,
      .icon-btn.active,
      .icon-btn.primary {
        border-color: rgba(190, 64, 82, .78);
        background:
          radial-gradient(circle at 50% 24%, rgba(190, 64, 82, .18), transparent 68%),
          linear-gradient(180deg, rgba(30, 7, 11, .94), rgba(10, 5, 7, .88)),
          rgba(8, 5, 6, .86);
        color: #fff0f2;
        box-shadow: 0 0 0 1px rgba(190, 64, 82, .12), 0 0 20px rgba(122, 26, 40, .22), inset 0 1px 0 rgba(255, 238, 242, .06);
      }

      .monster-workspace {
        position: relative;
        z-index: 1;
        min-height: calc(100dvh - 62px);
        padding: 0 clamp(18px, 3vw, 30px) 34px;
      }

      .darken-workspace__topbar {
        position: sticky;
        top: 62px;
        z-index: 70;
        box-sizing: border-box;
        width: 100%;
        padding: 1rem 0;
        background: linear-gradient(180deg, rgba(10, 5, 7, .92), rgba(10, 5, 7, .74) 72%, rgba(10, 5, 7, 0));
        pointer-events: none;
      }

      .darken-topbar {
        pointer-events: auto;
        display: grid;
        align-items: center;
        width: min(1540px, 100%);
        margin: 0 auto;
        padding: 18px 20px;
        border: 2px solid rgba(95, 7, 22, .64);
        background:
          radial-gradient(circle at 12% 0%, rgba(122, 26, 40, .18), transparent 34%),
          linear-gradient(180deg, rgba(18, 5, 8, .985), rgba(8, 5, 6, .96)),
          var(--paper-texture);
        box-shadow: 0 30px 40px rgba(0, 0, 0, 1), inset 0 1px 0 rgba(255, 238, 242, .045), inset 0 -1px 0 rgba(255, 238, 242, .026);
        backdrop-filter: blur(18px) saturate(124%);
      }

      .darken-topbar__primary {
        display: grid;
        gap: 15px;
        min-width: 0;
      }

      .darken-topbar__eyebrow {
        margin: 0;
        color: rgba(208, 162, 170, .86);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .18em;
        line-height: 1;
        text-transform: uppercase;
      }

      .darken-topbar__title {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 10px;
        margin: 0;
        color: var(--text);
        font-family: var(--display);
        line-height: .94;
      }

      .darken-topbar__title-prefix {
        color: rgba(240, 215, 220, .72);
        font-size: clamp(22px, 2.2vw, 34px);
        font-weight: 850;
        letter-spacing: -.035em;
      }

      .darken-topbar__need-value {
        color: #fff0f2;
        font-size: clamp(31px, 3.2vw, 50px);
        font-weight: 950;
        letter-spacing: -.055em;
        text-shadow: 0 0 22px rgba(122, 26, 40, .34), 0 2px 0 rgba(0, 0, 0, .3);
      }

      .darken-topbar__control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        min-width: 0;
      }

      .mode-switch,
      .darken-workspace__tabs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
        margin: 0;
        padding: 0;
      }

      .mode-btn,
      .icon-btn {
        display: inline-grid;
        place-items: center;
        width: 40px;
        min-width: 40px;
        min-height: 40px;
        padding: 0;
      }

      .mode-btn svg,
      .icon-btn svg {
        width: 16px;
        height: 16px;
      }

      .darken-workspace__tab {
        min-height: 38px;
        min-width: 104px;
        padding: 0 16px;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .monster-topbar__summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 9px;
        min-width: 0;
      }

      .monster-current-frame {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(95, 7, 22, .58);
        background: rgba(0, 0, 0, .22);
        color: rgba(240, 215, 220, .72);
        padding: 0 12px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .04em;
        text-transform: uppercase;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
      }

      .panel {
        border: 2px solid color-mix(in srgb, var(--glass-line) 78%, white 22%);
        background-color: var(--glass-satin);
        background-image:
          linear-gradient(180deg, var(--panel-milk), transparent 56%),
          linear-gradient(135deg, rgba(255, 238, 242, .034), transparent 34%),
          linear-gradient(135deg, rgba(51, 3, 12, .26), rgba(0, 0, 0, .04) 48%, rgba(0, 0, 0, .14));
        background-blend-mode: overlay, overlay, normal;
        backdrop-filter: blur(18px) saturate(125%);
        box-shadow:
          0 28px 90px rgba(0, 0, 0, .62),
          0 0 0 1px rgba(255, 238, 242, .045),
          0 0 48px rgba(255, 238, 242, .034),
          inset 0 1px 0 var(--panel-white-line),
          inset 0 -1px 0 rgba(0, 0, 0, .42);
      }

      .brief-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: min(1540px, 100%);
        margin: 0 auto 18px;
        padding: 13px 14px;
      }

      .brief-summary-main {
        min-width: 0;
        display: grid;
        gap: 3px;
      }

      .brief-summary-line {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.35;
      }

      .brief-summary-line strong {
        color: #d0a2aa;
        font-weight: 900;
        text-shadow: 0 0 10px rgba(122, 26, 40, .42);
      }

      .brief-control-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 8px;
        margin-top: 10px;
      }

      .monster-number-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .balance-three-number-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .monster-field {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      .monster-field > span {
        color: #8f7278;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .085em;
        line-height: 1.35;
        text-transform: uppercase;
      }

      .brief-summary-actions,
      .brief-actions {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
      }

      .crucible-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 40px;
        border: 1px solid rgba(95, 7, 22, .58);
        background: linear-gradient(180deg, rgba(255, 238, 242, .025), transparent), rgba(0, 0, 0, .22);
        color: #c8a2a8;
        padding: 0 11px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .09em;
        text-transform: uppercase;
        transition: background .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease;
      }

      .crucible-action-btn svg {
        width: 14px;
        height: 14px;
      }

      .crucible-action-btn:hover {
        border-color: rgba(190, 64, 82, .72);
        background: rgba(95, 7, 22, .28);
        color: #fff0f2;
        box-shadow: 0 0 22px rgba(122, 26, 40, .2);
      }

      .tooltip-btn {
        position: relative;
      }

      .tooltip-btn[data-tooltip]::before {
        content: attr(data-tooltip);
        position: absolute;
        right: 0;
        bottom: calc(100% + 10px);
        z-index: 30;
        width: max-content;
        max-width: 260px;
        border: 1px solid rgba(190, 64, 82, .46);
        background: rgba(5, 5, 6, .94);
        color: rgba(238, 238, 238, .82);
        padding: 8px 9px;
        font-size: 10px;
        font-weight: 750;
        letter-spacing: .015em;
        line-height: 1.35;
        text-align: left;
        text-transform: none;
        white-space: normal;
        box-shadow: 0 18px 42px rgba(0, 0, 0, .56), 0 0 24px rgba(122, 26, 40, .2), inset 0 1px 0 rgba(255, 238, 242, .05);
        opacity: 0;
        pointer-events: none;
        transform: translateY(4px);
        transition: opacity .12s ease, transform .12s ease;
      }

      .tooltip-btn[data-tooltip]:hover::before,
      .tooltip-btn[data-tooltip]:focus-visible::before {
        opacity: 1;
        transform: translateY(0);
      }

      .tooltip-btn.is-disabled,
      .crucible-action-btn[aria-disabled="true"] {
        cursor: not-allowed;
        opacity: .54;
        filter: saturate(.72);
      }

      .tooltip-btn.is-disabled:hover,
      .crucible-action-btn[aria-disabled="true"]:hover {
        border-color: rgba(255, 238, 242, .09);
        background: rgba(255, 255, 255, .022);
        color: rgba(238, 238, 238, .58);
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
      }

      .icon-btn.empty-cta {
        position: relative;
        border-color: rgba(190, 64, 82, .95);
        color: #f0b9c2;
        box-shadow:
          0 0 0 1px rgba(190, 64, 82, .26),
          0 0 30px rgba(122, 26, 40, .62),
          inset 0 0 28px rgba(122, 26, 40, .18);
        animation: cruciblePulse 1.85s ease-in-out infinite;
      }

      .icon-btn.empty-cta::after {
        content: "Forge";
        position: absolute;
        top: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        color: #8f7278;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .12em;
        text-transform: uppercase;
        pointer-events: none;
      }

      @keyframes cruciblePulse {
        0%, 100% { filter: drop-shadow(0 0 2px rgba(122, 26, 40, .28)); }
        50% { filter: drop-shadow(0 0 10px rgba(190, 64, 82, .44)); }
      }

      .monster-layout {
        display: grid;
        grid-template-columns: minmax(540px, 1fr) minmax(320px, 390px);
        gap: 14px;
        align-items: start;
        width: min(1540px, 100%);
        margin: 0 auto;
      }

      .monster-frame-scrim {
        position: fixed;
        inset: 0;
        z-index: 108;
        display: none;
        border: 0;
        background: rgba(0, 0, 0, .18);
        padding: 0;
      }

      .monster-frame-scrim.is-open {
        display: block;
      }

      .monster-frame-drawer {
        position: fixed;
        top: 82px;
        left: max(18px, calc((100vw - 1540px) / 2 + 18px));
        z-index: 112;
        width: min(430px, calc(100vw - 36px));
        max-height: calc(100dvh - 106px);
        overflow: auto;
        transform: translateX(calc(-100% - 42px));
        opacity: 0;
        pointer-events: none;
        transition: transform .18s ease, opacity .16s ease;
      }

      .game-frame-drawer {
        padding: 0;
        border-color: rgba(190, 64, 82, .42);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .07), transparent 8rem),
          radial-gradient(circle at 0% 0%, rgba(190, 64, 82, .2), transparent 14rem),
          linear-gradient(135deg, rgba(13, 10, 12, .98), rgba(7, 5, 6, .94));
        box-shadow:
          0 40px 110px rgba(0, 0, 0, .78),
          0 0 0 1px rgba(255, 238, 242, .06),
          0 0 64px rgba(122, 26, 40, .28),
          inset 0 1px 0 rgba(255, 238, 242, .08);
      }

      .monster-frame-drawer.is-open {
        transform: translateX(0);
        opacity: 1;
        pointer-events: auto;
      }

      .monster-frame-drawer__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .monster-frame-drawer__head .icon-btn {
        flex: 0 0 auto;
      }

      .game-frame__hero {
        position: relative;
        overflow: hidden;
        padding: 16px 16px 14px;
        border-bottom: 1px solid rgba(190, 64, 82, .32);
        background:
          linear-gradient(180deg, rgba(190, 64, 82, .16), transparent 76%),
          radial-gradient(circle at 84% 14%, rgba(240, 185, 194, .12), transparent 10rem),
          rgba(0, 0, 0, .18);
      }

      .game-frame__hero::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px),
          linear-gradient(180deg, rgba(255,255,255,.035) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: linear-gradient(180deg, black, transparent 92%);
        opacity: .36;
      }

      .game-frame__hero > * {
        position: relative;
        z-index: 1;
      }

      .game-frame__status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .game-frame__status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 26px;
        border: 1px solid rgba(190, 64, 82, .38);
        background: rgba(0, 0, 0, .28);
        color: #d0a2aa;
        padding: 0 9px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .game-frame__status span {
        width: 7px;
        height: 7px;
        background: #be4052;
        box-shadow: 0 0 12px rgba(190, 64, 82, .9);
      }

      .game-frame__hero h2 {
        margin: 7px 0 12px;
        color: #fff0f2;
        font-family: var(--display);
        font-size: clamp(30px, 4vw, 42px);
        line-height: .92;
        letter-spacing: -.055em;
        text-shadow: 0 0 24px rgba(122, 26, 40, .46);
      }

      .game-frame__loadout {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .game-frame__loadout span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
        min-height: 30px;
        border: 1px solid rgba(95, 7, 22, .54);
        background: rgba(0, 0, 0, .24);
        color: rgba(240, 215, 220, .8);
        padding: 0 8px;
        font-size: 11px;
        font-weight: 850;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .game-frame__loadout svg {
        width: 13px;
        height: 13px;
        color: #b33b4e;
        flex: 0 0 auto;
      }

      .game-frame__body {
        display: grid;
        gap: 0;
        padding: 13px 14px 16px;
      }

      .game-frame__minihead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        color: var(--faint);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .game-frame__minihead strong {
        color: #d0a2aa;
        font-size: 11px;
      }

      .game-type-grid,
      .game-role-grid {
        display: grid;
        gap: 7px;
      }

      .game-type-card,
      .game-role-card {
        position: relative;
        display: grid;
        min-width: 0;
        border: 1px solid rgba(95, 7, 22, .48);
        background:
          linear-gradient(90deg, rgba(95, 7, 22, .18), transparent 58%),
          rgba(0, 0, 0, .23);
        color: var(--muted);
        padding: 10px;
        text-align: left;
        transition: border-color .12s ease, background .12s ease, box-shadow .12s ease, transform .12s ease, color .12s ease;
      }

      .game-type-card {
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 58px;
      }

      .game-type-card:hover,
      .game-type-card.active,
      .game-role-card:hover,
      .game-role-card.active {
        border-color: rgba(190, 64, 82, .8);
        background:
          radial-gradient(circle at 10% 0%, rgba(190, 64, 82, .2), transparent 9rem),
          linear-gradient(90deg, rgba(95, 7, 22, .34), transparent 68%),
          rgba(10, 6, 8, .76);
        color: #fff0f2;
        box-shadow:
          0 0 0 1px rgba(190, 64, 82, .16),
          0 0 28px rgba(122, 26, 40, .28),
          inset 3px 0 0 rgba(190, 64, 82, .78);
      }

      .game-type-card:hover,
      .game-role-card:hover {
        transform: translateX(2px);
      }

      .game-type-card__icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(190, 64, 82, .28);
        background: rgba(51, 3, 12, .24);
        color: #b33b4e;
      }

      .game-type-card__icon svg {
        width: 19px;
        height: 19px;
      }

      .game-type-card__text {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .game-type-card__text strong,
      .game-role-card__top strong {
        color: #eeeeee;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.1;
      }

      .game-type-card__text small,
      .game-role-card__top small,
      .game-type-card__mark {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .game-type-card.active .game-type-card__mark,
      .game-role-card.active .game-role-card__top small {
        color: #d0a2aa;
      }

      .game-category-panel,
      .game-threat-panel {
        border: 1px solid rgba(95, 7, 22, .42);
        background: rgba(0, 0, 0, .18);
        padding: 9px;
      }

      .game-category-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .game-category-chip,
      .game-threat-chip {
        border: 1px solid rgba(95, 7, 22, .54);
        background: rgba(51, 3, 12, .18);
        color: #c8a2a8;
        transition: border-color .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease;
      }

      .game-category-chip {
        min-height: 30px;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 850;
      }

      .game-category-chip:hover,
      .game-category-chip.active,
      .game-threat-chip:hover,
      .game-threat-chip.active {
        border-color: rgba(190, 64, 82, .82);
        background: rgba(95, 7, 22, .44);
        color: #fff0f2;
        box-shadow: 0 0 22px rgba(122, 26, 40, .18), inset 0 1px 0 rgba(255, 238, 242, .05);
      }

      .game-role-card {
        gap: 8px;
      }

      .game-role-card__top,
      .game-role-card__stats,
      .game-frame__meter span {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .game-role-card__summary {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }

      .game-role-card__stats {
        justify-content: flex-start;
        flex-wrap: wrap;
      }

      .game-role-card__stats span {
        border: 1px solid rgba(95, 7, 22, .42);
        background: rgba(0, 0, 0, .2);
        color: #c8a2a8;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 850;
      }

      .game-threat-scale {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
      }

      .game-threat-chip {
        display: grid;
        gap: 4px;
        align-content: center;
        min-height: 56px;
        padding: 8px 7px;
        text-align: left;
      }

      .game-threat-chip span {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .12em;
      }

      .game-threat-chip strong {
        font-size: 11px;
        line-height: 1.1;
      }

      .game-frame__meters {
        display: grid;
        gap: 9px;
        margin-top: 12px;
      }

      .game-frame__meter {
        display: grid;
        gap: 6px;
      }

      .game-frame__meter small {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .game-frame__meter strong {
        color: #d0a2aa;
        font-size: 11px;
        font-weight: 950;
      }

      .game-frame__meter i {
        display: block;
        height: 7px;
        overflow: hidden;
        border: 1px solid rgba(95, 7, 22, .52);
        background: rgba(0, 0, 0, .36);
        font-style: normal;
      }

      .game-frame__meter b {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, rgba(95, 7, 22, .9), rgba(190, 64, 82, .72));
        box-shadow: 0 0 16px rgba(190, 64, 82, .34);
      }

      .game-frame__meter b.is-over {
        background: linear-gradient(90deg, rgba(190, 64, 82, .95), rgba(240, 185, 194, .76));
      }

      .monster-danger-segments {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        min-height: 40px;
        border: 1px solid var(--line);
        background: rgba(0, 0, 0, .18);
      }

      .intrusion-segment {
        border: 0;
        border-right: 1px solid rgba(95, 7, 22, .32);
        background: transparent;
        color: var(--muted);
        font-size: 11px;
        font-weight: 850;
        padding: 0 8px;
      }

      .intrusion-segment:last-child {
        border-right: 0;
      }

      .intrusion-segment:hover,
      .intrusion-segment.active {
        background: rgba(51, 3, 12, .42);
        color: #d0a2aa;
      }

      .navigator,
      .build-canvas {
        min-height: 0;
        padding: 14px;
        border-color: color-mix(in srgb, rgba(95, 7, 22, .62) 74%, white 26%);
        background-color: rgba(33, 27, 29, .88);
        background-image:
          linear-gradient(180deg, rgba(255, 238, 242, .06), transparent 9rem),
          radial-gradient(circle at 12% 0%, rgba(255, 238, 242, .04), transparent 20rem),
          linear-gradient(120deg, rgba(122, 26, 40, .055), transparent 48%);
        background-blend-mode: overlay, overlay, normal;
      }

      .navigator-head {
        margin-bottom: 13px;
        border-bottom: 1px solid rgba(95, 7, 22, .34);
        padding-bottom: 11px;
      }

      .navigator-head h2 {
        margin: 5px 0 0;
        color: #eeeeee;
        font-family: var(--font);
        font-size: 22px;
        font-weight: 850;
        line-height: 1.05;
        letter-spacing: -.035em;
        text-shadow: 0 0 16px rgba(122, 26, 40, .26);
      }

      .navigator-mode-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 10px;
        border: 1px solid rgba(95, 7, 22, .46);
        background: rgba(0, 0, 0, .2);
        padding: 7px 8px;
      }

      .navigator-mode-row span,
      .navigator-mode-row strong {
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .09em;
        text-transform: uppercase;
      }

      .navigator-mode-row span {
        color: #8f7278;
      }

      .navigator-mode-row strong {
        color: #d0a2aa;
        text-align: right;
      }


      .monster-panel-group {
        display: grid;
        gap: 10px;
        padding: 14px 0;
        border-top: 1px solid rgba(95, 7, 22, .34);
      }

      .monster-panel-group:first-of-type {
        border-top: 0;
        padding-top: 0;
      }

      .monster-panel-group__head {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #d0a2aa;
      }

      .monster-panel-group__head svg {
        width: 15px;
        height: 15px;
        filter: drop-shadow(0 0 6px rgba(122, 26, 40, .32));
      }

      .monster-panel-group__head h3 {
        margin: 0;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .11em;
        text-transform: uppercase;
      }

      .monster-choice-stack,
      .component-list,
      .compiled-stack,
      .monster-warning-list {
        display: grid;
        gap: 9px;
      }

      .brief-choice-card {
        position: relative;
        min-height: 96px;
        overflow: hidden;
        border: 1px solid var(--line);
        background-color: rgba(9, 6, 8, .56);
        background-image: linear-gradient(180deg, rgba(122, 26, 40, .045), transparent 48%), linear-gradient(90deg, rgba(51, 3, 12, .24), transparent 52%);
        background-blend-mode: overlay, normal;
        color: var(--muted);
        padding: 14px 13px 13px;
        text-align: left;
        transition: border-color .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease, transform .12s ease;
      }

      .brief-choice-card:hover,
      .brief-choice-card.selected {
        border-color: rgba(122, 26, 40, .95);
        background:
          linear-gradient(180deg, rgba(51, 3, 12, .36), transparent 160px),
          radial-gradient(circle at 28px 22px, rgba(190, 64, 82, .2), transparent 150px),
          rgba(51, 3, 12, .17);
        color: var(--text);
        box-shadow: 0 0 0 1px rgba(122, 26, 40, .4), 0 0 46px rgba(51, 3, 12, .6), inset 0 0 44px rgba(122, 26, 40, .17);
      }

      .brief-choice-card:hover {
        transform: scale(1.006);
      }

      .brief-choice-card strong {
        position: relative;
        z-index: 2;
        display: block;
        margin-bottom: 7px;
        color: #eeeeee;
        font-family: var(--font);
        font-size: 14px;
        font-weight: 850;
        line-height: 1.18;
        letter-spacing: -.01em;
      }

      .brief-choice-card.selected strong {
        color: #d0a2aa;
        text-shadow: 0 0 13px rgba(122, 26, 40, .58), 0 0 2px rgba(255, 255, 255, .14);
      }

      .brief-choice-card span:not(.brief-choice-icon) {
        position: relative;
        z-index: 2;
        display: block;
        font-size: 12px;
        line-height: 1.42;
      }

      .brief-choice-icon {
        position: absolute;
        right: 14px;
        top: 50%;
        z-index: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 88px;
        height: 88px;
        color: rgba(143, 38, 53, .18);
        transform: translateY(-50%);
        filter: drop-shadow(0 0 18px rgba(122, 26, 40, .14));
        pointer-events: none;
      }

      .brief-choice-icon svg {
        width: 72px;
        height: 72px;
      }

      .build-head,
      .slot-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
      }

      .monster-build-head {
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(95, 7, 22, .34);
        padding-bottom: 14px;
      }

      .crucible-head-controls {
        display: grid;
        align-items: start;
        gap: 12px;
        flex: 0 0 auto;
      }


      .monster-canvas-title {
        margin: 5px 0 4px;
        color: var(--text);
        font-family: var(--display);
        font-size: clamp(34px, 4vw, 48px);
        line-height: .96;
        letter-spacing: -.04em;
      }

      .monster-canvas-subtitle {
        max-width: 620px;
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }

      .build-slots {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        align-items: start;
      }

      .guided-flow-panel {
        display: grid;
        gap: 12px;
        margin-bottom: 14px;
        border: 1px solid rgba(95, 7, 22, .54);
        background: rgba(0, 0, 0, .22);
        padding: 13px;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .04);
      }

      .guided-flow-next {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(190, 64, 82, .32);
        background:
          radial-gradient(circle at 0% 0%, rgba(190, 64, 82, .13), transparent 16rem),
          rgba(0, 0, 0, .18);
        padding: 11px 12px;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
      }

      .guided-flow-next__copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .guided-flow-next__copy span,
      .guided-readiness-badge,
      .guided-slot-chip span {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .guided-flow-next__copy strong {
        color: #fff0f2;
        font-size: 15px;
        font-weight: 950;
        line-height: 1.1;
        letter-spacing: -.025em;
      }

      .guided-flow-next__copy p {
        margin: 0;
        color: rgba(238, 238, 238, .52);
        font-size: 12px;
        line-height: 1.4;
      }

      .guided-flow-next button {
        min-height: 36px;
        border: 1px solid rgba(190, 64, 82, .6);
        background: rgba(95, 7, 22, .28);
        color: #fff0f2;
        padding: 0 12px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .09em;
        text-transform: uppercase;
        white-space: nowrap;
        box-shadow: 0 0 18px rgba(122, 26, 40, .18), inset 0 1px 0 rgba(255, 238, 242, .05);
      }

      .guided-flow-next button:hover {
        border-color: rgba(240, 185, 194, .72);
        background: rgba(122, 26, 40, .36);
      }

      .guided-slot-roadmap {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
      }

      .guided-slot-chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 30px;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .022);
        color: rgba(238, 238, 238, .52);
        padding: 0 9px;
        transition: border-color .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease;
      }

      .guided-slot-chip strong {
        color: inherit;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .07em;
        text-transform: uppercase;
      }

      .guided-slot-chip.is-filled {
        border-color: rgba(143, 150, 148, .28);
        color: #bec8c5;
      }

      .guided-slot-chip.is-next,
      .guided-slot-chip:hover {
        border-color: rgba(190, 64, 82, .6);
        background: rgba(95, 7, 22, .26);
        color: #fff0f2;
        box-shadow: 0 0 18px rgba(122, 26, 40, .18);
      }

      .guided-readiness-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
      }

      .guided-readiness-badge {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        border: 1px solid rgba(255, 238, 242, .065);
        background: rgba(0, 0, 0, .16);
        padding: 0 8px;
        color: rgba(238, 238, 238, .34);
      }

      .guided-readiness-badge.is-ready {
        border-color: rgba(143, 150, 148, .32);
        color: #bec8c5;
        background: rgba(143, 150, 148, .08);
      }

      .guided-flow-warnings {
        display: grid;
        gap: 7px;
      }

      .guided-flow-warning {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 7px;
        margin: 0;
        border: 1px solid rgba(95, 7, 22, .46);
        background: rgba(0, 0, 0, .18);
        padding: 8px;
      }

      .guided-flow-warning svg {
        width: 14px;
        height: 14px;
        margin-top: 2px;
        color: #b33b4e;
      }

      .guided-flow-warning span {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }

      .guided-flow-warning.critical {
        border-color: rgba(240, 185, 194, .7);
        background: rgba(122, 26, 40, .28);
      }

      .guided-flow-warning.major {
        border-color: rgba(190, 64, 82, .58);
      }

      .graft-inspector {
        display: grid;
        gap: 12px;
        margin-top: 14px;
        border: 1px solid rgba(95, 7, 22, .52);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .04), transparent 72%),
          radial-gradient(circle at 0% 0%, rgba(122, 26, 40, .13), transparent 16rem),
          rgba(0, 0, 0, .22);
        padding: 13px;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
      }

      .graft-inspector__head,
      .graft-inspector__footer {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .graft-inspector__head h3 {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 6px 0 0;
        color: #fff0f2;
        font-size: 18px;
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: -.025em;
      }

      .graft-inspector__head h3 svg {
        width: 18px;
        height: 18px;
        color: #b33b4e;
      }

      .graft-inspector__status {
        display: grid;
        justify-items: end;
        gap: 4px;
        min-width: 116px;
      }

      .graft-inspector__status span,
      .graft-inspector__footer span,
      .graft-inspector__empty span {
        color: #8f7278;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .graft-inspector__status strong {
        border: 1px solid rgba(190, 64, 82, .42);
        background: rgba(51, 3, 12, .24);
        color: #d0a2aa;
        padding: 3px 7px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .graft-inspector__content,
      .graft-inspector__stack {
        display: grid;
        gap: 12px;
      }

      .graft-inspector__item {
        display: grid;
        gap: 12px;
        border: 1px solid rgba(95, 7, 22, .38);
        background: rgba(0, 0, 0, .16);
        padding: 11px;
      }

      .graft-inspector__title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .graft-inspector__title-row button {
        display: grid;
        place-items: center;
        width: 26px;
        min-width: 26px;
        min-height: 26px;
        border: 1px solid rgba(95, 7, 22, .52);
        background: rgba(0, 0, 0, .2);
        color: #8f7278;
      }

      .graft-inspector__title-row button:hover {
        border-color: rgba(190, 64, 82, .72);
        color: #fff0f2;
      }

      .graft-inspector__title-row svg {
        width: 13px;
        height: 13px;
      }

      .graft-inspector__main h4 {
        margin: 0 0 5px;
        color: #d0a2aa;
        font-size: 15px;
        font-weight: 900;
      }

      .graft-inspector__main p,
      .graft-inspector__rules p,
      .graft-inspector__empty p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }

      .graft-inspector__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 9px;
      }

      .graft-inspector__chips span {
        border: 1px solid rgba(95, 7, 22, .54);
        background: rgba(51, 3, 12, .2);
        color: #c8a2a8;
        padding: 3px 6px;
        font-size: 10px;
        font-weight: 850;
      }

      .graft-inspector__rules {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }

      .graft-inspector__rules article {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px;
        border: 1px solid rgba(95, 7, 22, .38);
        background: rgba(0, 0, 0, .2);
        padding: 10px;
      }

      .graft-inspector__rules svg {
        width: 15px;
        height: 15px;
        margin-top: 2px;
        color: #b33b4e;
      }

      .graft-inspector__rules strong {
        display: block;
        margin-bottom: 4px;
        color: #fff0f2;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .graft-inspector__footer {
        align-items: center;
        border-top: 1px solid rgba(95, 7, 22, .34);
        padding-top: 10px;
      }

      .graft-inspector__footer button {
        min-height: 30px;
        border: 1px solid rgba(95, 7, 22, .58);
        background: rgba(0, 0, 0, .24);
        color: #c8a2a8;
        padding: 0 10px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .graft-inspector__footer button:hover {
        border-color: rgba(190, 64, 82, .78);
        color: #fff0f2;
      }

      .graft-inspector__empty {
        display: grid;
        gap: 8px;
        border: 1px dashed rgba(95, 7, 22, .46);
        background: rgba(0, 0, 0, .18);
        padding: 11px;
      }

      .build-slot {
        position: relative;
        cursor: pointer;
        border: 1px solid var(--line);
        background-color: rgba(8, 6, 7, .46);
        background-image:
          linear-gradient(180deg, rgba(122, 26, 40, .05), transparent 62%),
          radial-gradient(circle at 24px 22px, rgba(122, 26, 40, .08), transparent 130px),
          linear-gradient(135deg, rgba(51, 3, 12, .24), transparent 70%);
        background-blend-mode: screen, screen, normal;
        padding: 17px 16px;
        min-height: 138px;
        overflow: hidden;
        transition: border-color .12s ease, background .12s ease, box-shadow .12s ease, transform .12s ease, opacity .12s ease, filter .12s ease;
      }

      .build-slot:hover {
        background: linear-gradient(180deg, rgba(51, 3, 12, .24), transparent 150px), radial-gradient(circle at 26px 22px, rgba(122, 26, 40, .16), transparent 140px), rgba(51, 3, 12, .09);
        transform: scale(1.003);
      }

      .build-slot.active {
        border-color: rgba(122, 26, 40, .95);
        background:
          linear-gradient(180deg, rgba(51, 3, 12, .36), transparent 160px),
          radial-gradient(circle at 28px 22px, rgba(190, 64, 82, .2), transparent 150px),
          rgba(51, 3, 12, .17);
        box-shadow: 0 0 0 1px rgba(122, 26, 40, .4), 0 0 46px rgba(51, 3, 12, .6), inset 0 0 44px rgba(122, 26, 40, .17), inset 0 1px 0 rgba(122, 26, 40, .08);
      }

      .build-slot.needs-attention:not(.active)::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: conic-gradient(from var(--empty-slot-border-angle, 0deg), rgba(122, 26, 40, .2) 0deg, rgba(122, 26, 40, .2) 222deg, rgba(222, 146, 159, .4) 246deg, rgba(174, 50, 68, .62) 263deg, rgba(222, 146, 159, .32) 281deg, rgba(122, 26, 40, .2) 308deg, rgba(122, 26, 40, .2) 360deg);
        opacity: .45;
        animation: emptySlotBorderOrbit 8.3s linear infinite;
      }

      .build-slot.needs-attention:not(.active)::after {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        pointer-events: none;
        background-color: #09090a;
        background-image: linear-gradient(180deg, rgba(180, 174, 176, .045), transparent 62%), radial-gradient(circle at 24px 22px, rgba(150, 142, 146, .06), transparent 130px), linear-gradient(135deg, rgba(42, 39, 41, .14), transparent 70%);
        filter: saturate(.56);
      }

      .build-slot > * {
        position: relative;
        z-index: 1;
      }

      @property --empty-slot-border-angle {
        syntax: '<angle>';
        inherits: false;
        initial-value: 0deg;
      }

      @keyframes emptySlotBorderOrbit {
        0% { --empty-slot-border-angle: 0deg; }
        100% { --empty-slot-border-angle: 360deg; }
      }

      .slot-name {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: var(--accent-3);
        font-size: 12.5px;
        font-weight: 900;
        letter-spacing: .06em;
        line-height: 1.15;
        text-transform: uppercase;
      }

      .slot-icon {
        width: 19px;
        min-width: 19px;
        height: 19px;
        color: #8f2635;
        filter: drop-shadow(0 0 5px rgba(122, 26, 40, .24));
      }

      .build-slot.active .slot-name,
      .build-slot.active .slot-icon,
      .slot-item-title {
        color: #d0a2aa;
        text-shadow: 0 0 13px rgba(122, 26, 40, .58), 0 0 2px rgba(255, 255, 255, .14);
      }

      .slot-head-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .count {
        min-width: 26px;
        border: 1px solid rgba(122, 26, 40, .18);
        background: rgba(122, 26, 40, .12);
        color: var(--faint);
        padding: 2px 7px;
        font-size: 12px;
        font-weight: 650;
        text-align: center;
      }

      .slot-menu-btn {
        display: grid;
        place-items: center;
        width: 26px;
        min-width: 26px;
        min-height: 26px;
        border: 0;
        background: transparent;
        color: var(--faint);
        opacity: 0;
        transform: translateY(-1px);
        transition: opacity .12s ease, color .12s ease, filter .12s ease;
      }

      .build-slot.has-items:hover .slot-menu-btn,
      .build-slot.has-items:focus-within .slot-menu-btn {
        opacity: 1;
      }

      .slot-empty {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 10px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }

      .slot-stack {
        display: grid;
        gap: 10px;
        margin-top: 12px;
      }

      .slot-item {
        position: relative;
        border: 0;
        background: transparent;
        padding: 0 30px 0 0;
        box-shadow: none;
      }

      .slot-item-remove {
        position: absolute;
        top: -2px;
        right: 0;
        display: grid;
        place-items: center;
        width: 24px;
        min-width: 24px;
        min-height: 24px;
        border: 1px solid rgba(95, 7, 22, .52);
        background: rgba(0, 0, 0, .18);
        color: #8f7278;
        opacity: 0;
        transition: opacity .12s ease, color .12s ease, border-color .12s ease, background .12s ease;
      }

      .slot-item:hover .slot-item-remove,
      .slot-item:focus-within .slot-item-remove {
        opacity: 1;
      }

      .slot-item-remove:hover {
        border-color: rgba(190, 64, 82, .72);
        background: rgba(95, 7, 22, .26);
        color: #fff0f2;
      }

      .slot-item-remove svg {
        width: 13px;
        height: 13px;
      }

      .slot-item-text {
        margin: 0;
        color: var(--muted);
        padding-left: 1.25em;
        font-size: 13px;
        line-height: 1.45;
        text-indent: -1.25em;
      }

      .match-row.always-visible,
      .meta-list.always-visible {
        max-height: none;
        opacity: 1;
        transform: none;
        margin-top: 9px;
      }

      .match-chip,
      .navigator-filter-chip,
      .source-chip-btn,
      .meta-value {
        border: 1px solid rgba(95, 7, 22, .56);
        background: rgba(51, 3, 12, .2);
        color: #c8a2a8;
        padding: 3px 6px;
        font-size: 10px;
        font-weight: 800;
      }

      .monster-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .component-card {
        position: relative;
        overflow: hidden;
        display: grid;
        gap: 9px;
        border: 2px solid var(--line);
        background-color: rgba(9, 6, 8, .56);
        background-image: linear-gradient(180deg, rgba(122, 26, 40, .045), transparent 48%), linear-gradient(90deg, rgba(51, 3, 12, .24), transparent 52%);
        background-blend-mode: overlay, normal;
        padding: 12px;
        cursor: grab;
        transition: border-color .12s ease, background .12s ease, box-shadow .12s ease, transform .12s ease;
      }

      .component-card:hover,
      .component-card.in-build {
        border-color: rgba(122, 26, 40, .95);
        background:
          linear-gradient(180deg, rgba(51, 3, 12, .36), transparent 160px),
          radial-gradient(circle at 28px 22px, rgba(190, 64, 82, .2), transparent 150px),
          rgba(51, 3, 12, .17);
        box-shadow: 0 0 0 1px rgba(122, 26, 40, .4), 0 0 46px rgba(51, 3, 12, .6), inset 0 0 44px rgba(122, 26, 40, .17), inset 0 1px 0 rgba(122, 26, 40, .08);
      }

      .component-card:hover {
        transform: scale(1.006);
      }

      .component-toggle-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-width: 54px;
        height: 26px;
        border: 1px solid rgba(122, 26, 40, .52);
        background: rgba(0, 0, 0, .22);
        color: #c8a2a8;
        padding: 0 8px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .component-toggle-btn svg {
        width: 12px;
        height: 12px;
      }

      .component-toggle-btn span {
        line-height: 1;
      }

      .card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding-right: 64px;
      }

      .component-title-stack {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .component-card__slot-line {
        color: #8f7278;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .1em;
        line-height: 1;
        text-transform: uppercase;
      }

      .decision-badge-row,
      .component-quick-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .decision-badge,
      .component-quick-meta span {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .025);
        color: rgba(238, 238, 238, .52);
        padding: 0 6px;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .045em;
      }

      .decision-badge {
        color: #c8a2a8;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .decision-badge--recommended,
      .decision-badge--synergy {
        border-color: rgba(143, 150, 148, .34);
        background: rgba(143, 150, 148, .08);
        color: #bec8c5;
      }

      .decision-badge--high-pressure,
      .decision-badge--needs-tell,
      .decision-badge--risky,
      .decision-badge--blocked {
        border-color: rgba(190, 64, 82, .5);
        background: rgba(95, 7, 22, .24);
        color: #f0b9c2;
      }

      .component-quick-meta strong {
        margin-left: 4px;
        color: #f0d7dc;
        font-weight: 950;
      }

      .component-decision-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }

      .component-decision-grid > span {
        display: grid;
        gap: 3px;
        min-width: 0;
        border: 1px solid rgba(255, 238, 242, .06);
        background: rgba(0, 0, 0, .14);
        padding: 7px;
      }

      .component-decision-grid small {
        color: #8f7278;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .1em;
        line-height: 1;
        text-transform: uppercase;
      }

      .component-decision-grid strong {
        overflow: hidden;
        color: rgba(238, 238, 238, .74);
        font-size: 11px;
        font-weight: 900;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .component-decision-grid .is-risky strong {
        color: #f0b9c2;
      }

      .component-card[data-decision-tier="recommended"] {
        border-color: rgba(143, 150, 148, .38);
      }

      .component-card[data-decision-tier="risky"],
      .component-card[data-decision-tier="blocked"] {
        border-color: rgba(190, 64, 82, .38);
      }

      .component-card h3 {
        margin: 0;
        font-family: var(--font);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.22;
        letter-spacing: .01em;
      }

      .component-card.in-build h3 {
        color: #d0a2aa;
        text-shadow: 0 0 13px rgba(122, 26, 40, .58), 0 0 2px rgba(255, 255, 255, .14);
      }

      .summary {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
      }

      .meta-list {
        display: grid;
        gap: 4px;
      }

      .meta-row {
        display: grid;
        grid-template-columns: 78px minmax(0, 1fr);
        gap: 6px;
        align-items: start;
        border-top: 1px solid rgba(122, 26, 40, .12);
        padding-top: 4px;
      }

      .meta-row:first-child {
        border-top: 0;
        padding-top: 0;
      }

      .meta-label {
        color: #8f7278;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .085em;
        line-height: 1.35;
        text-transform: uppercase;
      }

      .meta-values {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        min-width: 0;
      }

      .meta-value.source-chip {
        border-color: rgba(95, 7, 22, .68);
        background: rgba(51, 3, 12, .32);
        color: #d0a2aa;
      }

      .meta-value.strong-chip,
      .compatibility-badge.soft,
      .compatibility-badge.avoid {
        border-color: rgba(190, 64, 82, .54);
        background: rgba(95, 7, 22, .3);
        color: #f0d7dc;
      }

      .meta-value.danger-chip,
      .compatibility-badge.missing,
      .compatibility-badge.incompatible {
        border-color: rgba(240, 185, 194, .64);
        background: rgba(122, 26, 40, .32);
        color: #f0b9c2;
      }

      .compatibility-badge {
        flex: 0 0 auto;
        border: 1px solid rgba(95, 7, 22, .56);
        background: rgba(0, 0, 0, .24);
        padding: 3px 6px;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .compatibility-note {
        margin: 7px 0 0;
        border-left: 2px solid rgba(190, 64, 82, .64);
        color: #d0a2aa;
        padding-left: 8px;
        font-size: 11px;
        line-height: 1.35;
      }

      .component-card.compatibility-missing,
      .component-card.compatibility-incompatible {
        border-color: rgba(190, 64, 82, .68);
      }

      .monster-source-tools {
        position: relative;
        margin-bottom: 12px;
      }

      .monster-source-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .source-chip-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 38px;
        padding: 0 9px;
        font-size: 11px;
        font-weight: 850;
      }

      .source-chip-btn svg {
        width: 14px;
        height: 14px;
      }

      .navigator-count {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        min-height: 38px;
        border: 1px solid var(--line);
        background: rgba(51, 3, 12, .18);
        color: var(--muted);
        padding: 0 9px;
        font-size: 12px;
        font-weight: 650;
        text-align: center;
      }

      .tag-filter-row.monster-source-grid-open {
        position: static;
        display: grid;
        width: auto;
        max-height: none;
        overflow: visible;
        gap: 8px;
        margin-top: 8px;
        padding: 6px;
        border: 1px solid rgba(95, 7, 22, .76);
        background: rgba(5, 5, 6, .58);
        box-shadow: none;
      }

      .tag-filter-row__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 4px 5px 7px;
        border-bottom: 1px solid rgba(95, 7, 22, .34);
        color: var(--faint);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .tag-filter-row__head svg {
        width: 14px;
        height: 14px;
      }

      .filter-chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .navigator-filter-chip {
        min-height: 26px;
        text-align: left;
      }

      .navigator-filter-chip:hover,
      .navigator-filter-chip.active {
        border-color: rgba(122, 26, 40, .82);
        background: rgba(51, 3, 12, .46);
        color: #f0d7dc;
      }

      .monster-slot-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        padding: 0 0 12px;
        border-bottom: 1px solid rgba(95, 7, 22, .34);
        margin-bottom: 12px;
      }

      .monster-component-list {
        max-height: 740px;
        overflow: auto;
        padding-right: 3px;
      }

      .monster-meter {
        display: grid;
        gap: 6px;
      }

      .monster-meter + .monster-meter {
        margin-top: 8px;
      }

      .monster-meter__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 850;
      }

      .monster-meter__head span {
        text-transform: uppercase;
        letter-spacing: .08em;
      }

      .monster-meter__head strong {
        color: #d0a2aa;
      }

      .monster-meter__head strong.is-over {
        color: #f0b9c2;
      }

      .monster-meter__track {
        height: 8px;
        overflow: hidden;
        border: 1px solid rgba(95, 7, 22, .5);
        background: rgba(0, 0, 0, .36);
      }

      .monster-meter__track > div {
        height: 100%;
        background: linear-gradient(90deg, rgba(95, 7, 22, .86), rgba(190, 64, 82, .7));
        box-shadow: 0 0 18px rgba(122, 26, 40, .38);
      }

      .monster-meter__track > div.is-over {
        background: linear-gradient(90deg, rgba(122, 26, 40, .9), rgba(240, 185, 194, .72));
      }

      .monster-stat-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 10px;
      }

      .monster-stat {
        text-align: center;
      }

      .compiled-meta-item,
      .compiled-component,
      .compiled-mechanic,
      .compiled-note {
        border: 1px solid rgba(122, 26, 40, .08);
        background: rgba(0, 0, 0, .22);
        padding: 10px;
      }

      .compiled-label {
        display: block;
        margin-bottom: 4px;
        color: var(--faint);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .compiled-value,
      .compiled-component strong,
      .compiled-mechanic strong {
        color: var(--text);
        font-size: 13px;
        font-weight: 800;
      }

      .monster-use-note {
        margin-top: 10px;
      }

      .compiled-note p,
      .compiled-component p,
      .compiled-mechanic p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }

      .monster-warning-list {
        margin-top: 10px;
      }

      .monster-warning {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px;
        border: 1px solid rgba(190, 64, 82, .62);
        background: rgba(51, 3, 12, .2);
        color: #e3b1ba;
        padding: 9px;
        font-size: 12px;
        line-height: 1.4;
      }

      .monster-warning svg {
        width: 14px;
        height: 14px;
        margin-top: 2px;
      }

      .monster-warning--ok {
        margin-top: 10px;
        border-color: rgba(143, 150, 148, .38);
        color: #bec8c5;
      }

      .balance-recommendation-list {
        display: grid;
        gap: 9px;
      }

      .balance-recommendation {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        border: 1px solid rgba(190, 64, 82, .44);
        background: rgba(51, 3, 12, .18);
        padding: 10px;
      }

      .balance-recommendation > svg {
        width: 15px;
        height: 15px;
        margin-top: 2px;
        color: #b33b4e;
      }

      .balance-recommendation--ok {
        border-color: rgba(143, 150, 148, .36);
        background: rgba(143, 150, 148, .06);
      }

      .balance-recommendation--ok > svg {
        color: #bec8c5;
      }

      .balance-recommendation__body {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      .balance-recommendation__body > span {
        display: none;
      }

      .balance-recommendation__body strong {
        color: #fff0f2;
        font-size: 13px;
        font-weight: 950;
        line-height: 1.15;
      }

      .balance-recommendation__body p {
        margin: 0;
        color: rgba(238, 238, 238, .56);
        font-size: 12px;
        line-height: 1.42;
      }

      .balance-recommendation__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 3px;
      }

      .balance-recommendation__actions button {
        min-height: 28px;
        border: 1px solid rgba(190, 64, 82, .46);
        background: rgba(95, 7, 22, .22);
        color: #f0d7dc;
        padding: 0 9px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .balance-recommendation__actions button:hover {
        border-color: rgba(240, 185, 194, .68);
        background: rgba(122, 26, 40, .34);
        color: #fff0f2;
      }

      .balance-recommendation.is-critical {
        border-color: rgba(240, 185, 194, .64);
        background: rgba(122, 26, 40, .24);
      }

      .balance-recommendation.is-major {
        border-color: rgba(190, 64, 82, .5);
      }

      .balance-recommendation.is-minor {
        border-color: rgba(255, 238, 242, .08);
        background: rgba(255, 255, 255, .022);
      }

      .table-view {
        width: min(1540px, 100%);
        margin: 0 auto;
        border: 1px solid rgba(95, 7, 22, .52);
        background: linear-gradient(180deg, rgba(51, 3, 12, .22), transparent 7rem), rgba(0, 0, 0, .24);
        padding: 18px;
      }

      .run-mode-workbench {
        width: min(1540px, 100%);
        margin: 0 auto;
        display: grid;
        gap: 14px;
      }

      .run-mode-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border: 1px solid rgba(95, 7, 22, .52);
        background:
          radial-gradient(circle at 0% 0%, rgba(122, 26, 40, .16), transparent 18rem),
          linear-gradient(180deg, rgba(51, 3, 12, .2), transparent 76%),
          rgba(0, 0, 0, .24);
        padding: 16px;
      }

      .run-mode-hero h2 {
        margin: 0 0 6px;
        color: #fff0f2;
        font-family: var(--display);
        font-size: clamp(34px, 4vw, 56px);
        line-height: .9;
        letter-spacing: -.055em;
      }

      .run-mode-hero p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }

      .run-mode-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }

      .run-mode-actions button {
        min-height: 36px;
        border: 1px solid rgba(95, 7, 22, .58);
        background: rgba(0, 0, 0, .24);
        color: #c8a2a8;
        padding: 0 12px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .run-mode-actions button:hover {
        border-color: rgba(190, 64, 82, .72);
        color: #fff0f2;
        background: rgba(95, 7, 22, .28);
      }

      .run-stat-strip {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 8px;
      }

      .run-stat-strip article {
        border: 1px solid rgba(95, 7, 22, .46);
        background: rgba(0, 0, 0, .22);
        padding: 11px;
      }

      .run-stat-strip span {
        display: block;
        margin-bottom: 4px;
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .run-stat-strip strong {
        color: #fff0f2;
        font-size: 18px;
        font-weight: 950;
        line-height: 1;
      }

      .run-mode-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        align-items: start;
      }

      .run-panel {
        display: grid;
        align-content: start;
        gap: 11px;
        min-height: 168px;
        border: 1px solid rgba(95, 7, 22, .48);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .035), transparent 72%),
          rgba(0, 0, 0, .22);
        padding: 13px;
      }

      .run-panel--wide {
        grid-column: span 2;
      }

      .run-panel__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid rgba(95, 7, 22, .32);
        padding-bottom: 8px;
      }

      .run-panel__head h3 {
        margin: 0;
        color: #d0a2aa;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .11em;
        text-transform: uppercase;
      }

      .run-panel__head strong {
        color: #8f9694;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .run-list,
      .run-trigger-list {
        display: grid;
        gap: 8px;
      }

      .run-list article,
      .run-trigger-list article {
        display: grid;
        gap: 5px;
        border: 1px solid rgba(255, 238, 242, .065);
        background: rgba(0, 0, 0, .18);
        padding: 10px;
      }

      .run-list strong,
      .run-trigger-list strong {
        color: #fff0f2;
        font-size: 13px;
        font-weight: 950;
        line-height: 1.2;
      }

      .run-list p,
      .run-trigger-list p,
      .run-empty {
        margin: 0;
        color: rgba(238, 238, 238, .58);
        font-size: 12px;
        line-height: 1.42;
      }

      .run-trigger-list article > div {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .run-trigger-list span {
        color: #8f7278;
        font-size: 10px;
        font-weight: 900;
        line-height: 1.25;
        text-align: right;
      }

      .export-workbench {
        width: min(1540px, 100%);
        margin: 0 auto;
      }

      .export-layout {
        display: grid;
        grid-template-columns: minmax(540px, 1fr) minmax(320px, 420px);
        gap: 14px;
        align-items: start;
      }

      .export-stat-preview {
        width: 100%;
      }

      .export-console {
        display: grid;
        gap: 13px;
        padding: 14px;
        position: sticky;
        top: 190px;
      }

      .export-console__head {
        border-bottom: 1px solid rgba(95, 7, 22, .34);
        padding-bottom: 11px;
      }

      .export-console__head h2 {
        margin: 5px 0 5px;
        color: #eeeeee;
        font-family: var(--font);
        font-size: 22px;
        font-weight: 850;
        line-height: 1.05;
        letter-spacing: -.035em;
      }

      .export-console__head p:not(.eyebrow) {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .export-format-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .export-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .export-textarea-shell {
        display: grid;
        gap: 7px;
      }

      .export-textarea-shell > span {
        color: #8f7278;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .085em;
        line-height: 1.35;
        text-transform: uppercase;
      }

      .export-textarea-shell textarea {
        width: 100%;
        min-height: 420px;
        resize: vertical;
        border: 1px solid rgba(95, 7, 22, .58);
        background:
          linear-gradient(180deg, rgba(122, 26, 40, .045), transparent 48%),
          rgba(0, 0, 0, .28);
        color: rgba(238, 238, 238, .9);
        padding: 11px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 11px;
        line-height: 1.5;
        outline: none;
      }

      .export-copy-btn {
        min-height: 42px;
        border: 1px solid rgba(190, 64, 82, .72);
        background:
          radial-gradient(circle at 50% 24%, rgba(190, 64, 82, .18), transparent 68%),
          linear-gradient(180deg, rgba(30, 7, 11, .94), rgba(10, 5, 7, .88));
        color: #fff0f2;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .11em;
        text-transform: uppercase;
        box-shadow: 0 0 22px rgba(122, 26, 40, .24), inset 0 1px 0 rgba(255, 238, 242, .06);
      }

      .export-copy-btn.copied {
        border-color: rgba(143, 150, 148, .54);
        color: #bec8c5;
      }

      .export-copy-btn.failed {
        border-color: rgba(240, 185, 194, .76);
        color: #f0b9c2;
      }

      .export-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .export-readiness-card,
      .export-run-sheet {
        display: grid;
        gap: 10px;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .022);
        padding: 12px;
      }

      .export-readiness-card.is-ready {
        border-color: rgba(143, 150, 148, .36);
        background: rgba(143, 150, 148, .055);
      }

      .export-readiness-card.is-blocked {
        border-color: rgba(240, 185, 194, .56);
        background: rgba(122, 26, 40, .16);
      }

      .export-readiness-card__head,
      .export-run-sheet__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid rgba(255, 238, 242, .06);
        padding-bottom: 8px;
      }

      .export-readiness-card__head div {
        display: grid;
        gap: 3px;
      }

      .export-readiness-card__head span,
      .export-run-sheet__head span,
      .export-check span,
      .export-run-sheet__grid span {
        color: #8f7278;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .1em;
        line-height: 1;
        text-transform: uppercase;
      }

      .export-readiness-card__head strong,
      .export-run-sheet__head strong {
        color: #fff0f2;
        font-size: 13px;
        font-weight: 950;
        line-height: 1.1;
      }

      .export-readiness-card__head em {
        display: inline-grid;
        place-items: center;
        min-width: 42px;
        min-height: 30px;
        border: 1px solid rgba(255, 238, 242, .08);
        background: rgba(0, 0, 0, .18);
        color: #d0a2aa;
        font-size: 11px;
        font-style: normal;
        font-weight: 950;
      }

      .export-readiness-meter {
        height: 6px;
        overflow: hidden;
        border: 1px solid rgba(255, 238, 242, .07);
        background: rgba(0, 0, 0, .24);
      }

      .export-readiness-meter span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, rgba(95, 7, 22, .92), rgba(190, 64, 82, .76));
        box-shadow: 0 0 16px rgba(122, 26, 40, .28);
      }

      .export-check-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }

      .export-check {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 7px;
        align-items: start;
        border: 1px solid rgba(255, 238, 242, .06);
        background: rgba(0, 0, 0, .14);
        padding: 8px;
      }

      .export-check svg {
        width: 14px;
        height: 14px;
        color: #b33b4e;
      }

      .export-check.is-ready svg {
        color: #bec8c5;
      }

      .export-check div {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .export-check strong,
      .export-run-sheet__grid strong {
        overflow: hidden;
        color: rgba(238, 238, 238, .74);
        font-size: 11px;
        font-weight: 900;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .export-check.is-ready strong {
        color: #bec8c5;
      }

      .export-check.is-blocked strong,
      .export-check.needs-review strong {
        color: #f0b9c2;
      }

      .export-review-btn {
        min-height: 34px;
        border: 1px solid rgba(190, 64, 82, .46);
        background: rgba(95, 7, 22, .2);
        color: #f0d7dc;
        padding: 0 10px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .export-review-btn:hover {
        border-color: rgba(240, 185, 194, .68);
        background: rgba(122, 26, 40, .34);
        color: #fff0f2;
      }

      .export-run-sheet__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }

      .export-run-sheet__grid article {
        display: grid;
        gap: 4px;
        min-width: 0;
        border: 1px solid rgba(255, 238, 242, .06);
        background: rgba(0, 0, 0, .14);
        padding: 8px;
      }

      .compiled-sheet {
        display: grid;
        gap: 16px;
      }

      .compiled-hero {
        border-bottom: 1px solid rgba(95, 7, 22, .42);
        padding-bottom: 14px;
      }

      .compiled-kicker {
        margin: 0 0 7px;
        color: var(--accent-3);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .compiled-title {
        margin: 0;
        font-family: var(--display);
        font-size: clamp(34px, 4vw, 48px);
        line-height: .96;
        letter-spacing: -.04em;
      }

      .compiled-meta-grid,
      .compiled-component-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }

      .monster-output-grid {
        grid-template-columns: .85fr 1.15fr;
      }

      .compiled-section h2 {
        margin: 0 0 9px;
        color: #b33b4e;
        font-family: var(--font);
        font-size: 15px;
        font-weight: 900;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      .cruor-stat-block {
        max-width: 960px;
        margin: 0 auto;
        border: 1px solid rgba(122, 26, 40, .62);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .038), transparent 8rem),
          radial-gradient(circle at 12% 0%, rgba(122, 26, 40, .16), transparent 18rem),
          rgba(5, 5, 6, .72);
        padding: 18px 20px 20px;
        box-shadow:
          0 24px 72px rgba(0, 0, 0, .42),
          inset 0 1px 0 rgba(255, 238, 242, .05);
      }

      .cruor-stat-block__head {
        border-bottom: 2px solid rgba(122, 26, 40, .68);
        padding-bottom: 10px;
        margin-bottom: 10px;
      }

      .cruor-stat-block__head h3 {
        margin: 0 0 4px;
        color: #fff0f2;
        font-family: var(--display);
        font-size: clamp(34px, 4vw, 54px);
        line-height: .92;
        letter-spacing: -.045em;
        text-shadow: 0 0 20px rgba(122, 26, 40, .36);
      }

      .cruor-stat-block__head p,
      .cruor-stat-block__core p,
      .cruor-stat-block__facts p,
      .cruor-stat-block__section p {
        margin: 0;
        color: rgba(238, 238, 238, .9);
        font-size: 13.5px;
        line-height: 1.52;
      }

      .cruor-stat-block__core,
      .cruor-stat-block__facts {
        display: grid;
        gap: 4px;
        padding: 9px 0;
        border-bottom: 1px solid rgba(95, 7, 22, .44);
      }

      .cruor-stat-block strong {
        color: #fff0f2;
        font-weight: 900;
      }

      .cruor-stat-block em {
        color: #f0d7dc;
        font-style: italic;
      }

      .cruor-stat-block__abilities {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        padding: 11px 0;
        border-bottom: 1px solid rgba(95, 7, 22, .44);
      }

      .table-overflow-wrapper {
        min-width: 0;
        overflow-x: auto;
      }

      .cruor-ability-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid rgba(95, 7, 22, .42);
        background: rgba(0, 0, 0, .18);
      }

      .cruor-ability-table th,
      .cruor-ability-table td {
        border-bottom: 1px solid rgba(95, 7, 22, .26);
        padding: 6px 8px;
        color: rgba(238, 238, 238, .88);
        font-size: 12px;
        line-height: 1.2;
        text-align: center;
      }

      .cruor-ability-table thead th {
        color: #d0a2aa;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .cruor-ability-table tbody th {
        color: #fff0f2;
        font-weight: 950;
        text-align: left;
      }

      .monster-header {
        margin: 0 0 7px !important;
        border-bottom: 1px solid rgba(122, 26, 40, .72);
        color: #b33b4e !important;
        font-size: 16px !important;
        font-weight: 950;
        letter-spacing: .08em;
        line-height: 1.25 !important;
        text-transform: uppercase;
      }

      .cruor-stat-block__section {
        display: grid;
        gap: 8px;
        padding-top: 13px;
      }

      .cruor-stat-block__section + .cruor-stat-block__section {
        margin-top: 2px;
      }

      .cruor-stat-block__section .legendary-actions {
        color: var(--muted);
        font-size: 12.5px;
      }

      .cruor-stat-block__dm-notes {
        margin-top: 14px;
        border-top: 1px solid rgba(95, 7, 22, .44);
        color: var(--muted);
      }

      .rendered-stat-block {
        width: 100%;
      }

      .rendered-stat-block .cruor-stat-block__core {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px 12px;
      }

      .rendered-stat-block .cruor-stat-block__core p {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .rendered-stat-block .cruor-stat-block__core strong {
        color: #8f7278;
        font-size: 9px;
        letter-spacing: .09em;
        text-transform: uppercase;
      }

      .rendered-stat-block .cruor-stat-block__facts {
        gap: 6px;
      }

      .cruor-stat-block__section.is-weakness {
        border: 1px solid rgba(143, 150, 148, .34);
        background:
          linear-gradient(90deg, rgba(143, 150, 148, .07), transparent 70%),
          rgba(0, 0, 0, .13);
        padding: 12px;
      }

      .cruor-stat-block__section.is-weakness h2 {
        color: #bec8c5;
      }

      .cruor-stat-block__designer-notes {
        margin-top: 14px;
        border-top: 1px solid rgba(95, 7, 22, .44);
        padding-top: 10px;
      }

      .cruor-stat-block__designer-notes > summary {
        cursor: pointer;
        color: #8f7278;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .1em;
        list-style: none;
        text-transform: uppercase;
      }

      .cruor-stat-block__designer-notes > summary::-webkit-details-marker {
        display: none;
      }

      .cruor-stat-block__designer-notes[open] > summary {
        color: #d0a2aa;
        margin-bottom: 8px;
      }

      .cruor-stat-block__designer-notes div {
        display: grid;
        gap: 6px;
      }

      .cruor-stat-block__designer-notes p {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .export-raw-panel {
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .018);
        padding: 10px;
      }

      .export-raw-panel > summary {
        cursor: pointer;
        color: #8f7278;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .1em;
        list-style: none;
        text-transform: uppercase;
      }

      .export-raw-panel > summary::-webkit-details-marker {
        display: none;
      }

      .export-raw-panel[open] > summary {
        color: #d0a2aa;
        margin-bottom: 10px;
      }

      .export-raw-panel__body {
        display: grid;
        gap: 10px;
      }

      .export-raw-panel .export-textarea-shell textarea {
        min-height: 220px;
        max-height: 360px;
      }

      .compiled-trigger {
        display: block;
        margin-bottom: 5px;
        color: #c8a2a8;
        font-size: 11px;
        font-weight: 900;
        line-height: 1.35;
      }

      .compiled-mode-note {
        margin: 8px 0 0 !important;
        color: var(--faint) !important;
        font-size: 10px !important;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      .balance-workbench {
        width: min(1540px, 100%);
        margin: 0 auto;
        padding: 16px;
      }

      .balance-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid rgba(95, 7, 22, .38);
        padding-bottom: 15px;
        margin-bottom: 15px;
      }

      .balance-hero h2 {
        margin: 6px 0 5px;
        color: #fff0f2;
        font-family: var(--display);
        font-size: clamp(36px, 4vw, 56px);
        line-height: .9;
        letter-spacing: -.055em;
      }

      .balance-hero p:not(.eyebrow) {
        max-width: 620px;
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }

      .balance-verdict {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 38px;
        border: 1px solid rgba(95, 7, 22, .58);
        background: rgba(0, 0, 0, .24);
        color: #d0a2aa;
        padding: 0 12px;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .09em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .balance-verdict svg {
        width: 15px;
        height: 15px;
      }

      .balance-verdict.ready {
        border-color: rgba(143, 150, 148, .42);
        color: #bec8c5;
      }

      .balance-verdict.needs-review {
        border-color: rgba(190, 64, 82, .72);
        color: #f0b9c2;
        box-shadow: 0 0 26px rgba(122, 26, 40, .2);
      }

      .balance-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        align-items: stretch;
      }

      .balance-card {
        display: grid;
        align-content: start;
        gap: 12px;
        min-height: 178px;
        border: 1px solid rgba(95, 7, 22, .48);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .04), transparent 72%),
          radial-gradient(circle at 0% 0%, rgba(122, 26, 40, .13), transparent 12rem),
          rgba(0, 0, 0, .22);
        padding: 13px;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
      }

      .balance-wide-card {
        grid-column: span 2;
      }

      .balance-controls-card {
        grid-column: span 2;
      }

      .balance-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid rgba(95, 7, 22, .32);
        padding-bottom: 9px;
      }

      .balance-card__head span {
        color: #d0a2aa;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .balance-card__head strong {
        color: #f0d7dc;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
        text-align: right;
      }

      .balance-note {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .advanced-mode-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border: 1px solid rgba(95, 7, 22, .48);
        background: rgba(0, 0, 0, .22);
        padding: 10px;
      }

      .advanced-mode-strip div {
        display: grid;
        gap: 3px;
      }

      .advanced-mode-strip strong {
        color: #fff0f2;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .advanced-mode-strip span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }

      .advanced-mode-strip button {
        min-height: 32px;
        border: 1px solid rgba(95, 7, 22, .58);
        background: rgba(0, 0, 0, .24);
        color: #c8a2a8;
        padding: 0 10px;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .advanced-mode-strip button.active {
        border-color: rgba(190, 64, 82, .78);
        background: rgba(95, 7, 22, .42);
        color: #fff0f2;
        box-shadow: 0 0 22px rgba(122, 26, 40, .18);
      }

      .balance-advanced-card {
        grid-column: span 4;
      }

      .slot-cap-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .balance-meta-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .breakdown-meta-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .balance-progress-ring {
        position: relative;
        display: grid;
        place-items: center;
        width: 104px;
        height: 104px;
        margin: 0 auto;
        background: conic-gradient(rgba(190, 64, 82, .78) var(--progress), rgba(0, 0, 0, .32) 0);
        box-shadow: 0 0 30px rgba(122, 26, 40, .18);
      }

      .balance-progress-ring::before {
        content: "";
        position: absolute;
        inset: 8px;
        background: rgba(5, 5, 6, .92);
        border: 1px solid rgba(95, 7, 22, .42);
      }

      .balance-progress-ring span {
        position: relative;
        z-index: 1;
        color: #fff0f2;
        font-size: 18px;
        font-weight: 950;
      }

      .empty {
        border: 1px dashed var(--line);
        padding: 18px;
        color: var(--faint);
        background: rgba(255, 255, 255, .025);
        font-size: 13px;
        line-height: 1.45;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .monster-shell ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      .monster-shell ::-webkit-scrollbar-track {
        background: transparent;
      }

      .monster-shell ::-webkit-scrollbar-thumb {
        border: 0;
        border-radius: 0;
        background: linear-gradient(180deg, rgba(170, 48, 66, .76), rgba(70, 8, 20, .78));
        box-shadow: inset 0 0 0 1px rgba(255, 238, 242, .055);
      }

      /* Sprint 12 · Minimal UI pass */
      .app-shell__bar {
        min-height: 52px;
        padding-block: 8px;
        border-bottom-width: 1px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, .34);
      }

      .app-shell__brand {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }

      .app-shell__brand strong {
        font-family: var(--font);
        font-size: 14px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .app-shell__eyebrow,
      .app-shell__nav {
        display: none;
      }

      .monster-workspace {
        min-height: calc(100dvh - 52px);
        padding-bottom: 42px;
      }

      .darken-workspace__topbar {
        top: 52px;
        padding: 12px 0 18px;
      }

      .darken-topbar {
        border-width: 1px;
        padding: 14px 16px;
        background: rgba(11, 8, 10, .88);
        box-shadow: 0 18px 48px rgba(0, 0, 0, .48), inset 0 1px 0 rgba(255, 238, 242, .04);
      }

      .darken-topbar__primary {
        gap: 10px;
      }

      .darken-topbar__eyebrow,
      .darken-topbar__title-prefix,
      .monster-canvas-subtitle {
        display: none;
      }

      .darken-topbar__need-value {
        font-family: var(--font);
        font-size: clamp(22px, 2.1vw, 32px);
        font-weight: 950;
        letter-spacing: -.035em;
      }

      .darken-workspace__tab {
        min-width: 86px;
        min-height: 34px;
        border-color: rgba(255, 238, 242, .08);
        background: transparent;
      }

      .monster-current-frame {
        min-height: 34px;
        border-color: rgba(255, 238, 242, .08);
        background: rgba(255, 255, 255, .025);
        color: rgba(238, 238, 238, .58);
      }

      .monster-layout {
        grid-template-columns: minmax(0, 1fr);
        gap: 22px;
      }

      .panel,
      .navigator,
      .build-canvas,
      .balance-workbench,
      .export-console,
      .table-view {
        border-width: 1px;
        border-color: rgba(255, 238, 242, .08);
        background-color: rgba(12, 10, 12, .74);
        background-image: linear-gradient(180deg, rgba(255, 255, 255, .025), transparent 160px);
        box-shadow: 0 18px 52px rgba(0, 0, 0, .34), inset 0 1px 0 rgba(255, 255, 255, .035);
      }

      .navigator,
      .build-canvas {
        padding: 18px;
      }

      .monster-build-head {
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 0;
        border-bottom: 0;
      }

      .monster-canvas-title {
        font-family: var(--font);
        font-size: clamp(26px, 3vw, 38px);
        font-weight: 950;
        letter-spacing: -.045em;
      }

      .monster-canvas-meta-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .monster-canvas-meta-row > span,
      .monster-canvas-meta-row > strong {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(0, 0, 0, .16);
        padding: 0 8px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .monster-canvas-meta-row > span {
        color: rgba(238, 238, 238, .48);
      }

      .monster-canvas-meta-row > strong {
        color: #d0a2aa;
      }

      .crucible-head-controls {
        grid-template-columns: auto;
      }

      .guided-flow-panel.is-wizard {
        display: grid;
        gap: 11px;
        margin: 18px 0 12px;
        border-color: rgba(255, 238, 242, .08);
        background: rgba(255, 255, 255, .022);
        padding: 14px 12px 12px;
        box-shadow: none;
      }

      .brief-wizard__progress {
        --brief-progress: 0;
        position: relative;
        display: grid;
        grid-template-columns: repeat(7, 82px);
        justify-content: center;
        align-items: start;
        gap: 38px;
        width: min(860px, 100%);
        min-height: 62px;
        margin: 0 auto;
        padding: 0;
      }

      .brief-wizard__progress::before,
      .brief-wizard__progress::after {
        content: "";
        position: absolute;
        top: 18px;
        left: 46px;
        right: 46px;
        height: 2px;
        background: rgba(255, 238, 242, .08);
        pointer-events: none;
      }

      .brief-wizard__progress::after {
        right: auto;
        width: calc(100% - 92px);
        background: linear-gradient(90deg, rgba(95, 7, 22, .84), rgba(190, 64, 82, .78));
        transform: scaleX(var(--brief-progress));
        transform-origin: left center;
        box-shadow: 0 0 18px rgba(122, 26, 40, .3);
        transition: transform .18s ease;
      }

      .brief-step-btn {
        position: relative;
        z-index: 1;
        display: grid;
        justify-items: center;
        align-content: start;
        gap: 7px;
        min-width: 92px;
        border: 0;
        background: transparent;
        color: rgba(238, 238, 238, .42);
        padding: 0;
        text-align: center;
      }

      .brief-step-btn:disabled {
        cursor: not-allowed;
        opacity: .46;
      }

      .brief-step-number {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(255, 238, 242, .11);
        background: rgba(5, 5, 6, .86);
        color: #8f7278;
        font-size: 11px;
        font-weight: 950;
        box-shadow: 0 12px 26px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255, 238, 242, .04);
        transition: border-color .14s ease, background .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease;
      }

      .brief-step-label {
        color: inherit;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .08em;
        line-height: 1.15;
        text-transform: uppercase;
        transition: color .14s ease;
      }

      .brief-step-btn.reached .brief-step-number {
        border-color: rgba(143, 150, 148, .36);
        color: #bec8c5;
        background: rgba(0, 0, 0, .34);
      }

      .brief-step-btn.reached .brief-step-label {
        color: #bec8c5;
      }

      .brief-step-btn.active .brief-step-number,
      .brief-step-btn:hover:not(:disabled) .brief-step-number {
        transform: translateY(-1px);
        border-color: rgba(190, 64, 82, .72);
        background: rgba(95, 7, 22, .46);
        color: #fff0f2;
        box-shadow: 0 0 0 1px rgba(190, 64, 82, .12), 0 0 26px rgba(122, 26, 40, .36), inset 0 1px 0 rgba(255, 238, 242, .06);
      }

      .brief-step-btn.active .brief-step-label,
      .brief-step-btn:hover:not(:disabled) .brief-step-label {
        color: #fff0f2;
      }

      .monster-flow-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 30px;
        border-top: 1px solid rgba(255, 238, 242, .055);
        padding-top: 10px;
        color: rgba(238, 238, 238, .48);
        text-align: center;
      }

      .monster-flow-status strong {
        color: #d0a2aa;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .monster-flow-status span {
        color: rgba(238, 238, 238, .42);
        font-size: 11px;
      }

      .monster-flow-warnings {
        margin-top: 2px;
      }

      .monster-anatomy-composer {
        display: grid;
        gap: 12px;
        margin-bottom: 14px;
      }

      .monster-silhouette-panel__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .monster-silhouette-panel__head h3 {
        margin: 4px 0 0;
        color: #fff0f2;
        font-size: 16px;
        font-weight: 950;
        letter-spacing: -.025em;
      }

      .monster-silhouette-panel__tools {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex: 0 0 auto;
      }

      .monster-silhouette-panel__tools > span {
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(0, 0, 0, .18);
        color: #d0a2aa;
        padding: 4px 8px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .anatomy-frame-btn {
        display: grid;
        place-items: center;
        width: 34px;
        min-width: 34px;
        height: 34px;
        border: 1px solid rgba(255, 238, 242, .09);
        background: rgba(5, 5, 6, .58);
        color: #c8a2a8;
        padding: 0;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035), 0 10px 24px rgba(0, 0, 0, .24);
        transition: border-color .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease, transform .12s ease;
      }

      .anatomy-frame-btn svg {
        width: 15px;
        height: 15px;
      }

      .anatomy-frame-btn:hover,
      .anatomy-frame-btn:focus-visible {
        transform: translateY(-1px);
        border-color: rgba(190, 64, 82, .66);
        background: rgba(95, 7, 22, .36);
        color: #fff0f2;
        box-shadow: 0 0 0 1px rgba(190, 64, 82, .12), 0 0 24px rgba(122, 26, 40, .26), inset 0 1px 0 rgba(255, 238, 242, .05);
        outline: none;
      }

      .monster-start-screen {
        display: grid;
        align-content: center;
        gap: 26px;
        min-height: clamp(520px, 64vh, 760px);
        overflow: hidden;
        border: 1px solid rgba(255, 238, 242, .06);
        background:
          linear-gradient(90deg, rgba(255, 255, 255, .028) 1px, transparent 1px),
          linear-gradient(180deg, rgba(255, 255, 255, .022) 1px, transparent 1px),
          radial-gradient(circle at 50% 18%, rgba(190, 64, 82, .18), transparent 22rem),
          radial-gradient(circle at 50% 84%, rgba(95, 7, 22, .22), transparent 20rem),
          rgba(0, 0, 0, .18);
        background-size: 34px 34px, 34px 34px, auto, auto, auto;
        padding: clamp(18px, 4vw, 42px);
      }

      .monster-start-screen__intro {
        display: grid;
        justify-items: center;
        gap: 8px;
        max-width: 680px;
        margin: 0 auto;
        text-align: center;
      }

      .monster-start-screen__intro h3 {
        margin: 0;
        color: #fff0f2;
        font-family: var(--display);
        font-size: clamp(36px, 5vw, 70px);
        line-height: .9;
        letter-spacing: -.055em;
        text-shadow: 0 0 28px rgba(122, 26, 40, .44);
      }

      .monster-start-screen__intro p:not(.eyebrow) {
        max-width: 520px;
        margin: 0;
        color: rgba(238, 238, 238, .56);
        font-size: 13px;
        line-height: 1.45;
      }

      .monster-start-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 340px));
        justify-content: center;
        gap: 14px;
      }

      .monster-start-card {
        position: relative;
        display: grid;
        grid-template-columns: 56px minmax(0, 1fr);
        grid-template-areas:
          "icon body";
        gap: 14px 13px;
        min-height: 178px;
        overflow: hidden;
        border: 1px solid rgba(255, 238, 242, .09);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .036), transparent 68%),
          radial-gradient(circle at 20% 0%, rgba(190, 64, 82, .16), transparent 12rem),
          rgba(5, 5, 6, .62);
        color: rgba(238, 238, 238, .72);
        padding: 18px;
        text-align: left;
        box-shadow: 0 18px 44px rgba(0, 0, 0, .38), inset 0 1px 0 rgba(255, 238, 242, .045);
        transition: border-color .14s ease, background .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease;
      }

      .monster-start-card::after {
        content: "";
        position: absolute;
        inset: auto 18px 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(190, 64, 82, .72), transparent);
        opacity: 0;
        transition: opacity .14s ease;
      }

      .monster-start-card:hover {
        transform: translateY(-2px);
        border-color: rgba(190, 64, 82, .68);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .055), transparent 68%),
          radial-gradient(circle at 20% 0%, rgba(190, 64, 82, .26), transparent 13rem),
          rgba(12, 7, 9, .86);
        color: #fff0f2;
        box-shadow: 0 26px 70px rgba(0, 0, 0, .52), 0 0 0 1px rgba(190, 64, 82, .12), 0 0 42px rgba(122, 26, 40, .26);
      }

      .monster-start-card:hover::after {
        opacity: 1;
      }

      .monster-start-card__icon {
        grid-area: icon;
        display: grid;
        place-items: center;
        width: 56px;
        height: 56px;
        border: 1px solid rgba(190, 64, 82, .34);
        background: rgba(51, 3, 12, .24);
        color: #d0a2aa;
        box-shadow: inset 0 0 24px rgba(122, 26, 40, .16);
      }

      .monster-start-card__icon svg {
        width: 24px;
        height: 24px;
      }

      .monster-start-card__body {
        grid-area: body;
        display: grid;
        align-content: start;
        gap: 7px;
        min-width: 0;
      }

      .monster-start-card__body strong {
        color: #fff0f2;
        font-size: 18px;
        font-weight: 950;
        line-height: 1.05;
        letter-spacing: -.025em;
      }

      .monster-start-card__body em {
        color: rgba(238, 238, 238, .56);
        font-size: 12px;
        font-style: normal;
        line-height: 1.42;
      }

      .monster-start-card__meta {
        grid-area: meta;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        justify-self: start;
        min-height: 28px;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(0, 0, 0, .2);
        color: #d0a2aa;
        padding: 0 9px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .monster-silhouette-stage {
        --anatomy-card-gap: 12px;
        --anatomy-side-column-width: minmax(220px, 0.82fr);
        --anatomy-center-width: minmax(300px, 1.08fr);
        --anatomy-slot-card-height: 96px;
        --anatomy-meter-height: 54px;
        position: relative;
        min-height: 360px;
        overflow: hidden;
        border: 1px solid rgba(255, 238, 242, .06);
        background:
          linear-gradient(90deg, rgba(255, 255, 255, .028) 1px, transparent 1px),
          linear-gradient(180deg, rgba(255, 255, 255, .022) 1px, transparent 1px),
          radial-gradient(circle at 50% 36%, rgba(95, 7, 22, .28), transparent 16rem),
          rgba(0, 0, 0, .18);
        background-size: 34px 34px, 34px 34px, auto, auto;
      }

      .anatomy-stage {
        min-height: clamp(720px, 74vh, 900px);
        padding: clamp(14px, 2vw, 22px);
      }

      .anatomy-stage__grid {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: var(--anatomy-side-column-width) var(--anatomy-center-width) var(--anatomy-side-column-width);
        grid-template-rows: minmax(0, 1fr) auto;
        grid-template-areas:
          "left center right"
          ". lair .";
        gap: var(--anatomy-card-gap) clamp(14px, 2vw, 24px);
        min-height: calc(clamp(720px, 74vh, 900px) - clamp(28px, 4vw, 44px));
      }

      .anatomy-stage__column {
        display: grid;
        grid-template-rows: var(--anatomy-meter-height) minmax(0, 1fr);
        gap: var(--anatomy-card-gap);
        min-width: 0;
      }

      .anatomy-stage__column--left {
        grid-area: left;
      }

      .anatomy-stage__column--right {
        grid-area: right;
      }

      .anatomy-stage__slot-stack {
        display: grid;
        align-content: space-between;
        gap: var(--anatomy-card-gap);
        min-height: 0;
      }

      .anatomy-stage__center {
        grid-area: center;
        position: relative;
        display: grid;
        min-width: 0;
        min-height: 620px;
      }

      .anatomy-stage__silhouette-layer {
        position: relative;
        min-height: 100%;
        overflow: visible;
      }

      .anatomy-stage__lair {
        grid-area: lair;
        display: grid;
        justify-items: center;
        min-width: 0;
      }

      .silhouette-metric-row {
        display: contents;
      }

      .silhouette-metric-card {
        display: grid;
        align-content: center;
        gap: 8px;
        width: 100%;
        min-height: var(--anatomy-meter-height);
        border: 1px solid rgba(255, 238, 242, .07);
        background: rgba(5, 5, 6, .46);
        padding: 10px;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
        backdrop-filter: blur(10px);
      }

      .silhouette-metric-card .monster-meter__head {
        font-size: 9px;
      }

      .silhouette-metric-card .monster-meter__track {
        height: 5px;
      }

      .monster-silhouette-connectors {
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .monster-silhouette-connector {
        stroke: rgba(255, 238, 242, .12);
        stroke-width: .16;
        vector-effect: non-scaling-stroke;
      }

      .monster-silhouette-connector.is-filled {
        stroke: rgba(143, 150, 148, .42);
      }

      .monster-silhouette-connector.is-active {
        stroke: rgba(240, 185, 194, .82);
        stroke-width: .28;
        filter: drop-shadow(0 0 5px rgba(190, 64, 82, .55));
      }

      .monster-silhouette-connector.is-guided:not(.is-active) {
        stroke: rgba(190, 64, 82, .58);
        stroke-dasharray: 4 4;
        stroke-width: .22;
      }

      .monster-silhouette-svg {
        position: absolute;
        inset: 22px 50%;
        z-index: 0;
        width: min(340px, 78%);
        height: calc(100% - 44px);
        transform: translateX(-50%);
        overflow: visible;
        opacity: .96;
        filter: drop-shadow(0 22px 38px rgba(0, 0, 0, .66));
        cursor: pointer;
        transition: filter .16s ease, opacity .16s ease, transform .16s ease;
      }

      .monster-silhouette-svg:hover,
      .monster-silhouette-svg:focus-visible {
        opacity: 1;
        filter:
          drop-shadow(0 24px 42px rgba(0, 0, 0, .72))
          drop-shadow(0 0 18px rgba(190, 64, 82, .28));
        outline: none;
      }

      .monster-silhouette-svg .silhouette-layer {
        transform-box: fill-box;
        transform-origin: center;
      }

      .monster-silhouette-aura path {
        fill: rgba(95, 7, 22, .16);
        stroke: rgba(190, 64, 82, .2);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
      }

      .monster-silhouette-body path {
        fill: rgba(238, 238, 238, .075);
        stroke: rgba(240, 215, 220, .34);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
        transition: fill .16s ease, stroke .16s ease, stroke-width .16s ease, filter .16s ease;
      }

      .monster-silhouette-svg:hover .monster-silhouette-body path,
      .monster-silhouette-svg:focus-visible .monster-silhouette-body path {
        fill: rgba(238, 238, 238, .12);
        stroke: rgba(240, 185, 194, .62);
        stroke-width: 2.35;
        filter: drop-shadow(0 0 8px rgba(190, 64, 82, .34));
      }

      .monster-silhouette-svg--undead .monster-silhouette-body path {
        fill: rgba(238, 238, 238, .18);
        stroke: rgba(240, 215, 220, .16);
        stroke-width: 1;
      }

      .monster-silhouette-svg--undead:hover .monster-silhouette-body path,
      .monster-silhouette-svg--undead:focus-visible .monster-silhouette-body path {
        fill: rgba(238, 238, 238, .24);
        stroke: rgba(240, 185, 194, .5);
        stroke-width: 1.45;
      }

      .monster-silhouette-svg--beast .monster-silhouette-body path {
        fill: rgba(190, 64, 82, .08);
      }

      .monster-silhouette-svg--aberration .monster-silhouette-body path {
        fill: rgba(208, 162, 170, .085);
      }

      .silhouette-layer--eye {
        fill: rgba(190, 64, 82, .22) !important;
        stroke: rgba(240, 185, 194, .56) !important;
      }

      .monster-scratch-hint {
        display: grid;
        justify-items: center;
        gap: 4px;
        width: min(520px, 100%);
        margin: 0 auto;
        border: 1px solid rgba(255, 238, 242, .08);
        background: rgba(5, 5, 6, .38);
        color: rgba(238, 238, 238, .58);
        padding: 9px 12px;
        text-align: center;
        box-shadow: inset 0 1px 0 rgba(255, 238, 242, .035);
        pointer-events: none;
      }

      .monster-scratch-hint strong {
        color: #fff0f2;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .monster-scratch-hint span {
        color: rgba(238, 238, 238, .5);
        font-size: 11px;
        line-height: 1.35;
      }

      .monster-silhouette-node {
        position: absolute;
        z-index: 3;
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(255, 238, 242, .12);
        background: rgba(5, 5, 6, .76);
        color: rgba(238, 238, 238, .55);
        padding: 0;
        box-shadow: 0 10px 24px rgba(0, 0, 0, .36);
        backdrop-filter: blur(10px);
      }

      .monster-silhouette-node svg {
        width: 14px;
        height: 14px;
      }

      .monster-silhouette-node:hover,
      .monster-silhouette-node.is-active,
      .monster-silhouette-node.is-guided,
      .monster-silhouette-slot-card:hover,
      .monster-silhouette-slot-card.is-active,
      .monster-silhouette-slot-card.is-guided {
        border-color: rgba(190, 64, 82, .62);
        background: rgba(95, 7, 22, .46);
        color: #fff0f2;
        box-shadow: 0 0 0 1px rgba(190, 64, 82, .12), 0 0 24px rgba(122, 26, 40, .3);
      }

      .monster-silhouette-node.is-guided:not(.is-active),
      .monster-silhouette-slot-card.is-guided:not(.is-active),
      .build-slot.is-guided:not(.active) {
        animation: guidedSlotPulse 1.8s ease-in-out infinite;
      }

      @keyframes guidedSlotPulse {
        0%, 100% { box-shadow: 0 0 0 1px rgba(190, 64, 82, .08), 0 0 12px rgba(122, 26, 40, .16); }
        50% { box-shadow: 0 0 0 1px rgba(190, 64, 82, .2), 0 0 26px rgba(190, 64, 82, .32); }
      }

      .monster-silhouette-node.is-filled,
      .monster-silhouette-slot-card.is-filled {
        border-color: rgba(143, 150, 148, .34);
        color: #bec8c5;
      }

      .monster-silhouette-node.is-filled.is-active,
      .monster-silhouette-slot-card.is-filled.is-active {
        border-color: rgba(240, 185, 194, .68);
        color: #fff0f2;
      }

      .monster-silhouette-slot-card {
        position: relative;
        z-index: 4;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
        width: 100%;
        min-height: var(--anatomy-slot-card-height);
        height: var(--anatomy-slot-card-height);
        overflow: hidden;
        border: 1px solid rgba(255, 238, 242, .09);
        background: rgba(5, 5, 6, .72);
        color: rgba(238, 238, 238, .62);
        padding: 9px 10px;
        text-align: left;
        box-shadow: 0 12px 30px rgba(0, 0, 0, .34);
        backdrop-filter: blur(12px);
        transition: border-color .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease, width .14s ease;
      }

      .monster-silhouette-slot-card.is-left,
      .monster-silhouette-slot-card.is-right {
        width: 100%;
      }

      .monster-silhouette-slot-card.is-bottom {
        width: min(420px, 100%);
        height: var(--anatomy-slot-card-height);
      }

      .monster-silhouette-slot-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .monster-silhouette-slot-card__head > span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
        overflow: hidden;
        color: inherit;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .09em;
        text-transform: uppercase;
      }

      .monster-silhouette-slot-card__head svg {
        width: 13px;
        height: 13px;
        flex: 0 0 auto;
      }

      .monster-silhouette-slot-card__head strong {
        display: inline-grid;
        place-items: center;
        min-width: 20px;
        min-height: 20px;
        border: 1px solid rgba(255, 238, 242, .08);
        background: rgba(0, 0, 0, .18);
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
      }

      .monster-silhouette-slot-card__body {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .monster-silhouette-slot-card__body strong {
        display: -webkit-box;
        overflow: hidden;
        color: #f0d7dc;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.16;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
      }

      .monster-silhouette-slot-card__body em {
        display: -webkit-box;
        overflow: hidden;
        color: rgba(238, 238, 238, .5);
        font-size: 11px;
        font-style: normal;
        line-height: 1.32;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .monster-silhouette-slot-card:hover .monster-silhouette-slot-card__body em,
      .monster-silhouette-slot-card.is-active .monster-silhouette-slot-card__body em {
        -webkit-line-clamp: 2;
      }

      .build-slots {
        display: none;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .build-slot {
        min-height: 102px;
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .022);
        padding: 12px;
      }

      .build-slot:hover,
      .build-slot.active {
        transform: none;
        border-color: rgba(190, 64, 82, .48);
        background: rgba(95, 7, 22, .13);
        box-shadow: inset 0 0 0 1px rgba(190, 64, 82, .08);
      }

      .build-slot.needs-attention:not(.active)::before,
      .build-slot.needs-attention:not(.active)::after {
        display: none;
      }

      .slot-name {
        color: rgba(238, 238, 238, .7);
        font-size: 10px;
        letter-spacing: .09em;
      }

      .slot-icon {
        width: 15px;
        min-width: 15px;
        height: 15px;
        color: #8f7278;
      }

      .count {
        border-color: rgba(255, 238, 242, .06);
        background: transparent;
        color: #8f7278;
        font-size: 10px;
      }

      .slot-empty {
        margin-top: 12px;
        color: rgba(238, 238, 238, .38);
        font-size: 12px;
      }

      .slot-item-text {
        padding-left: 0;
        text-indent: 0;
        font-size: 12px;
        line-height: 1.35;
      }

      .slot-item-text .slot-item-title {
        display: block;
        margin-bottom: 2px;
        color: #d0a2aa;
      }

      .slot-item .match-row {
        display: none;
      }

      .build-slot.active .slot-item .match-row,
      .build-slot:hover .slot-item .match-row {
        display: flex;
      }

      .graft-inspector > summary,
      .component-details > summary {
        list-style: none;
        cursor: pointer;
      }

      .graft-inspector > summary::-webkit-details-marker,
      .component-details > summary::-webkit-details-marker {
        display: none;
      }

      .monster-source-tools {
        margin-bottom: 10px;
        padding: 8px;
      }

      .monster-source-tools .tag-filter-row.monster-source-grid-open {
        margin-top: 8px;
        border-color: rgba(255, 238, 242, .075);
        background: rgba(0, 0, 0, .14);
      }

      .source-chip-btn,
      .navigator-count,
      .navigator-filter-chip,
      .match-chip,
      .meta-value {
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .025);
      }

      .monster-slot-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 10px;
      }

      .monster-slot-tabs .navigator-filter-chip {
        flex: 0 0 auto;
        white-space: nowrap;
      }

      .component-card {
        border-width: 1px;
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .022);
        padding: 12px;
        box-shadow: none;
      }

      .component-card:hover,
      .component-card.in-build {
        transform: none;
        border-color: rgba(190, 64, 82, .42);
        background: rgba(95, 7, 22, .13);
        box-shadow: inset 0 0 0 1px rgba(190, 64, 82, .08);
      }

      .component-card.slot-full {
        cursor: not-allowed;
        opacity: .58;
      }

      .component-card.slot-full:hover {
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .022);
        box-shadow: none;
      }

      .component-card.slot-full .component-toggle-btn,
      .component-toggle-btn:disabled {
        cursor: not-allowed;
        opacity: .45;
      }

      .component-card h3 {
        font-size: 13px;
        font-weight: 850;
      }

      .component-card .summary {
        color: rgba(238, 238, 238, .56);
        font-size: 11.5px;
        line-height: 1.38;
      }

      .component-impact-line {
        margin: -2px 0 0;
        color: #8f7278;
        font-size: 10px;
        font-weight: 850;
        line-height: 1.3;
      }

      .component-toggle-btn {
        border-color: rgba(255, 238, 242, .09);
        background: rgba(0, 0, 0, .18);
      }

      .component-details {
        margin-top: 8px;
      }

      .component-details > summary {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .component-details[open] > summary {
        color: #d0a2aa;
      }

      .component-details .meta-list {
        margin-top: 8px;
      }

      .graft-inspector {
        margin-top: 18px;
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .02);
        padding: 11px 12px;
        box-shadow: none;
      }

      .graft-inspector__head {
        align-items: center;
      }

      .graft-inspector__head h3 {
        margin-top: 3px;
        font-size: 15px;
      }

      .graft-inspector__status strong {
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .025);
      }

      .graft-inspector__content,
      .graft-inspector__empty {
        margin-top: 12px;
      }

      .graft-inspector__item,
      .graft-inspector__rules article,
      .graft-inspector__empty {
        border-color: rgba(255, 238, 242, .075);
        background: rgba(0, 0, 0, .12);
      }

      .monster-component-list {
        max-height: calc(100dvh - 360px);
      }

      .balance-card {
        border-color: rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .022);
      }

      .balance-hero p:not(.eyebrow),
      .subtle-note {
        color: rgba(238, 238, 238, .44);
      }

      .balance-grid {
        gap: 14px;
      }

      .balance-grid--simplified {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .balance-grid--simplified .balance-recommendations-card {
        grid-column: 1 / -1;
      }

      .balance-diagnostics {
        grid-column: 1 / -1;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .018);
        padding: 10px;
      }

      .balance-diagnostics > summary {
        cursor: pointer;
        list-style: none;
        color: #8f7278;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .balance-diagnostics > summary::-webkit-details-marker {
        display: none;
      }

      .balance-diagnostics[open] > summary {
        color: #d0a2aa;
        margin-bottom: 10px;
      }

      .balance-diagnostics__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .balance-card:not(.balance-controls-card) .balance-note {
        font-size: 11px;
        color: rgba(238, 238, 238, .5);
      }

      .compiled-meta-item {
        border-color: rgba(255, 238, 242, .06);
        background: rgba(0, 0, 0, .14);
      }

      .balance-card__head {
        border-bottom-color: rgba(255, 238, 242, .06);
      }

      /* Darken a Location alignment pass */
      .monster-topbar__control-row {
        align-items: center;
      }

      .darken-topbar__mode-switch {
        flex: 0 0 auto;
      }

      .monster-topbar__right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 9px;
        min-width: 0;
      }

      .monster-topbar__right .darken-workspace__tabs {
        flex: 0 0 auto;
      }

      .mode-btn {
        width: 36px;
        min-width: 36px;
        min-height: 36px;
        border-color: rgba(255, 238, 242, .09);
        background: rgba(255, 255, 255, .022);
        color: rgba(238, 238, 238, .58);
      }

      .mode-btn:hover,
      .mode-btn.active {
        border-color: rgba(190, 64, 82, .55);
        background: rgba(95, 7, 22, .2);
        color: #fff0f2;
        box-shadow: inset 0 0 0 1px rgba(190, 64, 82, .08), 0 0 20px rgba(122, 26, 40, .14);
      }

      .monster-navigator .navigator-head {
        margin-bottom: 10px;
        border-bottom-color: rgba(255, 238, 242, .06);
        padding-bottom: 10px;
      }

      .navigator-meta {
        margin: 6px 0 0;
        color: rgba(238, 238, 238, .46);
        font-size: 12px;
        line-height: 1.35;
      }

      .monster-navigator-tools {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
      }

      .navigator-search-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 36px auto;
        gap: 7px;
        align-items: center;
      }

      .search-wrap {
        min-width: 0;
      }

      .search-wrap input {
        min-height: 36px;
        border-color: rgba(255, 238, 242, .08);
        background: rgba(0, 0, 0, .2);
        color: rgba(238, 238, 238, .88);
        font-size: 12px;
      }

      .search-wrap input::placeholder {
        color: rgba(238, 238, 238, .34);
      }

      .navigator-filter-btn {
        position: relative;
        width: 36px;
        min-width: 36px;
        min-height: 36px;
        border-color: rgba(255, 238, 242, .09);
        background: rgba(255, 255, 255, .022);
      }

      .navigator-filter-btn[data-active-count="1"]::after {
        content: "";
        position: absolute;
        top: 7px;
        right: 7px;
        width: 6px;
        height: 6px;
        background: #be4052;
        box-shadow: 0 0 10px rgba(190, 64, 82, .75);
      }

      .navigator-count {
        min-width: 38px;
        min-height: 36px;
        border-color: rgba(255, 238, 242, .08);
        background: rgba(0, 0, 0, .18);
        color: #d0a2aa;
        font-size: 11px;
        font-weight: 950;
      }

      .monster-source-grid-open {
        display: grid;
        gap: 10px;
        margin-top: 0;
        padding: 9px;
        border-color: rgba(255, 238, 242, .08);
        background: rgba(0, 0, 0, .16);
      }

      .tag-clear-btn {
        min-height: 24px;
        border: 1px solid rgba(255, 238, 242, .08);
        background: rgba(255, 255, 255, .024);
        color: #8f7278;
        padding: 0 8px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .tag-clear-btn:hover {
        border-color: rgba(190, 64, 82, .48);
        color: #fff0f2;
      }

      .navigator-filter-panel {
        display: grid;
        gap: 11px;
      }

      .navigator-filter-section {
        display: grid;
        gap: 7px;
      }

      .navigator-filter-section strong {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .navigator-filter-chip {
        min-height: 28px;
        padding: 0 9px;
        color: rgba(238, 238, 238, .56);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .035em;
      }

      .navigator-filter-chip:hover,
      .navigator-filter-chip.active {
        border-color: rgba(190, 64, 82, .48);
        background: rgba(95, 7, 22, .22);
        color: #fff0f2;
      }

      .monster-slot-tabs {
        gap: 6px;
      }

      .component-toggle-btn:hover:not(:disabled) {
        border-color: rgba(190, 64, 82, .58);
        background: rgba(95, 7, 22, .22);
        color: #fff0f2;
      }

      .monster-layout {
        grid-template-columns: minmax(0, 1fr);
      }

      .template-picker-modal {
        position: fixed;
        inset: 0;
        z-index: 135;
        display: grid;
        place-items: center;
        padding: 28px;
      }

      .template-picker-modal__scrim {
        position: absolute;
        inset: 0;
        z-index: 0;
        border: 0;
        background:
          radial-gradient(circle at 50% 18%, rgba(122, 26, 40, .26), transparent 30rem),
          rgba(0, 0, 0, .74);
        backdrop-filter: blur(12px) saturate(112%);
      }

      .template-picker-modal__panel {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 16px;
        width: min(1080px, calc(100vw - 56px));
        max-height: calc(100dvh - 56px);
        overflow: hidden;
        padding: 18px;
        border-color: rgba(190, 64, 82, .38);
        background:
          radial-gradient(circle at 18% 0%, rgba(190, 64, 82, .16), transparent 24rem),
          radial-gradient(circle at 82% 100%, rgba(95, 7, 22, .22), transparent 28rem),
          linear-gradient(180deg, rgba(18, 12, 14, .98), rgba(7, 5, 6, .96));
        box-shadow:
          0 42px 120px rgba(0, 0, 0, .86),
          0 0 0 1px rgba(255, 238, 242, .06),
          0 0 78px rgba(122, 26, 40, .28),
          inset 0 1px 0 rgba(255, 238, 242, .06);
      }

      .template-picker-modal__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid rgba(255, 238, 242, .07);
        padding-bottom: 14px;
      }

      .template-picker-modal__head h2 {
        margin: 5px 0 6px;
        color: #fff0f2;
        font-family: var(--display);
        font-size: clamp(36px, 4.6vw, 64px);
        line-height: .92;
        letter-spacing: -.055em;
        text-shadow: 0 0 28px rgba(122, 26, 40, .44);
      }

      .template-picker-modal__head p:not(.eyebrow) {
        max-width: 560px;
        margin: 0;
        color: rgba(238, 238, 238, .5);
        font-size: 13px;
        line-height: 1.45;
      }

      .template-picker-modal__head .icon-btn {
        flex: 0 0 auto;
      }

      .template-picker-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        align-content: start;
        overflow: auto;
        padding: 2px 4px 2px 0;
      }

      .template-choice-card__button {
        position: relative;
        display: grid;
        gap: 12px;
        width: 100%;
        min-height: 208px;
        overflow: hidden;
        border: 1px solid rgba(255, 238, 242, .09);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .036), transparent 68%),
          radial-gradient(circle at 0% 0%, rgba(190, 64, 82, .16), transparent 13rem),
          rgba(5, 5, 6, .62);
        color: rgba(238, 238, 238, .72);
        padding: 16px;
        text-align: left;
        box-shadow: 0 18px 44px rgba(0, 0, 0, .34), inset 0 1px 0 rgba(255, 238, 242, .045);
        transition: border-color .14s ease, background .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease;
      }

      .template-choice-card__button::after {
        content: "";
        position: absolute;
        inset: auto 16px 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(190, 64, 82, .72), transparent);
        opacity: 0;
        transition: opacity .14s ease;
      }

      .template-choice-card__button:hover,
      .template-choice-card.active .template-choice-card__button {
        transform: translateY(-2px);
        border-color: rgba(190, 64, 82, .68);
        background:
          linear-gradient(180deg, rgba(255, 238, 242, .055), transparent 68%),
          radial-gradient(circle at 0% 0%, rgba(190, 64, 82, .26), transparent 14rem),
          rgba(12, 7, 9, .86);
        color: #fff0f2;
        box-shadow: 0 26px 70px rgba(0, 0, 0, .52), 0 0 0 1px rgba(190, 64, 82, .12), 0 0 42px rgba(122, 26, 40, .24);
      }

      .template-choice-card__button:hover::after,
      .template-choice-card.active .template-choice-card__button::after {
        opacity: 1;
      }

      .template-choice-card__topline,
      .template-choice-card__title-row,
      .template-choice-card__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .template-choice-card__topline span,
      .template-choice-card__topline strong,
      .template-choice-card__title-row em {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .template-choice-card__topline strong,
      .template-choice-card.active .template-choice-card__title-row em {
        color: #d0a2aa;
      }

      .template-choice-card__title-row strong {
        color: #fff0f2;
        font-size: 21px;
        font-weight: 950;
        line-height: 1.05;
        letter-spacing: -.035em;
      }

      .template-choice-card__title-row em {
        flex: 0 0 auto;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(0, 0, 0, .2);
        padding: 5px 7px;
        font-style: normal;
      }

      .template-choice-card__summary {
        color: rgba(238, 238, 238, .58);
        font-size: 12px;
        line-height: 1.45;
      }

      .template-choice-card__meta {
        justify-content: flex-start;
        flex-wrap: wrap;
        margin-top: auto;
      }

      .template-choice-card__meta span {
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .025);
        color: #c8a2a8;
        padding: 3px 6px;
        font-size: 9px;
        font-weight: 850;
      }

      .component-navigator-modal {
        position: fixed;
        inset: 0;
        z-index: 130;
        display: grid;
        place-items: center;
        padding: 28px;
      }

      .component-navigator-modal__scrim {
        position: absolute;
        inset: 0;
        z-index: 0;
        border: 0;
        background:
          radial-gradient(circle at 50% 24%, rgba(122, 26, 40, .22), transparent 28rem),
          rgba(0, 0, 0, .72);
        backdrop-filter: blur(10px) saturate(112%);
      }

      .component-navigator-modal__panel {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-rows: auto auto auto minmax(0, 1fr);
        gap: 12px;
        width: min(980px, calc(100vw - 56px));
        max-height: calc(100dvh - 56px);
        overflow: hidden;
        padding: 16px;
        border-color: rgba(190, 64, 82, .34);
        background:
          radial-gradient(circle at 18% 0%, rgba(190, 64, 82, .13), transparent 22rem),
          linear-gradient(180deg, rgba(18, 12, 14, .98), rgba(7, 5, 6, .96));
        box-shadow:
          0 42px 120px rgba(0, 0, 0, .86),
          0 0 0 1px rgba(255, 238, 242, .06),
          0 0 70px rgba(122, 26, 40, .24),
          inset 0 1px 0 rgba(255, 238, 242, .06);
      }

      .component-navigator-modal__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid rgba(255, 238, 242, .07);
        padding-bottom: 12px;
      }

      .component-navigator-modal__head h2 {
        margin: 5px 0 0;
        color: #fff0f2;
        font-family: var(--font);
        font-size: clamp(24px, 3vw, 36px);
        font-weight: 950;
        letter-spacing: -.045em;
        line-height: 1;
      }

      .component-navigator-modal__head .icon-btn {
        flex: 0 0 auto;
      }

      .component-navigator-modal[data-navigator-mode="slot"] .component-navigator-modal__panel {
        width: min(860px, calc(100vw - 56px));
      }

      .component-navigator-modal[data-navigator-mode="global"] .component-navigator-modal__panel {
        width: min(1080px, calc(100vw - 56px));
      }

      .component-navigator-modal__slot-tabs {
        margin-bottom: 0;
        padding-bottom: 10px;
      }

      .component-navigator-modal__hierarchy {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border: 1px solid rgba(255, 238, 242, .065);
        background: rgba(255, 255, 255, .02);
        padding: 7px 9px;
      }

      .component-navigator-modal__hierarchy span,
      .component-navigator-modal__hierarchy strong {
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .component-navigator-modal__hierarchy span {
        color: #8f7278;
      }

      .component-navigator-modal__hierarchy strong {
        color: #d0a2aa;
        text-align: right;
      }

      .smart-slot-picks {
        display: grid;
        gap: 9px;
        border: 1px solid rgba(255, 238, 242, .075);
        background: rgba(255, 255, 255, .02);
        padding: 10px;
      }

      .smart-slot-picks__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .smart-slot-picks__head strong {
        color: #fff0f2;
        font-size: 13px;
        font-weight: 950;
        letter-spacing: -.02em;
      }

      .smart-slot-picks__head span {
        color: #8f7278;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .smart-slot-picks__grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .smart-pick-card {
        display: grid;
        align-content: start;
        gap: 6px;
        min-width: 0;
        border: 1px solid rgba(255, 238, 242, .08);
        background: rgba(0, 0, 0, .18);
        padding: 10px;
      }

      .smart-pick-card.is-recommended {
        border-color: rgba(143, 150, 148, .32);
        background: rgba(143, 150, 148, .045);
      }

      .smart-pick-card.is-spicy {
        border-color: rgba(190, 64, 82, .36);
        background: rgba(95, 7, 22, .16);
      }

      .smart-pick-card__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .smart-pick-card__top span {
        color: #8f7278;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .smart-pick-card__top button {
        min-height: 24px;
        border: 1px solid rgba(190, 64, 82, .44);
        background: rgba(95, 7, 22, .22);
        color: #f0d7dc;
        padding: 0 8px;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .smart-pick-card__top button:hover:not(:disabled) {
        border-color: rgba(240, 185, 194, .66);
        background: rgba(122, 26, 40, .34);
        color: #fff0f2;
      }

      .smart-pick-card__top button:disabled {
        cursor: not-allowed;
        opacity: .42;
      }

      .smart-pick-card h3 {
        margin: 0;
        color: #fff0f2;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.15;
      }

      .smart-pick-card p {
        margin: 0;
        color: rgba(238, 238, 238, .56);
        font-size: 11px;
        line-height: 1.35;
      }

      .smart-pick-card em,
      .smart-pick-card small {
        color: #8f7278;
        font-size: 10px;
        font-style: normal;
        font-weight: 850;
        line-height: 1.3;
      }

      .smart-pick-card small {
        color: #d0a2aa;
      }

      .component-navigator-modal__list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-content: start;
        max-height: none;
        overflow: auto;
        padding: 2px 4px 2px 0;
      }

      .component-navigator-modal__list .component-card {
        min-height: 132px;
      }

      .component-navigator-modal__list .empty {
        grid-column: 1 / -1;
      }

      @media (max-width: 1500px) and (min-width: 1321px) {
        .monster-layout {
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
        }

        .navigator,
        .build-canvas {
          padding: 14px;
        }

        .anatomy-stage {
          min-height: clamp(720px, 74vh, 900px);
        }

        .anatomy-stage__grid {
          grid-template-columns: minmax(200px, .8fr) minmax(300px, 1.1fr) minmax(200px, .8fr);
        }

        .monster-silhouette-svg {
          width: min(315px, 74%);
        }

        .monster-silhouette-slot-card {
          padding: 8px 9px;
        }

        .monster-silhouette-slot-card__body em {
          -webkit-line-clamp: 2;
        }
      }

      @media (max-width: 1320px) {
        .monster-layout {
          grid-template-columns: 1fr;
        }

        .monster-navigator {
          position: static;
        }

        .monster-component-list {
          max-height: 520px;
        }

        .anatomy-stage {
          min-height: clamp(720px, 74vh, 900px);
        }

        .anatomy-stage__grid {
          grid-template-columns: minmax(190px, .78fr) minmax(280px, 1.08fr) minmax(190px, .78fr);
        }

        .monster-silhouette-svg {
          width: min(340px, 74%);
        }
      }

      @media (max-width: 1220px) {
        .balance-grid,
        .balance-grid--simplified,
        .balance-diagnostics__grid,
        .run-mode-grid,
        .export-layout {
          grid-template-columns: 1fr;
        }

        .balance-wide-card,
        .balance-controls-card,
        .balance-advanced-card,
        .run-panel--wide {
          grid-column: auto;
        }

        .monster-navigator,
        .export-console {
          position: static;
        }

        .build-slots,
        .monster-anatomy-composer,
        .graft-inspector__rules,
        .monster-output-grid,
        .compiled-meta-grid,
        .compiled-component-grid,
        .balance-meta-grid,
        .export-meta-grid,
        .run-stat-strip,
        .cruor-stat-block__abilities {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .app-shell__bar,
        .darken-topbar__control-row,
        .brief-summary,
        .build-head,
        .balance-hero,
        .run-mode-hero {
          display: grid;
        }

        .app-shell__nav,
        .darken-workspace__tabs,
        .mode-switch {
          justify-content: flex-start;
        }

        .monster-workspace {
          padding: 0 14px 24px;
        }

        .brief-control-grid,
        .monster-number-row,
        .slot-cap-grid,
        .monster-stat-grid,
        .monster-danger-segments,
        .guided-flow-steps {
          grid-template-columns: 1fr;
        }

        .monster-current-frame {
          width: 100%;
        }

        .monster-frame-drawer {
          top: 112px;
          left: 14px;
          width: calc(100vw - 28px);
          max-height: calc(100dvh - 136px);
        }

        .game-frame__loadout,
        .game-threat-scale,
        .crucible-head-controls {
          grid-template-columns: 1fr;
        }

        .brief-actions {
          justify-content: flex-start;
        }

        .monster-silhouette-stage {
          min-height: 330px;
        }

        .monster-anatomy-composer {
          display: none;
        }

        .monster-shell[data-composer-started="false"] .monster-anatomy-composer {
          display: grid;
        }

        .monster-shell[data-composer-started="false"] .build-slots {
          display: none;
        }

        .monster-start-screen {
          min-height: 430px;
          padding: 18px;
        }

        .monster-start-grid {
          grid-template-columns: 1fr;
        }

        .monster-start-card {
          min-height: 138px;
        }

        .monster-shell[data-composer-started="true"] .monster-anatomy-composer {
          display: none;
        }

        .monster-shell[data-composer-started="true"] .build-slots {
          display: grid;
          grid-template-columns: 1fr;
        }

        .monster-silhouette-slot-card,
        .monster-silhouette-node,
        .monster-silhouette-connectors,
        .monster-scratch-hint {
          display: none;
        }

        .brief-wizard__progress {
          grid-template-columns: repeat(7, 72px);
          justify-content: flex-start;
          gap: 22px;
          width: 100%;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .brief-wizard__progress::before,
        .brief-wizard__progress::after {
          left: 39px;
          right: 39px;
        }

        .brief-wizard__progress::after {
          width: calc(100% - 72px);
        }

        .brief-step-btn {
          min-width: 72px;
        }

        .guided-flow-next {
          grid-template-columns: 1fr;
        }

        .guided-flow-next button {
          width: 100%;
        }

        .guided-slot-roadmap,
        .guided-readiness-row {
          justify-content: flex-start;
        }

        .brief-step-label {
          font-size: 8px;
        }

        .monster-flow-status {
          display: grid;
          gap: 4px;
        }

        .template-picker-modal,
        .component-navigator-modal {
          padding: 14px;
        }

        .template-picker-modal__panel {
          width: calc(100vw - 28px);
          max-height: calc(100dvh - 28px);
          padding: 13px;
        }

        .template-picker-modal__head {
          display: grid;
        }

        .template-picker-modal__head .icon-btn {
          position: absolute;
          top: 13px;
          right: 13px;
        }

        .template-picker-grid {
          grid-template-columns: 1fr;
        }

        .template-choice-card__button {
          min-height: 176px;
        }

        .component-navigator-modal {
          padding: 14px;
        }

        .component-navigator-modal__panel {
          width: calc(100vw - 28px);
          max-height: calc(100dvh - 28px);
          padding: 13px;
        }

        .component-navigator-modal__head {
          display: grid;
        }

        .component-navigator-modal__head .icon-btn {
          position: absolute;
          top: 13px;
          right: 13px;
        }

        .component-navigator-modal__list,
        .smart-slot-picks__grid {
          grid-template-columns: 1fr;
        }

        .export-action-grid,
        .export-check-grid,
        .export-run-sheet__grid,
        .run-mode-actions {
          grid-template-columns: 1fr;
        }

        .run-mode-actions {
          justify-content: flex-start;
        }

        .darken-workspace__tab {
          min-width: 0;
          flex: 1 1 0;
        }
      }
    `}</style>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<CruorMonsterComposerMvp />);
}
