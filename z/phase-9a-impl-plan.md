# Phase 9a implementation plan — pre-v0.4.0 best-practice updates

Status: IMPLEMENTED (4 commits: 9a-3, 9a-2, 9a-1, 9a-4) — impl review pending.

Target branch: v13-rewrite. Scope: the four Phase-9a items from
z/phase-9-plan.md. Invariants for every item: system stays bootable;
`node tools/audit.mjs && node tools/test-migrations.mjs` green; no behavioral
change to rolls/sheets; licensing text untouched.

## 9a-1 · World migration runner

**Design correction vs z/phase-9-plan.md** (which proposed a per-document
"staleness test by source inspection"): on the client, a constructed
document's `_source` has ALREADY been passed through `migrateData` + schema
cleaning — legacy shapes are only visible in the raw DB, which client code
cannot read. A staleness predicate is therefore impossible client-side. The
correct mechanism (and what dnd5e ships) is an **unconditional one-time
re-save of every world document, gated by a version setting**: re-saving
persists the in-memory (already-migrated) source, and the gate guarantees the
pass runs once per needs-migration version.

### New file `module/migrations/world.mjs`

- `export const NEEDS_MIGRATION_VERSION = "0.4.0";` — the newest system
  version that requires a world re-save. Bumped only when a future release
  adds migrations that must be persisted.
- `export function needsMigration(storedVersion, isNewer = foundry.utils.isNewerVersion)`
  — pure decision: `!storedVersion || isNewer(NEEDS_MIGRATION_VERSION, storedVersion)`.
  The injected comparator keeps it node-testable (tools/test-migrations.mjs
  gains cases: "", older, equal, newer).
- `export async function migrateWorld()` — returns `{migrated, failed}` counts:
  1. `ui.notifications.info` (localized) "Migrating HELLAS world…".
  2. All full-source writes use **`toObject(true)`** (explicit source
     serialization — v13 default, made explicit for reviewability; verified:
     source is the migrateData-cleaned data, so derived skillid/fullName/
     level.max/modifiers.armor are never persisted) with
     **`{diff: false, recursive: false, render: false}`** — non-recursive
     replacement so removed legacy keys don't survive a recursive merge
     (codex P1).
  3. World items: `const data = item.toObject(true); delete data.effects;`
     → `item.update(data, opts)` in try/catch; on error `console.error` +
     `failed++` + continue (never abort the batch).
  4. World actors: `const data = actor.toObject(true); delete data.items;
     delete data.effects;` → `actor.update(data, opts)`, then
     `actor.updateEmbeddedDocuments("Item", actor.items.map(i => { const d =
     i.toObject(true); delete d.effects; return d; }), opts)`. Item-level
     embedded `effects` stripped everywhere — module-created AEs are
     deliberately untouched (codex P3 / devin m2).
  5. **Unlinked-token deltas are OUT OF SCOPE** (plan rev 2 change): a
     `{diff:false}` full-object write against a synthetic token actor would
     convert a sparse ActorDelta into a total override, decoupling the token
     from future base-actor edits — worse than the disease. Deltas keep being
     migrated in memory by migrateData on every construction, which is safe
     indefinitely. Code comment records the cut. (Resolves the codex/devin
     disagreement: devin B1 sound in effect, codex right that `token.delta`
     direct writes are also wrong — so neither; skip.)
  6. Compendia are NOT migrated: system packs ship current-shape; world packs
     get core+migrateData treatment on read (code comment says so).
  7. `migrated++` on each successful write; `failed++` on each caught error
     (explicit per devin rev-2). Final notification: zero failures →
     `HELLAS.migration.completed` ({version}, {count}); with failures →
     `HELLAS.migration.completedWithFailures` ({version}, {count}, {failed})
     as a warning notification.

### Wiring in `hellas.mjs`

- `init`: `game.settings.register(SYSTEM_ID, "systemMigrationVersion",
  {scope: "world", config: false, type: String, default: ""})`.
- `Hooks.once("ready")`:
  ```js
  if ( game.users.activeGM !== game.user ) return;   // one migrating client (codex P2)
  const stored = game.settings.get(SYSTEM_ID, "systemMigrationVersion");
  if ( !needsMigration(stored) ) return;
  const isFresh = !stored && !game.actors.size && !game.items.size && !game.scenes.size;
  let ok = true;
  if ( !isFresh ) {
    const { failed } = await migrateWorld();
    ok = failed === 0;
  }
  if ( ok ) await game.settings.set(SYSTEM_ID, "systemMigrationVersion", game.system.version);
  ```
  Fresh worlds stamp without a pass. **The version is stamped only on a
  zero-failure pass** (codex P2): any per-document failure leaves the world
  unstamped so the next launch retries — harmless, because re-saving is
  idempotent. The stamp uses the RUNNING system version so future
  needs-migration bumps re-trigger correctly.
- i18n (en.json): `HELLAS.migration.begun` ("Migrating the HELLAS system to
  version {version}. Please be patient and do not close your game or shut
  down the server."), `HELLAS.migration.completed` ("HELLAS system migration
  to version {version} completed ({count} documents updated)."),
  `HELLAS.migration.completedWithFailures` ("HELLAS system migration to
  version {version} finished: {count} documents updated, {failed} failed —
  see the console (F12). Migration will retry on next launch.") — aligned
  with the §7 notification contract (devin rev-2).
- Failure modes: a wholesale throw OR any per-document failure leaves the
  setting unstamped → automatic retry next launch (idempotent by
  construction).

### Checklist additions (z/CHECKLIST.md §H)

- First GM launch of a legacy world shows begun/completed notifications;
  second launch is silent.
- After migration, Export Data on a legacy actor shows `sixthborn` (not
  `sxithborn`) and no blank-string numerics; an exported owned SKILL shows no
  `skillid`/`fullName` keys and `modifiers` is absent from the actor export —
  derived values stayed out of the DB (codex P3 checklist row).
- An unlinked token with an ActorDelta and an owned item: after migration the
  delta is UNCHANGED (scope cut) and the token still works.

## 9a-2 · Bundle fonts locally

- `fonts/` at repo root: `roboto-300.woff2`, `roboto-400.woff2`,
  `roboto-500.woff2`, `caesar-dressing-400.woff2` (latin subsets), plus the
  upstream license file for each family (fetch from github.com/google/fonts —
  ship whatever license each family actually carries there; expected OFL for
  Caesar Dressing, Apache-2.0 or OFL for Roboto depending on current
  upstream).
- Acquisition via a committed script `tools/fetch-fonts.mjs` (devin M3):
  requests the Google `css2` stylesheet per family with a modern-browser
  User-Agent, parses the latin-subset woff2 URLs, downloads into `fonts/`,
  and verifies magic bytes `wOF2` + non-trivial size. One-time but
  reproducible/auditable.
- **Bold rendering decision** (codex P3 / devin n3, agreeing): `font-weight:
  bold` sites keep using synthetic bold from 400/500 — exactly what the
  legacy Google import produced (it also loaded no 700). Explicitly accepted;
  no new weights bundled. Recorded here so reviews don't re-raise it.
- `styles/hellas.css`: delete both `@import url('https://fonts.googleapis…')`
  lines; add four `@font-face` blocks (`font-display: swap`, relative
  `url("../fonts/….woff2")`, correct weight per file, `format("woff2")`).
- README credits section: font attribution + license pointer (existing
  credits text untouched).
- `release.yml` zip list gains `fonts`.
- `tools/audit.mjs` gains: every `url("../fonts/…")` in hellas.css exists on
  disk; no `googleapis`/`gstatic` reference remains anywhere in styles/.
- Checklist row: NEW section "§K. Offline assets" (z/CHECKLIST.md §J is
  already Dark mode — devin rev-2): with the network blocked (devtools
  offline), sheet headings still render in Caesar Dressing and body text in
  Roboto.

## 9a-3 · Manifest polish batch

- `system.json`:
  - `"media": [{"type": "setup", "url": "systems/hellas/assets/images/augustine-wong-li0iC0rjvvg-unsplash.jpg"}]`
    and `"background": "systems/hellas/assets/images/augustine-wong-li0iC0rjvvg-unsplash.jpg"`
    (reuses the already-credited sheet background; no new binary).
  - `"flags": {"hotReload": {"extensions": ["css", "hbs", "json"], "paths": ["styles", "templates", "lang"]}}`
    — the `extensions`+`paths` shape to be confirmed against the official
    configuration article during implementation (devin m5); worst case an
    unknown key is ignored, but verify rather than assume.
  - `"changelog": "https://github.com/snorith/hellas/blob/main/CHANGELOG.md"`.
- New `CHANGELOG.md` (Keep-a-Changelog-lite): `## 0.4.0` — v13/v14 rewrite
  summary (data models, AppV2 sheets, LevelDB packs, migration runner, fixed
  legacy bugs F1–F20 by reference to nothing internal — plain words), `##
  0.3.6` back-reference line ("legacy 0.7.x line; see git history").
- `release.yml` zip list gains `CHANGELOG.md`.
- Authors contact (discord/email): DEFERRED — needs Stephen's preferred
  contact; explicitly not part of this implementation.
- `tools/audit.mjs` gains: manifest `media[].url`/`background` paths exist on
  disk (strip the `systems/hellas/` prefix like template checks do).

## 9a-4 · Package Release API step

Verified against foundryvtt.com/article/package-release-api/ (fetched
2026-08-08): POST `https://foundryvtt.com/_api/packages/release_version/`,
`Authorization: <fvttp_… token>` header, body `{id, release: {version,
manifest, notes, compatibility{minimum, verified, maximum}}}`; the `manifest`
must be the VERSION-SPECIFIC URL (explicitly not the `latest` channel); 400
with JSON error detail on validation failure; `"dry-run": true` supported.

- New step in `release.yml` after "Create release":
  ```yaml
  - name: Publish to foundryvtt.com package listing
    env:
      FOUNDRY_PACKAGE_TOKEN: ${{ secrets.FOUNDRY_PACKAGE_TOKEN }}
      TAG: ${{ github.ref_name }}
    run: |
      if [ -z "$FOUNDRY_PACKAGE_TOKEN" ]; then
        echo "FOUNDRY_PACKAGE_TOKEN not set - skipping foundryvtt.com publish"
        exit 0
      fi
      VERSION="${TAG#v}"
      MIN=$(jq -er '.compatibility.minimum // empty' system.json)
      VER=$(jq -er '.compatibility.verified // empty' system.json)
      BODY=$(jq -n --arg v "$VERSION" --arg min "$MIN" --arg ver "$VER" \
        --arg manifest "https://github.com/${{ github.repository }}/releases/download/${TAG}/system.json" \
        --arg notes "https://github.com/${{ github.repository }}/releases/tag/${TAG}" \
        '{id: "hellas", release: {version: $v, manifest: $manifest, notes: $notes, compatibility: {minimum: $min, verified: $ver, maximum: ""}}}')
      curl -sS --fail-with-body -X POST "https://foundryvtt.com/_api/packages/release_version/" \
        -H "Content-Type: application/json" \
        -H "Authorization: $FOUNDRY_PACKAGE_TOKEN" \
        -d "$BODY"
  ```
  - Guard moved INTO the shell (plan rev 2): codex and devin disagreed on
    whether a step's own `env:` is visible to its `if:`; the shell guard is
    correct under either reading and both reviewers endorse it. `jq -er` +
    `// empty` makes missing compatibility keys fail locally instead of
    sending "null" to Foundry (codex P3).
  - `compatibility.maximum: ""` is VERIFIED acceptable: the official article's
    own example request body sends `"maximum": ""`
    (foundryvtt.com/article/package-release-api, fetched 2026-08-08) —
    resolves devin M2. A manual `"dry-run": true` call before the first real
    tag remains recommended.
  - The step is skipped (not failed) while the secret is absent — the
    workflow stays green until Stephen registers the package and adds
    `FOUNDRY_PACKAGE_TOKEN`.
  - `--fail-with-body` makes a 400 fail the job WITH the API's JSON error
    visible in the log.
- Deferred human steps (unchanged from phase-9 plan): register/claim
  `hellas` on foundryvtt.com; add the secret. Optionally run one manual
  `"dry-run": true` curl before the first real tag.

## Execution order & commits

1. 9a-3 manifest polish (smallest, unblocks CHANGELOG referenced by 9a-4 notes URL)
2. 9a-2 fonts
3. 9a-1 migration runner
4. 9a-4 release step
Each as its own commit; audit additions land with their item.

## Review ledger (this plan)

### rev 1 — codex (ask) + devin (read-only), plan mode

codex: toObject() source-serialization claim VALIDATED (API docs); step-env-in-if
VALIDATED per GitHub docs; manifest shapes valid. Findings: P1 add
recursive:false to all full-source updates (folded); P2 stamp only on
zero-failure + activeGM guard (folded); P3 strip item-level effects (folded);
P3 token-delta checklist row (folded); P3 bold-weight decision needed
(folded: synthesis explicitly accepted — status quo); P3 jq -er // empty
(folded).

devin: B1 unlinked-token delta recipe a corruption risk (RESOLVED by scope
cut — scene pass dropped; a diff:false write would turn a sparse delta into a
total override, so neither reviewer's recipe survives); M1 toObject
source-vs-prepared unverified locally (CLOSED: codex verified vs API docs;
made explicit as toObject(true)); B2 step-env-in-if not evaluable (DISPUTED
by codex citing docs; RESOLVED by shell guard, correct under both readings);
M2 maximum:"" unverified (CLOSED: official article example sends "");
M3 scripted font fetch (folded: tools/fetch-fonts.mjs); m2 item effects
(folded, same as codex P3); m4 no thumbnail (accepted, parent plan allows);
m5 hotReload extensions key unverified (folded: verify during impl);
n1 counter explicit (folded); n2/n3/n4 noted, no change. isFresh shortcut and
compendium scope cut confirmed sound by devin.

### rev 2 — confirmation round — **CONVERGED (conditionally → folded)**

codex: "The plan is ready to implement." (unconditional).
devin: accepted every rev-1 disposition (B1 scope cut, B2 shell guard, M1
toObject(true), M2 maximum:"" — the latter two marked locally-unverifiable by
devin but closed via codex/API-article verification recorded in rev 1), and
conditioned readiness on two mechanical folds, both applied above:
i18n placeholders aligned with the notification contract (+ new
completedWithFailures key), and the offline-font checklist row moved to a new
§K (old §J is Dark mode). migrated++ made explicit. Per devin's own
conclusion ("fold ... and it is ready") + codex's unconditional ready, the
plan is at terminal state; a third round would re-review prose alignment only.
Implementation may proceed. Impl-time verification notes carried: jq -er
behavior, hotReload manifest shape.
