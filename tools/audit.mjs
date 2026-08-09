/**
 * Phase-7 static cross-reference audit. Bare node; rerunnable.
 * Run: node tools/audit.mjs   (exit code 1 on any failure)
 *
 * Checks:
 *  1. data-action in templates ↔ action handlers in each sheet class
 *  2. every static {{localize "..."}} key + JS-referenced key exists in en.json
 *  3. dynamically-composed i18n families exist for every config enumeration
 *  4. every form name="system.*" path resolves to a schema field (the REAL
 *     defineSchema() runs under a stubbed foundry global)
 *  5. every PARTS/preload template path exists on disk
 *  6. pack sources: _id/_key consistency, declared types only
 *  7. system.json ↔ disk: esmodules/styles/languages/pack sources present
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

let failures = 0;
const fail = msg => { failures++; console.log(`FAIL  ${msg}`); };
const ok = msg => console.log(`ok    ${msg}`);

const read = f => readFileSync(f, "utf8");
const glob = (dir, ext, out = []) => {
	for ( const e of readdirSync(dir, { withFileTypes: true }) ) {
		const p = path.join(dir, e.name);
		if ( e.isDirectory() ) glob(p, ext, out);
		else if ( p.endsWith(ext) ) out.push(p);
	}
	return out;
};

/* ---- stub foundry + import real data models -------------------------- */

class StubField { constructor(options = {}) { this.options = options; } }
class SchemaField extends StubField {
	constructor(fields, options = {}) { super(options); this.fields = fields; }
}
globalThis.foundry = {
	abstract: { TypeDataModel: class TypeDataModel {} },
	data: { fields: {
		SchemaField,
		NumberField: StubField, StringField: StubField,
		BooleanField: StubField, HTMLField: StubField
	} }
};

const models = {
	character: (await import("../module/data/character.mjs")).default,
	skill: (await import("../module/data/skill.mjs")).default,
	weapon: (await import("../module/data/weapon.mjs")).default,
	armor: (await import("../module/data/armor.mjs")).default,
	dynamism: (await import("../module/data/dynamism.mjs")).default,
	talent: (await import("../module/data/talent.mjs")).default
};
const { HELLAS } = await import("../module/config.mjs");

const schemaPaths = {};
const walk = (fields, prefix, out) => {
	for ( const [k, f] of Object.entries(fields) ) {
		const p = prefix ? `${prefix}.${k}` : k;
		out.add(p);
		if ( f instanceof SchemaField ) walk(f.fields, p, out);
	}
};
for ( const [type, M] of Object.entries(models) ) {
	schemaPaths[type] = new Set();
	walk(M.defineSchema(), "", schemaPaths[type]);
}

/* ---- 1. actions ↔ handlers ------------------------------------------ */

const sheetChecks = [
	{ cls: "module/sheets/actor-sheet.mjs", cName: "HellasActorSheet",
		tpls: glob("templates/actor", ".hbs") },
	{ cls: "module/sheets/item-sheet.mjs", cName: "HellasItemSheet",
		tpls: glob("templates/item", ".hbs") }
];
for ( const { cls, cName, tpls } of sheetChecks ) {
	const src = read(cls);
	const handlers = new Set([...src.matchAll(/^\t{3}(\w+): \w+Sheet/gm)].map(m => m[1]));
	const used = new Set();
	for ( const t of tpls ) {
		for ( const m of read(t).matchAll(/data-action="([^"]+)"/g) ) used.add(m[1]);
	}
	const missing = [...used].filter(a => !handlers.has(a));
	const orphan = [...handlers].filter(a => !used.has(a));
	if ( missing.length ) fail(`${cName}: template actions without handlers: ${missing}`);
	else ok(`${cName}: all ${used.size} template actions have handlers`);
	if ( orphan.length ) fail(`${cName}: handlers never used in templates: ${orphan}`);
}

/* ---- 2 + 3. i18n ------------------------------------------------------ */

const lang = JSON.parse(read("lang/en.json"));
const langKeys = new Set(Object.keys(lang));
const flatWalk = (o, p, out) => {
	for ( const [k, v] of Object.entries(o) ) {
		const kk = p ? `${p}.${k}` : k;
		out.add(kk);
		if ( v && (typeof v === "object") ) flatWalk(v, kk, out);
	}
};
flatWalk(lang, "", langKeys);

const has = k => langKeys.has(k);
let i18nBad = 0;
const requireKey = (k, why) => { if ( !has(k) ) { i18nBad++; fail(`i18n missing: ${k} (${why})`); } };

// static keys in all templates
for ( const t of glob("templates", ".hbs") ) {
	for ( const m of read(t).matchAll(/localize "([^"]+)"/g) ) {
		requireKey(m[1], t);
	}
}
// static keys in all modules
for ( const f of glob("module", ".mjs").concat(["hellas.mjs"]) ) {
	for ( const m of read(f).matchAll(/(?:localize|format)\("(HELLAS\.[^"$]+)"/g) ) {
		requireKey(m[1], f);
	}
}
// composed families
for ( const a of HELLAS.attributes ) {
	requireKey(`HELLAS.attributes.${a}.name`, "attribute name");
}
for ( const a of HELLAS.characterAttributes ) {
	requireKey(`HELLAS.attributes.${a}.description`, "attribute tile tooltip");
}
for ( const s of HELLAS.skills ) requireKey(`HELLAS.skills.${s}.name`, "skill name");
const allSpecifiers = new Set(Object.values(HELLAS.skillSpecificsBreakdown).flat());
for ( const sp of allSpecifiers ) {
	requireKey(`HELLAS.skills.specifics.${sp}`, "specifier");
}
const allModeTypes = new Set(Object.values(HELLAS.dynamismModesSpecificBreakdowns).flat());
for ( const mt of allModeTypes ) requireKey(`HELLAS.skills.mode.${mt}`, "mode type");
for ( const m of HELLAS.weaponModifiers ) {
	requireKey(`HELLAS.weapon.modifier.short.${m}`, "weapon mod short");
	requireKey(`HELLAS.weapon.modifier.long.${m}`, "weapon mod long");
	if ( m !== "regular" ) requireKey(`HELLAS.weapon.modifier.desc.${m}`, "weapon mod desc");
}
for ( const m of HELLAS.armorModifiers ) {
	requireKey(`HELLAS.armor.modifier.short.${m}`, "armor mod short");
	requireKey(`HELLAS.armor.modifier.long.${m}`, "armor mod long");
}
for ( const [group, types] of Object.entries(HELLAS.armorTypes) ) {
	requireKey(`HELLAS.armor.type.group.long.${group}`, "armor type group");
	for ( const t of types ) requireKey(`HELLAS.armor.type.opt.long.${t}`, "armor type opt");
}
for ( const o of ["critfail", "fail", "partialsuccess", "success", "critsuccess"] ) {
	requireKey(`HELLAS.die.roll.outcome.${o}`, "outcome");
}
for ( const t of ["skill", "dynamism", "weapon", "armor", "talent"] ) {
	requireKey(`HELLAS.item.${t}.new`, "item create name");
	requireKey(`TYPES.Item.${t}`, "TYPES label");
}
requireKey("TYPES.Actor.character", "TYPES label");
for ( const i of ["first", "following"] ) requireKey(`HELLAS.roll.chat.initiative.${i}.title`, "initiative chat");
for ( const t of ["attributes", "disadvantages", "personal", "description"] ) {
	requireKey(`HELLAS.sheet.tabs.${t}`, "actor tab");
}
if ( !i18nBad ) ok(`i18n: all static + composed keys present (${langKeys.size} total keys)`);

/* ---- 4. form name paths ↔ schema ------------------------------------- */

const tplForType = {
	character: glob("templates/actor", ".hbs"),
	skill: ["templates/item/skill.hbs", "templates/item/header.hbs", "templates/item/description.hbs"],
	weapon: ["templates/item/weapon.hbs", "templates/item/header.hbs", "templates/item/description.hbs"],
	armor: ["templates/item/armor.hbs", "templates/item/header.hbs", "templates/item/description.hbs"],
	dynamism: ["templates/item/dynamism.hbs", "templates/item/header.hbs", "templates/item/description.hbs"],
	talent: ["templates/item/talent.hbs", "templates/item/header.hbs", "templates/item/description.hbs"]
};
let nameBad = 0;
for ( const [type, tpls] of Object.entries(tplForType) ) {
	for ( const t of tpls ) {
		for ( const m of read(t).matchAll(/name="([^"]+)"/g) ) {
			const n = m.group?.(1) ?? m[1];
			if ( !n.startsWith("system.") ) continue;  // document-level fields (name) or dialog inputs
			// resolve {{...}} segments against known loops
			let p = n.slice(7)
				.replace("{{this.key}}", "relationship")            // disadvantages loop sample
				.replace("{{key}}", "relationship");
			if ( p.includes("children.") ) p = "personal.tree.children.firstborn";
			if ( p.includes("callings.") ) p = p.replace(/callings\.[^.]+\./, "callings.first.");
			if ( p.startsWith("ambitions.") ) p = "ambitions.1.info";
			if ( p.includes("{{") ) { fail(`unresolved template name path in ${t}: ${n}`); nameBad++; continue; }
			if ( !schemaPaths[type].has(p) ) { fail(`form path not in ${type} schema: ${n} (${t})`); nameBad++; }
		}
	}
}
if ( !nameBad ) ok("form name paths: all system.* inputs resolve to schema fields");

/* ---- 5. template paths ------------------------------------------------ */

let tplBad = 0;
const tplRefs = new Set();
for ( const f of glob("module", ".mjs").concat(["hellas.mjs"]) ) {
	for ( const m of read(f).matchAll(/"systems\/hellas\/(templates\/[^"]+)"/g) ) tplRefs.add(m[1]);
}
for ( const t of tplRefs ) {
	if ( !existsSync(t) ) { fail(`referenced template missing on disk: ${t}`); tplBad++; }
}
if ( !tplBad ) ok(`template paths: all ${tplRefs.size} referenced templates exist`);

/* ---- 6. pack sources --------------------------------------------------- */

let packBad = 0;
const declaredTypes = new Set(["skill", "dynamism", "weapon", "armor", "talent"]);
for ( const dir of readdirSync("packs/_source") ) {
	for ( const f of glob(path.join("packs/_source", dir), ".json") ) {
		const doc = JSON.parse(read(f));
		if ( doc._key !== `!items!${doc._id}` ) { fail(`bad _key in ${f}`); packBad++; }
		if ( !declaredTypes.has(doc.type) ) { fail(`undeclared type ${doc.type} in ${f}`); packBad++; }
		for ( const k of Object.keys(doc.system) ) {
			if ( !schemaPaths[doc.type].has(k) ) { fail(`pack field ${k} not in ${doc.type} schema (${f})`); packBad++; }
		}
	}
}
if ( !packBad ) ok("pack sources: _key/_id/type/system fields all consistent with schemas");

/* ---- 7. manifest ↔ disk ------------------------------------------------ */

const manifest = JSON.parse(read("system.json"));
let manBad = 0;
for ( const e of manifest.esmodules ) if ( !existsSync(e) ) { fail(`esmodule missing: ${e}`); manBad++; }
for ( const s of manifest.styles ) if ( !existsSync(s) ) { fail(`style missing: ${s}`); manBad++; }
for ( const l of manifest.languages ) if ( !existsSync(l.path) ) { fail(`lang missing: ${l.path}`); manBad++; }
for ( const p of manifest.packs ) {
	const src = p.path.replace("packs/", "packs/_source/");
	if ( !existsSync(src) ) { fail(`pack source missing: ${src}`); manBad++; }
}
const dt = manifest.documentTypes;
if ( !dt?.Actor?.character || Object.keys(dt?.Item ?? {}).length !== 5 ) { fail("documentTypes incomplete"); manBad++; }
if ( !manBad ) ok("manifest: esmodules/styles/languages/pack sources/documentTypes all present");

/* ----------------------------------------------------------------------- */

console.log(failures ? `\n${failures} FAILURES` : "\nAUDIT CLEAN");
process.exit(failures ? 1 : 0);
