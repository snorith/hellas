# Foundry VTT system development best practices (v13/v14, as of 2026-08)

Repo-agnostic reference. Every practice below was verified against the cited
source or against measured behavior during a real v13 system build; anything
not fully verified is marked **unverified**.

---

## 1. Manifest (`system.json`)

**Why:** the manifest is the package's entire public contract — installation,
updates, setup-screen presentation, and server-side validation all read it.

| Field | Practice | Why |
|---|---|---|
| `id` | lower-case, matches folder name, never changes | worlds reference the id; changing it orphans every existing world |
| `version` | semver **string**, no pre-release labels; bump on *every* change, even manifest-only | Foundry's `isNewerVersion` compares strings and does not support pre-release labels; floats break (0.10 < 0.9) |
| `compatibility` | `{"minimum": "13.347", "verified": "14"}` shape; keep `verified` current each core release | users get warnings for unverified generations; the modern block replaced `minimumCoreVersion`/`compatibleCoreVersion` (removed in v13) |
| `manifest` | ONE stable URL that always serves the latest manifest (e.g. `…/releases/latest/download/system.json`) | update checks poll this URL; if it moves, updates silently stop |
| `download` | version-pinned zip URL per release — never a "latest" or branch zip | installing an old manifest must fetch *that* version |
| `documentTypes` | declare every sub-type, with `htmlFields` for rich-text fields | the server needs sub-types declared or documents of that type are invalid; `htmlFields` drives server-side sanitization |
| `packs` | `type` (not legacy `entity`), plus `system: "<id>"` on Actor/Item/Adventure packs | v11+ requires packs to declare their system, directly or via relationships |
| `media` | `[{"type": "setup", "url": …, "thumbnail": …}]` for the setup-screen gallery; cover/screenshot/video via the community Manifest+ spec (consumed by Forge/Foundry Hub, ignored by core) | package presentation in setup UI and external browsers |
| `background` | world-login background image path | login-screen polish (dnd5e ships one) |
| `flags.hotReload` | `{"paths": ["styles", "templates", "lang"]}` + launch server with `--hotReload` | live-reloads js/css/html/hbs/json without full refresh during development |
| `grid` | `{"distance": n, "units": "…"}` object (replaces legacy `gridDistance`/`gridUnits`) | legacy keys are shimmed, not forever |
| `primaryTokenAttribute` / `secondaryTokenAttribute` | still current in v13 (dnd5e uses them); dotted path into `system` resolving to `{value, max}` | default token bars |

Sources: https://foundryvtt.com/article/system-development/ ·
https://foundryvtt.wiki/en/development/guides/package-best-practices ·
https://foundryvtt.wiki/en/development/manifest-plus ·
https://github.com/foundryvtt/foundryvtt/issues/8913 (setup media) ·
https://github.com/foundryvtt/foundryvtt/issues/9027 + https://foundryvtt.com/article/configuration/ (hotReload) ·
live https://raw.githubusercontent.com/foundryvtt/dnd5e/master/system.json

## 2. Data models (`TypeDataModel`)

**Why:** schemas replace `template.json` (formally deprecated in the v14
prototype cycle) and give validation, defaults, migration hooks, and real
inheritance.

- Define one `foundry.abstract.TypeDataModel` subclass per sub-type; register
  in `init` with `Object.assign(CONFIG.Actor.dataModels, {type: Class})` —
  `Object.assign`, not `mergeObject`, to preserve statics.
- Destructure fields at call time: `const {SchemaField, NumberField, StringField,
  BooleanField, HTMLField} = foundry.data.fields;`.
- **`NumberField({integer: true})` rounds during cleaning** — `_cleanType`
  "applies `integer`, `min`, `max`, and `step`" — it does not reject floats.
  Source: fvtt-types mirror of core JSDoc
  (League-of-Foundry-Developers/foundry-vtt-types, `fields.d.mts`).
- **NumberField casts `""` to `0`.** Any legacy blank-string value headed into a
  NumberField must be converted to `null` *in `migrateData`, before cleaning* —
  make such fields `nullable: true`. (Measured; the 0-cast silently corrupts.)
- **The `migrateData` delta contract** (hard-won, generalizes to every system):
  `static migrateData(source)` is called with *update deltas*, not only full
  documents. Every normalization must be presence-guarded (`key in source`,
  walk only branches that exist, never invent siblings) and idempotent.
  Anything requiring whole-document context (cross-field normalization) does
  NOT belong in `migrateData` — put it in `_preCreate`/`_preUpdate`, which see
  the full document. Smoke-test migrations in bare node (pure functions, no
  foundry import needed) with partial-delta and double-run cases.
- Derived values (computed ratings, display names, totals) belong in
  `prepareBaseData`/`prepareDerivedData` on the model — **never** write to the
  database during data preparation (infinite-loop and permission hazards).
- `LOCALIZATION_PREFIXES` static + per-field `label`/`hint` keys let core
  localize schemas once (`Localization#localizeDataModel`); required if you use
  the `{{formInput}}`/`{{formGroup}}` helpers.
  Source: https://foundryvtt.com/api/v13/classes/foundry.helpers.Localization.html
- Use `choices:` on StringFields only when legacy data cannot contain
  out-of-list values — `choices` *invalidates* nonconforming documents rather
  than normalizing them.

Sources: https://foundryvtt.com/article/system-data-models/ ·
https://foundryvtt.wiki/en/development/api/DataModel ·
https://foundryvtt.com/releases/14.352 (template.json deprecation)

## 3. Sheets (ApplicationV2 / HandlebarsApplicationMixin)

**Why:** AppV1 (`Application`, `ActorSheet`, jQuery `html` args) is deprecated
with removal on the v15+ horizon; all core UI is AppV2 since v13.

Core contract (all verified against live v13 systems + the conversion guide):

```js
const { api, sheets } = foundry.applications;
class MySheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["mysystem", "actor"],
    position: { width: 900, height: 950 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { doThing: MySheet.#onDoThing }   // static; `this` = app instance
  };
  static PARTS = {
    header: { template: "systems/mysystem/templates/actor/header.hbs" },
    tabs:   { template: "templates/generic/tab-navigation.hbs" }, // core-provided
    main:   { template: "systems/mysystem/templates/actor/main.hbs",
              scrollable: [""] }   // "" = the part's ROOT is scrollable (documented)
  };
}
```

- `scrollable: [""]` is the sanctioned idiom: "A blank string is used to denote
  that the root level of the part is scrollable."
  Source: https://foundryvtt.com/api/v13/interfaces/foundry.HandlebarsTemplatePart.html
- Tabs: keep active-tab state in `this.tabGroups`; build
  `{id, group, cssClass, label}` records for the generic nav template; assign
  `context.tab` per part in `_preparePartContext`; each tab template's root is
  `<section class="tab {{tab.cssClass}}" data-group="…" data-tab="…">`. Never
  set `display` on the element that directly contains tabs (grid/flex there
  makes all tabs visible).
- Choose parts per document type in `_configureRenderOptions` (call super).
- `getData()` → `async _prepareContext(options)`; per-part additions in
  `_preparePartContext(partId, context)`.
- Actions replace `activateListeners`: `data-action="doThing"` in templates;
  handler receives `(event, target)`; extra `data-*` attributes ride on
  `target.dataset`. Gate mutating actions on `this.isEditable`
  (DocumentSheetV2 provides it).
- ActorSheetV2 gives free drag/drop: elements with class `draggable` +
  `data-item-id` drag as items; drops onto the sheet create/sort embedded items.
- Rich text: enrich in context prep with
  `foundry.applications.ux.TextEditor.implementation.enrichHTML(html, {secrets, relativeTo})`,
  then render `<prose-mirror name="system.field" data-document-uuid="{{doc.uuid}}"
  value="{{system.field}}" toggled="true">{{{enriched}}}</prose-mirror>` when
  editable, bare `{{{enriched}}}` when not. The legacy `{{editor}}` v12 pattern
  is deprecated.
- Templates load via `foundry.applications.handlebars.renderTemplate` /
  `loadTemplates` (namespaced in v13; bare globals deprecated).
- Sheet registration: `const {Actors, Items} = foundry.documents.collections;`
  then `Items.registerSheet("mysystem", MySheet, {types, makeDefault: true, label})`.
- Image editing: an action calling
  `new foundry.applications.apps.FilePicker.implementation({type: "image", current, callback}).browse()`.
- Tooltips: core `data-tooltip` (text) / `data-tooltip-html` (HTML string
  attribute) replace vendored tooltip libraries; content renders inside core's
  `#tooltip` element — scope tooltip CSS there.

Sources: https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide ·
https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Tabs-in-AppV2 ·
https://foundryvtt.wiki/en/development/api/applicationv2 ·
live sdm system (luizrcb/foundryvtt-sdm) and dnd5e sources

### DialogV2 (prompts)

- Factories: `confirm()`, `prompt()`, `input()`, `wait()` on
  `foundry.applications.api.DialogV2`.
- `wait()` resolves to the clicked button's `action` or its `callback` return;
  with `rejectClose: false` it resolves `null` on dismiss (else it rejects).
- Button callbacks receive `(event, button, dialog)`; read inputs via
  `button.form.elements.<name>` — **DialogV2 supplies the form; never put a
  `<form>` inside dialog content** (nested forms are invalid HTML and the
  inputs can end up invisible to `button.form`).
- Content is an HTML string (form-less), a div element, or built from
  `foundry.applications.fields` helpers. Post-render focus etc. via the
  `render: (event, dialog)` option.
- Parse number inputs with `Number()`, not `parseInt()` — number inputs accept
  exponent notation (`1e2`), which `parseInt` truncates to `1`.

Source: https://foundryvtt.com/api/classes/foundry.applications.api.DialogV2.html

## 4. CSS

- **v13 auto-wraps manifest-declared stylesheets in the `system` (or `module`)
  cascade layer** — do not add your own `@layer` wrapper; the layer order
  already lets system styles beat core without specificity hacks.
  Sources: https://github.com/foundryvtt/foundryvtt/issues/6842 ·
  https://foundryvtt.wiki/en/development/guides/css-cascade-layers
- Scope every rule under a package class (e.g. `.application.mysystem`);
  unscoped rules leak into core UI and other packages.
  Source: https://foundryvtt.com/article/intro-development/
- **Bundle fonts locally** (`@font-face` + files shipped in the package) instead
  of `@import`-ing Google Fonts: Foundry servers frequently run offline/LAN
  (fonts silently vanish), and third-party font calls are a GDPR liability.
  Community-established practice (exemplar packages ship `fonts/` directories).
- Theme-awareness: v13 "Theme V2" follows OS light/dark. Either consume core
  theme variables, or commit to a self-painted look — but then set text,
  field, select/option colors explicitly so dark mode cannot produce
  light-on-light.
- v13 renders checkboxes as FontAwesome icons; custom checkbox styling must
  target `::before`/`::after` pseudo-elements.
  Source: https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide

## 5. i18n

- Everything user-facing goes through `game.i18n.localize/format`; Handlebars
  `{{localize "KEY" arg=…}}` switches between the two automatically.
- Provide `TYPES.Actor.<type>` / `TYPES.Item.<type>` labels — the create
  dialogs use them (raw ids show otherwise).
- Flat or nested JSON both work; whichever is chosen, be consistent.
- AppV2 auto-localizes `window.title` and settings `name/label/hint` given
  i18n keys.
- Composed keys (`prefix.${value}.suffix`) are fine but audit them: enumerate
  every runtime value and assert the key exists (missing keys render as the raw
  key with no error).
- Schema field labels/hints: see `LOCALIZATION_PREFIXES` in §2.
- Compendium translation (Babele) needs no system-side support.

Sources: https://foundryvtt.wiki/en/development/api/localization ·
https://foundryvtt.wiki/en/development/guides/SD-tutorial/SD13-Localization

## 6. Compendia

- v11+ packs are **LevelDB directories**; NeDB `.db` files are legacy
  (auto-migrated once, on load). New packs ship LevelDB only.
  Source: https://foundryvtt.com/article/v11-leveldb-packs/
- Norm (dnd5e/pf2e): keep **per-document JSON sources in git**, compile to
  LevelDB at build/release time with `@foundryvtt/foundryvtt-cli`
  (`compilePack(src, dest)` / `extractPack`), and gitignore the compiled output.
- **Every source document needs `_key`** — `"!items!<_id>"` (collection-typed).
  Without it `compilePack` silently produces an *empty* database (measured).
  Verify builds by round-trip `extractPack` + count.
- **Legacy NeDB `.db` files are append-only journals**: duplicate `_id` lines
  are updates — last write wins; honor `$$deleted` tombstones when converting
  (measured; naive line counts overcount documents).
- Preserve `_id`s across conversions so existing `Compendium.<system>.<pack>.<id>`
  references keep resolving; keep pack `name`s stable for the same reason.
- Strip world-specific `permission`/`ownership` user entries from pack sources;
  `{"default": 0}` is a sane baseline (pack visibility is configured pack-level
  since v11).
- `packFolders` (manifest) groups many packs in the sidebar; worth it at ~5+.

Sources: https://github.com/foundryvtt/foundryvtt-cli ·
https://foundryvtt.com/article/v11-leveldb-packs/ · live dnd5e repo layout

## 7. Documents & rolls

- Dice are async-only since v11: `const roll = new Roll(formula, data);
  await roll.evaluate();` (`{async: false}` is long removed). Post with
  `roll.toMessage({speaker, flavor}, {rollMode})`; `CONST.DICE_ROLL_MODES.*`
  for modes.
  Source: https://foundryvtt.com/releases/11.292 · https://foundryvtt.wiki/en/development/api/roll
- Guard roll data: a `null` fed to `@path` substitution breaks the formula —
  coerce non-finite values before building roll data (pairs with nullable
  NumberFields, §2).
- Plain `Roll` + `toMessage` is automatically compatible with Dice So Nice.
- Custom document classes: set `CONFIG.Actor.documentClass` /
  `CONFIG.Item.documentClass` in `init`. One Item class dispatching on
  `this.type` is the modern replacement for per-type class hacks.
- Persisted derived state (display names, normalized selectors) belongs in
  `_preCreate` (`this.updateSource({...})` — it merges) and `_preUpdate`
  (mutate `changed`) — full-document context is available there, unlike in
  `migrateData` (§2).
- Active Effects: core applies AEs to `system.*` during actor prep whether or
  not the system supports them, and other modules can create them. A system
  that ignores AEs entirely should at least surface a list/delete UI, or
  document that AEs are unsupported. Values derived in `prepareDerivedData`
  overwrite AE modifications to those same derived fields — decide which fields
  are AE-targetable and compute accordingly.
- `_stats` on every document (`systemId`, `systemVersion`, `coreVersion`, …)
  since v10 — useful for targeting migrations.
  Source: https://foundryvtt.com/releases/10.260

## 8. Release & distribution

- Standard pipeline: tag push → CI builds packs → stamps `version` + pinned
  `download` URL into the manifest → zips the system payload → attaches
  **both** the zip and the stamped `system.json` to the GitHub release. The
  advertised install/update manifest is `…/releases/latest/download/system.json`
  (stable), while each release's own manifest pins its download (checklist
  rule: stable manifest URL, never a "latest" zip).
  Source: https://foundryvtt.wiki/en/development/guides/package-best-practices
- Zip layout: manifest at archive root of the package folder contents; exclude
  dev-only material (pack sources, docs, CI config).
- **Package Release API**: POST each release to foundryvtt.com so the listing
  and its per-core-version compatibility stay current — automatable in CI
  (e.g. marketplace action `cs96and/FoundryVTT-release-package` with a
  `PACKAGE_TOKEN` secret).
  Source: https://foundryvtt.com/article/package-release-api/
- Changing distribution channels: leave a manifest at the OLD polled URL
  carrying both legacy keys (`name`, `minimumCoreVersion`) and the modern
  `id`/`compatibility` block, pointing `manifest`/`download` at the new
  channel. Set the legacy `minimumCoreVersion` high enough that ancient cores
  refuse the update instead of installing an incompatible build (**unverified**
  against real 0.x cores — test before relying on it). Note GitHub serves
  renamed-branch raw URLs via redirect, so a manifest polled at
  `/master/...` can live on `main` after a rename.

## 9. Migration norms

Two complementary layers — most established systems use both:

1. **`migrateData` (schema layer)**: shape-fixes on read, forever. Delta-safe
   rules per §2. This alone keeps worlds *working*, but the database contents
   stay legacy-shaped indefinitely (exports and pack dumps show old keys).
2. **One-time world migration runner (dnd5e pattern)**: a world-scoped
   `systemMigrationVersion` setting; on `ready`, if the setting is older than
   the current needs-migration threshold and the user is GM, iterate world
   actors/items/scene-token deltas/compendia, apply update payloads, then
   bump the setting. `_stats.systemVersion` per document helps target work.
   Source: dnd5e `module/migration.mjs` + `systemMigrationVersion` setting
   (github.com/foundryvtt/dnd5e).

Version-gap advice for users migrating very old worlds: step through core
generations (v11 → v12 → v13), opening the world at each step, rather than
jumping — core's own irreversible migrations run per generation.
Source: https://foundryvtt.com/article/migration/ (+ community guidance).

## 10. Deprecation horizons (plan against these)

| Item | Status | Source |
|---|---|---|
| `template.json` | deprecation period entered in v14 prototype; use TypeDataModel + `documentTypes` | https://foundryvtt.com/releases/14.352 |
| AppV1 (`Application`, `ActorSheet`, jQuery `html`) | deprecated; v13 hooks pass DOM elements, not jQuery; removal on the v15+ horizon | https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide · https://foundryvtt.com/releases/13.332 |
| Legacy manifest keys (`name`, `minimumCoreVersion`, `compatibleCoreVersion`, pack `entity`) | removed/enforced in v13 (deprecated since v10) | https://foundryvtt.com/article/manifest-migration-guide/ · https://github.com/foundryvtt/foundryvtt/issues/11815 |
| Global class names (pre-namespace) | deprecated redirects until ~v15 (v13 ESModule reorganization) | https://foundryvtt.com/releases/13.332 |
| `Roll#evaluate({async:false})` | removed (v11) | https://foundryvtt.com/releases/11.292 |
| NeDB packs | migrated-on-load only; don't ship new ones | https://foundryvtt.com/article/v11-leveldb-packs/ |
| Node requirements | v13: Node 20+; v14: Node 24 (mutually exclusive with v13's) | https://foundryvtt.com/releases/13.341 · https://foundryvtt.com/releases/14.356 |
