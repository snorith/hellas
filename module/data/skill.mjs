import { HELLAS, SPECIFY_SUBTYPE } from "../config.mjs";
import { textField, valueMaxField } from "./fields.mjs";
import { migrateSkillData } from "./migrations.mjs";

/**
 * Normalize skill selector fields in place (SPEC §5.1 step 1). Pure: operates
 * on a plain object {skill, attribute, specifier, specifierCustom}. An empty
 * skill is left empty ("new skill" state); an unknown skill falls back to the
 * first configured skill (legacy crashed on unknown values).
 *
 * @param {{skill: string, attribute: string, specifier: string, specifierCustom: string}} d
 * @returns {typeof d} the same object
 */
export function normalizeSkillSelectors(d) {
	if ( d.skill && !HELLAS.skills.includes(d.skill) ) d.skill = HELLAS.skills[0];
	const skill = d.skill;
	if ( !skill ) {
		// "New skill" state: dependent selectors are meaningless — clear them so
		// nothing stale persists or feeds the rating (devin rev-2 D8).
		d.specifier = "";
		d.specifierCustom = "";
		d.attribute = "";
		return d;
	}

	if ( HELLAS.skillsWSpecifics.includes(skill) ) {
		const specifiers = HELLAS.skillSpecificsBreakdown[skill];
		if ( !specifiers.includes(d.specifier) ) d.specifier = specifiers[0] ?? "";
		if ( skill === HELLAS.dynamismMode ) {
			const types = HELLAS.dynamismModesSpecificBreakdowns[d.specifier] ?? [];
			if ( !types.includes(d.specifierCustom) ) d.specifierCustom = types[0] ?? "";
		}
		else if ( d.specifier !== SPECIFY_SUBTYPE ) d.specifierCustom = "";
	}
	else {
		d.specifier = "";
		d.specifierCustom = "";
	}

	const allowed = HELLAS.skillWAssocShortAttributes[skill] ?? [];
	if ( !allowed.includes(d.attribute) ) d.attribute = allowed[0] ?? "";
	return d;
}

/**
 * The derived skill display name (SPEC §5.1 step 4), from NORMALIZED selector
 * values. Mirrors the legacy fullName() logic exactly.
 *
 * @param {{skill: string, specifier: string, specifierCustom: string}} d
 * @param {boolean} owned  Whether the item is embedded on an actor.
 * @returns {string}
 */
export function skillFullName(d, owned) {
	const skill = d.skill ?? "";
	if ( !skill.trim() ) return game.i18n.localize("HELLAS.item.skill.new");

	let base = game.i18n.localize(`HELLAS.skills.${skill}.name`);
	if ( !HELLAS.skillsWSpecifics.includes(skill) ) return base;

	const specifier = d.specifier ?? "";
	const specifierCustom = d.specifierCustom ?? "";

	if ( skill === HELLAS.dynamismMode ) {
		base = game.i18n.localize("HELLAS.skills.mode.short.name");
		const specifierName = game.i18n.localize(`HELLAS.skills.specifics.${specifier}`);
		if ( (specifierCustom === specifier) || !owned ) {
			return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: base, specifier: specifierName });
		}
		const typeName = game.i18n.localize(`HELLAS.skills.mode.${specifierCustom}`);
		return game.i18n.format("HELLAS.item.skill.name.combiner2", { skill: base, specifier: specifierName, type: typeName });
	}

	if ( (skill === "perform") && !owned ) {
		return game.i18n.format("HELLAS.item.skill.name.combiner", {
			skill: base, specifier: game.i18n.localize("HELLAS.skills.specifics.specify")
		});
	}
	if ( HELLAS.skillSpecificsGetAll.includes(skill) && !owned ) {
		return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: base, specifier: "*" });
	}
	if ( (specifier === SPECIFY_SUBTYPE) && specifierCustom.trim() ) {
		return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: base, specifier: specifierCustom });
	}
	if ( specifier.trim() ) {
		const specifierName = game.i18n.localize(`HELLAS.skills.specifics.${specifier}`);
		return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: base, specifier: specifierName });
	}
	return base;
}

/**
 * System data for `skill` items. See z/SPEC.md §4.1 and §5.1.
 *
 * skillid, level.max, the normalized selector fields and fullName are DERIVED
 * here every prepare (F5 — legacy persisted them via writes during prepareData).
 * Document#name is kept in sync by HellasItem._preCreate/_preUpdate instead.
 */
export default class SkillData extends foundry.abstract.TypeDataModel {

	/** @override */
	static defineSchema() {
		const { HTMLField } = foundry.data.fields;
		return {
			skill: textField(),
			attribute: textField(),          // SHORT attribute name, e.g. "DEX"
			specifier: textField(),
			specifierCustom: textField(),
			level: valueMaxField(),          // max is recomputed as derived data
			notes: new HTMLField({ required: true, initial: "" })
		};
	}

	/** @override */
	static migrateData(source) {
		migrateSkillData(source);
		return super.migrateData(source);
	}

	/* -------------------------------------------- */

	/**
	 * Normalize selectors, derive skillid / rating / display name.
	 * In-memory only — never written back (F5).
	 * @override
	 */
	prepareDerivedData() {
		super.prepareDerivedData();

		normalizeSkillSelectors(this);

		// skillid (SPEC §5.1 step 2; "" while no skill chosen, like legacy)
		this.skillid = this.skill
			? [this.skill, this.specifier, this.specifierCustom].join(".")
			: "";

		// Rating (SPEC §5.1 step 3)
		const actor = this.parent.actor;
		let attributeValue = 0;
		if ( actor && this.attribute ) {
			const long = HELLAS.attributesShortToLong[this.attribute];
			const v = actor.system?.attributes?.[long]?.value;
			if ( Number.isFinite(v) ) attributeValue = v;
		}
		const base = Number.isFinite(this.level.value) ? this.level.value : 0;
		this.level.max = actor ? base + attributeValue : base;

		// Display name (SPEC §5.1 step 4)
		this.fullName = skillFullName(this, !!actor);
	}
}
