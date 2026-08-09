# Phase 9 — Best-practices updates (two-phase plan)

Source: z/BEST-PRACTICES.md (gap analysis vs. current community/official
guidance, researched 2026-08-08). This plan turns its ranked gaps into two
work phases. Phase 9a lands before tagging v0.4.0; Phase 9b is scheduled
v0.4.x work, explicitly NOT a release blocker. Each item keeps the system
bootable and must leave `node tools/audit.mjs && node tools/test-migrations.mjs`
green; user-visible items get rows added to z/CHECKLIST.md.

---

## Phase 9a — before tagging v0.4.0

### 9a-1 · World migration runner (gap #1, med-high, M)

The structural item: migrateData normalizes legacy shapes in memory forever
but never persists them for untouched documents.

- `module/migrations/world.mjs`: `migrateWorld()` — GM-gated, iterates world
  actors + items (incl. unlinked token actors via scenes) and re-saves each
  document whose source still shows a legacy shape; the existing presence-
  guarded migrateData layer does the actual transformation on save, so the
  runner is a dumb "touch every stale doc once" loop with progress
  notifications (`ui.notifications.info` start/end, error-per-doc without
  aborting the batch).
- World setting `hellas.systemMigrationVersion` (hidden, scope world). On
  `ready`, if `game.user.isGM` and setting < `NEEDS_MIGRATION_VERSION`
  (0.4.0), run and then stamp the setting (dnd5e pattern).
- Staleness test: cheap source inspection (e.g. `sxithborn` key present,
  blank-string numerics) — when in doubt, re-save; a no-op save is harmless.
- Smoke coverage: extend `tools/test-migrations.mjs` with the staleness
  predicate (pure function, node-testable). Foundry-side behavior goes on the
  manual checklist (§H gains "migration banner appears once, second launch
  silent").
- Compendium packs are NOT migrated (system packs ship migrated; world packs
  are the GM's, core re-migrates on read — note in code comment).

### 9a-2 · Bundle fonts locally (gap #2, med, S–M)

- Download Roboto (300/400/500) and Caesar Dressing as woff2 into `fonts/`;
  replace the two Google-Fonts `@import`s in `styles/hellas.css` with
  `@font-face` rules using relative URLs (`../fonts/...`).
- License note: both are OFL/Apache — add attribution lines to README credits
  (verify each family's license file and ship it in `fonts/`).
- Failure mode closed: offline/LAN installs currently lose the entire visual
  identity; also removes a third-party request per client (GDPR).
- Release zip gains `fonts` in the `zip -r` list (release.yml).

### 9a-3 · Manifest polish batch (gaps #8–#11, low, S)

One commit:
- `media: [{type: "setup", url, thumbnail}]` + `background` — needs an image;
  reuse `assets/images/augustine-wong-…jpg` (already credited) scaled copy,
  or ship without thumbnail if not worth generating one.
- `flags.hotReload: {extensions: ["css","hbs","json"], paths: ["styles","templates","lang"]}`.
- Real `CHANGELOG.md` (0.4.0 entry summarizing the rewrite; `changelog` URL →
  the file on GitHub).
- Authors entry gains contact info — NEEDS STEPHEN: preferred contact
  (discord handle? email?) before this lands.

### 9a-4 · Package Release API step (gap #3, med, S + human steps)

- Append a release.yml step (after the GitHub release) POSTing to the
  foundryvtt.com Package Release API with tag, compatibility, and the
  versioned manifest URL — guarded with
  `if: ${{ secrets.FOUNDRY_PACKAGE_TOKEN != '' }}` so the workflow stays
  green until the secret exists.
- NEEDS STEPHEN: register/claim the `hellas` package on foundryvtt.com and
  add `FOUNDRY_PACKAGE_TOKEN` to the repo secrets. Until then the step
  no-ops.

Phase 9a exit: audit + smoke green; checklist rows added (migration banner,
fonts render offline — i.e. with network blocked); version stays 0.4.0;
ledger/review loop re-run only if the migration runner turns out non-trivial
(it touches persistence).

## Phase 9b — v0.4.x follow-ups (post-release)

Ordered by payoff; independent items, each its own commit/PR.

1. **Active Effects visibility** (gap #4, M): read-only-plus-delete effects
   list on the actor sheet (new small part or a section under Attributes) and
   item sheets' description tab; `allApplicableEffects()` enumeration, delete
   + disable toggles only — no editor, no automation promises. Prevents
   module-created AEs from being invisible/unmanageable.
2. **Accessibility pass** (gap #5, M): convert action `<a>` icons to
   `<button type="button" class="inline-control">`-style controls (or add
   `role="button"` + `tabindex="0"`), visible `:focus-visible` styles,
   `aria-label` from the existing `title` values, `aria-pressed` on the armor
   toggle, fate dots as a radio-group pattern. Re-run the audit (extend it to
   assert every `data-action` element is focusable).
3. **LOCALIZATION_PREFIXES + schema labels** (gap #6, M): add
   `static LOCALIZATION_PREFIXES` to the six data models and the
   corresponding `HELLAS.<Type>.FIELDS.*.label/hint` key families to en.json;
   audit gains a composed-family check for them. Prerequisite for item 5.
4. **`choices:` on safe enums** (gap #7, M): weapon `modifier`, armor
   `modifier`, armor `type` get `choices` (values from config); migrateData
   gains presence-guarded coercion of out-of-list legacy values to the field
   default so old docs never turn invalid. Skill selectors stay free+
   normalized (ledger D1 — do not revisit).
5. **`{{formGroup}}/{{formInput}}` adoption** (gap #12, L): only after item 3;
   swap hand-written item-sheet inputs for field helpers where it reduces
   template code without changing behavior. Lowest priority; skip if the
   diff is not clearly better.

Explicitly out of scope (documented divergences, z/BEST-PRACTICES.md):
manual `@layer`, choices on skill selectors, edit/play sheet modes, AE
automation, pack folders/art mapping.

Status: 9a ✅ implemented + reviewed to convergence (see z/phase-9a-impl-plan.md; author-contact and package-token human steps still open) · 9b queued post-release
