# Cruor Content Pack Authoring Guide

This document defines the working pattern for authoring Cruor content packs after the first multi-pack integration pass. A content pack is a self-contained bundle of Source Anchors, Inspiration cards, and Monster Composer components that can be merged into the shared static registry without changing the consumer pages.

## Goal

A content pack should be portable, reviewable, and safe to merge. It should explain what it adds, where it comes from, which workflows it supports, and how its entries connect to one another.

The current supported runtime collections are:

```text
workflows
slots
components
sourceAnchors
inspirations
taxonomies
```

Presets are intentionally not part of the pack schema yet. When presets are needed, write them manually in the Monster Composer preset data layer after the pack content is stable.

## File Location

Bundled packs live here:

```text
shared/content/content-packs/<pack-id>-pack.js
```

A pack file should export:

```text
<PACK_NAME>_CONTENT_PACK_ID
<PACK_NAME>_SOURCE_ANCHORS
<PACK_NAME>_INSPIRATIONS
<PACK_NAME>_MONSTER_COMPONENTS
<PACK_NAME>_CONTENT_PACK
```

Example:

```text
JACK_THE_RIPPER_CONTENT_PACK_ID
JACK_THE_RIPPER_SOURCE_ANCHORS
JACK_THE_RIPPER_INSPIRATIONS
JACK_THE_RIPPER_MONSTER_COMPONENTS
JACK_THE_RIPPER_CONTENT_PACK
```

## Required Pack Shape

Every pack should call `createContentPack()` and include clear metadata:

```js
createContentPack({
  id: "pack-id",
  title: "Pack Title",
  summary: "What this pack adds and how it should be used.",
  version: "0.1.0",
  status: CONTENT_PACK_STATUS.PUBLISHED,
  locale: "en",
  author: "Cruor Games",
  license: "internal-prototype",
  tags: ["content-pack"],
  updatedAt: "YYYY-MM-DD",
  metadata: {
    bundled: true,
    registryRole: "thematic-content-pack",
    source: "short-source-description",
    safetyNote: "How this pack handles sensitive material, if relevant.",
  },
  collections: {
    workflows: PACK_WORKFLOWS,
    slots: PACK_SLOTS,
    components: PACK_MONSTER_COMPONENTS,
    sourceAnchors: PACK_SOURCE_ANCHORS,
    inspirations: PACK_INSPIRATIONS,
    taxonomies: [],
  },
});
```

## Source Anchors

A Source Anchor is the conceptual root of pack content. It should describe a usable design source, not just a title.

Each Source Anchor should include:

```text
id
label
type
status
workflows
sourceTypes
themes
motifs
horror
summary
```

Use Source Anchors for things like:

```text
historical cases
folklore patterns
ritual structures
specific locations
objects or documents
monster traditions
social fears
```

A good Source Anchor answers: “What repeatable horror design logic does this source provide?”

## Inspiration Cards

An Inspiration card is what the public archive shows. It should be readable without knowing the Monster Composer internals.

Each Inspiration should include:

```text
id
title
label
type
contentType: "source-inspiration-card"
status
workflows: ["inspiration-archive"]
sourceAnchors
sourceTypes
themes
motifs
horror
summary
narrative
caption
media
inspiration
tags
```

Use the `inspiration.logic` field to explain how the source turns into playable Cruor content.

## Monster Components

A Monster Component is a registry-backed graft that can be adapted into the Monster Composer feed.

Each component should include:

```text
id
title
label
type
contentType: "monster-graft"
status
workflows: ["monster-composer"]
slots
sourceAnchors
sourceTypes
themes
motifs
horror
summary
tableText
mechanics
counterplay
monster
tags
```

The `monster` object must include:

```text
graftId
slot
section
typeBias
roleBias
cost
complexity
stats
```

Supported slot IDs currently are:

```text
body
mind
movement
attack
horror
twist
weakness
death
lair
```

Use `weakness` components aggressively. Horror components should have player-facing answers, limits, or tells.

## Design Rules

**Keep IDs Stable.** Once a pack is merged, avoid renaming IDs unless the entry is broken and still unreleased.

**One Source Anchor, Many Entries.** A Source Anchor should usually support at least one Inspiration and one Monster Component.

**Do Not Hide Counterplay.** If a component creates burst damage, control, fear, stealth, teleportation, or denial, write explicit counterplay.

**Prefer Playable Language.** Summaries can be atmospheric, but `mechanics` and `tableText` should be concrete enough to be adapted into a stat block.

**Respect Sensitive Sources.** Historical violence, real victims, tragedy, marginalized groups, religious material, and living traditions require a safety note and careful framing.

**Avoid Pack-Specific UI Assumptions.** A pack should not require custom UI code to be understood. The registry, Inspirations archive, and Monster Composer feed should be able to consume it generically.

## Integration Pattern

To add a new bundled pack:

1. Create `shared/content/content-packs/<pack-id>-pack.js`.
2. Export the pack and its arrays.
3. Import the pack in `shared/content/static-registry.js`.
4. Add the pack to `STATIC_CONTENT_PACKS`.
5. Export the pack from `shared/content/index.js` if external modules need direct access.
6. If Monster Composer should consume its components, add it to `monster-content-pack-feed.js` or generalize that feed if multiple packs are active.

## Validation

Run at minimum:

```bash
node --check shared/content/content-packs/<pack-id>-pack.js
npm run build
npm run lint
```

Also validate the pack in code with:

```js
validateContentPack(<PACK_NAME>_CONTENT_PACK)
```

Expected result:

```text
[]
```

Warnings may be acceptable during prototyping, but errors should block merge.
