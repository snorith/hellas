# Phase 4b — Compendium packs: NeDB → JSON sources → LevelDB

Goal: preserve all compendium content (skills / talents / dynamisms) in the
modern pack pipeline: per-document JSON sources in git, LevelDB compiled by
tooling (locally for dev symlinks, in CI for releases).

## What was discovered

- The legacy `.db` files are NeDB **journals**: duplicate `_id` lines are
  updates (last write wins). True counts after dedup: skills 64 (64 lines),
  talents 75 (78), dynamisms 30 (42). No `$$deleted` tombstones present, but
  the converter honors them anyway.
- Compiled LevelDB sources require a `_key` (`!items!<id>`) per document —
  without it `compilePack` silently produces an empty DB (verified by
  round-trip extract, then fixed).

## Pipeline

1. `tools/convert-packs.mjs` (one-time, idempotent) — reads `src/packs/*.db`,
   dedups the journal, converts `data` → filtered `system` (running the Phase-3
   migration functions; drops order/version/spell/skill-item skillid per the
   schema), `permission` → `ownership {default: 0}`, preserves `_id`/name/img/
   flags, writes `packs/_source/<pack>/<slug>__<id>.json`.
2. `tools/build-packs.mjs` — `compilePack` from `@foundryvtt/foundryvtt-cli`
   (tools/package.json devDependency; tools/node_modules gitignored) compiles
   each source dir to `packs/<pack>/` (gitignored; rebuilt on demand and in the
   Phase-8 release workflow).
3. `tools/check-packs.mjs` — round-trip extract + count verification.
4. `system.json` re-declares the three packs with modern `type: "Item"` +
   `system: "hellas"` and folder paths (`packs/system-skills` etc.), keeping the
   legacy `name`/`label` (systemSkills / systemTalents / systemDynamisms) so
   existing world references (`Compendium.hellas.systemSkills.<id>`) resolve.

Verified: round-trip counts 64/75/30 with expected system keys per type; doc
`_id`s preserved. Pack item img paths (`systems/hellas/assets/icons/*.svg`)
resolve against the root `assets/` copy made in Phase 2.

Status: ✅ complete
