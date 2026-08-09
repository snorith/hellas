import { intField, textField } from "./fields.mjs";
import { migrateDynamismData } from "./migrations.mjs";

/** Sentinel skillid meaning "no mode skill chosen yet". */
export const DEFAULT_DYNAMISM_SKILLID = "dynamism";

/**
 * System data for `dynamism` items. See z/SPEC.md §4.2.
 * `skillid` holds the item id of a mode-skill on the owning actor, or the
 * `dynamism` sentinel (rolling requires a real skill). Legacy `spell`,
 * `order`, `version` are dropped by schema omission.
 */
export default class DynamismData extends foundry.abstract.TypeDataModel {

	/** @override */
	static defineSchema() {
		const { HTMLField } = foundry.data.fields;
		return {
			skillid: textField(DEFAULT_DYNAMISM_SKILLID),
			dod: intField(),
			dodinfo: textField(),
			range: textField(),
			tradition: textField(),
			duration: textField(),
			other: textField(),
			notes: new HTMLField({ required: true, initial: "" })
		};
	}

	/** @override */
	static migrateData(source) {
		migrateDynamismData(source);
		return super.migrateData(source);
	}

	/** @override */
	prepareDerivedData() {
		super.prepareDerivedData();
		if ( !this.skillid?.trim() ) this.skillid = DEFAULT_DYNAMISM_SKILLID;
	}
}
