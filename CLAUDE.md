# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A FoundryVTT game system for the HELLAS 2nd ed. RPG (fan-made, content under arrangement with Khepera Publishing). Targets Foundry **v13.347+** (verified v14). Plain JS ES modules + JSDoc (no TypeScript), plain CSS with native nesting (no preprocessor), and **zero build steps** — the repository root IS the system directory. There is no test framework beyond the node smoke tests below.

## Commands

```shell
mise install                     # pins node (release tooling only)
cd tools && npm install && cd .. # foundryvtt-cli, once
node tools/build-packs.mjs       # compile packs/_source/* JSON into LevelDB packs/ (gitignored)
node tools/audit.mjs             # static cross-reference audit — run after ANY change; exit 1 on failure
node tools/test-migrations.mjs   # migration + version-gate smoke tests (bare node, stubbed foundry)
node tools/check-packs.mjs       # round-trip verify compiled packs
node tools/fetch-fonts.mjs       # re-download bundled woff2 fonts (rarely needed)
```

Local testing: symlink the repo root to `<FoundryData>/Data/systems/hellas`, build packs once, launch Foundry. The manifest declares `flags.hotReload` for css/hbs/json when Foundry runs with hot reload enabled.

Releases: push a `v*` tag — `.github/workflows/release.yml` builds packs, stamps `system.json`, gates on the audit + smoke tests, zips, attaches manifest+zip to a GitHub release, and (when the `FOUNDRY_PACKAGE_TOKEN` secret exists) publishes to foundryvtt.com. Never commit zips.

## Architecture

Entry point `hellas.mjs` registers everything on `init` (data models, document classes, sheets, settings) and runs the one-time world migration on `ready`.

- **Data models** (`module/data/*.mjs`): one `TypeDataModel` per type — `character` actor + `skill`/`weapon`/`armor`/`dynamism`/`talent` items, mirrored by `documentTypes` in `system.json`. All NumberFields are nullable (legacy blanks stored as null, coerced to 0 in derived data). Derived-only values NEVER live in the schema: skill `skillid`/`fullName`/`level.max` and actor `modifiers.armor` are computed in `prepareDerivedData` every prepare.
- **Migrations, two layers** (`module/data/migrations.mjs` + `module/migrations/world.mjs`): `migrateData` functions are PURE and **presence-guarded** — they run on partial update deltas, so they must never invent absent branches, and blank strings become `null` before NumberField cleaning (which would 0-cast). Never put whole-document normalization in migrateData (deltas lack context) — that lives in `HellasItem._preCreate/_preUpdate`. The world runner re-saves all documents once per `NEEDS_MIGRATION_VERSION` (gated by the `systemMigrationVersion` world setting) so in-memory migrations reach the DB; it deliberately skips unlinked-token deltas and compendia (see the file header for why).
- **Documents** (`module/documents/`): `HellasItem.roll()` dispatches skill/weapon/dynamism rolls — all async, all through the DialogV2 modifier prompt (`module/dialogs/roll-modifiers.mjs`), outcomes via the omega table in `module/dice.mjs`, always public roll mode. Weapon/dynamism `system.skillid` holds a sibling item's **id** (or the `combatrating`/`dynamism` sentinel); skill `skillid` is a derived dotted string — same field name, different semantics.
- **Sheets** (`module/sheets/`): ApplicationV2 + HandlebarsApplicationMixin; ONE item-sheet class serves all five types via `_configureRenderOptions`. Every action — including rolls — is gated on `isEditable` (observers can look, never act). No jQuery, no custom Handlebars helpers: everything is precomputed in `_prepareContext` (choice maps, tooltip HTML, fate dots).
- **Config** (`module/config.mjs`): all game constants (`HELLAS`) plus `SYSTEM_ID`. Import `SYSTEM_ID` from here, not from `hellas.mjs` — keeps modules importable in bare node for the smoke tests.
- **Compendia**: per-document JSON sources in `packs/_source/` (committed, `_key: "!items!<id>"` required or compilation silently produces empty packs); compiled LevelDB in `packs/` (gitignored).
- **i18n** (`lang/en.json`): flat dotted keys. A key must NEVER be both a string and a prefix of another key — v13's dotted-key expansion throws and the ENTIRE language file fails to load (the audit enforces this).
- **CSS** (`styles/hellas.css`): the sheets commit to one marble-paper look in BOTH core themes, which means every ground and every foreground color is painted explicitly — never rely on core theme colors showing through (core dark-theme tables/headings/checkboxes have all bitten here; see the MT entries in git history). Fonts are bundled in `fonts/` — no external font imports.

## Constraints that aren't obvious from the code

- `src/system.json` is a **tombstone**, not the manifest: legacy 0.7-era installs poll `raw.githubusercontent.com/.../master/src/system.json` (served from `main` via branch-rename redirect). It must stay at that exact path on `main`, carrying both legacy and modern keys. The real manifest is `system.json` at the root.
- The system id `hellas` and the pack names (`systemSkills` etc.) must never change — existing worlds reference both.
- Verify Foundry APIs against foundryvtt.com/api, the foundryvtt.wiki AppV2 guide, or the live dnd5e repo before writing sheet/manifest code — not from memory. When docs conflict, the core GitHub design issue wins (learned via `flags.hotReload`).
- Licensing/trademark text (README, manifest description, `templates/apps/trademark-notice.hbs`, LICENSE, `fonts/LICENSE-*`) is preserved verbatim — never edit it.
- `master` is the historical release branch name (now `main`); day-to-day work happens on `develop`.
