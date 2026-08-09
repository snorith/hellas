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

### rev 1 — commit 06a9109, reviewers: codex (GPT-5.6, review --commit) + devin (SWE-1.7, read-only)

| # | Reviewer | Finding | Disposition |
|---|----------|---------|-------------|
| C1 | codex | [P1] `scrollable: [""]` in PARTS is an invalid CSS selector; sheets fail to render | **Rejected**: official v13 API docs (HandlebarsTemplatePart.scrollable) — "A blank string is used to denote that the root level of the part is scrollable"; same idiom in core apps, dnd5e, community tabs guide. Codex found nothing else. |
| D1 | devin | **Major**: skill selector normalization derived-only; `_preUpdate` synced only `name`, so stored `specifier`/`attribute` can go stale vs the document name (and vs SPEC §5.1/F5 text); clearing `skill` didn't reset name | **Folded** (item.mjs): `_preCreate` now persists the normalized selector set via `updateSource`; `_preUpdate` writes the full normalized set into `changed.system` (merged with current doc, still presence-guarded on selector fields) and resets the name to "New Skill" when skill is empty. SPEC F5 wording corrected. **Sub-recommendation rejected**: calling `normalizeSkillSelectors` from `migrateSkillData` — migrateData runs on partial deltas without whole-document context; a delta touching only `specifier` would be mis-normalized against an absent `skill` (exactly the rule-2 corruption class). Legacy docs normalize in memory on prepare and persist on first edit instead. |
| D2 | devin | **Minor**: `#onItemEdit` was the one actor-sheet action not `isEditable`-gated, contradicting the stated all-actions rule and legacy parity | **Folded**: guard added. 9/9 actions now gated (recounted per Gate 1). |
| D3 | devin | Unverified: does `NumberField({integer:true})` reject legacy floats? | **Closed by verification**: fvtt-types (mirrors core JSDoc) — `NumberField#_cleanType` "Applies `integer`, `min`, `max`, and `step`" during cleaning, i.e. rounds; it does not reject. |
| D4 | devin | Unverified: do 0.7.x cores refuse a manifest with `minimumCoreVersion: "13"`? | **Open — deliberate design risk**, carried to the manual checklist (§H). Worst case a 0.7 client updates and gets a nonfunctional system; mitigations noted in z/phase-8-plan.md. |
| D5 | devin | Note: tools/audit.mjs doesn't verify compiled packs/ dirs, only _source | **Accepted as-is**: release.yml builds packs before the audit runs; local dev builds them via tools/build-packs.mjs. Coverage note, not a defect. |

Gates: G1 recounted ("all actions gated" was false → fixed → 9/9); G2 outward pass
(CSS asset URL resolution, Google-Fonts import, settings-menu title localization)
found nothing new; G3 executed for C1 (docs) and D3 (fvtt-types); G4 NOT clean —
one major folded → rev 2 round required. Devin logistics: run 1 hit the
workspace-trust gate, run 2 blocked on `git ls-tree`, run 3 blocked on
`web_search`; run 4 succeeded with shell+network tools forbidden in the prompt.

### rev 2 — pending (re-review of the folded state)
