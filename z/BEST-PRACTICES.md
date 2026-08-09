# HELLAS v13 rewrite vs. current Foundry best practices

Research date: 2026-08-08 · Method: a research agent with full context of the
rewrite surveyed current (2025–2026) official Foundry articles, foundryvtt.wiki
guides, GitHub issues, and live exemplar systems (dnd5e, sdm, boilerplate
lineage), then compared each practice against our actual files. Sources are
cited per row. Verdicts: ALIGNED / PARTIAL / GAP / N-A.

The bottom line: **the architecture is aligned with current practice** (AppV2
sheets, TypeDataModels, CLI-built LevelDB packs from versioned JSON sources,
auto-layered scoped CSS, async dice, tag-push releases, full i18n coverage).
The gaps are concentrated in six concrete items, one of which — the world
migration runner — is structural.

---

## 1. Manifest completeness / polish

| Practice | Guidance (source) | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| `media` entries (setup-screen gallery; Manifest+ cover/screenshots) | Core `media: [{type:"setup", url, thumbnail}]` since v11 (foundryvtt GH #8913); Manifest+ spec (foundryvtt.wiki/en/development/manifest-plus); dnd5e ships media + `background` | No `media`, no `background` | GAP | low | S |
| `background` world-login image | dnd5e system.json | Absent | GAP | low | S |
| `flags.hotReload` dev paths | Official CLI `--hotReload` + manifest flag (foundryvtt.com/article/configuration/; GH #9027) | Absent | GAP | low | S |
| `packFolders` grouping | dnd5e; useful ≥~5 packs | 3 packs, ungrouped | N-A | — | — |
| Semver string version, bump on any change | Package Best Practices Checklist (foundryvtt.wiki) | "0.4.0"; workflow stamps per tag | ALIGNED | — | — |
| Stable manifest URL; download pinned per version | Same checklist | releases/latest manifest; tag-pinned download | ALIGNED | — | — |
| changelog/readme/bugs/license URLs | Checklist + Foundry Hub | Present; changelog → README#changelog (real CHANGELOG.md nicer) | PARTIAL | low | S |
| Author contact (discord/flags) | dnd5e authors; Manifest+ | name+url only | GAP | low | S |

## 2. Data models

| Practice | Guidance | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| `LOCALIZATION_PREFIXES` + field label/hint localization | v13 `Localization#localizeDataModel` (foundryvtt.com/api/v13 Localization); dnd5e uses it | Not used; labels live in hand-written templates | GAP — matters if we adopt formInput/formGroup or want labels in core UIs | med | M |
| `choices:` on constrained StringFields | Wiki DataModel guide; dnd5e | Free StringFields + normalize-and-persist in `_preUpdate` | PARTIAL — deliberate for skill selectors (legacy data would invalidate); weapon/armor `modifier` + armor `type` could safely use choices | med | M |
| Presence-guarded migrateData | (review-loop-established) | Yes, node-tested | ALIGNED | — | — |

## 3. Sheets

| Practice | Guidance | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| `{{formInput}}/{{formGroup}}` + `systemFields` | v13 field-helper idiom (live systems) | Hand-written inputs (audit-checked) | PARTIAL — helpers need §2 localization first | low | L |
| AppV2 PARTS/tabs/actions/drag-drop contract | Wiki conversion guide | Adopted | ALIGNED | — | — |
| Edit/play sheet modes | dnd5e/sdm convention, not a requirement | Single mode (legacy parity) | N-A (product choice) | — | — |
| A11y: aria/keyboard on icon-only controls | foundryvtt.com intro-development; community a11y | `title=` everywhere but `<a>` without href/role aren't keyboard-focusable | GAP | med | M |
| Partial re-render via parts | HandlebarsApplicationMixin design | Whole-part re-render (fine at this size) | ALIGNED | — | — |

## 4. CSS

| Practice | Guidance | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| System styles in the `system` CSS layer | v13 auto-wraps manifest styles (GH #6842; wiki css-cascade-layers) | Manifest-declared → auto-layered; no manual `@layer` needed | ALIGNED | — | — |
| **Bundle fonts locally** | Community norm (offline/LAN installs, GDPR); Foundry bundles its fonts | `@import` Google Fonts — offline installs silently lose Roboto + Caesar Dressing; third-party call per client | GAP | med | S–M |
| Scope to package class | Official CSS best practices | Everything under `.application.hellas` | ALIGNED | — | — |

## 5. i18n

TYPES.* labels, full string coverage (F10), flat keys, Babele compatibility:
all ALIGNED. Field label/hint keys: same GAP as §2 LOCALIZATION_PREFIXES.

## 6. Compendia

JSON `_source` in git + LevelDB in CI (dnd5e/pf2e norm), `_key` per doc,
ownership defaults: all ALIGNED. packFolders/banners/art mapping: N-A at 3
item packs.

## 7. Documents / rolls

| Practice | Guidance | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| Async evaluate, toMessage flavor, DSN compatibility, token bar attributes | v11+/current | Done | ALIGNED | — | — |
| **Active Effects surface** | Core lets users/modules attach AEs regardless of system support; boilerplate ships an AE tab as baseline; Simple Worldbuilding ships none (acceptable but conscious) | No AE UI; module-created AEs would apply to `system.attributes.*` during prepare yet be invisible/unmanageable from our sheets; derived armor totals recompute after AEs inconsistently | PARTIAL | med | M |

## 8. Release / distribution

| Practice | Guidance | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| Tag-push GH Actions → stamped manifest + zip | Community norm | Done, plus audit+test gate | ALIGNED | — | — |
| **Package Release API** | Official (foundryvtt.com/article/package-release-api/); marketplace action cs96and/FoundryVTT-release-package | Not integrated — foundryvtt.com listing won't auto-update version/compatibility | GAP | med | S (needs package registration + PACKAGE_TOKEN secret) |
| Tombstone dual-key manifest for the legacy channel | No official pattern; consistent with stable-URL rule | src/system.json on main | ALIGNED (novel; 0.7-core behavior tracked as ledger D4) | — | — |

## 9. Migration norms — the structural gap

| Practice | Guidance | What we do | Verdict | Sev | Effort |
|---|---|---|---|---|---|
| One-time world migration runner (`systemMigrationVersion` world setting + GM-gated `migrateWorld()` on `ready`) | dnd5e pattern; `_stats.systemVersion` per doc (v10+) supports targeting | migrateData-only: shapes normalize in memory on every read; renames persist only when a doc happens to be updated | PARTIAL — functionally safe, but DB contents stay legacy-shaped indefinitely (exports/dumps show old keys; migrateData runs forever) | **med-high** | M |

## 10. Deprecation horizons

template.json (deprecated v14): none at root ✓ · AppV1/jQuery removal
trajectory: fully off both ✓ · v13 FA-checkbox styling quirk: default styling
used, verify visually ✓ · Node horizons: tooling-only concern ✓.

---

## Ranked gaps (research agent's ranking, concurred)

1. **World migration runner** (§9, med-high, M)
2. **Bundle fonts locally** (§4, med, S–M)
3. **Package Release API in release.yml** (§8, med, S + human steps)
4. **Minimal Active Effects visibility** (§7, med, M)
5. **A11y pass on icon-only controls** (§3, med, M)
6. **LOCALIZATION_PREFIXES on data models** (§2/§5, med, M)
7. **`choices:` on weapon/armor modifier + armor type** (§2, med, M)
8. `media`/`background` manifest polish (low, S)
9. `flags.hotReload` (low, S)
10. Real CHANGELOG.md (low, S)
11. Author contact in manifest (low, S)
12. formGroup adoption (low, L — only after #6)

## Deliberate divergences that are fine (do not "fix")

- No manual `@layer` — v13 auto-layers manifest styles; adding our own would double-wrap.
- Free StringFields for skill selectors — `choices` would invalidate legacy docs; normalize-and-persist (ledger D1) is the safer contract.
- Single visual look in both themes — documented commitment (z/phase-6-plan.md).
- No edit/play modes, no AE automation, XP as free text — legacy parity per spec.
- Pack ownership defaults, 3 ungrouped packs, no art mapping — scale-appropriate.
- Tombstone dual-key manifest — nonstandard but sound; D4 execution check pending.

## Recommendation (parent session)

**Before tagging v0.4.0** (protects data and first impressions):
- #1 migration runner — pairs naturally with the existing migrateData layer;
  without it the sxithborn rename and blank→null cleanups never reach the DB
  for untouched documents.
- #2 font bundling — small, and the current Google import means a LAN/offline
  table loses the entire visual identity.
- #8/#9/#10/#11 manifest-polish batch — trivial, one commit.
- #3 Package Release API — add the workflow step behind a secret-present guard
  now; Stephen registers the package + sets PACKAGE_TOKEN when ready.

**v0.4.x follow-ups** (real improvements, not release blockers):
- #4 AE visibility (small effects list + delete on sheets)
- #5 a11y (buttons or role/tabindex on action anchors + focus styles)
- #6 then #12 (localized schema labels, then form helpers)
- #7 choices on the safe enum fields (with migrateData guards)
