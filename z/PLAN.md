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
| 9 | Best-practices updates (9a pre-tag · 9b post-release) | z/phase-9-plan.md | ✅ 9a done (plan+impl reviewed to convergence; ledger in z/phase-9a-impl-plan.md) · 9b queued |

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

### rev 2 — commit f096fcd + parseInt fix, reviewers: codex (ask, focused) + devin (read-only)

Both reviewers confirmed the rev-1 folds sound (devin: "correct and safe for
normal sheet / full-form / submitOnChange / drag-copy flows"; codex: "the folded
rev-1 fixes are sound", no P1/P2).

| # | Reviewer | Finding | Disposition |
|---|----------|---------|-------------|
| C2 | codex | P3: `parseInt` truncates exponent-form number-input values ("1e2" → 1) in the modifier dialog | **Folded**: `Number()` + `Math.round` + finite guard in roll-modifiers.mjs. |
| D6 | devin | **Major**: explicit `<form>` nested inside DialogV2 content — DialogV2 supplies its own form; a nested form risks `button.form` not seeing the inputs (silent zeros or throw) | **Folded**: modifiers.hbs wrapper is now a `<div>`. Corroborated by the AppV2 conversion guide ("never `<form>` inside a form") and DialogV2 docs examples, which pass formless content. |
| D7 | devin | Minor: `_preUpdate` ships the full normalized selector set, so a concurrent edit of a different selector field by another client gets clobbered | **Accepted as designed**: normalization requires writing a consistent set; concurrent same-item selector edits are an edge case; legacy persisted full normalized sets too. Recorded, not changed. |
| D8 | devin | Minor: clearing `skill` left stale `attribute`/`specifier`/`specifierCustom` persisted (feeding the rating) | **Folded**: `normalizeSkillSelectors` now clears the dependent selectors when `skill` is empty. |
| D9 | devin | Nit: programmatic `Item.create({type:"skill"})` without a name leaves name unset while fullName says "New Skill" | **Rejected**: core `BaseItem` requires `name` at creation — a nameless programmatic create fails core validation before our hook matters; every real flow supplies a name. |
| D10 | devin | Minor: fate label tooltip used `HELLAS.attributes.fatepoints.description` (no placeholders) with format args | **Folded** + logged as new legacy bug **F20**: the never-used `HELLAS.attributes.fatepoints.title` ("Fate points {current} of {max}") is the correct key — verified in en.json. Legacy had the same bug. |

Gates: G1 no new quantifier claims; G2 outward pass (devin swept item-sheet
context prep, attributes.hbs bindings, settings menu, CSS selector coverage —
nothing new); G3 executed for D6 (guide + docs) and D10 (en.json values); G4 NOT
clean — a major (D6) was folded → rev 3 confirmation round required. All static
checks green after folds.

### rev 3 — commit 0576f86, reviewers: codex (review --commit) + devin (read-only) — **CONVERGED**

- codex: "…do not introduce a concrete regression." No findings.
- devin: "All four folds are sound; the brief fresh sweep found no new
  significant defects." Verified D6 (inputs reachable via button.form.elements,
  no nested form), C2 (Number() edge cases: "" → 0, "1e2" → 100, "3.7" → 4,
  missing → 0), D8 (nothing depended on stale selectors), D10 (.title key +
  placeholders + template binding).

Gate 4: all selected reviewers report nothing significant across two model
families; quantifier recounts done (rev 1); outward sweeps done (revs 1–3);
every rejected finding carries a reason. **Review loop terminal state reached.**

Still open (execution-gated, NOT reviewer-resolvable): D4 — whether a 0.7.x
core refuses the tombstone's `minimumCoreVersion: "13"` — carried to
z/CHECKLIST.md §H alongside the rest of the manual Foundry verification.

### rev 4 — third model family: droid (GLM-5.2, read-only), round 1

Droid verified the full v13 API surface (every namespace/signature/option
shape), the data-prep ordering (no stale reads or circularity), the roll
pipeline, all templates, tools, and both manifests. "No blockers or majors.
The review ledger's converged state holds."

| # | Reviewer | Finding | Disposition |
|---|----------|---------|-------------|
| R1 | droid | Minor: weapon STR-shortfall arithmetic uses bare `w.str` while the guard uses `w.str ?? 0`; claimed NaN → false "critsuccess" when str is null and strength negative | **Scenario disproven by execution** (`null - (-1) === 1`; JS coerces null to 0, and the schema yields number-or-null, never undefined — outcomes identical). **Folded anyway** as a defensive-clarity one-liner (`minStr` used in both guard and arithmetic). |
| R2 | droid | Nit: dead `\|\| true` condition in tools/audit.mjs specifier loop | **Folded**: vestigial condition removed. |
| R3 | droid | Nit: three unused legacy i18n keys (`HELLAS.attributes.{relationship,internal,external}.short.name`) all carried the wrong value "Fate Points" | **Folded**: values corrected (keys remain unused; wrong data removed). |

Logistics: first droid dispatch failed on expired Factory auth (user re-logged
in); retry ran clean. Round NOT counted as clean (three folds) → droid round 2
confirmation pending.

### rev 5 — commit 572797c, droid round 2 — **CONVERGED (all three families)**

"All three folds confirmed sound; the fresh sweep found nothing new of
significance. No defects to tag." Droid also cross-checked every factual claim
in z/BEST-PRACTICES.md against the shipped code and found no contradictions.
With rev 3 (codex+devin) and rev 5 (droid), all three model families have
reached nothing-significant on the current state. Remaining open item stays
D4 (execution-gated, manual checklist §H).

### Manual testing round 1 (Stephen, live Foundry v13, 2026-08-09)

| # | Finding | Disposition |
|---|---------|-------------|
| MT1 | EVERY string rendered as its raw i18n key — the entire language file failed to load | **Root-caused + folded**: en.json carried both `HELLAS.skill.specifier.title` (string) and the stray `HELLAS.skill.specifier.title.label` — v13 expands dotted keys via setProperty, and assigning a property onto a string throws in strict mode, aborting the whole translation merge. Stray key removed (supersedes the F19 "kept, unused" call); tools/audit.mjs now fails on ANY dotted-key expansion collision so the class cannot return. |
| MT2 | System-select tile background reads as blank | The white-marble media image washes out at tile size; setup media switched to brushed-gold.jpg (login `background` keeps the marble). Cosmetic; revisit with real art if desired. |
| MT3 | Actor-sheet tables render as dark slabs under the core dark theme | **Folded**: .hellas-table now paints an explicit light ground + ink and resets thead/tbody/tr backgrounds — core dark-theme table styling no longer shows through the translucent tints. |
| MT4 | Two-column section overflows the window width | **Folded**: grid columns are now `minmax(0, 1fr)` (grid children default to min-width auto, letting unbreakable content push past the window edge — aggravated by MT1's raw-key strings, but latent regardless). |
| MT5 | Sheet tabs cannot scroll to reach lower fields | **Folded**: window-content is now an overflow-hidden flex column and `section.tab` flexes to the remaining height with its own overflow-y auto (PARTS `scrollable: [""]` only preserves scroll position — the overflow CSS is the system's responsibility). Applies to actor and item sheets alike. |
| MT6 | Item-sheet title and default icon near-invisible on the marble | **Folded**: headings (h1-h4, .charname) now take the sheet ink explicitly — core's dark theme paints headings pale cream for dark grounds; and .profile-img gets a dark chip behind it so core's white-line default SVG icons read (raster portraits cover the chip entirely). Also fixes the pale FAMILY/MATERNAL/Notes headings on the actor sheet. |
| MT7 | Armor-sheet field hints wrap underneath the input box | **Folded**: the input+hint grid cells are now flex rows — the hint takes its own flexible column beside the field and wraps within it. |
| MT8 | Unchecked checkbox renders as a solid dark block (looks checked) | **Folded**: the v13 icon-font checkbox states were illegible on our ground (the conversion guide's known quirk). Checkboxes now take appearance:none with core's glyph pseudo-elements suppressed and our own box + ✔ drawn — deterministic in both themes. Empty light box = unchecked, dark check = checked. |
