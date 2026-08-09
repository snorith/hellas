/**
 * Pure migration helpers shared by every data model's static migrateData.
 *
 * CONTRACT (hard-won): migrateData runs on update DELTAS as well as full
 * documents. Every normalization here is presence-guarded — a path that is
 * absent from the source is left absent, never created. Blank-string values
 * headed into NumberFields become null (NumberField would cast "" to 0).
 * All functions mutate `source` in place and are idempotent.
 *
 * This module deliberately imports nothing from Foundry so it can be
 * unit-tested in bare node (tools/test-migrations.mjs).
 */

/**
 * Is this a plain traversable object (not null, not array)?
 * @param {unknown} v
 * @returns {v is Record<string, unknown>}
 */
function isObject(v) {
	return (typeof v === "object") && (v !== null) && !Array.isArray(v);
}

/**
 * Convert blank-string values at `path` to null, presence-guarded.
 * `path` segments may be `"*"`, which fans out over the keys PRESENT at that
 * level (never inventing any). Missing branches are skipped silently.
 *
 * @param {object} source  Migration source (full doc or update delta), mutated.
 * @param {string} path    Dot path, e.g. "attributes.*.value".
 */
export function blankToNull(source, path) {
	const segments = path.split(".");
	const walk = (node, i) => {
		if ( !isObject(node) ) return;
		const seg = segments[i];
		const last = i === segments.length - 1;
		const keys = seg === "*" ? Object.keys(node) : (seg in node ? [seg] : []);
		for ( const key of keys ) {
			if ( last ) {
				const value = node[key];
				if ( (typeof value === "string") && (value.trim() === "") ) node[key] = null;
			}
			else walk(node[key], i + 1);
		}
	};
	walk(source, 0);
}

/**
 * Rename a key inside the object at `parentPath`, presence-guarded.
 * If the new key already exists the old one is simply dropped.
 *
 * @param {object} source
 * @param {string} parentPath  Dot path to the containing object.
 * @param {string} oldKey
 * @param {string} newKey
 */
export function renameKey(source, parentPath, oldKey, newKey) {
	let node = source;
	for ( const seg of parentPath.split(".") ) {
		if ( !isObject(node) || !(seg in node) ) return;
		node = node[seg];
	}
	if ( !isObject(node) || !(oldKey in node) ) return;
	if ( !(newKey in node) ) node[newKey] = node[oldKey];
	delete node[oldKey];
}

/* -------------------------------------------- */

/** Legacy NumberField paths per document sub-type. */
const CHARACTER_NUMBER_PATHS = [
	"attributes.*.value",
	"attributes.*.max",
	"disadvantages.*.level",
	"initiative.modifiers.first",
	"initiative.modifiers.following"
];

const SKILL_NUMBER_PATHS = ["level.value", "level.max"];
const WEAPON_NUMBER_PATHS = ["acc", "dr", "wt", "rof", "str", "price"];
const ARMOR_NUMBER_PATHS = ["str", "per", "cha", "parry", "pr", "wt", "md", "price"];
const DYNAMISM_NUMBER_PATHS = ["dod", "price"];

/**
 * Migrate legacy character system data (full doc or delta).
 * - F1: personal.tree.children.sxithborn → sixthborn
 * - blank strings at number paths → null
 * @param {object} source  Mutated in place.
 * @returns {object} source
 */
export function migrateCharacterData(source) {
	renameKey(source, "personal.tree.children", "sxithborn", "sixthborn");
	for ( const p of CHARACTER_NUMBER_PATHS ) blankToNull(source, p);
	return source;
}

/** @param {object} source @returns {object} */
export function migrateSkillData(source) {
	for ( const p of SKILL_NUMBER_PATHS ) blankToNull(source, p);
	return source;
}

/** @param {object} source @returns {object} */
export function migrateWeaponData(source) {
	for ( const p of WEAPON_NUMBER_PATHS ) blankToNull(source, p);
	return source;
}

/** @param {object} source @returns {object} */
export function migrateArmorData(source) {
	for ( const p of ARMOR_NUMBER_PATHS ) blankToNull(source, p);
	return source;
}

/** @param {object} source @returns {object} */
export function migrateDynamismData(source) {
	for ( const p of DYNAMISM_NUMBER_PATHS ) blankToNull(source, p);
	return source;
}

/** @param {object} source @returns {object} */
export function migrateTalentData(source) {
	return source;
}
