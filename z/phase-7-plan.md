# Phase 7 — Verification

## Static audit — tools/audit.mjs (rerunnable, exit-code gated)

Covers, per the phase brief:
1. `data-action` ↔ handler for both sheet classes (and orphan handlers)
2. every static `{{localize}}`/`game.i18n.*` key exists in en.json
3. every dynamically-composed i18n family exists for every config enumeration
   (17 attribute names, 10 tile descriptions, 40 skill names, all specifiers,
   all mode types, weapon/armor modifier short/long/desc, armor type groups +
   options, outcomes, TYPES.*, item-create names, tab labels, initiative cards)
4. every form `name="system.*"` path resolves to a real schema field — the
   REAL `defineSchema()` functions run under a stubbed `foundry` global and the
   resulting schema trees are walked (loop-variable paths resolved to
   representative concrete paths)
5. every template path referenced from JS exists on disk (26)
6. pack sources: `_key`/`_id` consistency, declared types only, every system
   field present in the type's schema
7. manifest ↔ disk: esmodules, styles, languages, pack sources, documentTypes

Result: **AUDIT CLEAN** (after adding `HELLAS.attributes.hitpoints.name`,
which never existed — legacy only had `.current.name`/`.max.name`).
Migration smoke tests remain green. Run both anytime:
`node tools/audit.mjs && node tools/test-migrations.mjs`.

## Manual checklist — z/CHECKLIST.md

Ten sections (boot/compendia, character basics, skills incl. all specifier
branches, all five roll flows with edge cases, item tables + armor totals,
other tabs, observer-permission parity, v0.3.6 world migration, settings
notice, dark mode). Each is a concrete action with the expected result;
sections H (real legacy world) and G (second logged-in user) genuinely need a
human + Foundry install.

Status: ✅ static audit complete/clean · manual checklist awaiting Stephen
