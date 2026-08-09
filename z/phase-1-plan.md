# Phase 1 — Repo reset

Goal: remove the 2021 toolchain (gulp + rollup + TypeScript + Tailwind/PostCSS +
committed release zips) so the repo root can become the system directory. Old
source stays at `src/` as read-only reference until Phase 7 verification passes.

## Discovered toolchain (to delete)

| File/dir | Role | Action |
|---|---|---|
| gulpfile.js | build/link/package/publish pipeline | delete |
| package.json, package-lock.json | npm deps for the pipeline | delete |
| node_modules/ | installed deps (gitignored) | delete |
| tsconfig.json | TypeScript config | delete |
| tailwind.config.js | Tailwind config | delete |
| build-readme.md | build instructions for the old pipeline | delete |
| package/*.zip | committed release artifacts (v0.3.5, v0.3.6) | delete — only tag-URL zips are referenced by old manifests, and tags keep their tree |
| foundryconfig.json | local dev path config (gitignored, absent here) | n/a |

## Kept (reference until Phase 7; removed in Phase 8)

- `src/` — entire legacy system (spec source; also the tombstone manifest path `src/system.json` lives here permanently, rewritten in Phase 8)
- README.md, LICENSE (license/trademark text preserved verbatim)

## New root layout (created across Phases 2–6)

```
system.json  hellas.mjs  mise.toml
module/   (config, settings/helpers, data models, documents, sheets, dice)
templates/  styles/  lang/  assets/  packs/
z/        (plans + spec, removed before release)
```

- `assets/` is copied from `src/assets/` in Phase 2 because compendium content
  references `systems/hellas/assets/icons/*.svg` (verified against pack contents).
- `.gitignore`: drop stale `dist`/`foundryconfig.json` entries in Phase 8; harmless meanwhile.

Exit criteria: old toolchain gone; `git status` shows only deletions + z/; nothing
else references the deleted files (checked: only README's install URL mentions
src/system.json — that's the tombstone path, intentionally preserved).

Status: ✅ complete
