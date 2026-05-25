# Cruor Games — Codex Instructions

## Project Type

Cruor Games is a modular web application for tabletop RPG tools and dark fantasy content. The map generator is one feature of the site, not the whole application.

## Core Rules

- Keep features modular.
- Do not mix map generator logic with unrelated site features.
- Prefer small, focused changes over broad rewrites.
- Do not rename public functions, files, CSS classes, or data fields unless explicitly requested.
- Preserve existing behavior unless the task asks to change it.
- Avoid adding dependencies unless necessary.
- When changing JavaScript, check for broken references, missing imports, and duplicated helpers.
- When changing rendering logic, keep data generation separate from visual rendering.
- When a task is unclear, inspect the relevant files before changing code.

## Code Style

- Use plain JavaScript unless the project is explicitly migrated.
- Prefer readable named functions over clever abstractions.
- Keep feature code inside `src/features/<feature-name>/`.
- Keep shared utilities inside `src/shared/`.
- Do not place feature-specific logic in shared utilities.

## Verification

After modifying code:
- Check that the app still loads.
- Check browser console errors.
- Check that the modified feature still works with at least one minimal input.
- Summarize changed files and verification steps.