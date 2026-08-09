# HELLAS system — behavioral specification (extracted from legacy 0.7.x code)

Source of truth for the v13/v14 rewrite. Extracted from the full legacy source at
v0.3.6 (`src/`). "Legacy path" notation below uses the 0.7 `data.data` layout; the
rewrite stores the same logical fields under `system.*`.

---

## 1. System identity & manifest

- **id**: `hellas` (MUST NOT change — existing worlds depend on it)
- title: "Hellas"; description mentions fan-contributed support + Khepera Publishing (preserve verbatim from old system.json/README)
- Legacy manifest values (v0.3.6): `minimumCoreVersion: 0.7.0`, `compatibleCoreVersion: 0.7.9`,
  `manifest: https://raw.githubusercontent.com/snorith/hellas/master/src/system.json`,
  `download: https://raw.githubusercontent.com/snorith/hellas/v0.3.6/package/hellas-v0.3.6.zip`
  - **Update-channel landmine**: live installs poll the raw-GitHub master `src/system.json` path.
    A tombstone manifest must remain at exactly `src/system.json` on master with BOTH legacy keys
    (`minimumCoreVersion`/`compatibleCoreVersion`, `name`) and modern `id`/`compatibility`, whose
    `manifest`/`download` point at the new GitHub-Releases channel.
- Legacy `scripts`: tooltipster bundles (dropped — replaced by core tooltips); `esmodules: [hellas.js]`; `styles: [hellas.css, tooltipster css]`.
- **Packs** (3, all Item, legacy NeDB `.db`, declared with legacy `entity: "Item"`):
  - `systemSkills` / "System Skills" / `./packs/system-skills.db`
  - `systemTalents` / "System Talents" / `./packs/system-talents.db`
  - `systemDynamisms` / "System Dynamisms" / `./packs/system-dynamisms.db`
  - Rewrite: LevelDB packs built from JSON sources via foundryvtt-cli; declare `type: "Item"` + `system: "hellas"`. Content (with `data.` → `system.` and field migrations applied) must be preserved.
- `primaryTokenAttribute: attributes.hitpoints`, `secondaryTokenAttribute: attributes.fatepoints`
- `gridDistance: 1`, `gridUnits: ""` (modern: `grid: {distance: 1, units: ""}`)
- **Initiative** (combat tracker): `1d20 + @attributes.speed.value + @initiative.modifiers.first + (@attributes.speed.value / 100)`, `decimals: 2`
- Languages: `en` → `lang/en.json` only.
- License/trademark text in README.md, LICENSE, and the settings notice (§8) is preserved verbatim per location.

## 2. Game constants (`HELLAS` config object; exposed as `game.HELLAS` and used by sheets)

- `SPECIFY_SUBTYPE = 'specify'` — sentinel meaning "user types a custom specifier".
- `races` (8): amazoran, goregon, hellene, kyklope, myrmidon, nephelai, nymphas, zintar. (Informational; race is a free-text field on the sheet.)
- `attributesWShortName` (17 entries, insertion order matters — `attributes` = its keys):
  intelligence INT, perception PER, will WIL, charisma CHA, strength STR, constitution CON,
  dexterity DEX, speed SPD, combatrating CR, dynamism DYN, glory Glory, heropoints "Hero Points",
  hitpoints HP, **fatepoint** "Fate Points" (note: singular here, `fatepoints` in actor schema),
  relationship Relationship, internal Internal, external External.
- `attributesShortToLong` — exact inverse map (INT→intelligence, … "Fate Points"→fatepoint).
- `characterAttributes` (the 10 rollable, displayed in a 5×2 grid, in this order):
  charisma, constitution, dexterity, intelligence, perception, speed, strength, will, combatrating, dynamism.
- `characterDisadvantages`: relationship, internal, external.
- `initiativeAttribute: "speed"`.
- `skills` = keys of `skillWAssocShortAttributes` (see below), 40 skills.
- `skillSpecificsBreakdown` — skills that have variant specifiers:
  - athletics: swimming, climbing, balancing, flying, jumping, ropeclimbing, running, strengthfeat, endurance, specify
  - computers: personal, mainframe, starship, specify
  - deception: deception, disguise
  - drive: specify
  - etiquette: specify
  - handicraft: alchemy, armorer, artificer, artisan, bowyerfletcher, brewervintner, engineermechanical, engineerstructural, gunsmith, finearts, vehicles, weaponsmith, specify
  - instinct: intuition, initiative
  - intimidate: words, physically
  - investigatesearch: investigationwcha, investigationwint, search
  - literacy: specify
  - lore: agriculture, arcanearts, engineering, folklore, forgery, gambling, heraldry, herblore, geography, history, law, local, mining, nature, region, streetwise, tactics, specify
  - mode: (filled at init with the 8 dynamism modes)
  - perform: dance, musicianship, juggling, acting, oratory, singing
  - pilot: specify
  - profession: specify
  - science: astronomy, biology, botany, chemistry, geology, mathematics, medicine, metallurgy, physics, xenobiology, theology, zoology, specify
  - sleightofhand: perform, detect
  - speaklanguage: atlantean, goregon, hellene, nymphas, zintar, zoran, specify
  - survival: savannah, forest, jungle, desert, arctic, swamp, alpine, aquatic, urban, specify
  - torture: specify
  - trackingshadowing: tracking, shadowing
  - trading: appraising, haggling
  - weapon: melee, ranged, heavyweapons, guns, thrown, vehicleweapons, specify
- `skillSpecificsGetOneOnly` (buy each variation separately): computers, drive, etiquette, handicraft, instinct, literacy, mode, perform, pilot, profession, science, speaklanguage, survival, weapon, lore.
  (NOTE: perform appears here AND has special naming behavior; athletics et al. are get-all by absence.)
- `skillSpecificsGetAll`: torture. (Sheet copy: "all variations included with one buy".)
- `skillWAssocShortAttributes` (skill → allowed attributes, first = default):
  athletics [CON,DEX,SPD,STR]; animalhandling [WIL]; command [CHA]; computers [INT];
  deception [CHA,INT]; deducemotive [PER]; diplomacy [CHA]; disablemechanism [DEX]; drive [DEX];
  etiquette [CHA,INT]; evade [DEX]; handicraft [INT,STR,DEX]; heal [INT]; influence [CHA];
  instinct [PER,SPD]; intimidate [CHA,STR]; investigatesearch [CHA,INT,PER]; literacy [INT];
  lore [INT]; medicine [INT]; mode [DYN,PER,CR]; mounted [CR]; navigate [PER]; pankration [CR];
  parry [CR]; perform [DEX,CHA]; pilot [DEX]; profession [INT,PER,WIL,CHA,STR,CON,DEX,SPD,CR,DYN];
  research [PER,INT]; resolve [WIL]; ride [DEX]; science [INT]; sleightofhand [DEX,PER];
  speaklanguage [INT]; stealth [DEX]; survival [CON,INT]; torture [DEX,INT,STR];
  trackingshadowing [PER,DEX]; trading [INT,CHA]; weapon [CR].
- `skillWAssocLongAttributes` — derived at init: same map with long attribute names.
- `dynamismModes` = keys of `dynamismModesSpecificBreakdowns` (8): attack, illusion, influence, kinetic, manifest, manipulate, sensory, shield.
- `dynamismModesSpecificBreakdowns`:
  attack [skill, cr]; illusion [illusion, resist]; influence [influence]; kinetic [kinetic, grapple];
  manifest [create, dematerialize]; manipulate [health, skill, attribute, protection, minortransform, majortransform, completetransform];
  sensory [perception, locate, scry, obscure]; shield [aura, barrier, ward, curse].
- `dynamismMode: "mode"` — the skill name that represents dynamism modes.
- `weaponModifiers` (13): regular, aether, armorpiercing, beam, bulky, fast, flame, impaling, needle, slugthrower, sonic, torch, vehicularscale.
- `armorModifiers` (4): regular, energy, aether, holo.
- `armorTypes` (grouped for the `<optgroup>` select):
  naked [nakednudity, nakedenchantingbeauty]; clothing [clothingutility, clothingofftherack, clothinghighfashion, clothingnoblewear];
  cuirass [cuirasslight, cuirassmedium, cuirassheavy]; full [fulllight, fullmedium, fullheavy];
  helmet [helmetlight, helmetmedium, helmetheavy]; shield [shieldlight, shieldmedium, shieldheavy, shielddrone];
  shroud [shroudclassa, shroudclassb, shroudclassc].
- `childrenBorn` (6): firstborn, secondborn, thirdborn, fourthborn, fifthborn, **sxithborn** (typo IS the legacy data key — see fix-don't-port F1).
- Init also does: `skillSpecificsBreakdown["mode"] = dynamismModes`.

## 3. Actor schema — type `character` (the only Actor type)

Legacy template.json layout (all under `data.`; rewrite → `system.`):

| Field | Legacy default | Type / notes |
|---|---|---|
| biography | "" | HTML (rich editor on Description tab) |
| epithet, race, profession, deity | "" | string (header fields) |
| xp | "" | **string** (free text, e.g. "3/12") |
| attributes.{intelligence,perception,will,charisma,strength,constitution,dexterity,speed,glory,heropoints,combatrating,dynamism,hitpoints,relationship,internal,external} | {value:0, max:0} | number pairs. UI edits `value` for the 10 rollables + glory + heropoints; hitpoints edits value AND max |
| attributes.fatepoints | {value:0, max:10} | fate dots widget; max drives dot count |
| modifiers.armor.{dexterity,perception,parry,pr} | 0 | armor-derived totals (see §5 — becomes derived, kept accepting legacy stored values) |
| disadvantages.{relationship,internal,external} | {level:0, info:""} | level edited as text input with data-dtype Number |
| ambitions.{1,2,3}.info | "" | template declared 3; **sheet renders 4** (`ambitions.4.info`) — see F2. New schema: 4 slots |
| possessions.info | "" | textarea |
| abilities.info | "" | textarea ("Special Abilities & Divine Favors") |
| personal.tree.house | "" | string |
| personal.tree.mother.{grandmother,grandfather,name} | "" | strings |
| personal.tree.father.{grandmother,grandfather,name} | "" | strings |
| personal.tree.children.{firstborn…sxithborn} | "a".."f" (junk defaults) | strings — new default "" (F3); migrate `sxithborn` → `sixthborn` (F1) |
| personal.birth.{age,month,year,planet} | "" | strings |
| personal.info.{socialstation,gift,mark,encounter,destiny,fate,deeds,notes,familystatus} | "" | strings/textareas |
| personal.info.callings.{first,second,third,fourth,fifth}.{years,notes} | "" | strings |
| initiative.modifiers.{first,following} | 0 | numbers |
| version | 1 | (base template) schema version marker |

Legacy shapes the migration must accept:
- Values may be strings where numbers are expected (inputs with `data-dtype Number` but `type="text"`, e.g. disadvantage levels). Blank string → `null` before NumberField cleaning (NOT 0-cast).
- `personal.tree.children.sxithborn` → `sixthborn`.
- `modifiers.armor.*` may exist with stale values — accepted, then recomputed as derived.
- `ambitions.4` may exist in world data even though template.json never declared it (0.7 persisted undeclared keys).
- Actor `data.data` wholesale → `system` (core handles the envelope; our migrateData handles renames within).

## 4. Item schemas (5 types; every type keeps a TypeDataModel even if minimal)

Shared legacy template mixins: `common` {notes: "" (HTML), order: -1, version: 1};
`sellable` {price: "0" — STRING default, edited as Number — see F4};
`carriable` {carriable: true}; `spell` {spell: true}; `skilltype` {skillid: ""};
`wearable` {active: false}.
`order` is dead (core sort replaces it — keep accepting, drop from schema).

### 4.1 skill (`common` + `skilltype`)
| Field | Default | Notes |
|---|---|---|
| skill | "" | one of HELLAS.skills; empty → normalized to first (athletics) when prepared |
| attribute | "" | SHORT name (e.g. "DEX"); must be in skillWAssocShortAttributes[skill], else reset to first |
| specifier | "" | for skills with specifics; must be in breakdown list, else reset to first; "" for skills without |
| specifierCustom | "" | free text when specifier == 'specify'; for skill 'mode' it's the mode sub-type (from dynamismModesSpecificBreakdowns[specifier]); cleared otherwise |
| level | {value:0, max:0} | value = bought level; max = DERIVED rating (see §5) |
| skillid | "" | DERIVED: `${skill}.${specifier}.${specifierCustom}` (dot-joined, always 2 dots) |
| notes | "" | HTML description |
- Default img: `icons/svg/lightning.svg`.
- Item NAME is derived (see §5 naming rules).

### 4.2 dynamism (`common` + `spell` + `skilltype`)
| Field | Default | Notes |
|---|---|---|
| skillid | "" → normalized to `"dynamism"` sentinel when unowned | ON A DYNAMISM, skillid holds the **item _id** of the chosen mode-skill on the same actor (sentinel `"dynamism"` = unset) — different semantics from skill.skillid! |
| dod | 0 | degree of difficulty (negative modifier by convention; passed to roll dialog) |
| dodinfo | "" | textarea, shown with line breaks |
| range, tradition, duration, other | "" | strings |
| spell | true | dead flag, keep accepting |
- Default img `icons/svg/lightning.svg`. Roll requires a real skillid (error notification otherwise).

### 4.3 weapon (`common` + `carriable` + `sellable` + `skilltype` + `wearable`)
| Field | Default | Notes |
|---|---|---|
| skillid | "" → normalized to `"combatrating"` when unowned | item _id of a weapon-skill on the actor, or sentinel `"combatrating"` = roll off CR attribute |
| acc | 0 | accuracy mod, added into the dialog's prefilled modifier |
| dr | 0 | damage rating (display only) |
| wt | 0 | weight (display) |
| rof | 0 | rate of fire (display) |
| str | 0 | minimum STR; shortfall penalty (see §6.4) |
| cha | 0 | DEAD field (never in UI) — keep accepting |
| ammo, rng | "" | strings (display) |
| modifier | "regular" | one of weaponModifiers |
| ismissile | false | doubles STR-shortfall penalty |
| price | "0" legacy string | number in UI (F4) |
| carriable | true, active | false | dead flags, keep accepting |
- Default img `icons/svg/sword.svg`.

### 4.4 armor (`common` + `carriable` + `sellable` + `wearable`)
| Field | Default | Notes |
|---|---|---|
| str | 0 | min STR; shortfall → DEX penalty while worn (§5.2) |
| per | 0 | PER modifier while worn (additive, entered signed) |
| cha | 0 | CHA modifier (display only, "not included in rolls") |
| parry | 0 | parry modifier while worn |
| pr | 0 | protection rating (soak, summed) |
| wt | 0 | weight |
| md | 0 | max damage before parry reduced (display) |
| type | "clothingutility" | one of armorTypes leaf values |
| modifier | "regular" | one of armorModifiers |
| active | false | "worn" toggle on actor sheet |
| price | "0" legacy | (F4) |
- Default img `icons/svg/shield.svg`.

### 4.5 talent (`common`)
| Field | Default | Notes |
|---|---|---|
| desc | "" | textarea (short description) |
| benefit | "" | HTML (rich editor) |
- Default img `icons/svg/sun.svg`.

## 5. Derived data rules

### 5.1 Skill preparation (legacy did this in prepareData with writes-during-prepare — F5; rewrite computes as pure derived data)
1. Normalize `skill` (empty → first), `specifier` (must be in breakdown), `specifierCustom`
   (mode: must be in mode breakdown, default first; non-mode non-specify: cleared),
   `attribute` (must be in allowed list, default first). In the rewrite these normalizations
   happen in the item sheet's option lists + `_preUpdate`/migrateData, not as render-time writes.
2. `skillid = [skill, specifier, specifierCustom].join('.')`.
3. Rating: `level.max = level.value + actor.attributes[long(attribute)].value` when owned;
   `level.max = level.value` when unowned. (level.max is display+roll "Rating".)
4. Derived item NAME:
   - no skill → i18n `HELLAS.item.skill.new`
   - plain skill (no specifics): `HELLAS.skills.<skill>.name`
   - mode skill: base name `HELLAS.skills.mode.short.name`; if unowned or specifierCustom==specifier → combiner "{skill}: {specifier}"; else combiner2 "{skill}: {specifier} ({type})" with type = `HELLAS.skills.mode.<specifierCustom>`
   - perform + unowned → combiner with specifier label "specify"
   - get-all skill (torture) + unowned → combiner with literal `*`
   - specifier=='specify' with custom text → combiner "{skill}: {customtext}"
   - otherwise combiner "{skill}: {localized specifier}"
   (Exact i18n combiners: `HELLAS.item.skill.name.combiner` = "{skill}: {specifier}"-style, `…combiner2` adds the mode type — reuse keys as-is.)
   Legacy also wrote the derived name back to the DB when it differed (F5). Rewrite: derive at
   prepareDerivedData time (Document#name stays user-invisible for skills — sheet hides the name
   input for skills and shows derived name as heading).
5. Default icon when none set.

### 5.2 Actor armor totals (legacy: computed in ActorSheet.getData + wrote back via actor.update — F6; rewrite: pure derived in prepareDerivedData)
For each **armor** item with `active == true`:
- `totalpr += pr`
- `perModifier += per`
- `parryModifier += parry`
- if `armor.str > actor.strength.value`: `dexModifier += (armor.str − strength.value)`
Result (matching legacy storage signs):
- `modifiers.armor.dexterity = −dexModifier` (≤ 0)
- `modifiers.armor.perception = perModifier` (sign as entered)
- `modifiers.armor.parry = parryModifier`
- `modifiers.armor.pr = totalpr`
Displayed in armor table footer: Total PR / Total DEX mod / Total PER mod.

### 5.3 Actor misc
- Rollable attribute values non-finite → treated as 0 for display (legacy `_prepareAttributes`).
- No other derived actor math (HP, glory etc. are manual).

## 6. Roll engine

### 6.1 Omega-table outcome (dice.ts) — applies to attribute/skill/weapon/dynamism rolls (NOT initiative)
On final roll total: `≤0` critfail; `1–5` fail; `6–10` partialsuccess; `11–19` success; `≥20` critsuccess.
Localized via `HELLAS.die.roll.outcome.<outcome>`, announced with `HELLAS.roll.chat.outcome`.

### 6.2 Modifier dialog (before every non-initiative roll; Cancel/close aborts the roll)
Fields (all integers):
- `dod` — degree of difficulty; prefilled from dynamism's dod (else 0); autofocused/selected; has rich tooltip (`HELLAS.roll.modifiers.dialog.dod.tooltip`, HTML).
- `nonproficiency` — default 0.
- `multipleactionscount` — select 0–10, default 0.
- `modifier` — prefilled with context baseModifier (armor/weapon-derived, see per-roll).
Buttons: cancel / roll (roll is default).

### 6.3 Multiple-action penalty (MAP)
`MAP = count × (−5)`; if `count > 0` add `+SPD`; clamp so result `≤ 0` (never a bonus).
(First action is free — count starts at 0.)

### 6.4 The five rolls (all public rollMode, all send chat card with flavor template)
All formulas evaluate with the dialog values; `@modifier` is the dialog's (possibly edited) modifier.

1. **Attribute roll** (`.attr-roll`, on the 10 characterAttributes):
   baseModifier = `modifiers.armor[attribute]` if that key exists (dexterity/perception), else 0.
   Formula: `d20 + @attribute.value + @dod + @nonproficiency + @multipleactionspenalty + @modifier`.
   Chat: attributeroll.hbs — title "HELLAS.roll.chat.attribute.title" + outcome + details (attribute value, dod, nonprof, MAP count, modifier).
   (Legacy passed a `data-rating` too; unused — F7.)
2. **Skill roll** (`.skill-roll` on owned skill item):
   baseModifier = (skill=='parry' ? modifiers.armor.parry : 0) + (modifiers.armor[long(attribute)] ?? 0).
   Formula: `d20 + @level.max + @dod + @nonproficiency + @multipleactionspenalty + @modifier`.
   Chat: skillroll.hbs (shows level.max as "skill rating", attribute short name in title).
3. **Weapon roll** (`.weapon-roll`):
   STR shortfall: if `actor.strength.value < weapon.str`: penalty = `(str − strength) × (ismissile ? −4 : −2)`; plus `+ acc`. That sum is the dialog baseModifier.
   baseLevel: skillid=='combatrating' → `attributes.combatrating.value`, skill name = localized CR attribute name; else look up owned skill by **item id** — missing skill ⇒ error notification `No associated skill found for <name>` and abort; baseLevel = skill.level.max, skillName = skill name.
   Formula: `d20 + @baseLevel + @dod + @nonproficiency + @multipleactionspenalty + @modifier`.
   Chat: weaponroll.hbs (title has skill + weapon names).
4. **Dynamism roll** (`.dynamism-roll`):
   Requires a concrete mode-skill (skillid !== 'dynamism' sentinel) — else error notification "You must first pick a specific dynamism skill for <name>…" and abort.
   Dialog opens with dod prefilled from item.dod, baseModifier 0. Missing skill item ⇒ same "No associated skill" error.
   baseLevel = skill.level.max. Same formula as weapon. Chat: dynamismroll.hbs.
5. **Initiative roll** (`.initiative-roll`, ids `first`|`following`) — NO dialog, NO omega outcome:
   modifier = `initiative.modifiers[first|following]` (0 if absent).
   Formula: `d20 + @speedAttr.value + @modifier`. Chat: initiativeroll.hbs shows plain total + speed + modifier. (Combat-tracker formula in §1 is separate and only uses `first`.)

All rolls async in rewrite (`await roll.evaluate()`), `roll.toMessage({speaker, flavor: renderedTemplate})`, public roll mode (legacy forced PUBLIC via `{rollMode: CONFIG.Dice.rollModes.PUBLIC}` — keep: these rolls are always public).

## 7. Sheets

### 7.1 Actor sheet (character) — legacy 925×1000, tabs [attributes, disadvantages, personal, description], initial "attributes"
Header: img (editable via data-edit), name input, epithet/race/profession/deity inputs. Greek-meander divider bars.

**Attributes tab**:
- 5-col grid of the 10 characterAttributes: localized name (title = description tooltip), d20 roll button (`.attr-roll`), number input for `attributes.<name>.value` (integer, min −10).
- Resource row: HP current/max inputs; Glory value; Hero Points value (with static HTML tooltip: Hero-Point spending rules table — preserve content verbatim, §7.4); XP free-text (with static HTML tooltip: XP costs table — preserve verbatim).
- **Fate points widget**: label (click = set 0) + `max` dots (repeat 1..max). Dot n filled iff `n ≤ value`; last dot renders skull icon ("Dead"). Click dot n ⇒ set `fatepoints.value = n`; click the label ⇒ 0. Legacy only mutated in-memory prepared data + re-render (never persisted — F8; rewrite persists via actor.update).
- **Skills table**: columns [notes-tooltip icon | name | roll d20 | Level (level.value) | Attr (short) | Rating (level.max) | edit/delete]; header + button creates new skill. Notes icon disabled (greyed) when notes empty, else rich HTML tooltip: img, name, level/attr/rating table, raw notes HTML.
- **Dynamisms table**: [tooltip | name | roll | DoD | Range | Duration | + / edit/delete]. Tooltip: skill association (sentinel→"default" label, unknown id→"unknown" label), dod, dodinfo (breaklines), range, other, tradition, duration, notes HTML.
- **Weapons table**: [tooltip | name | roll | ACC | DR+modifier-short-suffix | ROF | Ammo | RNG | + / edit/delete]. Tooltip: associated skill name (same sentinel logic vs `combatrating`), acc, dr, modifier long name + (if non-regular) modifier description HTML, wt, str, rof, ammo, rng, ismissile check, price, notes.
- **Initiative table**: first-round roll button + `initiative.modifiers.first` input; following-rounds roll button + `.following` input.
- **Armor table**: [tooltip | name | active checkbox toggle | PR+modifier-short-suffix | Parry | + / edit/delete]; footer with the three armor totals (§5.2). Tooltip: type long name, modifier long name, pr, str, parry, md, per, cha, wt, price, notes.
- **Talents table**: [tooltip | name | + / edit/delete]. Tooltip: desc (breaklines) + benefit HTML (+ legacy bug F9: rendered `dynamism.data.notes` — fix to talent notes).
- Item rows sorted **by name** (case-sensitive `<`/`>` compare) within each type.
- Item create: new item of dataset type with default name `HELLAS.item.<type>.new`. Edit: opens item sheet. Delete: confirm via `window.confirm` (legacy; rewrite: DialogV2.confirm) with `HELLAS.dialog.really.delete`, then delete + row slide-up.

**Disadvantages tab**: Relationship/Internal/External fieldsets (level "Rating" input + info textarea each); Possessions textarea; "Special Abilities & Divine Favors" textarea; Ambitions ×4 textareas. Headings are hardcoded English in template (F10 — localize in rewrite; en.json has `HELLAS.sheet.tabs.disadvantages` etc., add missing label keys).
**Personal tab**: Family (house, parents' social station, family status; maternal/paternal grandparents+parent; 6 children), Birth (age/month/year/planet), Notes textarea, right column: gift/mark/encounter/destiny/fate/deeds with flavor blurbs (hardcoded English — F10), The Callings ×5 (years + notes). Legacy has id/for typos in Third Path (F11).
**Description tab**: rich editor bound to `biography`.

Editability: legacy gated ALL listeners on `options.editable` — observers could not roll. **Preserve**: every action, including rolls, requires isEditable (standing decision).

### 7.2 Item sheets (all legacy 550×620, tabs [<type>, description], initial <type>; name input in header — hidden/derived for skill)
- **Skill**: selects for skill (all 40, localized), specifier (breakdown of chosen skill; disabled/greyed when none), specifierCustom — EITHER mode-type select (when skill==mode; disabled when only 1 option) OR free-text input (enabled only when specifier=='specify'); attribute select (allowed list, localized long names); level.value number input. Below: contextual guidance copy (mode: one-per-buy note; get-one-only vs all-included note; multi-attribute note, etiquette special-cased; fallback "n/a" note). Description tab edits `notes`.
  The option lists re-derive live from HELLAS based on current selections (legacy recomputed in getData; AppV2 re-render on change).
- **Weapon**: skill select = sentinel "combatrating" option + actor's skills with skillid prefix `weapon` (by item id); acc, dr, modifier select, wt, str, rof, ammo, rng, ismissile checkbox, price. Description tab edits notes.
- **Armor**: type select (grouped optgroups), modifier select, pr, str (+"included in rolls" note), parry (+note), md, per (+note), cha (+"NOT included" note), wt, price. Description tab.
- **Dynamism**: skill select = sentinel "dynamism" option + actor's skills with skillid prefix `mode` (by item id); dod, dodinfo textarea, range, other, tradition, duration. Description tab.
- **Talent**: desc textarea; benefit rich editor; description (notes) tab.
- Legacy `setPosition` hack (sheet-body height = position.height − 192) — obsolete under AppV2 layout; do not port.

### 7.3 Skill-picker option filtering on actor items
`getSkillsBySkillIDPrefix(prefix)`: actor's skill items where `skillid.startsWith(prefix)`, name-sorted. Used with `weapon` (weapon sheet) and `mode` (dynamism sheet).

### 7.4 Static rules-copy tooltips (preserve text verbatim)
- XP spending table (improving skills = new level +1 XP; new skills = .5 XP × training period; talents = 20 XP; attributes = new level ×5 XP; above racial max = double; CR/DYN = new level ×10 XP).
- Hero-point spending list (+2 to a roll after rolling; negate mishap/critfail; +4 damage; negate 4 damage per point up to max; 2 points = extra action without MAP; 2 points = negate crit unconsciousness; gifting rules) + Glory→HP-max-per-action table (1–20:2, 21–40:3, 41–100:5, 101–150:6, 151–200:10, 200+:Any).

## 8. Settings, helpers, i18n

- **Setting** `hellas.trademarkNotice`: world-scoped, config-visible, `type: null`, no value — exists solely to display the Khepera trademark/license notice text in the settings UI. Preserve text verbatim (v13: use a settings menu or read-only note; keep the notice visible somewhere in Settings).
- **Handlebars helpers registered** (rewrite: keep only those templates still need; core now provides concat/eq/ne/lte/gt/selected/disabled/checked/localize/editor equivalents): `concat`, `breaklines` (escape + \n→<br>, SafeString), `findEntryByKeyValue`, `ifIn`, `repeat` (with @index/@num/@first/@last), `setVar` (writes into template root — replace with saner precomputation in _prepareContext), `toLowerCase`, `numToStr`, `selected`, `disabled`, `ifEmptyOrWhitespace`, `isZeroThenBlank`, `isZero`, `add`, `sub`.
- **i18n**: single `lang/en.json`, 504 flat keys under `HELLAS.*` namespaces: sheet.tabs, section.*, character.*, attributes.<attr>.{name,description} (+hitpoints.current/max), skills.<skill>.name + skills.<skill>.description?, skills.specifics.*, skills.mode.*, skill.column.*, skill.{skill,specifier,type,attribute,level}.{label,title}, item.<type>.new/roll, item.skill.* guidance copy, weapon.*, armor.* (incl. type.group.long.*, type.opt.long.*, modifier.{short,long,desc}.*), dynamism.*, talent.*, initiative.*, roll.modifiers.dialog.*, roll.chat.*, die.roll.outcome.*, dialog.really.delete. Carry the file over; add keys for F10 hardcoded strings; every key referenced by new templates must exist (phase-7 audit).
- Also new in v13: `TYPES.Actor.character`, `TYPES.Item.{skill,dynamism,weapon,armor,talent}` labels required.

## 9. Legacy data shapes → migration matrix (migrateData, presence-guarded, idempotent)

| Legacy | New | Rule |
|---|---|---|
| `data.data.*` (envelope) | `system.*` | handled by core v10+ shim for world docs; our pack conversion rewrites explicitly |
| numbers stored as strings ("", "3") in any NumberField (disadvantage levels, price, dod, etc.) | number/null | `"" → null`, numeric string → Number (guard `key in delta`) |
| `price: "0"` (string default) | number 0 | same rule |
| `personal.tree.children.sxithborn` | `sixthborn` | rename, delete old key |
| children junk defaults "a".."f" | keep user data | only defaults change; no data rewrite |
| `ambitions.4.info` undeclared-but-present | declared 4th slot | schema declares 1–4 |
| item `order`, `carriable`, `spell`, weapon `cha`, actor `version`, item `version` | dropped from schema | silently ignored (TypeDataModel drops unknown keys); no migration write needed |
| `modifiers.armor.*` stored | derived only | ignore stored values (recomputed); schema may omit → dropped |
| skill `level.max`, skill `name`, skill `skillid` stored | derived | accept stored, recompute on prepare |
| weapon/dynamism `skillid` item-id references | unchanged | ids survive; sentinel strings `combatrating`/`dynamism` unchanged |
| pack `entity: "Item"` | `type: "Item"` | manifest fix |

## 10. Fix-don't-port (legacy bugs — fix in rewrite, never silently carry)

- **F1** `sxithborn` typo is both a config value and a data key (template.json + sheet). Fix to `sixthborn` + migrateData rename.
- **F2** Actor sheet renders `ambitions.4.info` but template.json declared only 1–3. Declare 4 in schema.
- **F3** `personal.tree.children` defaults are junk ("a".."f"). New defaults "".
- **F4** `price` typed as string "0" in template but edited as Number in sheets. Schema: NumberField, migrate strings.
- **F5** Skill item wrote to the DB during `prepareData` (name, skillid, level.max, specifier normalizations via updateOwnedItem) — write-during-prepare loop risk. Rewrite: pure derived data; persisted normalization only in `_preUpdate`.
- **F6** Actor sheet wrote armor totals to DB during `getData` (update-during-render). Rewrite: derived in prepareDerivedData, never stored.
- **F7** `.attr-roll` passes `data-rating`, `attrRoll(attribute, rating)` ignores `rating`. Drop it.
- **F8** Fate-point clicks never persisted (mutated prepared data + re-render only; reverted on next data refresh). Rewrite: `actor.update({"system.attributes.fatepoints.value": n})`.
- **F9** Talent tooltip block in actorSheet.hbs renders `{{{dynamism.data.notes}}}` inside the talents loop (always empty/undefined). Should be the talent's own notes.
- **F10** Hardcoded English strings in disadvantages/personal tabs (headings, labels, flavor blurbs like "As a child I inherited a gift…"). Localize with new HELLAS.* keys (en.json only).
- **F11** "My Third Path" notes: `<label for>` points at second-path notes, textarea `id="data.personal.info.third.second.notes"` (name attr was correct). Fix ids/labels.
- **F12** armorSheet.hbs parry input `title` uses non-existent key `HELLAS.weapon.parry.title` (verified missing from en.json). Use `HELLAS.armor.parry.title` (exists).
- **F13** Disadvantages tab wrapper `<div class="tab personal" … data-tab="disadvantages">` — wrong class (cosmetic). Fix.
- **F14** config `attributesWShortName` uses `fatepoint` (singular) while the actor schema/manifest use `fatepoints`; the shortname entry is unused for fatepoints. Keep schema `fatepoints`; drop/rename the dead config entry (nothing references `fatepoint` via short-name paths — verify in phase 7).
- **F15** `preloadTemplates` omitted weaponroll/dynamismroll/initiativeroll chat templates (worked only because renderTemplate lazy-loads). Rewrite: complete preload list (or rely on PARTS).
- **F16** modifiers dialog embeds `<script>` with jQuery/tooltipster (CSP-hostile). Rewrite: DialogV2 + `data-tooltip-html`, autofocus via render callback.
- **F17** Actor sheet `_onItemCreate` copies the whole HTML `dataset` into item source. Create with `{name, type}` only.
- **F18** `sortItemsByNameFunction` is case/locale-naive. Use `localeCompare` (behavioral change accepted: saner ordering).
- **F19** Legacy skillSheet.hbs referenced i18n key `HELLAS.skill.specifier.custom.title` which never existed in en.json (tooltip silently showed the raw key). Key added. (en.json also carries a stray `HELLAS.skill.specifier.title.label` = "Custom" — kept, unused.)

## 11. Assets & styling notes (input to Phase 6)

- Fonts/styles: legacy Tailwind utility classes throughout templates + PostCSS pipeline — all replaced with plain CSS (native nesting), reproducing: marble background (`assets/images/augustine-wong-…jpg`) on sheet window-content, greek-meander divider strips (`assets/images/meander.svg`), gold/aluminum foil resource-tile backgrounds (brushed-gold.jpg / brushed-aluminum.jpg), red-marble accents, `hellas-titling` display font ($font-titles from styles/utils/variables.css — check actual font stack in Phase 6), fate-dot styling incl. filled/skull states, table styling for the six item tables.
- v13: colors/spacing via core theme variables where sensible; must be legible in BOTH light and dark core themes (background image is light — ensure text contrast rules don't invert).
- Icons: keep `assets/icons/*.svg` (game-icons.net attribution in README) — they're referenced by compendium content.
- `src/lib/tooltipster*` deleted (replaced by core tooltips).

## 12. Manual verification checklist (input to Phase 7)

Create character → set attributes → roll each of the 10 attributes (dialog cancel + confirm paths) → add skill from scratch (each specifier branch: plain, specify+custom, mode+type) → verify derived name/rating → drag skills/talents/dynamisms from the 3 compendia → weapon with CR sentinel and with linked weapon-skill (incl. STR shortfall + missile) → dynamism linked to mode skill (+ sentinel error path) → armor active toggle drives footer totals + DEX/PER/parry modifiers appear in rolls → fate dots persist across reload → initiative both buttons + combat tracker → all tooltips → observer-permission user sees sheet but cannot roll/edit → world from v0.3.6 migrates (children.sxithborn, string numbers, ambitions.4).
