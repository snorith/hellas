# Phase 3 — Data models + migrateData

Goal: TypeDataModel classes for `character` and the five item types, registered
in `CONFIG.*.dataModels`, with presence-guarded `migrateData` and a node smoke
test. template.json is now dead weight (root never had one; `src/template.json`
remains reference-only).

## Architecture

- `module/data/fields.mjs` — small field factories (`intField`, `valueMaxField`)
  around `foundry.data.fields`. All NumberFields are `nullable: true` so blank
  legacy values survive as `null` instead of being 0-cast.
- `module/data/migrations.mjs` — PURE functions (no foundry imports) so they can
  be unit-tested in bare node:
  - `blankToNull(source, path)` — presence-guarded walker (supports `*` over
    present keys only); converts ""/whitespace strings at NumberField paths to
    `null`; never creates missing branches.
  - `migrateCharacterData/migrateSkillData/migrateWeaponData/migrateArmorData/
    migrateDynamismData/migrateTalentData` — apply blankToNull to every legacy
    NumberField path + the `sxithborn → sixthborn` rename (guarded, idempotent).
- `module/data/character.mjs`, `skill.mjs`, `weapon.mjs`, `armor.mjs`,
  `dynamism.mjs`, `talent.mjs` — the models. Static `migrateData` delegates to
  the pure functions then `super.migrateData`.

## Schema decisions (per SPEC §3–4)

- Dropped-by-omission legacy fields (never declared): item `order`, `version`,
  `carriable`, `spell`, weapon `cha`, actor `version`, actor `modifiers.armor.*`
  (now derived), skill `skillid`/`level.max` (now derived), skill/derived `name`
  copies. TypeDataModel cleaning discards unknown source keys — no migration
  writes needed.
- `ambitions` declares slots "1"–"4" (F2). `personal.tree.children.sixthborn`
  (F1) with migration rename. Children defaults "" (F3). `price` is a
  NumberField (F4). `xp` stays a StringField (free text by design).
- Derived data (F5/F6 — no DB writes during prepare):
  - CharacterData.prepareDerivedData: non-finite attribute values → 0 (legacy
    `_prepareAttributes`, extended to all attrs; fatepoints.max falls back 10),
    then armor totals from active armor items → `this.modifiers.armor`
    {dexterity ≤ 0, perception, parry, pr} exactly per SPEC §5.2.
  - SkillData.prepareDerivedData: normalization (skill/specifier/specifierCustom/
    attribute per SPEC §5.1, in-memory only), `this.skillid` dot-join,
    `this.level.max` = value + actor attribute (0 when unowned / not finite),
    `this.fullName` per the naming rules (i18n).
  - Weapon/DynamismData: skillid sentinel defaults handled by field initials
    (`combatrating` / `dynamism`).

## Smoke test (hard-won rule 2)

`tools/test-migrations.mjs`, bare node (no foundry global needed — migrations
are pure): full-document migration, partial update deltas (must not create
sibling branches), blank-string→null at every declared path, sxithborn rename
delta, no-op deltas stay no-op, double-migration idempotency. Run:
`node tools/test-migrations.mjs`.

Exit criteria: smoke test green; `node --check` on all new modules; system still
boots with models registered (types now validate + default properly).

Status: ✅ complete — smoke test 6/6 green
