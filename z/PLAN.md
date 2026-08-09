# HELLAS system rewrite — v13/v14 plan

Rebuild the HELLAS FoundryVTT system from scratch against current Foundry idioms
(v13 stable, v14-ready), using the old 0.7-era code strictly as a behavioral spec.
Old source stays in `src/` as reference until Phase 7 verification passes, then is
removed in Phase 8.

## Status

| Phase | Title | Plan file | Status |
|-------|-------|-----------|--------|
| 0 | Behavioral spec extraction | z/phase-0-plan.md | ✅ done |
| 1 | Repo reset (kill old toolchain) | z/phase-1-plan.md | ✅ done |
| 2 | Boot skeleton | z/phase-2-plan.md | ✅ done |
| 3 | Data models + migrateData | z/phase-3-plan.md | ✅ done |
| 4 | Documents & rolls | z/phase-4-plan.md | ✅ done |
| 4b | Compendium packs NeDB → LevelDB sources | z/phase-4b-plan.md | ✅ done |
| 5 | AppV2 sheets | z/phase-5-plan.md | ✅ done |
| 6 | CSS on v13 theme variables | z/phase-6-plan.md | ✅ done |
| 7 | Verification (static audit + manual checklist) | z/phase-7-plan.md | ✅ audit clean · manual checklist → z/CHECKLIST.md |
| 8 | Release workflow + docs | z/phase-8-plan.md | ✅ done (ship sequence pending human steps) |

Each phase ends with the system bootable (create world → open sheets → no console errors).

## Standing decisions

1. Plain JS ES modules + JSDoc, **no TypeScript**; plain CSS with native nesting, **no SASS/Tailwind**; **zero build steps** — the repo root becomes the system directory.
2. `compatibility: {minimum: "13.347", verified: "14"}`; `mise.toml` pins node for release tooling only.
3. Schemas as `TypeDataModel` classes + `documentTypes` in system.json; **delete template.json**.
4. Sheets on `ApplicationV2` + `HandlebarsApplicationMixin` (PARTS/TABS/static actions, no jQuery); `DialogV2` for prompts; core `data-tooltip` / `data-tooltip-html` replaces vendored tooltipster; core sort + ActorSheetV2 built-in drag-drop replaces the unused `order` field.
5. System id stays `hellas` so existing worlds survive; releases via GitHub Actions on tag push — no zips committed to the repo.
6. Verify current APIs against the live dnd5e repo and foundryvtt.com/api (and the foundryvtt.wiki AppV2 conversion guide) before writing sheet/manifest code. Never from memory.
7. `migrateData` must be presence-guarded (`key in obj`) — it runs on update deltas. Blank-string legacy values headed into NumberFields become `null` before cleaning. Smoke-test under a stubbed `foundry` global in node (partial deltas + idempotency).
8. Tombstone manifest stays at `src/system.json` on master (the legacy update-channel URL), carrying BOTH legacy keys and the modern compatibility block, pointing at the new release channel.
9. Keep every declared sub-type (all five item types + character actor), even if it looks dead.
10. Gate ALL sheet actions — including dice rolls — on `isEditable`. `_preUpdate` merge guards for any partial-object updates.
11. Legacy bugs are fixed, not ported; every one is logged in z/SPEC.md §Fix-don't-port.
12. Licensing/trademark text preserved verbatim per location (README, system.json description, settings notice, LICENSE).
13. No commits until Stephen asks.

## Review ledger

External review loop (codex/droid/devin) runs after implementation, before tagging.
Every finding gets recorded here as **folded** or **rejected (reason)**.

| # | Reviewer | Finding | Disposition |
|---|----------|---------|-------------|
| — | — | — | — |
