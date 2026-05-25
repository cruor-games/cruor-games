# Development Workflow

## Change Strategy

Work in small, reviewable steps.

Before editing:
- identify the relevant files;
- inspect current implementation;
- preserve existing public behavior unless instructed otherwise.

After editing:
- summarize changed files;
- summarize why the change was made;
- list manual verification steps.

## Debugging Rules

Do not fix errors by guessing.

When an error appears:
- identify the missing symbol or broken call;
- search where it should be defined;
- check whether it should be imported, moved, renamed, or implemented;
- avoid creating duplicate fallback definitions unless explicitly appropriate.

## Refactor Rules

Do not refactor unrelated code while fixing a bug.

Large refactors should be split into separate tasks.