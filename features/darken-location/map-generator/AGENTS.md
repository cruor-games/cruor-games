# Map Generator — Codex Instructions

## Goal

The map generator creates usable RPG location maps from structured input, especially from Darken a Location.

It should not generate everything randomly. It should translate user/content parameters into a coherent map.

## Core Principles

- Separate data generation from rendering.
- Separate layout graph, room placement, corridor generation, masks, surface rendering, labels, and export.
- Keep deterministic generation possible through seeds.
- Prefer debuggable intermediate structures.
- Avoid monolithic generator functions.
- Do not copy external reference code directly unless explicitly requested.
- Use reference generators only to understand techniques and visual goals.

## Required Pipeline

The intended pipeline is:

1. Normalize input.
2. Build location profile.
3. Build room/area graph.
4. Place rooms/areas.
5. Connect rooms/areas.
6. Build masks.
7. Add doors, thresholds, stairs, hazards, and points of interest.
8. Render visual layers.
9. Export map data and image/SVG if needed.

## Integration Rule

The map generator consumes a normalized map request object.

It must not depend directly on Darken a Location UI state.