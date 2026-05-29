# Cruor Content Pack QA Checklist

Use this checklist before adding a new content pack to `STATIC_CONTENT_PACKS`.

## Pack Metadata

- [ ] Pack ID is stable, lowercase, and kebab-case.
- [ ] Pack title is readable in UI.
- [ ] Summary explains what the pack adds.
- [ ] Version is set.
- [ ] Status is correct.
- [ ] `updatedAt` uses `YYYY-MM-DD`.
- [ ] `metadata.registryRole` is set.
- [ ] `metadata.safetyNote` is present for sensitive material.

## Source Anchors

- [ ] Every Source Anchor has a unique ID.
- [ ] Every Source Anchor has `workflows` for the systems it supports.
- [ ] Themes and motifs are specific enough to be searchable.
- [ ] Summary explains the usable horror logic.
- [ ] Source Anchors are not just bibliography labels.

## Inspirations

- [ ] Every Inspiration has `contentType: "source-inspiration-card"`.
- [ ] Every Inspiration points to at least one existing Source Anchor.
- [ ] Caption is short enough for cards.
- [ ] Narrative explains use at the table.
- [ ] `inspiration.logic` explains the design conversion.
- [ ] Media fallback icon is set.
- [ ] Tags include pack and source markers.

## Monster Components

- [ ] Every component has `contentType: "monster-graft"`.
- [ ] Every component points to at least one existing Source Anchor.
- [ ] Every component has exactly one primary slot.
- [ ] Every component has `monster.graftId` matching or intentionally mapping from `id`.
- [ ] `monster.section` is valid for export/run-mode expectations.
- [ ] `cost` roughly matches table pressure.
- [ ] `complexity` roughly matches tracking burden.
- [ ] `stats` contains only expected stat keys.
- [ ] `mechanics` is actionable.
- [ ] `counterplay` is explicit.
- [ ] Control, burst, stealth, teleport, or fear components have a player-facing answer.
- [ ] Weakness/Tell components are actually useful to players.

## Registry Validation

- [ ] `validateContentPack(PACK)` returns no errors.
- [ ] No duplicate IDs within the pack.
- [ ] No duplicate IDs against existing packs unless intentionally overridden by merge order.
- [ ] Source Anchor references resolve.
- [ ] Workflow references resolve.
- [ ] Slot references resolve.

## Inspirations UI

- [ ] Pack appears in Content Pack filter.
- [ ] Inspirations appear under the correct pack.
- [ ] Search finds title, themes, motifs, and linked components.
- [ ] Card fallback icon is readable.
- [ ] Modal displays the correct pack provenance.
- [ ] Linked Monster Components appear where expected.

## Monster Composer UI

- [ ] Pack sources appear in Monster Frame / Navigator source filters if the pack is enabled in the feed.
- [ ] Pack components appear in Component Navigator.
- [ ] Pack filter isolates the pack.
- [ ] Component cards show the content pack badge.
- [ ] Component details show source and content pack.
- [ ] Forge does not select impossible or incompatible components.
- [ ] Balance panel still computes pressure and complexity.
- [ ] Run mode renders selected components.
- [ ] Export renders selected components.

## Build Checks

Run:

```bash
node --check shared/content/content-packs/<pack-id>-pack.js
npm run dev
npm run build
npm run lint
```

Expected result:

```text
No runtime crash.
No missing import.
No broken JSX.
No duplicate export.
```
