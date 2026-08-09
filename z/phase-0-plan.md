# Phase 0 — Behavioral spec extraction

Goal: read 100% of the legacy system (TS modules, template.json, system.json,
all .hbs templates, en.json, settings/helpers, packs metadata, build pipeline)
and write z/SPEC.md as the single behavioral source of truth for the rewrite.

Inputs read (exhaustively):
- src/hellas.ts, src/module/** (all 18 TS files)
- src/template.json, src/system.json
- src/templates/actor/actorSheet.hbs (1133 lines), all 5 item sheets, 5 chat cards, modifiers dialog
- src/lang/en.json (504 flat keys — verified suspect keys programmatically)
- src/hellas.css + src/styles/** (inventory only; visual spec, not ported 1:1)
- gulpfile.js, package.json (toolchain to delete in Phase 1)
- src/packs/*.db (NeDB, 3 Item packs)

Deliverables:
- z/SPEC.md — every field, derived formula, roll rule, button/action, setting,
  Handlebars helper, i18n namespace, legacy data shape the migration must accept,
  and the fix-don't-port bug list.

Exit criteria: SPEC covers every `name=` path in every template, every listener
in every sheet class, every formula. System still boots (no code touched).

Status: ✅ complete — see z/SPEC.md
