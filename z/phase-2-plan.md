# Phase 2 — Boot skeleton

Goal: a minimal but genuinely installable v13/v14 system at the repo root —
modern manifest, entry esmodule, config constants, language file, stylesheet
stub. No data models, documents, or sheets yet (Foundry provides defaults for
untyped sub-types, so the world boots and documents of every declared type load).

## Files created

- `system.json` — modern manifest verified against live dnd5e (2026-08): `id`,
  `compatibility {minimum: "13.347", verified: "14"}`, `documentTypes` for
  Actor.character (+htmlFields biography) and the 5 Item types (+htmlFields notes,
  talent benefit), esmodules/styles/languages, `grid {distance:1, units:""}`,
  primary/secondaryTokenAttribute carried over. `packs` intentionally ABSENT until
  the NeDB→LevelDB conversion lands (Phase 4b) — declaring packs whose folders
  don't exist yet would break world load. Manifest/download point at the new
  GitHub-Releases channel (created in Phase 8).
- `hellas.mjs` — init hook: `CONFIG.HELLAS`, combat-tracker initiative formula
  (verbatim legacy formula, decimals 2). Registration points for later phases.
- `module/config.mjs` — full HELLAS constants from SPEC §2, with fixes F1
  (sixthborn) and F14 (fatepoints key) applied at the config level.
- `lang/en.json` — legacy file copied verbatim + required v13 `TYPES.Actor.*` /
  `TYPES.Item.*` labels added. (F10 keys land in Phase 5 with the new templates.)
- `styles/hellas.css` — stub (real styling in Phase 6).
- `mise.toml` — pins node 22 (release tooling only).
- `assets/` — copied from `src/assets` (pack content references
  `systems/hellas/assets/icons/*.svg`).

## Deferred decisions logged

- Trademark-notice setting: legacy `type: null` display-only setting is not a
  safe v13 idiom; ported in Phase 5 as a settings *menu* (DialogV2 showing the
  verbatim notice text).
- Handlebars helpers: registered in Phase 5 alongside the templates that use
  them (many legacy helpers are superseded by core v13 helpers).

Exit criteria: `system.json` parses and matches current schema conventions;
`node --check hellas.mjs module/config.mjs` passes; en.json parses with TYPES
keys present. Bootable: symlink repo into `Data/systems/hellas` → create world →
world loads, documents of all 6 sub-types creatable (default sheets).

Status: ✅ complete
