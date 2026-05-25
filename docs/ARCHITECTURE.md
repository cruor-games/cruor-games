# Cruor Games — Architecture

## Application Structure

The app is organized by feature.

Global shell, routing, shared UI, shared styles, and shared utilities live outside feature folders.

Feature-specific logic must remain inside its own folder.

## Folder Rules

- `src/app/`: app bootstrap, routing, global initialization.
- `src/shared/`: reusable utilities, shared UI primitives, shared state helpers.
- `src/features/`: independent app sections.
- `src/features/map-generator/`: all map generator logic.
- `src/features/darken-location/`: all Darken a Location logic.
- `src/data/`: static data, presets, schemas.
- `public/assets/`: static assets.

## Feature Boundary

A feature may import from `src/shared/`.

A feature should not import directly from another feature unless there is a documented integration contract.

For example, the map generator should not depend on Darken a Location internals. It should consume a normalized input object.