import { textField } from "./fields.mjs";
import { migrateTalentData } from "./migrations.mjs";

/**
 * System data for `talent` items. See z/SPEC.md §4.5.
 */
export default class TalentData extends foundry.abstract.TypeDataModel {

	/** @override */
	static defineSchema() {
		const { HTMLField } = foundry.data.fields;
		return {
			desc: textField(),
			benefit: new HTMLField({ required: true, initial: "" }),
			notes: new HTMLField({ required: true, initial: "" })
		};
	}

	/** @override */
	static migrateData(source) {
		migrateTalentData(source);
		return super.migrateData(source);
	}
}
