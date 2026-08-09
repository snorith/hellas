import { intField, textField } from "./fields.mjs";
import { migrateWeaponData } from "./migrations.mjs";

/** Sentinel skillid meaning "roll off the Combat Rating attribute". */
export const DEFAULT_WEAPON_SKILLID = "combatrating";

/**
 * System data for `weapon` items. See z/SPEC.md §4.3.
 * `skillid` holds the item id of a weapon-skill on the owning actor, or the
 * `combatrating` sentinel. Legacy `cha`, `carriable`, `active`, `order`,
 * `version` are dropped by schema omission.
 */
export default class WeaponData extends foundry.abstract.TypeDataModel {

	/** @override */
	static defineSchema() {
		const { BooleanField, HTMLField } = foundry.data.fields;
		return {
			skillid: textField(DEFAULT_WEAPON_SKILLID),
			acc: intField(),
			dr: intField(),
			wt: intField(),
			rof: intField(),
			str: intField(),
			ammo: textField(),
			rng: textField(),
			modifier: textField("regular"),
			ismissile: new BooleanField({ required: true, initial: false }),
			price: intField(),
			notes: new HTMLField({ required: true, initial: "" })
		};
	}

	/** @override */
	static migrateData(source) {
		migrateWeaponData(source);
		return super.migrateData(source);
	}

	/** @override */
	prepareDerivedData() {
		super.prepareDerivedData();
		if ( !this.skillid?.trim() ) this.skillid = DEFAULT_WEAPON_SKILLID;
	}
}
