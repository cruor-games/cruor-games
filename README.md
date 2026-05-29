# Cruor Games

**Build the place. Forge the threat. Darken the session.**

Cruor Games is a dark fantasy workbench for 5E Dungeon Masters. It helps DMs transform existing prep into playable horror material: haunted locations, disturbing monsters, clues, rewards, encounter twists, hazards, and table-ready session inserts.

Cruor is not meant to be a generic homebrew archive, a passive lore library, or a fully random generator. It is a composition toolbox: the user starts from a practical need, chooses a context, selects horror direction and source inspiration, then composes modular components into usable session material.

```text
Real Source → Themes / Motifs → Modular Components → Compiled Session Insert
```

---

## Table of Contents

- [Project Status](#project-status)
- [Core Promise](#core-promise)
- [Product Philosophy](#product-philosophy)
- [Primary User](#primary-user)
- [Core Product Loop](#core-product-loop)
- [Main Features](#main-features)
- [Repository Structure](#repository-structure)
- [Technical Stack](#technical-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Architecture Principles](#architecture-principles)
- [Content Data Model](#content-data-model)
- [Component Schema](#component-schema)
- [Source Anchors and Inspirations](#source-anchors-and-inspirations)
- [Cruor Composer / Crucible](#cruor-composer--crucible)
- [Darken a Location](#darken-a-location)
- [Map Generator](#map-generator)
- [Monster Composer](#monster-composer)
- [Inspiration Archive](#inspiration-archive)
- [Export Strategy](#export-strategy)
- [Editorial Guidelines](#editorial-guidelines)
- [UI and Visual Direction](#ui-and-visual-direction)
- [Development Rules](#development-rules)
- [Testing and Verification](#testing-and-verification)
- [Roadmap](#roadmap)
- [Terminology](#terminology)
- [Reference Materials](#reference-materials)
- [License](#license)

---

## Project Status

Cruor Games is currently an evolving MVP/prototype for a modular dark fantasy TTRPG tool site.

Some systems may still exist as static fixtures, local JavaScript data, or development prototypes. The long-term target is a scalable production architecture where content is stored, validated, edited, published, filtered, composed, saved, and exported through a consistent data model.

Current or planned site areas include:

- homepage / landing page;
- Cruor Composer / Crucible;
- Darken a Location workflow;
- Inspiration Archive;
- controlled dungeon/location map generator;
- Monster Composer / monster workbench;
- shared tooltip and UI systems;
- future builder/admin tools;
- future saved builds and export modes.

---

## Core Promise

> **Build drop-in horror for the session you already prepared.**

Most DMs already have a campaign, plot, location, NPCs, objectives, encounters, and limited prep time. They usually do not need a full adventure that replaces their work. They need fast, modular, low-friction material that can be added to what already exists.

Cruor exists to help a DM improve something specific before a session:

- a location;
- an encounter;
- a monster;
- an NPC;
- a clue;
- a reward;
- a hazard;
- a scene;
- a consequence;
- a table-ready horror beat.

The product should always answer this practical question:

> **Can a DM add this to a session without changing their plot, map, villain, or objective?**

If yes, it is core Cruor material.

---

## Product Philosophy

Cruor should feel like:

```text
tool + inspiration archive + occult laboratory + editorial product
```

It should not feel like:

```text
generic 5E homebrew archive
random generator
blog
passive lore dump
list of monsters
list of magic items
list of spells
```

The key differentiation is not only tone. Dark fantasy is the aesthetic; composition is the product.

Cruor should make the transformation visible:

```text
Real-world dread
→ source anchors
→ themes
→ motifs
→ components
→ slots
→ compiled output
→ table-ready session insert
```

A visitor should understand quickly:

- what they can create;
- how much control they have;
- why the output is usable;
- why this is different from a random generator;
- how real folklore, history, ritual, material culture, and biology become fantasy horror.

---

## Primary User

Cruor is aimed mainly at Dungeon Masters who:

- run D&D 5E or compatible fantasy horror games;
- already have their own campaign or session prep;
- want darker, stranger, more memorable material;
- do not want to replace their adventure;
- need table-ready outputs quickly;
- enjoy gothic horror, folk horror, body horror, religious horror, disease horror, occult horror, cosmic horror, or psychological horror;
- want controllable tools rather than purely random content.

Secondary users include:

- homebrew designers;
- adventure writers;
- dark fantasy creators;
- VTT-focused DMs;
- Patreon supporters interested in monthly packs, handouts, monsters, maps, and source-inspired horror components.

---

## Core Product Loop

The central workflow is:

```text
I Need To
→ Composer
→ Context
→ Source Inspiration
→ Horror Direction
→ Compatible Components
→ Add / Replace / Pair
→ Crucible Slots
→ Compile
→ Save / Export
```

The Composer should not simply display content. It should help the DM build something.

Example:

```text
I Need To: Darken a Location
Context: Cave
Horror Type: Body Horror
Source Anchor: Decomposition
Intrusion: Medium
Prep Time: 10 minutes

Output:
- location premise
- sensory layer
- visible anomaly
- environmental hazard
- disturbing clue
- encounter twist
- outcome or consequence
- read-aloud block
- at-the-table summary
- optional map regions
```

---

## Main Features

### Homepage / Landing Page

The homepage should frame Cruor as a dark fantasy workbench, not as a generic collection of tools.

Recommended message hierarchy:

```text
A Horror Workbench for Dungeon Masters
Cruor helps you darken existing prep instead of replacing it.

Start from the Place or the Threat
Darken a Dungeon
Forge a Monster

From Real Dread to Playable Components
Real Source → Motifs → Components → Table-Ready Material
```

Primary calls to action:

- **Open the Workbench**
- **Browse Inspirations**

The homepage should sell the present value of the project: usable tools, stronger outputs, source-inspired material, and an expanding workbench.

---

### Cruor Composer / Crucible

The Composer is the main product system. The Crucible is the build area where selected components are assembled into slots.

The user should be able to:

- choose a workflow;
- choose a context;
- select horror direction;
- filter by source anchor, source type, motif, theme, intrusion level, and prep time;
- add compatible components;
- replace components;
- pair related components;
- compile a build;
- export the result.

The final output should be one clean usable page, not a pile of disconnected cards.

---

### Darken a Location

A workflow for adding horror to a place the DM already has.

Typical slots:

- Premise / Location Skin
- Sensory Layer
- Visible Anomaly
- Environmental Hazard
- Disturbing Clue
- Encounter Twist
- Outcome / Consequence
- Read-Aloud
- At the Table
- Location Regions

This workflow should support caves, crypts, chapels, mines, forests, noble houses, villages, ruins, sewers, battlefields, prisons, ships, and other session locations.

---

### Map Generator

A controlled, content-aware dungeon/location map generator connected to the Darken a Location workflow.

It should not behave like a fully random dungeon generator. It should produce a map from a content configuration, especially generated or selected Location Regions.

The target is:

```text
content-aware + deterministic + editable + visually polished
```

The map generator should consume:

- context;
- horror tags;
- source anchors;
- location regions;
- region roles;
- region graph hints;
- room count;
- seed;
- entrances and exits;
- secret connections;
- hazards and clue markers where appropriate.

The generator should output:

- structured internal map model;
- SVG rendering;
- room labels or numbers;
- corridor data;
- doors;
- optional grid;
- editable handles;
- exportable SVG.

---

### Monster Composer

A workbench for building 5E-style horror monsters through anatomy, pressure, weakness, and table-ready mechanics.

Current or planned flow:

```text
Template / Scratch
→ Composer
→ Balance
→ Run
→ Export
```

Core design goals:

- stable anatomy layout;
- fast creation;
- clear decision support;
- Pressure and Complexity meters;
- explicit weakness / tell;
- balance review;
- counterplay checklist;
- exportable stat block;
- JSON export;
- future source-anchor integration.

Recommended minimum playable monster:

```text
Body + Attack Pattern + Weakness / Tell
```

Recommended complete monster:

```text
Body
Mind
Movement
Attack Pattern
Horror
Twist
Weakness / Tell
Death Effect
Lair / Scene Effect
```

---

### Inspiration Archive

The Inspiration Archive explains real-world, historical, folkloric, biological, ritual, literary, artistic, architectural, or material sources and shows how they become playable horror components.

Each source page should answer:

- What is it?
- Why does it disturb?
- Which Cruor themes does it support?
- Which motifs does it provide?
- Which workflows can use it?
- Which components are linked to it?
- How can the DM use it now?

Examples of Source Anchors:

- Jikininki
- Gashadokuro
- Sedlec Ossuary
- Towers of Silence
- Anthropodermic Bibliopegy
- Wax Death Masks
- Decomposition
- Mustard Gas
- The Mist
- Wolf Spiders

The public-facing source name should be preserved when it exists. Do not replace recognizable sources with abstract labels. For example, use `Gashadokuro` as the Source Anchor and use ideas like `starving skeleton`, `collective resentment`, or `rattling teeth` as themes or motifs.

---

## Repository Structure

The exact structure may evolve as prototypes are migrated into feature modules. The intended structure is:

```text
.
├── public/
│   └── static assets served directly by Vite or the host
│
├── src/
│   ├── app/
│   │   ├── main.jsx
│   │   ├── AppRouter.jsx
│   │   └── AppShell.jsx
│   │
│   ├── features/
│   │   ├── crucible/
│   │   │   ├── crucible.components-data.js
│   │   │   ├── crucible.sources-data.js
│   │   │   ├── crucible.events.js
│   │   │   └── ...
│   │   │
│   │   ├── darken-location/
│   │   │   ├── darken-location.workflow.js
│   │   │   ├── darken-location.page.jsx
│   │   │   └── ...
│   │   │
│   │   ├── inspirations/
│   │   │   ├── inspirations.page.jsx
│   │   │   └── ...
│   │   │
│   │   ├── darken-location/map-generator/
│   │   │   ├── map-config.js
│   │   │   ├── seeded-rng.js
│   │   │   ├── region-graph.js
│   │   │   ├── region-layout.js
│   │   │   ├── room-shapes.js
│   │   │   ├── dungeon-mask.js
│   │   │   ├── corridor-routing.js
│   │   │   ├── door-anchors.js
│   │   │   ├── map-renderer-svg.js
│   │   │   ├── map-editor-interactions.js
│   │   │   ├── map-export.js
│   │   │   └── map-tests.js
│   │   │
│   │   └── monster-composer/
│   │       ├── index.js
│   │       ├── monster-composer.page.jsx
│   │       ├── monster-composer.workflow.js
│   │       ├── styles.css
│   │       ├── data/
│   │       │   ├── monster-taxonomies.js
│   │       │   ├── monster-slots.js
│   │       │   ├── monster-sources.js
│   │       │   ├── monster-grafts.js
│   │       │   └── monster-templates.js
│   │       ├── balance/
│   │       ├── export/
│   │       └── components/
│   │
│   ├── shared/
│   │   ├── content/
│   │   │   ├── source-anchors.js
│   │   │   ├── taxonomies.js
│   │   │   └── registry.js
│   │   │
│   │   ├── tooltips/
│   │   │   ├── tooltip.registry.js
│   │   │   ├── tooltip.runtime.js
│   │   │   └── tooltip.renderers.js
│   │   │
│   │   ├── styles/
│   │   │   ├── app.css
│   │   │   ├── tooltips.css
│   │   │   └── tokens.css
│   │   │
│   │   └── utils/
│   │
│   └── data/
│       ├── workflows.json
│       ├── slots.json
│       ├── components.json
│       ├── source-anchors.json
│       ├── inspirations.json
│       └── taxonomies.json
│
├── dev/
│   ├── create-a-monster-mvp.html
│   └── create-a-monster-mvp.jsx
│
├── docs/
│   └── internal notes, specs, references, planning files
│
├── package.json
├── README.md
└── AGENTS.md
```

Not every folder above must exist immediately. It describes the intended modular direction of the codebase.

---

## Technical Stack

Current/prototype stack:

- React
- JavaScript
- Vite
- CSS Modules or feature-level CSS files where appropriate
- SVG rendering for maps
- static JSON / JS fixtures during MVP
- future database-backed content storage
- future builder/admin interface
- future JSON bundle import/export

Core principles:

- plain JavaScript unless the project is explicitly migrated;
- modular feature folders;
- shared utilities only for genuinely shared behavior;
- feature-specific logic stays inside the relevant feature;
- no unnecessary dependencies;
- no broad rewrites unless explicitly planned.

---

## Getting Started

### Requirements

Install:

- Node.js LTS
- npm

Recommended:

- VS Code
- Git
- modern Chromium-based browser for local testing

### Installation

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build production bundle

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

If a command is not available in `package.json`, add it intentionally or adjust this README to match the actual script names.

---

## Available Scripts

Expected scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "..."
  }
}
```

Do not assume scripts exist without checking `package.json`.

---

## Architecture Principles

### 1. Feature-first structure

Feature code belongs in:

```text
src/features/<feature-name>/
```

Examples:

```text
src/features/darken-location/
src/features/monster-composer/
src/features/inspirations/
src/features/crucible/
```

Shared utilities belong in:

```text
src/shared/
```

Only move code into `shared/` when at least two features actually need it.

---

### 2. Keep data separate from rendering

Data should not be hardwired into UI components long-term.

Preferred direction:

```text
Database / JSON bundles
→ content registry
→ filters
→ workflow compatibility
→ selected build
→ renderer/exporter
```

Temporary MVP fixtures are acceptable, but they should be treated as fixtures, not permanent editorial source of truth.

---

### 3. Keep generation separate from rendering

Especially for the map generator:

```text
input config
→ normalized config
→ graph
→ layout
→ masks
→ doors
→ model
→ SVG render
→ interactions
→ export
```

Do not mix pathfinding, DOM interaction, and SVG output in one function.

---

### 4. Prefer deterministic generators

Any generator that affects saved or exportable output should use seeded randomness.

Use:

```js
createSeededRng(seed);
randomFloat(rng);
randomInt(rng, min, max);
pickWeighted(rng, options);
hashStringToSeed(...parts);
```

Avoid:

```js
Math.random();
Date.now();
```

for reproducible geometry, layout, or table-ready builds.

---

### 5. Preserve public contracts

Do not rename public functions, CSS classes, data fields, route IDs, or exported constants unless the task explicitly asks for it.

When a rename is unavoidable:

1. find all references;
2. update them in the same change;
3. document the migration;
4. verify the build.

---

### 6. Separate migration from feature work

When extracting a prototype into modules:

```text
first: move without changing behavior
then: split data
then: split helpers
then: improve UI
then: expand dataset
```

Do not add new features while also moving large files unless there is a clear migration plan.

---

## Content Data Model

Cruor content should be atomic and composable.

The primary unit is the **Component**. A component is a reusable piece of session material that can be inserted into one or more workflow slots.

Examples:

- premise;
- sensory detail;
- visible anomaly;
- hazard;
- clue;
- encounter twist;
- boss phase;
- lair effect;
- death effect;
- reward power;
- cost;
- temptation;
- removal condition;
- NPC tell;
- horror clock;
- region template.

The compatibility system should be driven by:

- workflow IDs;
- slot IDs;
- contexts;
- horror tags;
- intrusion level;
- prep time;
- source anchors;
- source types;
- themes;
- motifs.

Recommended production architecture:

```text
Database
  -> published and draft components
  -> workflows
  -> slots
  -> source anchors
  -> taxonomies
  -> saved builds

Builder
  -> create/edit/validate components
  -> preview real render surfaces
  -> manage publication status
  -> import/export JSON bundles

Crucible
  -> read published components
  -> filter compatible components
  -> build selected arrangements
  -> render previews
  -> export outputs

Inspiration Archive
  -> explain real inspirations
  -> show themes and motifs
  -> list linked components
  -> send inspiration into the Crucible
```

---

## Component Schema

Canonical component shape:

```json
{
  "id": "cave-breathing",
  "slug": "cave-breathing",
  "title": "The Cave Has Been Breathing",
  "uiTitle": "the cave has been breathing",
  "type": "Premise",

  "workflows": ["location"],
  "slots": ["horrorPremise"],

  "contexts": ["Any", "Cave", "Mine", "Ruins"],
  "horror": ["Body Horror", "Occult Horror"],
  "intrusion": "Medium",
  "prep": "5 minutes",

  "sourceAnchors": ["Decomposition"],
  "sourceTypes": ["Biological Process"],
  "themes": ["corpse transformation", "organic architecture"],
  "motifs": ["gas", "bloating", "impossible decay"],

  "summary": "The location feels alive, warm, and aware.",
  "tableText": "The stone does not feel cold. It is warm under the palm, and something behind it answers every footstep with a slow, wet breath.",
  "mechanics": "Whenever blood is spilled or thunderous noise echoes here, trigger one environmental reaction from the build.",
  "narrative": "Use this to make an existing cave, mine, tunnel, or buried shrine feel organic without changing the party objective.",

  "status": "published",
  "locale": "en",
  "version": 1
}
```

### Required identity fields

- `id`
- `slug`
- `title`
- `uiTitle`
- `type`

### Required compatibility fields

- `workflows`
- `slots`
- `contexts`

### Required filtering fields

- `horror`
- `intrusion`
- `prep`
- `sourceAnchors`
- `sourceTypes`
- `themes`
- `motifs`

### Required rendered content fields

- `summary`
- `tableText`
- `mechanics`
- `narrative`

### Required publication fields

- `status`
- `locale`
- `version`

---

## Source Anchors and Inspirations

A **Source Anchor** is the public-facing root inspiration.

Source Anchors should preserve recognizable real names:

```text
Jikininki
Gashadokuro
Sedlec Ossuary
Towers of Silence
Anthropodermic Bibliopegy
Wax Death Masks
Decomposition
Mustard Gas
Wolf Spiders
```

Do not replace them with generalized fantasy terms.

Bad:

```text
Corpse-Eating Hunger
Starving Skeleton
Bone Chapel
Death Fog
```

Good:

```text
Source Anchor: Gashadokuro
Theme: collective resentment
Motif: rattling teeth
Component: The Bones Remember Hunger
```

### Source Type examples

- Animal Behavior
- Biological Process
- Funerary Practice
- Historical Object
- Historical Site
- Literary Inspiration
- Medical / Genetic Concept
- Punitive Practice
- Religious Practice
- Weapon
- Yokai / Japanese Folklore

### Theme examples

- corpse hunger
- funerary taboo
- collective resentment
- ritual exposure
- devotional bonework
- heritable corruption
- weaponized air
- post-mortem likeness
- forbidden preservation

### Motif examples

- opened graves
- rattling teeth
- yellow vapor
- wax tears
- warm pages
- skin slippage
- bone chandeliers
- carried spider young
- grave wax
- false miracles

---

## Cruor Composer / Crucible

The Composer is the user-facing workflow engine.

The Crucible is the active build panel.

### Composer responsibilities

- expose workflow choices;
- filter compatible components;
- show decision-ready cards;
- allow add/replace/pair actions;
- compile selected slots;
- produce exportable output.

### Crucible responsibilities

- display selected components by slot;
- enforce slot rules;
- prevent incompatible duplicates where needed;
- show missing critical pieces;
- compile read-aloud, mechanics, narrative notes, and table summary;
- maintain enough state to save or export the build.

### Suggested component actions

- Add to Build
- Replace Current
- Add as Detail
- Add as Hazard
- Pair With This
- Use as Read-Aloud
- Save for Later

### Generated build template

```md
# Build Title

## Use This When

Clear statement of when the DM should use this build.

## Read-Aloud

Short descriptive text ready to use at the table.

## What Changes Immediately

What this build adds to the existing session without replacing the DM’s plot.

## Components

Selected details, hazard, clue, twist, reward, NPC element, or other chosen pieces.

## Mechanics

DCs, saves, effects, damage, timing, triggers, conditions.

## Narrative Use

How the DM can connect the build to their existing story.

## At the Table

**Trigger.** Blood, loud noise, or fire.  
**Main Save.** DC 14 Constitution.  
**Primary Effect.** Forced movement and frightened.  
**Clue.** Corpse with moss-filled lungs.  
**Tone.** Body horror, claustrophobic, organic.
```

---

## Darken a Location

### Purpose

Darken a Location adds a horror layer to a place the DM already has.

It should support:

- atmosphere;
- sensory detail;
- visible change;
- hazard;
- clue;
- encounter twist;
- outcome;
- table summary;
- generated map regions.

### Typical input

```json
{
  "workflow": "location",
  "context": "Crypt",
  "horror": ["Religious Horror", "Gothic"],
  "intrusion": "Medium",
  "prep": "10 minutes",
  "sourceAnchors": ["Sedlec Ossuary", "Towers of Silence"]
}
```

### Typical output

```text
Premise
Sensory Layer
Visible Anomaly
Hazard
Clue
Encounter Twist
Outcome
Read-Aloud
At the Table
Location Regions
Map Config
```

### Location Region example

```json
{
  "id": "region-1",
  "name": "Bone-Lit Vestibule",
  "role": "Entrance / Threshold",
  "preferredShape": "rect",
  "size": "Small",
  "connectors": 2,
  "tags": ["entrance", "threshold"],
  "sourceAnchors": ["Sedlec Ossuary"],
  "feature": "Skulls arranged around the doorway mark each visitor as counted but not yet placed.",
  "danger": "The first loud prayer or oath makes every candle gutter and reveals a hidden footprint trail in bone dust.",
  "secret": "One skull is newer than the rest and still has a name scratched behind the jaw.",
  "isEntrance": true
}
```

---

## Map Generator

### Purpose

The map generator creates a readable, editable, exportable SVG map from authored or semi-authored Cruor content.

It should represent Location Regions. It should not invent unrelated content that ignores the Composer output.

### Target quality

The output should feel like a polished one-page dungeon map:

- clear rooms;
- clear corridors;
- correct doors;
- readable labels;
- optional grid;
- coherent topology;
- sparse meaningful cartographic details;
- no visual clutter;
- no debug-graph look.

### Required input model

```js
const mapConfig = {
  seed: "ossuary-042",
  context: "Crypt",
  biome: "Ossuary",
  horror: ["Religious Horror", "Gothic"],
  sourceAnchors: ["Sedlec Ossuary", "Towers of Silence"],
  roomCount: 7,
  gridSize: 20,
  mapWidth: 1000,
  mapHeight: 640,
  showGrid: true,
  mode: "gm",
  visualStyle: "one-page-dungeon",
  regions: [],
  connections: [],
};
```

### Required output model

```js
const generatedMap = {
  seed: "ossuary-042",
  gridSize: 20,
  bounds: { x: 0, y: 0, width: 1000, height: 640 },
  regions: [],
  corridors: [],
  dungeonMask: {
    floorCells: [],
    wallSegments: [],
    doorSegments: [],
  },
  svg: "<svg>...</svg>",
};
```

### Recommended pipeline

```text
1. Normalize Input
2. Build Region Graph
3. Place Regions on Grid
4. Resolve Room Shapes and Sizes
5. Build Room Masks
6. Route Corridors with Collision Avoidance
7. Build Corridor Masks
8. Merge Room + Corridor Masks
9. Compute Walls, Doors, and Openings
10. Add Optional Partitions / Merged Rooms
11. Add Labels, Numbers, Handles
12. Add Cartographic Details and Props
13. Render SVG Layers
14. Attach Interaction / Editing Behavior
15. Export SVG / State
```

### Quality priority

```text
1. topology
2. room placement
3. corridor routing
4. door correctness
5. unified mask rendering
6. editability
7. visual polish
8. props and texture
```

Do not spend time on hatch patterns, decorative details, or props if the geometry is still weak.

### Naming rule

Use neutral function names:

```text
buildDungeonMask
renderUnifiedDungeonSurface
shapeRooms
createProps
buildCorridorGraph
routeCorridors
mergeDungeonSurfaces
renderDoorCuts
renderWallTexture
renderInteriorDetails
```

Do not use reference-source names in functions, variables, comments, or public-facing code.

---

## Monster Composer

### Purpose

Monster Composer is a dark fantasy monster workbench. It should help a DM build a usable monster in minutes while maintaining clear balance, counterplay, and readable mechanics.

### Product target

Move from demo to reliable workbench:

- stable layout;
- quick monster creation;
- clear decision-making;
- credible export;
- practical balance guidance;
- useful counterplay checks.

### Core flow

```text
Template / Scratch
→ Composer
→ Balance
→ Run
→ Export
```

### Slot model

```text
Body
Mind
Movement
Attack Pattern
Horror
Twist
Weakness / Tell
Death Effect
Lair / Scene Effect
```

### Recommended build readiness states

```text
Playable Draft
Body + Attack Pattern + Weakness / Tell

Complete Monster
At least 6 filled slots

Setpiece Ready
Includes Twist, Death Effect, or Lair / Scene Effect

Export Ready
Passes Balance and Counterplay review
```

### Anatomy layout principle

The anatomy composer should use a controlled grid layout rather than fragile absolute positioning.

Conceptual layout:

```text
[Pressure]                  [Complexity]

[Mind]        [Silhouette]  [Body]
[Horror]      [Silhouette]  [Attack]
[Weakness]    [Silhouette]  [Movement]
[Death]       [Silhouette]  [Twist]

              [Lair / Scene Effect]
```

Cards and silhouette nodes are separate concepts:

- cards are for reading and selecting;
- nodes are visual anatomical hotspots;
- connector lines are calculated between node and card anchors.

### Balance concepts

Monster Composer should distinguish:

- printed stat block;
- effective combat profile;
- Pressure;
- Complexity;
- Counterplay;
- Tempo;
- action economy;
- first-three-round damage profile.

### Export modes

Recommended:

- Table Ready
- Designer Notes
- JSON
- Markdown

---

## Inspiration Archive

The Archive supports the Composer. It should not replace the Composer.

### Recommended page structure

```text
What It Is
Why It Disturbs
Cruor Themes
Cruor Motifs
Use It For
Linked Components
Use in the Crucible
```

### Filters

- Need
- Asset Type
- Location / Context
- Horror Type
- Intrusion Level
- Prep Time
- Source Type
- Theme
- Motif

### Social / marketing use

Each source can support a clear promotional hook:

```text
The Crucible expands with new components inspired by the Gashadokuro.
```

---

## Export Strategy

Current and future builds should support multiple output modes.

### Short Table View

Only what is needed during play.

### Prep View

More context, variants, and connection options.

### Player Handout View

Only player-safe text and printable handouts.

### Print View

Clean PDF or print-friendly page.

### VTT View

Separated text blocks for notes, read-aloud, handouts, hazards, monsters, rewards, and GM-only sections.

### JSON

Structured data for saving, importing, exporting, debugging, and future content packs.

### Markdown

Portable text export for editing, copying, documentation, and publishing.

---

## Editorial Guidelines

Cruor content should be useful before it is lore-heavy.

### Component writing order

Use this order:

```text
1. Immediate Use
2. Slot
3. Table Text
4. Mechanics
5. Variants
6. Source Anchor
```

Avoid opening components with long lore.

### Source Anchor page order

Use this order:

```text
1. What It Is
2. Why It Disturbs
3. Cruor Themes
4. Cruor Motifs
5. Use It For
6. Linked Components
```

### Voice

Write in a direct, operational, evocative style.

Good:

```text
Turn an existing dungeon into a playable horror site with regions, hazards, clues, atmosphere, and a map your table can use.
```

Bad:

```text
In the blood-soaked shadows of forgotten realms, nightmares awaken...
```

### Mechanical text

Rules text should be:

- clear;
- short;
- table-usable;
- compatible with 5E-style play;
- explicit about triggers, DCs, timing, conditions, and end conditions;
- not overloaded with unnecessary nested checks.

---

## UI and Visual Direction

Cruor should feel like:

```text
dark fantasy workbench
occult laboratory
source archive
map table
monster anatomy board
premium tool
```

### Visual priorities

- strong visual hierarchy;
- dark fantasy tone;
- readable UI;
- fast selection;
- low friction;
- clear export surfaces;
- minimal visual clutter;
- no generic fantasy marketing bloat.

### Useful interface labels

Prefer:

- Workbench
- Composer
- Crucible
- Source Anchor
- Table-Ready
- Drop-In Horror
- Build
- Forge
- Darken
- Export

Avoid making the product feel like:

- a passive archive;
- a random content slot machine;
- a blog;
- a list of content packs.

---

## Development Rules

### Keep features modular

Do not mix unrelated feature logic.

Good:

```text
src/features/monster-composer/
src/features/darken-location/
src/features/inspirations/
src/shared/tooltips/
```

Bad:

```text
one giant shared file containing monster logic, map logic, archive logic, and UI utilities
```

### Prefer small focused changes

Large rewrites are risky. Make small coherent changes that preserve working behavior.

### Do not rename public surfaces casually

Avoid renaming:

- exported functions;
- CSS classes;
- route IDs;
- data fields;
- slot IDs;
- workflow IDs;
- public constants.

### Do not use trial-and-error debugging

If the cause is unclear:

1. inspect the relevant files;
2. identify references;
3. verify assumptions;
4. make the smallest evidence-based change;
5. run the relevant checks.

### Protect working MVPs

When migrating prototypes:

- keep the old working file until the new feature is verified;
- create a feature shell first;
- move code without changing behavior;
- extract CSS;
- extract data;
- extract helpers;
- add tests or manual QA notes;
- only then improve functionality.

### Keep data generation separate from visual rendering

Especially for maps and monsters:

```text
data / selection / scoring
→ build model
→ render model
→ export model
```

### Do not add dependencies casually

Add dependencies only when they clearly reduce complexity or enable a necessary feature.

### Keep naming neutral

Reference projects can be studied, but do not name Cruor functions, variables, files, comments, or public UI after them.

---

## Testing and Verification

### General checks

Run before merging meaningful changes:

```bash
npm run lint
npm run build
```

For local UI testing:

```bash
npm run dev
```

Then test the affected feature manually.

---

### Composer manual QA

Check:

```text
- workflow selection works
- context filters work
- horror filters work
- source anchor filters work
- components can be added
- components can be replaced
- selected slots render correctly
- compiled output updates
- export output matches selected components
```

---

### Darken a Location manual QA

Check:

```text
- context selection changes compatible components
- source anchor selection affects suggestions
- sensory layer can hold distinct sensory kinds
- hazard appears in mechanics
- clue appears in narrative/table summary
- read-aloud compiles cleanly
- location regions are generated or selected
```

---

### Map Generator manual QA

Check:

```text
- seed changes the map
- same seed and same config reproduce the same map
- room count changes topology and rendered room count
- map uses given Location Regions
- all required rooms are connected
- corridors are one cell wide
- corridors avoid unrelated rooms
- doors are correctly oriented
- regular rooms align to grid
- grid can be shown/hidden
- rooms can be dragged
- corridor endpoints can be dragged
- corridor waypoints can be dragged
- SVG export works
- editor handles can be hidden
- map has room numbers or key entries
- output looks like a map, not a debug graph
```

---

### Monster Composer manual QA

Check:

```text
Template → Composer → Balance → Run → Export
Scratch → Body + Attack + Weakness → Balance
One-Click Fix applies correctly
Copy Stat Block works
Copy JSON works
Pressure meter updates
Complexity meter updates
Counterplay warnings are understandable
Weakness / Tell is visible
Lair / Scene Effect is not clipped
Slot text is not cut off
Anatomy layout does not overlap
```

---

### Tooltip manual QA

Check:

```text
- generic tooltips render above UI
- tooltips do not get clipped by containers
- pointer-hover tooltip position is stable
- native title tooltip is not duplicated
- compact cards remain readable
- tooltips avoid sidebars and viewport edges where possible
```

---

## Roadmap

### Near-term

- stabilize landing page;
- keep homepage message focused on place + threat;
- finalize workbench navigation;
- improve Darken a Location output quality;
- harden map generator topology and SVG rendering;
- stabilize Monster Composer layout;
- improve Monster Composer balance recommendations;
- make exports more credible and copyable.

### Mid-term

- migrate static component fixtures into structured JSON bundles;
- move shared source anchors and taxonomies into `src/shared/content/`;
- create or improve internal builder tools;
- add saved builds;
- support import/export of component bundles;
- expand source-inspired component packs;
- connect Monster Composer grafts to Source Anchors;
- improve Inspiration Archive navigation.

### Long-term

- production database as source of truth;
- admin/editorial Builder;
- published/draft/archive workflow;
- user accounts and saved builds;
- VTT-ready exports;
- print-friendly exports;
- Patreon/premium content packs;
- fully integrated map + location + monster workflows;
- Cruor-native source packs and deep dossiers.

---

## Terminology

### Component

A reusable atomic content unit that can be inserted into one or more slots.

### Workflow

A user-facing Composer mode representing what the DM wants to do.

Examples:

- Darken a Location
- Twist an Encounter
- Add a Disturbing Clue
- Create a Dark Reward
- Forge a Monster

### Slot

A structured placement inside a workflow.

Examples:

- Premise
- Sensory Layer
- Visible Anomaly
- Hazard
- Clue
- Encounter Twist
- Death Effect
- Lair Effect
- Cost
- Removal Condition

### Source Anchor

The recognizable real-world, historical, folkloric, biological, ritual, literary, artistic, architectural, or material inspiration root.

### Theme

A reusable conceptual category connecting multiple Source Anchors.

### Motif

A concrete image, object, sensory cue, gesture, body detail, or recurring element extracted from a Source Anchor.

### Build

A selected arrangement of components inside workflow slots.

### Crucible

The active build area where selected components are assembled.

### Composer

The system that helps the user choose, filter, combine, compile, and export components.

### Inspiration Archive

The archive of Source Anchors, themes, motifs, and linked components.

### Location Region

A named content-aware map region generated or selected by Darken a Location and passed into the map generator.

### Pressure

A measure of how strongly a monster or scene stresses the party.

### Complexity

A measure of how much tracking, rules load, or operational burden a monster or scene adds.

### Counterplay

The set of readable player-facing answers, weaknesses, tells, escape routes, or mitigation options that make horror fair and playable.

---

## Reference Materials

The project has internal reference documents for:

- operational concept;
- component data specification;
- landing page strategy;
- map generator guidelines;
- Monster Composer planning;
- monster balance methodology;
- external generator reference code for study.

Reference code is for analysis only. Do not copy architectures wholesale and do not preserve reference-source naming in Cruor code.

---

## License

Add the final license here before public release.

Recommended placeholder:

```text
Copyright © Cruor Games.
All rights reserved unless otherwise stated.
```

If the project includes third-party assets, libraries, or reference-derived material, document them clearly in a dedicated attribution section.
